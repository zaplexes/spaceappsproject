"""Reproduce a bounded PLACES table audit; never derive target coordinates."""

import argparse
import csv
import hashlib
import io
import json
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

BASE = "https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_rover_places/"
# Pin the reviewed archive bytes: upstream revisions require another review.
SOURCES = [
    (
        "best_interp.csv",
        "data_localizations/best_interp.csv",
        "58fbc62f2676195a00b40b2da53a797a70284a8d2344b288c999d325b7ccb4cc",
    ),
    (
        "best_interp.csv.xml",
        "data_localizations/best_interp.csv.xml",
        "03a382042c73d7a7eaced1c32f64108ed42c07f2139bbcc815cb4ab882eac70b",
    ),
    (
        "mech_arm.csv",
        "data_mechanisms/mech_arm.csv",
        "5292a962ea966dea9110cc7c2778ff8585e80fa1cb57d84e5f08ea51e221ea83",
    ),
    (
        "mech_arm.csv.xml",
        "data_mechanisms/mech_arm.csv.xml",
        "6f313b049f264944e97e3e9281872021966dc8b1b04b5f7b18b33e2bce4f6808",
    ),
    (
        "places-sis.pdf",
        "document/Mars2020_Rover_PLACES_PDS_SIS.pdf",
        "ca3eb9d2a0d992cedf96860f30537ac508e15fb0e2417fb74c5b80cb31418d1a",
    ),
    (
        "places-appendix-b.pdf",
        "document/Mars2020_Rover_PLACES_SIS_Appendix_B_PPPCS.pdf",
        "0cf5c06521b68c4ff2e074a0d77bc7579627b4b94460ee608c067031f9025220",
    ),
]
ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "data/manifests/pds-position-audit.json"
NS = {"p": "http://pds.nasa.gov/pds4/pds/v1"}
# Diagnostic site/drive keys suggested by published image names, not verified
# coring-event matches. No nearest-neighbour or same-sol target inference.
KEYS = [(26, 1004), (26, 1222), (29, 0)]


def audit(cache: Path, download: bool) -> dict:
    sources = []
    contents = {}
    for name, suffix, expected in SOURCES:
        path = cache / name
        if download and not path.exists():
            cache.mkdir(parents=True, exist_ok=True)
            with urllib.request.urlopen(BASE + suffix, timeout=90) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != expected:
                raise ValueError(f"Unreviewed source: {name}; checksum changed")
            path.write_bytes(data)
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f"Unreviewed source: {name}; checksum changed")
        contents[name] = data
        sources.append(
            {"file": name, "url": BASE + suffix, "sha256": expected, "bytes": len(data)}
        )
    tables = {}
    for name in ("best_interp.csv", "mech_arm.csv"):
        reader = csv.DictReader(io.StringIO(contents[name].decode()))
        rows = list(reader)
        if any(
            None in row or any(value is None for value in row.values()) for row in rows
        ):
            raise ValueError(f"Ragged CSV: {name}")
        label = ET.fromstring(contents[name + ".xml"])
        count = int(label.findtext(".//p:records", namespaces=NS))
        if len(rows) != count:
            raise ValueError(f"Record count differs from label: {name}")
        tables[name] = rows
        sources[next(i for i, s in enumerate(sources) if s["file"] == name)].update(
            version=label.findtext(".//p:version_id", namespaces=NS),
            logicalIdentifier=label.findtext(".//p:logical_identifier", namespaces=NS),
            records=count,
        )
    diagnostics = []
    for site, drive in KEYS:

        def matches(row):
            return int(row["site"]) == site and int(row["drive"]) == drive

        rover = [
            r for r in tables["best_interp.csv"] if matches(r) and r["frame"] == "ROVER"
        ]
        arm = [r for r in tables["mech_arm.csv"] if matches(r)]
        diagnostics.append(
            {
                "site": site,
                "drive": drive,
                "correspondenceToCoringEventVerified": False,
                "roverFrameRows": rover,
                "armRows": len(arm),
                "armRowsWithoutExactTimeInterval": sum(
                    not (r["min_sclk"] and r["max_sclk"]) for r in arm
                ),
                "armRowsWithoutApproximateTimeInterval": sum(
                    not (r["approx_min_sclk"] and r["approx_max_sclk"]) for r in arm
                ),
                "armRowsWithAllResolverAngles": sum(
                    all(
                        r["res_" + joint] not in ("", "-9999")
                        for joint in (
                            "azimuth",
                            "elevation",
                            "elbow",
                            "wrist",
                            "turret",
                        )
                    )
                    for r in arm
                ),
            }
        )
    return {
        "reviewDateUtc": "2026-11-12",
        "purpose": "Diagnostic rover-frame and mechanism-table review, not target localization.",
        "sources": sources,
        "diagnosticKeys": diagnostics,
        "eventJoinVerified": False,
        "drillTipTransformApplied": False,
        "markerPlacementApproved": False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cache-dir", type=Path, default=ROOT / "data/raw/pds-positions"
    )
    parser.add_argument("--download", action="store_true")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Compare with the committed audit without rewriting it",
    )
    args = parser.parse_args()
    result = audit(args.cache_dir, args.download)
    if args.check:
        if result != json.loads(OUTPUT.read_text()):
            raise ValueError("Audit differs from the committed review")
        print("Pinned PDS sources and table audit match the committed review.")
    else:
        OUTPUT.write_text(json.dumps(result, indent=2) + "\n")
        print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
