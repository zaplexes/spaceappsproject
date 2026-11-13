"""Retain sparse numerical terrain context; do not infer route eligibility."""

import json
from pathlib import Path

import numpy as np

from pipelines.terrain.build_elevation import PRODUCT, SOURCE_SHA256, read_dem, sha256
from pipelines.terrain.build_slope import gradient_degrees

ROOT = Path(__file__).resolve().parents[2]


def build():
    source = ROOT / "data/raw" / (PRODUCT + ".tif")
    if sha256(source) != SOURCE_SHA256:
        raise ValueError("Unreviewed DEM bytes")
    values, valid, grid = read_dem(source)
    dx, dy = grid["sourcePixelSizeMetres"]
    radius = 3396190
    latitudes = grid["bounds"][3] - np.degrees(
        (np.arange(grid["height"]) + 0.5) * dy / radius
    )
    slopes, slope_valid = gradient_degrees(values, valid, dx, dy, latitudes)
    stride = 8
    # Each stored sample is an actual source pixel, not an interpolated elevation.
    rows = np.arange(4, grid["height"] - 1, stride)
    cols = np.arange(4, grid["width"] - 1, stride)
    samples = []
    for row in rows:
        for col in cols:
            samples.append(
                [
                    round(float(values[row, col]), 1) if valid[row, col] else None,
                    round(float(slopes[row, col]), 2)
                    if slope_valid[row, col]
                    else None,
                ]
            )
    output = ROOT / "assets/terrain-context.json"
    data = {
        "schemaVersion": 1,
        "width": len(cols),
        "height": len(rows),
        "westCentre": grid["bounds"][0]
        + float(np.degrees((cols[0] + 0.5) * dx / radius)),
        "northCentre": float(latitudes[rows[0]]),
        "stepDegrees": float(np.degrees(stride * dx / radius)),
        "samples": samples,
    }
    output.write_text(json.dumps(data, separators=(",", ":"), allow_nan=False) + "\n")
    manifest = {
        "schemaVersion": 1,
        "sourceProductId": PRODUCT,
        "sourceSha256": SOURCE_SHA256,
        "assetUrl": "/terrain-context.json",
        "assetSha256": sha256(output),
        "sampleSpacingMetresInProjection": stride * dx,
        "sourcePixelSizeMetres": dx,
        "sampleCount": len(samples),
        "bounds": grid["bounds"],
        "verticalDatum": "Mars areoid (DeltaGeoid); not radius above renderer sphere",
        "analysisEligible": False,
        "method": "Every eighth source pixel from row/column 4; nearest stored centre, no interpolation. Heights rounded to 0.1 m; exploratory Horn gradients rounded to 0.01 degree. Route samples are sparse context, not corridor checks.",
    }
    (ROOT / "src/data/generated/terrain-context.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    print(f"Retained {len(samples)} numerical context samples; no route eligibility.")


if __name__ == "__main__":
    build()
