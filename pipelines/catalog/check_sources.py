"""Verify retained source metadata and display assets locally, without downloads."""

import hashlib
import json
import math
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from .import_nomenclature import MANIFEST
    from .import_nomenclature import build as build_nomenclature
except ImportError:
    from import_nomenclature import MANIFEST
    from import_nomenclature import build as build_nomenclature

ROOT = Path(__file__).resolve().parents[2]
NS = {"w": "http://www.opengis.net/wmts/1.0", "o": "http://www.opengis.net/ows/1.1"}


def read_json(root: Path, path: str):
    return json.loads((root / path).read_text())


def check_file(root: Path, relative: str, expected: str, size=None):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"File outside repository: {relative}")
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f"Checksum mismatch: {relative}")
    if size is not None and len(data) != size:
        raise ValueError(f"Byte count mismatch: {relative}")
    return data


def check_imagery(source: dict, snapshots: dict):
    capabilities = ET.fromstring(snapshots["capabilities"])
    if capabilities.get("version") != "1.0.0":
        raise ValueError("Unsupported WMTS protocol version")
    layer = capabilities.find("w:Contents/w:Layer", NS)
    if (
        layer is None
        or layer.findtext("o:Identifier", namespaces=NS) != source["productId"]
    ):
        raise ValueError("Imagery product differs from capabilities")
    bounds = layer.find("o:BoundingBox", NS)
    if bounds is None or bounds.get("crs") != "urn:ogc:def:crs:EPSG::104905":
        raise ValueError("Imagery must use the reviewed Mars CRS")
    extent = [
        float(value)
        for corner in ("o:LowerCorner", "o:UpperCorner")
        for value in bounds.findtext(corner, namespaces=NS).split()
    ]
    if extent != source["extent"]:
        raise ValueError("Imagery footprint differs from capabilities")
    if layer.findtext("w:Format", namespaces=NS) != "image/png":
        raise ValueError("Unsupported imagery format")
    if (
        layer.findtext("w:Style[@isDefault='true']/o:Identifier", namespaces=NS)
        != "default"
        or layer.findtext("w:TileMatrixSetLink/w:TileMatrixSet", namespaces=NS)
        != "default028mm"
    ):
        raise ValueError("Unsupported imagery style or matrix link")
    matrix_set = capabilities.find("w:Contents/w:TileMatrixSet", NS)
    if (
        matrix_set is None
        or matrix_set.findtext("o:SupportedCRS", namespaces=NS)
        != "urn:ogc:def:crs:EPSG::104905"
    ):
        raise ValueError("Unsupported imagery tiling CRS")
    matrices = matrix_set.findall("w:TileMatrix", NS)
    if len(matrices) != source["maxLevel"] + 1:
        raise ValueError("Imagery level count differs from capabilities")
    for level, matrix in enumerate(matrices):
        expected = {
            "o:Identifier": level,
            "w:TileWidth": 256,
            "w:TileHeight": 256,
            "w:MatrixWidth": 2 ** (level + 1),
            "w:MatrixHeight": 2**level,
        }
        if any(
            float(matrix.findtext(key, namespaces=NS)) != value
            for key, value in expected.items()
        ) or matrix.findtext("w:TopLeftCorner", namespaces=NS).split() != [
            "-180.0",
            "90.0",
        ]:
            raise ValueError(f"Unsupported imagery tile matrix at level {level}")
    response = json.loads(snapshots["catalog"])["response"]
    if response["numFound"] != 1 or len(response["docs"]) != 1:
        raise ValueError("Catalog must identify exactly one product")
    record = response["docs"][0]
    if (
        record["productLabel"] != source["productId"]
        or [float(v) for v in record["bbox"].split(",")] != source["extent"]
    ):
        raise ValueError("Catalog product or footprint differs from reviewed source")
    if source["layerId"] in {"jezero", "hirise"} and (
        ",3396190,0]" not in record["projection"]
    ):
        raise ValueError("Catalog does not define the reviewed Mars sphere")


def check_world_layer(source, snapshots):
    capabilities = ET.fromstring(snapshots["capabilities"])
    layer = capabilities.find("w:Contents/w:Layer", NS)
    matrix_set = capabilities.find("w:Contents/w:TileMatrixSet", NS)
    if (
        layer is None
        or matrix_set is None
        or layer.findtext("o:Identifier", namespaces=NS) != source["productId"]
    ):
        raise ValueError("World layer identity differs from capabilities")
    if source["analysisEligible"] is not False:
        raise ValueError("World layer analysis eligibility requires review")
    if (
        matrix_set.findtext("o:SupportedCRS", namespaces=NS)
        != "urn:ogc:def:crs:EPSG::104905"
    ):
        raise ValueError("World layer must use Mars geographic CRS")
    bounds = layer.find("o:BoundingBox", NS)
    extent = [
        float(v)
        for corner in ("o:LowerCorner", "o:UpperCorner")
        for v in bounds.findtext(corner, namespaces=NS).split()
    ]
    if extent != source["extent"]:
        raise ValueError("World layer extent differs from capabilities")
    matrices = matrix_set.findall("w:TileMatrix", NS)
    if len(matrices) != source["maxLevel"] + 1 or source["tileSize"] not in {256, 512}:
        raise ValueError("World layer tile size or level count differs")
    for level, matrix in enumerate(matrices):
        expected = {
            "o:Identifier": level,
            "w:TileWidth": source["tileSize"],
            "w:TileHeight": source["tileSize"],
            "w:MatrixWidth": 2 ** (level + 1),
            "w:MatrixHeight": 2**level,
        }
        if any(
            float(matrix.findtext(key, namespaces=NS)) != value
            for key, value in expected.items()
        ) or matrix.findtext("w:TopLeftCorner", namespaces=NS).split() != [
            "-180.0",
            "90.0",
        ]:
            raise ValueError(
                "World layer tile grid differs from reviewed geographic grid"
            )
    resource = layer.find("w:ResourceURL", NS)
    template = resource.get("template").replace("//{Style}", "/{Style}")
    for old, new in {
        "{Style}": "default",
        "{TileMatrixSet}": "default028mm",
        "{TileMatrix}": "{z}",
        "{TileRow}": "{y}",
        "{TileCol}": "{x}",
    }.items():
        template = template.replace(old, new)
    if template != source["tileTemplate"] or resource.get("format") != source["format"]:
        raise ValueError("World layer endpoint or format differs from capabilities")
    response = json.loads(snapshots["catalog"])["response"]
    if (
        response["numFound"] != 1
        or len(response["docs"]) != 1
        or response["docs"][0]["productLabel"] != source["productId"]
    ):
        raise ValueError("World layer catalog identity mismatch")
    catalog_extent = [float(v) for v in response["docs"][0]["bbox"].split(",")]
    if any(abs(a - b) > 0.0001 for a, b in zip(catalog_extent, extent)):
        raise ValueError("World layer service/catalog extents disagree")
    if source["layerId"] == "ctx-global":
        service = json.loads(snapshots["ctx-service"])
        grid = service["tileInfo"]
        if (
            "3396190.0,0.0" not in service["spatialReference"]["wkt"]
            or grid["rows"] != source["tileSize"]
            or grid["origin"] != {"x": -180, "y": 90}
        ):
            raise ValueError("Global CTX service does not match Mars sphere/grid")
        for level in range(source["maxLevel"] + 1):
            if grid["lods"][level]["level"] != level or not math.isclose(
                grid["lods"][level]["resolution"],
                180 / source["tileSize"] / 2**level,
                rel_tol=0,
                abs_tol=1e-9,
            ):
                raise ValueError("Global CTX service resolution grid mismatch")


def validate(root: Path):
    verified = set()

    def verify(path, sha256, size=None):
        data = check_file(root, path, sha256, size)
        verified.add(path)
        return data

    review = read_json(root, "data/manifests/imagery-review.json")
    if (
        review["schemaVersion"] != 1
        or {s["layerId"] for s in review["sources"]} != {"global", "jezero", "hirise"}
        or len(review["sources"]) != 3
    ):
        raise ValueError("Expected exactly three reviewed imagery layers")
    for source in review["sources"]:
        snapshots = {}
        for snapshot in source["snapshots"]:
            if snapshot["kind"] in snapshots:
                raise ValueError("Duplicate imagery snapshot kind")
            snapshots[snapshot["kind"]] = verify(
                snapshot["path"], snapshot["sha256"], snapshot["bytes"]
            )
        if set(snapshots) != {"catalog", "capabilities"}:
            raise ValueError("Missing imagery catalog or capabilities snapshot")
        check_imagery(source, snapshots)

    world = read_json(root, "data/manifests/world-layers-review.json")
    if (
        world["schemaVersion"] != 1
        or {s["layerId"] for s in world["sources"]}
        != {"ctx-global", "themis", "relief-global", "geology-global"}
        or len(world["sources"]) != 4
    ):
        raise ValueError("Expected four reviewed world context layers")
    for source in world["sources"]:
        snapshots = {
            snapshot["kind"]: verify(
                snapshot["path"], snapshot["sha256"], snapshot["bytes"]
            )
            for snapshot in source["snapshots"]
        }
        check_world_layer(source, snapshots)
        if source["layerId"] == "geology-global":
            units = json.loads(snapshots["geology-legend"])["layers"][0]["legend"]
            expected = [
                {k: unit[k] for k in ("label", "imageData", "width", "height")}
                for unit in units
            ]
            if expected != world["geologyLegend"] or len(
                {u["label"] for u in units}
            ) != len(units):
                raise ValueError("Global geology legend differs from source")

    for name, checksum in read_json(
        root, "data/manifests/metadata-checksums.json"
    ).items():
        verify("data/manifests/" + name, checksum)
    geology_review = read_json(root, "data/manifests/geology-source-review.json")
    for source in geology_review["sources"]:
        if source["retainedInGit"]:
            verify(source["retainedPath"], source["sha256"], source["bytes"])
    for snapshot in geology_review["coordinateSnapshots"]:
        verify(snapshot["retainedPath"], snapshot["sha256"], snapshot["bytes"])
    for name in ("elevation", "geology", "slope"):
        product = read_json(root, f"src/data/generated/{name}.json")
        verify("assets" + product["assetUrl"], product["assetSha256"])
        if product["analysisEligible"] is not False:
            raise ValueError(f"{name}: analysis eligibility requires a new review")
        if product["referenceSphereRadiusMetres"] != 3396190:
            raise ValueError(f"{name}: unexpected Mars reference sphere")
        if product["latitudeType"] != "planetocentric":
            raise ValueError(f"{name}: unsupported latitude definition")
        west, south, east, north = product["bounds"]
        if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
            raise ValueError(f"{name}: invalid geographic bounds")
        if name in {"elevation", "slope"}:
            if product["verticalDatumConverted"] is not False:
                raise ValueError("Height conversion requires a new review")
            count = product["validPixels"] + product["nodataPixels"]
            if name == "slope" and (
                product["angleUnits"] != "degrees"
                or product["sourceSha256"]
                != read_json(root, "src/data/generated/elevation.json")["sourceSha256"]
                or product["scaleDegrees"] != [0, 90]
            ):
                raise ValueError("Slope source, units or scale differ from review")
        else:
            if product["registrationVerified"] is not False:
                raise ValueError("Geology registration requires a new review")
            count = product["validPixels"] + product["unknownPixels"]
            if product["sourceSha256"] != geology_review["sources"][0]["sha256"]:
                raise ValueError("Geology source differs from its review")
        if count != product["width"] * product["height"]:
            raise ValueError(f"{name}: invalid pixel accounting")
    images = read_json(root, "data/manifests/surface-images.json")["images"]
    if len(images) != 3 or len({image["stopId"] for image in images}) != 3:
        raise ValueError("Expected one reference image for each of three stops")
    for image in images:
        verify("assets" + image["assetUrl"], image["sha256"], image["bytes"])
    catalogue = read_json(root, MANIFEST)
    snapshot = catalogue["snapshot"]
    raw = verify(snapshot["path"], snapshot["sha256"], snapshot["bytes"])
    expected_files, expected_review = build_nomenclature(raw, catalogue["retrievedAt"])
    if catalogue != expected_review or catalogue["analysisEligible"] is not False:
        raise ValueError("Catalogue manifest differs from reproducible source import")
    for relative, expected in expected_files.items():
        verify(relative, hashlib.sha256(expected).hexdigest(), len(expected))
    return sorted(verified)


def main():
    try:
        files = validate(ROOT)
    except (OSError, ValueError, KeyError, TypeError, ET.ParseError) as error:
        print(f"Data verification failed: {error}", file=sys.stderr)
        return 1
    print(
        f"Verified {len(files)} retained metadata/display files and source contracts."
    )
    print("Live tiles, bulk source archives and scientific alignment are not verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
