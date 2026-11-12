"""Build a georeferenced colour overlay, never a Cesium height tileset."""

import argparse
import hashlib
import json
import math
import urllib.request
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image

PRODUCT = "JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0"
SOURCE_URL = (
    "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/"
    + PRODUCT
    + ".tif"
)
SOURCE_SHA256 = "16a1aa66c3f48c1bca252795827db7b417876217aff0f5e1aff18027fab2327b"
SOURCE_PAGE = "https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_ctx_dtm_mosaic"
RADIUS = 3396190.0
PALETTE = np.array([[54, 90, 103], [223, 207, 149], [165, 67, 41]], dtype=np.float64)


def sha256(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def download(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".partial")
    total = 0
    try:
        with (
            urllib.request.urlopen(SOURCE_URL, timeout=45) as response,
            temporary.open("wb") as output,
        ):
            while block := response.read(1024 * 1024):
                total += len(block)
                if total > 16 * 1024 * 1024:
                    raise ValueError(
                        "Source exceeds the expected 16 MiB download bound"
                    )
                output.write(block)
        if sha256(temporary) != SOURCE_SHA256:
            raise ValueError(
                "Source checksum changed; review the upstream product before rebuilding"
            )
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def read_dem(path):
    with rasterio.open(path) as source:
        if source.count != 1 or source.dtypes[0] != "float32":
            raise ValueError("Expected one Float32 elevation band")
        if source.crs is None:
            raise ValueError("Missing source coordinate system")
        projection = source.crs.to_dict()
        radius = projection.get("R", projection.get("a"))
        polar = projection.get("b", radius)
        if projection.get("proj") != "eqc" or radius != RADIUS or polar != RADIUS:
            raise ValueError("Expected equirectangular Mars reference sphere")
        for parameter in ["lat_ts", "lat_0", "lon_0", "x_0", "y_0"]:
            if float(projection.get(parameter, 0)) != 0:
                raise ValueError("Unexpected equirectangular projection parameters")
        if projection.get("units") != "m":
            raise ValueError("Horizontal units must be metres")
        transform = source.transform
        if transform.b != 0 or transform.d != 0 or transform.a <= 0 or transform.e >= 0:
            raise ValueError("Expected north-up, unrotated raster")
        if source.nodata is None:
            raise ValueError("Nodata definition is required")
        data = source.read(1, masked=True)
        valid = ~np.ma.getmaskarray(data) & np.isfinite(data.data)
        if not valid.any():
            raise ValueError("Raster contains no valid elevations")
        values = data.data[valid]
        # x=R*lambda, y=R*phi for this source's verified zero-centred eqc projection.
        west, south, east, north = [math.degrees(v / RADIUS) for v in source.bounds]
        if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
            raise ValueError("Invalid geographic footprint")
        return (
            data.data,
            valid,
            {
                "bounds": [west, south, east, north],
                "width": source.width,
                "height": source.height,
                "sourcePixelSizeMetres": [transform.a, -transform.e],
                "minimumMetres": float(values.min()),
                "maximumMetres": float(values.max()),
                "validPixels": int(valid.sum()),
                "nodataPixels": int((~valid).sum()),
                "nodataValue": float(source.nodata),
                "sourceCrsWkt": source.crs.to_wkt(),
            },
        )


def colourize(values, valid, minimum, maximum):
    if maximum < minimum:
        raise ValueError("Invalid colour bounds")
    fraction = np.zeros(values.shape, dtype=np.float64)
    if maximum > minimum:
        fraction[valid] = np.clip(
            (values[valid].astype(np.float64) - minimum) / (maximum - minimum), 0, 1
        )
    first = np.minimum((fraction * 2).astype(np.int32), 1)
    blend = (fraction * 2 - first)[..., None]
    rgba = np.zeros((*values.shape, 4), dtype=np.uint8)
    rgba[..., :3] = np.rint(
        PALETTE[first] * (1 - blend) + PALETTE[first + 1] * blend
    ).astype(np.uint8)
    rgba[..., 3] = np.where(valid, 255, 0)
    return rgba


def build(source, image_path, manifest_path):
    if sha256(source) != SOURCE_SHA256:
        raise ValueError("Unreviewed DEM checksum; source version must be verified")
    values, valid, grid = read_dem(source)
    rgba = colourize(values, valid, grid["minimumMetres"], grid["maximumMetres"])
    image_path = Path(image_path)
    manifest_path = Path(manifest_path)
    image_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(image_path, optimize=False)
    manifest = {
        "schemaVersion": 1,
        "pipelineVersion": "1.0.0",
        "productId": PRODUCT,
        "sourceUrl": SOURCE_URL,
        "sourceSha256": SOURCE_SHA256,
        "sourceByteLength": Path(source).stat().st_size,
        "sourcePage": SOURCE_PAGE,
        "citation": "Fergason et al., 2020, doi:10.5066/P906QQT8",
        "rights": "USGS public data; cite authors",
        "sourcePublicationDate": "2020-07-24",
        "verifiedDate": "2026-11-11",
        "mission": "Mars Reconnaissance Orbiter",
        "instrument": "CTX",
        "latitudeType": "planetocentric",
        "longitudeConvention": "east-positive, -180 to 180 degrees",
        "referenceSphereRadiusMetres": RADIUS,
        "verticalDatum": "Mars areoid (source DeltaGeoid)",
        "verticalUnits": "metres",
        "verticalDatumConverted": False,
        "assetUrl": "/jezero-elevation.png",
        "assetSha256": sha256(image_path),
        "displayType": "colour overlay on a smooth reference sphere; not 3D relief",
        "resampling": "none; source pixels retained",
        "colourScale": "linear over valid source range; not risk or scoring",
        "palette": PALETTE.astype(int).tolist(),
        "analysisEligible": False,
        "limitations": [
            "Source metadata alignment only; independent point-level registration unverified",
            "No slopes, obstacles, walking feasibility or hazard classification",
            "No areoid-to-radius height conversion; no 3D displacement",
        ],
        **grid,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, allow_nan=False) + "\n")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dem", type=Path, default=Path("data/raw/") / (PRODUCT + ".tif")
    )
    parser.add_argument("--download", action="store_true")
    parser.add_argument(
        "--image", type=Path, default=Path("assets/jezero-elevation.png")
    )
    parser.add_argument(
        "--manifest", type=Path, default=Path("src/data/generated/elevation.json")
    )
    args = parser.parse_args()
    if args.download:
        download(args.dem)
    manifest = build(args.dem, args.image, args.manifest)
    print(
        f"Built {manifest['width']}x{manifest['height']} elevation overlay; {manifest['validPixels']} valid pixels, {manifest['nodataPixels']} nodata pixels"
    )
    print(
        "Heights remain relative to the source Mars areoid. No 3D terrain or analysis output created."
    )


if __name__ == "__main__":
    main()
