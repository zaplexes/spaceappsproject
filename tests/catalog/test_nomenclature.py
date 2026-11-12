"""Scientific input and consistency checks for catalogue imports."""

import io
import unittest
import zipfile

from pipelines.catalog.import_nomenclature import build, parse_records


def placemark(
    feature_id="1",
    longitude="226.1975",
    point="-133.8025,18.6528",
    dimension="610.13",
    region="mc09",
):
    fields = {
        "link": f"http://planetarynames.wr.usgs.gov/Feature/{feature_id}",
        "clean_name": "Olympus Mons",
        "approval": "Adopted by IAU",
        "center_lon": longitude,
        "center_lat": "18.6528",
        "diameter": dimension,
        "type": "Mons, montes",
        "code": "MO",
        "quad_code": region,
        "quad_name": "Tharsis" if region else "",
        "origin": "Classical name.",
    }
    simple = "".join(
        f'<SimpleData name="{k}">{v}</SimpleData>' for k, v in fields.items()
    )
    return f"<Placemark><name>Olympus Mons</name><ExtendedData><SchemaData>{simple}</SchemaData></ExtendedData><Point><coordinates>{point}</coordinates></Point></Placemark>"


def archive(records, target="MARS"):
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w") as z:
        z.writestr(
            "MARS_nomenclature_center_pts.kml",
            f'<kml xmlns="http://www.opengis.net/kml/2.2" hint="target={target}"><Document>{records}</Document></kml>',
        )
    return output.getvalue()


class NomenclatureImport(unittest.TestCase):
    def test_east_longitude_and_kml_point_are_consistent(self):
        records, excluded = parse_records(archive(placemark()))
        self.assertAlmostEqual(records[0]["longitude"], -133.8025)
        self.assertEqual(records[0]["longitudeEast"], 226.1975)
        self.assertEqual(
            records[0]["sourceUrl"], "https://planetarynames.wr.usgs.gov/Feature/1"
        )
        self.assertEqual(excluded, {})
        records, _ = parse_records(
            archive(placemark(longitude="360", point="0,18.6528"))
        )
        self.assertEqual(records[0]["longitude"], 0)

    def test_unknown_dimension_and_region_remain_unknown(self):
        records, _ = parse_records(archive(placemark(dimension="0", region="")))
        self.assertIsNone(records[0]["dimensionKm"])
        self.assertEqual(records[0]["regionId"], "unspecified")

    def test_identical_duplicates_are_reported_but_conflicts_fail(self):
        rows, excluded = parse_records(archive(placemark() + placemark()))
        self.assertEqual(len(rows), 1)
        self.assertEqual(excluded, {"Identical duplicate source record": 1})
        with self.assertRaisesRegex(ValueError, "Conflicting duplicate"):
            parse_records(archive(placemark() + placemark(dimension="611")))

    def test_invalid_coordinates_and_non_mars_sources_fail(self):
        for source, message in [
            (archive(placemark(), "EARTH"), "Mars KML"),
            (archive(placemark(longitude="nan")), "Non-finite"),
            (archive(placemark(longitude="361")), "Out-of-range"),
            (archive(placemark(point="0,0")), "disagreement"),
            (archive(placemark(dimension="-1")), "Negative"),
            (archive(placemark(region="mc31")), "quadrangle"),
        ]:
            with (
                self.subTest(message=message),
                self.assertRaisesRegex(ValueError, message),
            ):
                parse_records(source)

    def test_unapproved_names_do_not_become_candidates(self):
        unapproved = placemark("2").replace("Adopted by IAU", "Dropped")
        records, excluded = parse_records(archive(placemark() + unapproved))
        self.assertEqual(len(records), 1)
        self.assertEqual(excluded, {"Dropped": 1})

    def test_rebuild_is_deterministic_and_keeps_analysis_disabled(self):
        source = archive(placemark())
        first = build(source, "2026-11-12T21:40:54Z")
        self.assertEqual(first, build(source, "2026-11-12T21:40:54Z"))
        outputs, review = first
        self.assertFalse(review["analysisEligible"])
        self.assertEqual(len(outputs), 3)
        self.assertIsNone(review["sourceVersion"])
        self.assertIsNone(review["sourcePublicationDate"])


if __name__ == "__main__":
    unittest.main()
