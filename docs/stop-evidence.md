# Stop evidence and position review

Reviewed November 11, 2026 in America/Sao_Paulo (November 12 UTC). This milestone adds reference photographs and reviews existing positions. It does not verify a walking route or establish a scientific goal.

## Surface references

Each stop uses the **primary sample's** photograph from the [NASA Mars rock sample catalog](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/), captured by Perseverance's left navigation camera. The photograph does not locate every sample at the outcrop. Additional samples retain their separate catalog records; no extra drill positions are inferred.

| Stop / primary sample | Image sol | Image date as published by NASA | Dossier PDF page |
| --- | --- | --- | --- |
| Skinner Ridge / Swift Run | 490 | 2022-07-07 | 14 |
| Wildcat Ridge / Hazeltop | 509 | 2022-07-26 | 58 |
| Amalik / Shuyak | 575 | 2022-10-02 | 100 |

Image capture dates are distinct from drilling and sealing dates. For example, NASA's Hazeltop image caption gives July 26 while its sample record lists July 27 as the sealing date. Dates are retained as published; the preview does not assign a timezone or infer an event timestamp from them.

Images in `assets/stops/` are unchanged bytes downloaded from the catalog's published 1024-pixel image URLs. They are displayed at their full aspect ratio without added labels or geographic annotations. Credit: **NASA/JPL-Caltech**. Source URLs, byte counts, dimensions and SHA-256 hashes are in `data/manifests/surface-images.json`; the browser suite verifies the committed files. NASA's upstream image rendering may change, so these hashes identify the actual retained versions rather than promising future byte identity. Source links and metadata remain available if a local image fails; retry is supported. Only the selected photograph loads.

Usage follows the existing [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) and [JPL image use policy](https://www.jpl.nasa.gov/jpl-image-use-policy/). No endorsement is implied. These surface observations are explicitly distinguished from the orbital map and DEM-derived colour overlay.

## What the PDS records locate

The [PLACES SIS](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_rover_places/document/Mars2020_Rover_PLACES_PDS_SIS.pdf), section 2.1.1, PDF page 7, defines a rover-body reference frame whose origin is a virtual nominal-ground point near the middle wheels. A rover-frame localization is not an outcrop centroid or a named drill hole.

Section 5.1.3, PDF pages 33–37, defines the CSV coordinate fields: distinct planetocentric and planetodetic latitudes, eastward longitude, projected northing/easting and elevation relative to the Mars areoid. The `sclk` field is the earliest spacecraft clock associated with that site/drive; `sol` is derived from that clock. Neither field identifies a coring event. Do not filter the table by a sample's sealed sol and treat the resulting row as its position. Do not transfer a rover-localization accuracy statement to a drill target.

Sections 5.5.2–5.5.6, PDF pages 48–50, describe mechanism time ranges, missing fields, joint angles in radians, and separate arm and drill mechanisms. The [instrument-frame appendix](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_rover_places/document/Mars2020_Rover_PLACES_SIS_Appendix_B_PPPCS.pdf), section 5.2.3, PDF pages 57–59, distinguishes the fixed drill reference from the bit-tip frame, which changes with drill feed. Arm joint angles alone are not global drill-tip coordinates. A defensible solution needs an identified sampling event, matching time/RMC, calibrated kinematics, feed state, target/contact interpretation and uncertainty, followed by a verified conversion into the map's coordinate convention.

The [sample dossier volume 2](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume2.pdf) reports numerical positions on the pages listed above. Source version 3.2 and its hash were retained in `data/manifests/sample-location-review.json`. The reviewed entries do not establish the latitude convention, horizontal accuracy or exact point definition. Shared Swift Run/Skyland coordinates are an additional reason not to interpret each report's values as independently resolved drill points. Exact application coordinates remain `null`. On November 12, 2026, the user authorized approximate highlights with a visible warning; the separate display policy is described below.

The [initial reports volume 1, release 2.2](https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%201%20Release%202.2.pdf) also lists coordinates for witness tube WB1, while stating that it was not placed in the corer or subjected to simulated sampling (report page 1-2). This confirms that a coordinate in this report format is not by itself evidence of a drill-hole position; it does not establish the precise meaning of the three candidate coordinates. The convention, reference point and uncertainty still require primary-source verification.

## Bounded table audit and limitations

Reviewed `best_interp.csv` and `mech_arm.csv`, each label version **16.0**. The former has 33,458 records and the latter 65,488; CSV widths and record counts match their labels. The retained audit records source URLs, hashes, versions, selected verbatim rover-frame rows and mechanism completeness counts. Bulk tables and PDFs remain outside Git.

The published image filenames suggest diagnostic site/drive keys 26/1004, 26/1222 and 29/0. **This filename interpretation has not been independently validated against camera labels and is not a verified sampling-event join.** The audit uses those keys to examine data availability, not to assign sample positions. It performs no nearest-neighbour matching, distance estimation or instrument transform.

| Diagnostic site/drive | Rover rows in reviewed `best_interp` | Arm rows | Arm rows missing both exact and approximate time ranges |
| --- | --- | --- | --- |
| 26/1004 | 1 | 427 | 427 |
| 26/1222 | 1 | 515 | 515 |
| 29/0 | 0 | 738 | 738 |

These missing time fields are an observed limitation of the pinned file, despite the SIS expectation that approximate times exist. Missing values and the `-9999` sentinel are not treated as zero. The reviewed localization rows' earliest sols are 477 and 502; those are not the photos' acquisition sols or proof of coring location. The absent 29/0 rover row is not filled from a nearby site.

The SIS documents a drill-feed table, but a request to the [documented `mech_drill.csv` URL](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_rover_places/data_mechanisms/mech_drill.csv) returned HTTP 404 during this review; the directory listed arm, drive, HGA and RSM tables. This records an endpoint observation, not a claim that drill telemetry cannot exist elsewhere. No archive-wide recovery or calibrated drill reconstruction was completed.

**Exact placement decision:** none of the three stops qualifies as a verified drill location. Dossier position meaning/convention/uncertainty and event-matched target localization remain unresolved. No rover-frame position substitutes for a target.

**Authorized approximate display:** selecting a stop highlights its primary sample's published candidate position and centers the camera there. `src/data/candidate-locations.ts` reads the reviewed dossier values into separate display-only fields. The reported N/E degrees are shown on the common Mars display sphere without a verified latitude conversion. This assumption is disclosed in the position evidence, with an approximate/unverified label and source link on the map. A fixed-size screen ring indicates selection; it is not a measured accuracy radius. Its anchor follows the globe and is hidden offscreen or behind the planet. Selection survives map startup and retry. This display choice does not verify point definition, latitude convention, precision, distances, routes or analysis eligibility.

## Reproduce the audit

Python's standard library is sufficient; the terrain virtual environment is optional. From the repository root:

```sh
python3 pipelines/evidence/review_positions.py --download --check
```

This downloads the six pinned table/label/specification files, roughly 27 MB total, into ignored `data/raw/pds-positions/`, validates their SHA-256 hashes, validates CSV shapes and label counts, and compares the audit with `data/manifests/pds-position-audit.json`. It does not download the separate roughly 100 MB dossier or the images, which are already reviewed/retained as described above. The audit operates locally after the first download:

```sh
python3 pipelines/evidence/review_positions.py --check
# Reuse an existing cache, for example the review session's temporary files:
python3 pipelines/evidence/review_positions.py --cache-dir /tmp/martian-map-evidence --check
```

A changed upstream file fails the checksum gate and needs another source review. Omitting `--check` rewrites the audit from the pinned sources; it does not approve marker placement. Scientific conclusions in this document are a manual interpretation of the cited specifications, not an automated proof from the table audit.

Run `npm test` for image integrity, per-stop evidence links, distinct capture/sealing context, loading/failure/retry, late requests, mobile and WebGL fallback. `npm run test:live` checks the integrated preview with live orbital imagery and refreshes desktop/mobile screenshots. Browser checks use Chromium with software WebGL; hardware GPU, Firefox and exhaustive assistive-technology coverage remain unverified.
