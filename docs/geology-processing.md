# Regional Jezero geology display

This is a display layer for regional geological interpretation. It does not identify an exact drill point, measure minerals, establish surface alignment or support a human route analysis. Reviewed November 11, 2026 locally (November 12 UTC).

## Official source and coordinate checks

Sun, V.Z., and Stack, K.M., 2020, *Geologic map of Jezero crater and the Nili Planum region, Mars*, USGS Scientific Investigations Map 3464, scale 1:75,000, [doi:10.3133/sim3464](https://pubs.usgs.gov/publication/sim3464). The [USGS interactive-map description](https://www.usgs.gov/media/images/interactive-map-jezero-crater-mars-perseverance-rover-landing) identifies the material as public domain. Credit is retained in the interface and Cesium attribution.

The official [GIS archive](https://pubs.usgs.gov/sim/3464/sim3464_database.zip) is 349,336,873 bytes, SHA-256 `a88bd53a5573743cc4a20036c10e585106d08a433ad2f34af269e9cea1529f87`. The processing input is its `GeoUnits_v1` layer with 1,304 polygon features; the `MapBoundary` layer verifies the extent. The archive and pamphlet remain outside Git. Small metadata, readme and coordinate-definition snapshots are retained byte-for-byte in `data/manifests/`, with source hashes in `geology-source-review.json`.

The embedded geodatabase CRS, included PRJ, [metadata](https://pubs.usgs.gov/sim/3464/sim3464_metadata.xml) and [readme](https://pubs.usgs.gov/sim/3464/sim3464_readme.txt) agree on a 3,396,190-metre Mars sphere, Transverse Mercator with central meridian 77.5° E, latitude origin zero, scale factor one and zero false easting/northing, in metres. The [pamphlet](https://pubs.usgs.gov/sim/3464/sim3464_pamphlet.pdf), printed page 4, describes planetocentric latitude and longitude increasing eastward, but states a different central meridian, 77.3° E. This discrepancy is preserved, not silently reconciled. The standalone FGDC metadata also contains `denflat=10.E-10` despite its sphere label; the actual PRJs/geodatabase explicitly define zero flattening. Processing follows the actual geometry’s embedded spherical 77.5° definition and rejects alternate projections.

GDAL transforms the polygons to the archive's Mars geographic definition. The transformed boundary agrees with the published extent **76.8–77.8° E, 17.7–18.7° N** within 0.00002° (a verification tolerance for the numerical boundary check, not a positional accuracy claim). Round trips at the published corners are tested. Earth CRS definitions are rejected. There is no Earth Web Mercator/GeoJSON CRS substitution or height-datum conversion.

## Alignment limitation accepted by the user

The USGS readme says the map was drawn on a semi-controlled CTX mosaic predating the controlled operations mosaic and reports random offsets of about **100–200 metres** from that later mosaic. The user chose to display this as regional context with the offset warning. No guessed shift or registration correction is applied. The warning remains visible whenever the geology layer is enabled. This is not a guaranteed upper bound on error at every location. Independent registration remains unchecked in the project tracker.

## Display derivation and unknown areas

`pipelines/geology/build_geology.py` checks the fixed archive hash, extracts only the geodatabase into a temporary directory, reads it with Pyogrio/GDAL, checks geometry with Shapely, and rasterizes the verified categories with Rasterio. Pillow writes a local 1024×1024 RGBA PNG. The grid uses equal angular cells of 1/1024 degree over the published extent; these display cells are not the source map's accuracy or its base imagery resolution. Pixel-centre polygon filling preserves holes. Cross-unit overlaps are withheld rather than resolved by drawing order.

The output uses a categorical display palette recorded in `pipelines/geology/units.json`, not the original USGS colours. Unit codes, full symbols and names are checked together. No mineral abundance, numerical age, risk score or walking classification is inferred from a colour. Cesium uses nearest-neighbour texture filters to avoid introducing blended unit categories during texture sampling; the user's opacity control blends the layer with orbital imagery for visual context.

Source QA found:

- FID 112: source code `5` conflicts with the reported name/symbol `Upper etched unit` / `Nue`. Excluded without selecting a classification.
- FIDs 666 and 1155: self-intersecting rings. Excluded without geometry repair.
- FID 1004: the display name `Crater riim unit` is corrected to `Crater rim unit`, corroborated by the published legend and its unchanged code `11` / symbol `cr`. Original text is retained in the manifest.

Conflicting-label areas are masked from the display. For invalid polygons, a conservative enclosing geographic rectangle is masked, which also withholds valid neighbouring areas. These rectangles are an exclusion policy, not new geological boundaries. Transparent pixels mean unclassified/withheld data. They must not be interpreted as absence of a geological unit or favourable travel conditions.

The generated manifest records **839,233 classified pixels and 209,343 unknown/withheld pixels**, zero cross-unit overlap pixels at this grid, and per-unit pixel/feature counts. All 14 source units remain represented. The footprint indicator describes the map envelope only; it does not claim that every pixel within it is classified. No stop is assigned a map unit while stop positions remain unverified.

## Local preview and reproduction

Refresh http://127.0.0.1:5174/ and enable **Jezero regional geology**. Open **Geological units (14)** for the legend. Opacity, source links, loading/failure/retry, viewport extent and list-based WebGL fallback are available. Geology and elevation colours are mutually exclusive so their separate legends remain readable; orbital imagery remains independently selectable. The layer is served locally and requires no credentials or external geology service after the build.

Python is optional for viewing. To reproduce using the verified Python 3.14.8 and uv environment:

```sh
uv venv .venv-geology --python python3
uv pip sync --python .venv-geology/bin/python --require-hashes pipelines/geology/requirements.txt
.venv-geology/bin/python pipelines/geology/build_geology.py --download
```

This downloads the approximately 349 MB official archive to ignored `data/raw/geology/`, validates its hash and builds the PNG plus `src/data/generated/geology.json`. The downloader uses `curl` because direct urllib requests returned 403 while curl retrieved the publisher's files. With an existing archive, omit `--download`; specify `--archive PATH` to reuse another cache. A changed archive fails the gate and requires review.

```sh
.venv-geology/bin/python -m unittest discover -s tests/geology -v
.venv-geology/bin/ruff check pipelines/geology tests/geology
.venv-geology/bin/ruff format --check pipelines/geology tests/geology
npm run build
npm test
npm run test:live
```

Python checks cover planet/projection rejection, published-corner round trips, invalid/conflicting source records, holes, overlap/withheld masking, checksum rejection and categorical asset integrity. Browser checks cover the legend, warning, opacity, extent, selected-stop focus, colour-layer exclusivity, loading/failure/retry, stale loading and mobile/WebGL fallback. The live check captures [desktop](geology-desktop.png) and [mobile](geology-mobile.png) previews with real NASA orbital imagery. Browser coverage remains Chromium/software WebGL; Firefox and hardware GPUs are unverified.
