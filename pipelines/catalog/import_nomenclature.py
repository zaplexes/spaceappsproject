"""Import the official Mars named-feature feed for static, on-demand browsing."""

import argparse
import hashlib
import io
import json
import math
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_URL = (
    "https://asc-planetarynames-data.s3.us-west-2.amazonaws.com/"
    "MARS_nomenclature_center_pts.kmz"
)
SOURCE_PAGE = "https://planetarynames.wr.usgs.gov/GIS_Downloads"
MANIFEST = "data/manifests/nomenclature-review.json"
NS = {"k": "http://www.opengis.net/kml/2.2"}
MAX_BYTES = 12_000_000


def encoded(value):
    return (
        json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"
    ).encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def number(value, label):
    if value is None or not value.strip():
        raise ValueError(f"Missing {label}")
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f"Non-finite {label}")
    return result


def parse_records(data):
    if len(data) > MAX_BYTES:
        raise ValueError("Source exceeds download limit")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        member = archive.getinfo("MARS_nomenclature_center_pts.kml")
        if member.file_size > MAX_BYTES:
            raise ValueError("Unpacked KML exceeds limit")
        root = ET.fromstring(archive.read(member))
    if root.tag != f"{{{NS['k']}}}kml" or root.get("hint") != "target=MARS":
        raise ValueError("Expected Mars KML")
    records, excluded, ids = [], Counter(), {}
    for placemark in root.findall(".//k:Placemark", NS):
        fields = {
            item.attrib["name"]: item.text or ""
            for item in placemark.findall(".//k:SimpleData", NS)
        }
        if fields.get("approval") != "Adopted by IAU":
            excluded[fields.get("approval") or "Missing approval"] += 1
            continue
        name = placemark.findtext("k:name", namespaces=NS)
        link = fields.get("link", "")
        match = re.fullmatch(
            r"https?://planetarynames\.wr\.usgs\.gov/Feature/(\d+)", link
        )
        if not match or not name or not name.strip() or not fields.get("type"):
            raise ValueError("Missing feature name, type or official ID")
        feature_id = "iau-" + match[1]
        identity = (
            name,
            fields,
            placemark.findtext("k:Point/k:coordinates", namespaces=NS),
        )
        if feature_id in ids:
            if ids[feature_id] != identity:
                raise ValueError(f"Conflicting duplicate feature ID: {feature_id}")
            excluded["Identical duplicate source record"] += 1
            continue
        ids[feature_id] = identity
        latitude = number(fields.get("center_lat"), "latitude")
        east = number(fields.get("center_lon"), "longitude")
        if not (-90 <= latitude <= 90 and 0 <= east <= 360):
            raise ValueError(f"Out-of-range coordinates: {name}")
        longitude = (east + 180) % 360 - 180
        point = placemark.findtext("k:Point/k:coordinates", namespaces=NS)
        if not point:
            raise ValueError(f"Missing KML point: {name}")
        point_values = point.strip().split(",")
        if len(point_values) not in (2, 3):
            raise ValueError(f"Unsupported KML point: {name}")
        point_lon, point_lat = [number(v, "KML point") for v in point_values[:2]]
        if (
            abs((point_lon - longitude + 180) % 360 - 180) > 1e-7
            or abs(point_lat - latitude) > 1e-7
        ):
            raise ValueError(f"KML/attribute coordinate disagreement: {name}")
        dimension = number(fields.get("diameter"), "dimension")
        if dimension < 0:
            raise ValueError(f"Negative dimension: {name}")
        region_id = fields.get("quad_code") or "unspecified"
        if region_id != "unspecified" and not re.fullmatch(
            r"mc(?:0[1-9]|[12]\d|30)", region_id
        ):
            raise ValueError(f"Unexpected map quadrangle: {region_id}")
        region_name = fields.get("quad_name") or "Region not specified"
        type_code = fields.get("code", "")
        if not re.fullmatch(r"[A-Z]{2}", type_code):
            raise ValueError(f"Invalid feature type code: {name}")
        records.append(
            {
                "id": feature_id,
                "name": name,
                "searchName": fields.get("clean_name") or name,
                "typeCode": type_code,
                "type": fields["type"],
                "regionId": region_id,
                "regionName": region_name,
                "latitude": latitude,
                "longitude": longitude,
                "longitudeEast": east,
                "dimensionKm": dimension if dimension > 0 else None,
                "nameOrigin": fields.get("origin") or None,
                "sourceUrl": "https://planetarynames.wr.usgs.gov/Feature/" + match[1],
            }
        )
    if not records:
        raise ValueError("No adopted features in source")
    return sorted(records, key=lambda r: (r["searchName"].casefold(), r["id"])), dict(
        excluded
    )


def build(data, retrieved_at):
    records, excluded = parse_records(data)
    source_hash = digest(data)
    version = source_hash[:12]
    base = {"schemaVersion": 1, "sourceSha256": source_hash}
    groups = defaultdict(list)
    types = {}
    for record in records:
        groups[record["regionId"]].append(record)
        code = record["typeCode"]
        if code in types and types[code] != record["type"]:
            raise ValueError("Conflicting feature type names")
        types[code] = record["type"]
    snapshot_url = f"/catalog/source-{version}.kmz"
    outputs = {"assets" + snapshot_url: data}
    regions = []
    for region_id, members in sorted(groups.items()):
        names = {m["regionName"] for m in members}
        if len(names) != 1:
            raise ValueError("Conflicting region names")
        url = f"/catalog/{region_id}-{version}.json"
        payload = encoded({**base, "regionId": region_id, "features": members})
        outputs["assets" + url] = payload
        regions.append(
            {
                "id": region_id,
                "name": names.pop(),
                "count": len(members),
                "assetUrl": url,
                "sha256": digest(payload),
                "bytes": len(payload),
            }
        )
    keys = ("id", "name", "searchName", "typeCode", "regionId", "latitude", "longitude")
    index = encoded({**base, "entries": [{k: r[k] for k in keys} for r in records]})
    index_url = f"/catalog/index-{version}.json"
    outputs["assets" + index_url] = index
    review = {
        **base,
        "title": "Mars named surface features",
        "sourceUrl": SOURCE_URL,
        "sourcePage": SOURCE_PAGE,
        "retrievedAt": retrieved_at,
        "sourceVersion": None,
        "sourcePublicationDate": None,
        "snapshot": {
            "path": "assets" + snapshot_url,
            "assetUrl": snapshot_url,
            "sha256": source_hash,
            "bytes": len(data),
        },
        "index": {"assetUrl": index_url, "sha256": digest(index), "bytes": len(index)},
        "count": len(records),
        "craterCount": sum(r["typeCode"] == "AA" for r in records),
        "excluded": excluded,
        "regions": regions,
        "types": [
            {"code": k, "name": v} for k, v in sorted(types.items(), key=lambda t: t[1])
        ],
        "rights": "Public domain, as stated in the source archive metadata.",
        "citation": "IAU Working Group for Planetary System Nomenclature / USGS Astrogeology Science Center, Gazetteer of Planetary Nomenclature, Mars named-feature export.",
        "coordinateNote": "KML export: planetocentric latitude and east longitude, per the USGS GIS downloads page; MDIM 2.1 control network. East longitude is wrapped to -180…180 for display on the 3396190-metre Mars sphere. These are catalogue centres, not observation or landing sites; horizontal accuracy and alignment are unverified.",
        "analysisEligible": False,
        "limitations": [
            "Named, IAU-adopted features only; this is not a complete catalogue of Martian craters or obstacles.",
            "A feature centre is a discovery reference, not a verified science observation site or accessible stop.",
            "Diameter means approximate diameter or longest dimension; source zero dimensions remain unknown.",
            "Name origin explains the name, not the feature's scientific history or composition.",
            "The archive's legacy metadata lists 2012 coverage, 1690 points and weekly updates; the current downloads page describes nightly exports. Neither is treated as this snapshot's release date or version.",
            "The archive projection sidecar defines an oblate Mars ellipsoid while its legacy XML describes a sphere. Display follows the documented KML angular convention; no alignment or analysis eligibility is established.",
            "Region filters use source quadrangle assignments or centre containment, not full feature footprints.",
        ],
    }
    return outputs, review


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source", type=Path, help="Use an already downloaded official KMZ"
    )
    parser.add_argument("--retrieved-at", help="UTC retrieval time for --source")
    args = parser.parse_args()
    if args.source and not args.retrieved_at:
        parser.error("--source requires --retrieved-at")
    try:
        retrieved_at = args.retrieved_at or datetime.now(timezone.utc).isoformat(
            timespec="seconds"
        )
        if (
            datetime.fromisoformat(retrieved_at.replace("Z", "+00:00"))
            .utcoffset()
            .total_seconds()
            != 0
        ):
            raise ValueError("Retrieval time must specify UTC")
        if args.source:
            data = args.source.read_bytes()
        else:
            request = urllib.request.Request(
                SOURCE_URL, headers={"User-Agent": "MartianMap-CatalogImport/1"}
            )
            with urllib.request.urlopen(request, timeout=40) as response:
                data = response.read(MAX_BYTES + 1)
        outputs, review = build(data, retrieved_at)
        # Parse and validate everything before changing any retained output.
        outputs[MANIFEST] = (
            json.dumps(review, ensure_ascii=False, indent=2) + "\n"
        ).encode()
        for relative, content in outputs.items():
            path = ROOT / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_suffix(path.suffix + ".tmp")
            temporary.write_bytes(content)
            temporary.replace(path)
        print(
            f"Imported {review['count']} features ({review['craterCount']} named craters), {len(review['regions'])} region files."
        )
        print(
            "Review the changes, run checks and publish the compiled site to release this snapshot."
        )
        return 0
    except (
        OSError,
        ValueError,
        KeyError,
        AttributeError,
        ET.ParseError,
        zipfile.BadZipFile,
    ) as error:
        print(f"Catalogue import failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
