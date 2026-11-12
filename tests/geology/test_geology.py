"""Synthetic geometry checks; these coordinates are not real science stops."""

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
import shapely
from PIL import Image
from rasterio.crs import CRS
from rasterio.warp import transform

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipelines/geology"))
from build_geology import build, classify_records, make_grid, validate_crs  # noqa: E402


class GeologyChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_wkt = (ROOT / "data/manifests/geology-mtm.prj").read_text()
        cls.source = validate_crs(cls.source_wkt)
        cls.geographic = CRS.from_wkt(
            (ROOT / "data/manifests/geology-mars-sphere.prj").read_text()
        )

    def test_planet_projection_gate_and_published_bounds_round_trip(self):
        for invalid in [
            CRS.from_epsg(3857).to_wkt(),
            self.source_wkt.replace("77.5", "77.3"),
            self.source_wkt.replace("3396190.0", "6378137.0"),
        ]:
            with self.assertRaises(ValueError):
                validate_crs(invalid)
        longitudes, latitudes = [76.8, 77.8], [17.7, 18.7]
        x, y = transform(self.geographic, self.source, longitudes, latitudes)
        lon, lat = transform(self.source, self.geographic, x, y)
        np.testing.assert_allclose(lon, longitudes, rtol=0, atol=1e-10)
        np.testing.assert_allclose(lat, latitudes, rtol=0, atol=1e-10)

    def test_conflicting_labels_and_invalid_geometry_are_withheld(self):
        valid = shapely.box(0, 0, 2, 2)
        invalid = shapely.Polygon([(0, 0), (2, 2), (2, 0), (0, 2), (0, 0)])
        grouped, masks, excluded, corrections = classify_records(
            [1, 2, 3],
            [valid, invalid, valid],
            [
                ("0", "Jezero fan 2 unit", "NHjf2"),
                ("1", "Jezero fan 1 unit", "NHjf1"),
                ("5", "Upper etched unit", "Nue"),
            ],
            self.source,
            self.geographic,
        )
        self.assertEqual(len(grouped["0"]), 1)
        self.assertEqual(sum(map(len, grouped.values())), 1)
        self.assertEqual([entry["fid"] for entry in excluded], [2, 3])
        self.assertEqual(len(masks), 2)
        self.assertEqual(corrections, [])

    def test_holes_conflicting_classes_and_withheld_areas_remain_unknown(self):
        outer = shapely.box(0, 0, 6, 6)
        hole = shapely.box(2, 2, 4, 4)
        polygon = shapely.Polygon(outer.exterior.coords, [hole.exterior.coords])
        mapping = shapely.geometry.mapping
        grouped = {"0": [mapping(polygon)], "1": [mapping(shapely.box(0, 0, 2, 2))]}
        grid, quality = make_grid(
            grouped, [mapping(shapely.box(4, 4, 6, 6))], mapping(outer), [0, 0, 6, 6], 6
        )
        self.assertTrue(
            (grid[2:4, 2:4] == 0).all(), "Polygon holes must not acquire a unit"
        )
        self.assertTrue(
            (grid[4:6, 0:2] == 0).all(),
            "Cross-unit overlaps must not choose the last feature",
        )
        self.assertEqual(grid[0, 5], 0, "Withheld areas must remain unknown")
        self.assertGreater(quality["crossUnitOverlapPixels"], 0)
        self.assertGreater(quality["withheldMaskPixels"], 0)
        self.assertGreater(np.count_nonzero(grid), 0)

    def test_retained_source_snapshots_match_the_reviewed_bytes(self):
        review = json.loads(
            (ROOT / "data/manifests/geology-source-review.json").read_text()
        )
        snapshots = [
            source for source in review["sources"] if source.get("retainedPath")
        ] + review["coordinateSnapshots"]
        self.assertEqual(len(snapshots), 4)
        for snapshot in snapshots:
            data = (ROOT / snapshot["retainedPath"]).read_bytes()
            self.assertEqual(len(data), snapshot["bytes"])
            self.assertEqual(hashlib.sha256(data).hexdigest(), snapshot["sha256"])

    def test_changed_archive_is_rejected_before_outputs(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / "changed.zip"
            archive.write_bytes(b"changed source")
            with self.assertRaisesRegex(ValueError, "checksum"):
                build(archive, root / "display.png", root / "manifest.json")
            self.assertFalse((root / "display.png").exists())

    def test_retained_display_matches_manifest_and_uses_only_categorical_colours(self):
        manifest = json.loads((ROOT / "src/data/generated/geology.json").read_text())
        path = ROOT / "assets/jezero-geology.png"
        self.assertEqual(
            hashlib.sha256(path.read_bytes()).hexdigest(), manifest["assetSha256"]
        )
        pixels = np.array(Image.open(path))
        self.assertEqual(pixels.shape, (manifest["height"], manifest["width"], 4))
        self.assertEqual(
            np.count_nonzero(pixels[..., 3] == 0), manifest["unknownPixels"]
        )
        self.assertEqual(
            np.count_nonzero(pixels[..., 3] == 255), manifest["validPixels"]
        )
        self.assertEqual(
            manifest["validPixels"] + manifest["unknownPixels"],
            pixels.shape[0] * pixels.shape[1],
        )
        for unit in manifest["units"]:
            rgb = [int(unit["colour"][i : i + 2], 16) for i in (1, 3, 5)]
            self.assertEqual(
                np.count_nonzero((pixels == [*rgb, 255]).all(axis=2)), unit["pixels"]
            )
        self.assertFalse(manifest["analysisEligible"])
        self.assertFalse(manifest["registrationVerified"])
        self.assertEqual(
            {entry["fid"] for entry in manifest["excludedFeatures"]}, {112, 666, 1155}
        )


if __name__ == "__main__":
    unittest.main()
