"""Build a view-only geological interpretation overlay from USGS SIM 3464."""

import argparse
import hashlib
import json
import subprocess
import tempfile
import zipfile
from pathlib import Path

import numpy as np
import pyogrio.raw
import rasterio
import shapely
from PIL import Image
from rasterio.crs import CRS
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from rasterio.warp import transform_bounds, transform_geom

ROOT = Path(__file__).resolve().parents[2]
BASE = "https://pubs.usgs.gov/sim/3464/"
SOURCE = "sim3464_database.zip"
SHA256 = "a88bd53a5573743cc4a20036c10e585106d08a433ad2f34af269e9cea1529f87"
BOUNDS = [76.8, 17.7, 77.8, 18.7]
RADIUS = 3396190
CATALOG = json.loads((Path(__file__).with_name("units.json")).read_text())
# Text-only correction supported by the unit code, full symbol and publisher legend.
NAME_CORRECTIONS = {1004: ("Crater riim unit", "Crater rim unit")}


def sha256(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def validate_crs(wkt):
    if not wkt or "Mars" not in wkt:
        raise ValueError("An explicit Mars coordinate definition is required")
    crs = CRS.from_wkt(wkt)
    params = crs.to_dict()
    for key, expected in {
        "proj": "tmerc",
        "lon_0": 77.5,
        "lat_0": 0,
        "k": 1,
        "x_0": 0,
        "y_0": 0,
        "units": "m",
    }.items():
        if params.get(key) != expected:
            raise ValueError(f"Unexpected source projection parameter: {key}")
    if params.get("R") != RADIUS:
        raise ValueError("Expected the 3396190-metre Mars sphere")
    return crs


def classify_records(ids, geometry, fields, source_crs, geographic):
    units = {u["sourceCode"]: u for u in CATALOG["units"]}
    grouped = {code: [] for code in units}
    excluded = []
    masks = []
    corrections = []
    for fid, shape, attributes in zip(ids, geometry, fields, strict=True):
        fid = int(fid)
        code, name, symbol = attributes
        unit = units.get(code)
        if fid in NAME_CORRECTIONS and name == NAME_CORRECTIONS[fid][0]:
            original = name
            name = NAME_CORRECTIONS[fid][1]
            corrections.append(
                {"fid": fid, "field": "name", "original": original, "display": name}
            )
        valid_geometry = (
            shape is not None
            and not shapely.is_empty(shape)
            and shapely.is_valid(shape)
            and shape.geom_type in ("Polygon", "MultiPolygon")
        )
        valid_label = (
            unit is not None and name == unit["name"] and symbol == unit["symbol"]
        )
        if not valid_geometry or not valid_label:
            reason = (
                "conflicting unit attributes"
                if valid_geometry
                else str(shapely.is_valid_reason(shape))
            )
            excluded.append(
                {
                    "fid": fid,
                    "sourceCode": code,
                    "name": name,
                    "symbol": symbol,
                    "reason": reason,
                }
            )
            if shape is None or shapely.is_empty(shape):
                raise ValueError("Missing geometry cannot be conservatively masked")
            if valid_geometry:
                masks.append(
                    transform_geom(
                        source_crs, geographic, shapely.geometry.mapping(shape)
                    )
                )
            else:
                # Never repair/interpret a self-intersection. Withhold its whole
                # enclosing geographic rectangle, including unaffected neighbours.
                bounds = transform_bounds(
                    source_crs, geographic, *shape.bounds, densify_pts=21
                )
                masks.append(shapely.geometry.mapping(shapely.box(*bounds)))
            continue
        converted = transform_geom(
            source_crs, geographic, shapely.geometry.mapping(shape)
        )
        if not shapely.is_valid(shapely.geometry.shape(converted)):
            raise ValueError("Reprojection produced invalid geometry")
        grouped[code].append(converted)
    return grouped, masks, excluded, corrections


def make_grid(grouped, withheld, boundary, bounds, size):
    if size < 1 or size > 4096:
        raise ValueError("Display grid size must be between 1 and 4096")
    transform = from_bounds(*bounds, size, size)
    grid = np.zeros((size, size), dtype=np.uint8)
    coverage = np.zeros_like(grid)
    for index, unit in enumerate(CATALOG["units"], 1):
        geometries = grouped.get(unit["sourceCode"], [])
        if not geometries:
            continue
        mask = rasterize(
            ((g, 1) for g in geometries),
            out_shape=grid.shape,
            transform=transform,
            dtype="uint8",
        ).astype(bool)
        coverage += mask
        grid[mask] = index
    overlap = coverage > 1
    inside = rasterize(
        [(boundary, 1)], out_shape=grid.shape, transform=transform, dtype="uint8"
    ).astype(bool)
    unknown = np.zeros_like(inside)
    if withheld:
        unknown = rasterize(
            ((g, 1) for g in withheld),
            out_shape=grid.shape,
            transform=transform,
            dtype="uint8",
            all_touched=True,
        ).astype(bool)
    grid[overlap | unknown | ~inside] = 0
    return grid, {
        "crossUnitOverlapPixels": int(overlap.sum()),
        "withheldMaskPixels": int(unknown.sum()),
        "outsideBoundaryPixels": int((~inside).sum()),
    }


def build(archive, image, manifest, size=1024):
    if sha256(archive) != SHA256:
        raise ValueError(
            "Unreviewed archive checksum; review the source before rebuilding"
        )
    with tempfile.TemporaryDirectory(prefix="martian-map-geology-") as temporary:
        temp = Path(temporary)
        with zipfile.ZipFile(archive) as source:
            for item in source.infolist():
                if (
                    "/Geodatabase/Nili.gdb/" in item.filename
                    and item.file_size
                    and not item.filename.endswith(".lock")
                ):
                    target = temp / "Nili.gdb" / Path(item.filename).name
                    target.parent.mkdir(exist_ok=True)
                    target.write_bytes(source.read(item))
            sphere_wkt = source.read(
                next(n for n in source.namelist() if n.endswith("/Mars2000_Sphere.prj"))
            ).decode()
        info, ids, wkb, attributes = pyogrio.raw.read(
            temp / "Nili.gdb",
            layer="GeoUnits_v1",
            columns=["unit", "name", "symbol"],
            return_fids=True,
        )
        if len(ids) != 1304:
            raise ValueError("Unexpected source feature count")
        crs = validate_crs(info["crs"])
        geographic = CRS.from_wkt(sphere_wkt)
        if geographic.to_dict().get("R") != RADIUS or "Mars" not in sphere_wkt:
            raise ValueError("Unexpected target Mars geographic definition")
        shapes = shapely.from_wkb(wkb)
        fields = list(zip(*attributes, strict=True))
        grouped, masks, excluded, corrections = classify_records(
            ids, shapes, fields, crs, geographic
        )
        boundary_info, _, boundary_wkb, _ = pyogrio.raw.read(
            temp / "Nili.gdb", layer="MapBoundary"
        )
        if CRS.from_wkt(boundary_info["crs"]) != crs or len(boundary_wkb) != 1:
            raise ValueError("Unexpected map boundary")
        boundary = shapely.from_wkb(boundary_wkb[0])
        if not shapely.is_valid(boundary):
            raise ValueError("Invalid map boundary")
        boundary = transform_geom(crs, geographic, shapely.geometry.mapping(boundary))
        actual = shapely.geometry.shape(boundary).bounds
        if not np.allclose(actual, BOUNDS, rtol=0, atol=0.00002):
            raise ValueError(f"Boundary does not match published bounds: {actual}")
        grid, quality = make_grid(grouped, masks, boundary, BOUNDS, size)
    colours = np.zeros((len(CATALOG["units"]) + 1, 4), dtype=np.uint8)
    units = []
    for index, unit in enumerate(CATALOG["units"], 1):
        colours[index] = [int(unit["colour"][i : i + 2], 16) for i in (1, 3, 5)] + [255]
        units.append(
            {
                **unit,
                "displayIndex": index,
                "acceptedSourceFeatures": len(grouped[unit["sourceCode"]]),
                "pixels": int((grid == index).sum()),
            }
        )
    image = Path(image)
    image.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(colours[grid]).save(image)
    result = {
        "schemaVersion": 1,
        "productId": "USGS-SIM-3464-GeoUnits_v1",
        "publicationDate": "2020-12-02",
        "reviewDateUtc": "2026-11-12",
        "sourceUrl": BASE + SOURCE,
        "sourceSha256": SHA256,
        "sourceBytes": Path(archive).stat().st_size,
        "sourcePage": "https://pubs.usgs.gov/publication/sim3464",
        "sourceReadme": BASE + "sim3464_readme.txt",
        "citation": "Sun and Stack, 2020, USGS SIM 3464, doi:10.3133/sim3464",
        "credit": "USGS · Sun and Stack (2020)",
        "rights": "Public domain; retain attribution",
        "mapScaleDenominator": 75000,
        "sourceLayer": "GeoUnits_v1",
        "sourceFeatures": len(ids),
        "excludedFeatures": excluded,
        "displayNameCorrections": corrections,
        "sourceCrsWkt": info["crs"],
        "sourceCoordinateDefinition": "Mars 2000 sphere; Transverse Mercator; central meridian 77.5 degrees east; metres",
        "displayCrsWkt": sphere_wkt,
        "latitudeType": "planetocentric",
        "longitudeConvention": "east-positive, -180 to 180 degrees",
        "referenceSphereRadiusMetres": RADIUS,
        "bounds": BOUNDS,
        "actualBoundaryBounds": list(actual),
        "width": size,
        "height": size,
        "gridSpacingDegrees": [1 / size, 1 / size],
        "rasterization": "Categorical display grid; pixel-centre polygon fill; no geometry repair, simplification or registration",
        "assetUrl": "/jezero-geology.png",
        "assetSha256": sha256(image),
        "validPixels": int((grid > 0).sum()),
        "unknownPixels": int((grid == 0).sum()),
        **quality,
        "units": units,
        "paletteNote": CATALOG["paletteNote"],
        "dataKind": "Geological interpretation from orbital mapping",
        "analysisEligible": False,
        "registrationVerified": False,
        "limitations": [
            "USGS reports random offsets of about 100–200 m from the controlled CTX operations mosaic; no registration correction applied",
            "At 1:75,000 this is regional context, not drill-target positioning or rover-scale mineral measurements",
            "Invalid geometry, conflicting labels and cross-unit overlaps are withheld; transparent areas are unclassified",
            "Invalid geometries use conservative enclosing-rectangle masks that also withhold valid neighbours",
            "The pamphlet states a 77.3 E central meridian; the archive geometry, PRJ, metadata and readme agree on 77.5 E, which is used here",
        ],
        "processingVersions": {
            "pyogrio": pyogrio.__version__,
            "shapely": shapely.__version__,
            "rasterio": rasterio.__version__,
        },
    }
    Path(manifest).parent.mkdir(parents=True, exist_ok=True)
    Path(manifest).write_text(json.dumps(result, indent=2, allow_nan=False) + "\n")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--archive", type=Path, default=ROOT / "data/raw/geology" / SOURCE
    )
    parser.add_argument("--download", action="store_true")
    parser.add_argument(
        "--image", type=Path, default=ROOT / "assets/jezero-geology.png"
    )
    parser.add_argument(
        "--manifest", type=Path, default=ROOT / "src/data/generated/geology.json"
    )
    args = parser.parse_args()
    if args.download:
        args.archive.parent.mkdir(parents=True, exist_ok=True)
        # Keep an existing verified cache until the new download passes its gate.
        temporary = args.archive.with_suffix(".partial")
        try:
            subprocess.run(
                [
                    "curl",
                    "-L",
                    "--fail",
                    "--max-time",
                    "180",
                    "--max-filesize",
                    "400000000",
                    "--output",
                    str(temporary),
                    BASE + SOURCE,
                ],
                check=True,
            )
            if sha256(temporary) != SHA256:
                raise ValueError("Downloaded archive changed; existing cache retained")
            temporary.replace(args.archive)
        finally:
            temporary.unlink(missing_ok=True)

    result = build(args.archive, args.image, args.manifest)
    print(
        f"Built {result['width']}x{result['height']} regional geology overlay; {len(result['units'])} units, {len(result['excludedFeatures'])} excluded source features"
    )
    print("Display only: source offset and unknown areas remain uncorrected.")


if __name__ == "__main__":
    main()
