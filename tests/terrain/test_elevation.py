import importlib.util
import tempfile
import unittest
from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import from_origin

MODULE = Path(__file__).parents[2] / "pipelines/terrain/build_elevation.py"
spec = importlib.util.spec_from_file_location("build_elevation", MODULE)
terrain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(terrain)


class ElevationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "example.tif"

    def write(
        self,
        values,
        crs="+proj=eqc +R=3396190 +lat_ts=0 +lon_0=0 +units=m",
        nodata=-9999,
    ):
        with rasterio.open(
            self.path,
            "w",
            driver="GTiff",
            width=values.shape[1],
            height=values.shape[0],
            count=1,
            dtype="float32",
            crs=crs,
            transform=from_origin(0, 40, 20, 20),
            nodata=nodata,
        ) as output:
            output.write(values.astype(np.float32), 1)

    def test_valid_range_excludes_nodata_and_preserves_alpha(self):
        self.write(np.array([[-2700, -2500, -9999], [-2600, np.nan, -2400]]))
        values, valid, grid = terrain.read_dem(self.path)
        self.assertEqual(grid["minimumMetres"], -2700)
        self.assertEqual(grid["maximumMetres"], -2400)
        self.assertEqual(grid["validPixels"], 4)
        self.assertEqual(grid["nodataPixels"], 2)
        rgba = terrain.colourize(values, valid, -2700, -2400)
        self.assertEqual(int(rgba[0, 2, 3]), 0)
        self.assertEqual(int(rgba[1, 1, 3]), 0)
        self.assertEqual(int(rgba[0, 0, 3]), 255)
        self.assertAlmostEqual(grid["bounds"][0], 0)
        self.assertAlmostEqual(grid["bounds"][2], np.degrees(60 / 3396190))
        self.assertAlmostEqual(grid["bounds"][3], np.degrees(40 / 3396190))

    def test_earth_crs_is_rejected(self):
        self.write(np.ones((2, 2)), crs="EPSG:3857")
        with self.assertRaisesRegex(ValueError, "Mars reference sphere"):
            terrain.read_dem(self.path)

    def test_absent_and_all_missing_data_are_rejected(self):
        self.write(np.full((2, 2), -9999))
        with self.assertRaisesRegex(ValueError, "no valid"):
            terrain.read_dem(self.path)
        self.write(np.ones((2, 2)), nodata=None)
        with self.assertRaisesRegex(ValueError, "Nodata"):
            terrain.read_dem(self.path)

    def test_unreviewed_source_is_rejected_before_publishing(self):
        self.write(np.ones((2, 2)))
        with self.assertRaisesRegex(ValueError, "checksum"):
            terrain.build(
                self.path, self.path.with_suffix(".png"), self.path.with_suffix(".json")
            )
        self.assertFalse(self.path.with_suffix(".png").exists())

    def test_constant_grid_and_colour_bounds(self):
        image = terrain.colourize(np.ones((2, 2)), np.ones((2, 2), dtype=bool), 1, 1)
        self.assertTrue(np.all(image[:, :, 3] == 255))
        with self.assertRaises(ValueError):
            terrain.colourize(np.ones((2, 2)), np.ones((2, 2), dtype=bool), 2, 1)


if __name__ == "__main__":
    unittest.main()
