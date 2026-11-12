import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from pipelines.terrain.build_slope import build, colourize, gradient_degrees

ROOT = Path(__file__).resolve().parents[2]


class SlopeTests(unittest.TestCase):
    def test_flat_grid_and_constant_height_offset(self):
        grid = np.full((7, 7), -2500.0)
        valid = np.ones(grid.shape, dtype=bool)
        a, mask = gradient_degrees(grid, valid, 20, 20, np.full(7, 18))
        b, _ = gradient_degrees(grid + 1000, valid, 20, 20, np.full(7, 18))
        np.testing.assert_array_equal(a[mask], np.zeros(25))
        np.testing.assert_array_equal(a, b)
        self.assertFalse(mask[0].any())
        self.assertFalse(mask[:, -1].any())

    def test_analytic_plane_and_latitude_correction(self):
        y, x = np.mgrid[:7, :7]
        plane = x * 20 * 0.5 + y * 20 * 0.25
        for latitude in [0, 18.5, 60]:
            result, valid = gradient_degrees(
                plane, np.ones(plane.shape, dtype=bool), 20, 20, np.full(7, latitude)
            )
            expected = np.degrees(
                np.arctan(np.hypot(0.5 / np.cos(np.radians(latitude)), 0.25))
            )
            np.testing.assert_allclose(result[valid], expected, atol=1e-10)

    def test_every_missing_neighbour_withholds_the_full_window(self):
        for missing in [np.nan, np.inf]:
            grid = np.zeros((7, 7))
            grid[3, 3] = missing
            result, valid = gradient_degrees(
                grid, np.ones(grid.shape, dtype=bool), 20, 20, np.zeros(7)
            )
            self.assertFalse(valid[2:5, 2:5].any())
            self.assertEqual(int(valid.sum()), 16)
            rgba = colourize(result, valid)
            self.assertTrue(np.all(rgba[2:5, 2:5, 3] == 0))

    def test_invalid_grid_and_spacing_fail(self):
        for dx, lat in [(0, 18), (-20, 18), (float("nan"), 18), (20, 90)]:
            with self.assertRaises(ValueError):
                gradient_degrees(
                    np.ones((3, 3)), np.ones((3, 3), bool), dx, 20, np.full(3, lat)
                )

    def test_unreviewed_input_does_not_publish(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "unreviewed.tif"
            source.write_bytes(b"not a reviewed DEM")
            with self.assertRaisesRegex(ValueError, "checksum"):
                build(source, root / "display.png", root / "manifest.json")
            self.assertFalse((root / "display.png").exists())

    def test_committed_asset_pixel_accounting_and_unknown_edges(self):
        manifest = json.loads((ROOT / "src/data/generated/slope.json").read_text())
        rgba = np.asarray(Image.open(ROOT / ("assets" + manifest["assetUrl"])))
        self.assertEqual(rgba.shape, (manifest["height"], manifest["width"], 4))
        self.assertEqual(int((rgba[..., 3] != 0).sum()), manifest["validPixels"])
        self.assertFalse(rgba[0, :, 3].any())
        self.assertFalse(rgba[:, -1, 3].any())
        self.assertFalse(manifest["analysisEligible"])


if __name__ == "__main__":
    unittest.main()
