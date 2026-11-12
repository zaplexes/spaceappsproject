"""Failure checks for the local source-integrity gate."""

import json
import shutil
import tempfile
import unittest
from pathlib import Path

from pipelines.catalog import check_sources as CHECK

ROOT = Path(__file__).resolve().parents[2]


class SourceChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in CHECK.validate(ROOT):
            self.copy(path)
        for path in [
            "data/manifests/imagery-review.json",
            "data/manifests/metadata-checksums.json",
            "data/manifests/geology-source-review.json",
            "data/manifests/surface-images.json",
            "data/manifests/nomenclature-review.json",
            "src/data/generated/elevation.json",
            "src/data/generated/geology.json",
            "src/data/generated/slope.json",
        ]:
            self.copy(path)

    def copy(self, relative):
        target = self.root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / relative, target)

    def mutate(self, relative, change):
        path = self.root / relative
        data = json.loads(path.read_text())
        change(data)
        path.write_text(json.dumps(data))

    def test_retained_files_match_review(self):
        self.assertEqual(len(CHECK.validate(self.root)), 51)

    def test_changed_metadata_and_display_bytes_are_rejected(self):
        for relative in [
            "data/manifests/imagery-ctx-capabilities.xml",
            "assets/jezero-geology.png",
            CHECK.read_json(self.root, "data/manifests/nomenclature-review.json")[
                "snapshot"
            ]["path"],
        ]:
            with self.subTest(relative=relative):
                path = self.root / relative
                original = path.read_bytes()
                path.write_bytes(original + b"changed")
                with self.assertRaisesRegex(ValueError, "Checksum mismatch"):
                    CHECK.validate(self.root)
                path.write_bytes(original)

    def test_catalogue_manifest_must_match_reproducible_import(self):
        self.mutate(
            "data/manifests/nomenclature-review.json", lambda d: d.update(count=1)
        )
        with self.assertRaisesRegex(ValueError, "reproducible source import"):
            CHECK.validate(self.root)

    def test_missing_snapshot_is_rejected(self):
        (self.root / "data/manifests/imagery-moc-catalog.json").unlink()
        with self.assertRaises(FileNotFoundError):
            CHECK.validate(self.root)

    def test_review_disagreement_with_capabilities_is_rejected(self):
        path = "data/manifests/imagery-review.json"
        self.mutate(path, lambda d: d["sources"][0].update(maxLevel=13))
        with self.assertRaisesRegex(ValueError, "level count"):
            CHECK.validate(self.root)

    def test_earth_crs_in_capabilities_is_rejected(self):
        review = CHECK.read_json(self.root, "data/manifests/imagery-review.json")
        source = review["sources"][0]
        snapshots = {
            snapshot["kind"]: (self.root / snapshot["path"]).read_bytes()
            for snapshot in source["snapshots"]
        }
        snapshots["capabilities"] = snapshots["capabilities"].replace(
            b"EPSG::104905", b"EPSG::4326"
        )
        with self.assertRaisesRegex(ValueError, "Mars CRS"):
            CHECK.check_imagery(source, snapshots)

    def test_wrong_planet_and_unsupported_analysis_are_rejected(self):
        path = "src/data/generated/elevation.json"
        for change, expected in [
            ({"referenceSphereRadiusMetres": 6378137}, "Mars reference sphere"),
            ({"analysisEligible": True}, "analysis eligibility"),
            ({"nodataPixels": 1}, "pixel accounting"),
        ]:
            with self.subTest(change=change):
                self.copy(path)
                self.mutate(path, lambda d: d.update(change))
                with self.assertRaisesRegex(ValueError, expected):
                    CHECK.validate(self.root)


if __name__ == "__main__":
    unittest.main()
