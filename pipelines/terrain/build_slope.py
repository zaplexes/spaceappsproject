"""Build an exploratory Mars DEM-gradient display; never classify walkability."""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

from pipelines.terrain.build_elevation import (
    PRODUCT,
    RADIUS,
    SOURCE_PAGE,
    SOURCE_SHA256,
    SOURCE_URL,
    read_dem,
    sha256,
)

PALETTE = np.array([[34, 64, 92], [124, 161, 178], [244, 224, 160]])


def gradient_degrees(values, valid, dx, dy, row_latitudes):
    """Horn 3x3 derivative, east spacing corrected on the source Mars sphere."""
    values = np.asarray(values, dtype=np.float64)
    valid = np.asarray(valid, dtype=bool)
    latitudes = np.asarray(row_latitudes, dtype=np.float64)
    if (
        values.ndim != 2
        or min(values.shape) < 3
        or values.shape != valid.shape
        or latitudes.shape != (values.shape[0],)
        or not np.isfinite([dx, dy]).all()
        or dx <= 0
        or dy <= 0
        or not np.isfinite(latitudes).all()
        or np.any(np.abs(latitudes) >= 89)
    ):
        raise ValueError("Unsupported local slope grid or spacing")
    valid = valid & np.isfinite(values)
    # Never interpolate nodata, edge values or a missing neighbour into a slope.
    windows = np.lib.stride_tricks.sliding_window_view(valid, (3, 3))
    inner_valid = windows.all(axis=(-1, -2))
    z = np.where(valid, values, 0)
    east = (
        z[:-2, 2:]
        + 2 * z[1:-1, 2:]
        + z[2:, 2:]
        - z[:-2, :-2]
        - 2 * z[1:-1, :-2]
        - z[2:, :-2]
    ) / (8 * dx * np.cos(np.radians(latitudes[1:-1]))[:, None])
    south = (
        z[2:, :-2]
        + 2 * z[2:, 1:-1]
        + z[2:, 2:]
        - z[:-2, :-2]
        - 2 * z[:-2, 1:-1]
        - z[:-2, 2:]
    ) / (8 * dy)
    result = np.full(values.shape, np.nan)
    result[1:-1, 1:-1] = np.where(
        inner_valid, np.degrees(np.arctan(np.hypot(east, south))), np.nan
    )
    return result, np.isfinite(result)


def colourize(values, valid):
    rgba = np.zeros((*values.shape, 4), dtype=np.uint8)
    # A physical 0–90 degree scale; no human mobility thresholds or risk bins.
    for channel in range(3):
        rgba[..., channel][valid] = np.rint(
            np.interp(values[valid], [0, 45, 90], PALETTE[:, channel])
        ).astype(np.uint8)
    rgba[..., 3][valid] = 255
    return rgba


def build(source, image_path, manifest_path):
    if sha256(source) != SOURCE_SHA256:
        raise ValueError("Unreviewed DEM checksum; source version must be verified")
    values, valid, grid = read_dem(source)
    dx, dy = grid["sourcePixelSizeMetres"]
    row_latitudes = grid["bounds"][3] - np.degrees(
        (np.arange(grid["height"]) + 0.5) * dy / RADIUS
    )
    slopes, slope_valid = gradient_degrees(values, valid, dx, dy, row_latitudes)
    if not slope_valid.any():
        raise ValueError("No complete 3x3 neighbourhoods for slope display")
    image_path = Path(image_path)
    manifest_path = Path(manifest_path)
    image_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(colourize(slopes, slope_valid)).save(image_path, optimize=False)
    manifest = {
        "schemaVersion": 1,
        "pipelineVersion": "1.0.0",
        "productId": PRODUCT + "-horn-gradient-display-v1",
        "sourceProductId": PRODUCT,
        "sourceUrl": SOURCE_URL,
        "sourceSha256": SOURCE_SHA256,
        "sourcePage": SOURCE_PAGE,
        "sourcePublicationDate": "2020-07-24",
        "verifiedDate": "2026-11-12",
        "citation": "Fergason et al., 2020, doi:10.5066/P906QQT8; local Horn-gradient derivation",
        "rights": "USGS public data; cite authors and disclose derived display",
        "mission": "Mars Reconnaissance Orbiter",
        "instrument": "CTX",
        "latitudeType": "planetocentric",
        "longitudeConvention": "east-positive, -180 to 180 degrees",
        "referenceSphereRadiusMetres": RADIUS,
        "verticalDatum": "Mars areoid (source DeltaGeoid)",
        "verticalDatumConverted": False,
        "heightUnits": "metres",
        "angleUnits": "degrees",
        "bounds": grid["bounds"],
        "width": grid["width"],
        "height": grid["height"],
        "sourcePixelSizeMetres": grid["sourcePixelSizeMetres"],
        "sourceCrsWkt": grid["sourceCrsWkt"],
        "algorithm": "Horn 3x3 areoid-height gradient; east ground spacing dx*cos(planetocentric latitude), north spacing dy on the source sphere",
        "algorithmReference": "https://gdal.org/en/stable/programs/gdaldem.html#slope",
        "neighbourhoodCells": [3, 3],
        "edgePolicy": "Transparent at outer 1-pixel border and wherever any 3x3 neighbour is missing or nonfinite; no interpolation",
        "scaleDegrees": [0, 90],
        "palette": PALETTE.tolist(),
        "minimumDegrees": float(slopes[slope_valid].min()),
        "maximumDegrees": float(slopes[slope_valid].max()),
        "validPixels": int(slope_valid.sum()),
        "nodataPixels": int((~slope_valid).sum()),
        "assetUrl": "/jezero-slope.png",
        "assetSha256": sha256(image_path),
        "analysisEligible": False,
        "limitations": [
            "Exploratory gradient of source areoid-relative heights, not independently validated physical surface inclination",
            "20 m source grid and 3x3 neighbourhood cannot resolve individual rocks or small obstacles",
            "Independent imagery/DEM registration and height-datum conversion remain unverified",
            "No risk classes, walking thresholds, route eligibility or safety rating",
        ],
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, allow_nan=False) + "\n")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dem", type=Path, default=Path("data/raw") / (PRODUCT + ".tif")
    )
    parser.add_argument("--image", type=Path, default=Path("assets/jezero-slope.png"))
    parser.add_argument(
        "--manifest", type=Path, default=Path("src/data/generated/slope.json")
    )
    args = parser.parse_args()
    result = build(args.dem, args.image, args.manifest)
    print(
        f"Built {result['validPixels']} gradient pixels; {result['nodataPixels']} unknown/edge pixels."
    )
    print("Exploratory display only; no route or walkability assessment created.")


if __name__ == "__main__":
    main()
