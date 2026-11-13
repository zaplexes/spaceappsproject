# Local preview source verification

**Current direction — November 13, 2026:** Help astronauts choose the next destination on Mars. Feature types start with equal 50% study interest and user-adjustable priorities. Jezero investigations are optional examples. This supersedes earlier ancient-water mission and Jezero-only scope decisions below; see [current scope](project-scope.md).


Verified on November 11, 2026 (America/Sao_Paulo; server responses dated November 12 UTC). These are visualization sources, not validated analysis rasters or human route evidence. Scientific document `Space Apps.docx` is unchanged.

## Imagery

Exact imagery capabilities/catalog snapshots and a shared source registry were added on November 12, 2026. See [source registry and integrity checks](source-registry.md) for snapshot URLs, scoped checksums, explicit unknowns and `npm run check:data`. All products remain visualization/reference evidence rather than eligible route-analysis inputs.

NASA's [Trek WMTS documentation](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) and [live public catalog](https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?start=0&rows=300&facetKeys=itemType%7CproductCat2%7CserviceTypes%7CthumbnailURLDir&facetValues=product%7C-%28DEM%20ConfidenceRaw%20Slope%29%7CMosaic%7C%5B%2A%20TO%20%2A%5D) supplied the following records. No token, API key or account was needed. Each selected layer's representative tile returned HTTP 200, PNG dimensions 256×256, and `Access-Control-Allow-Origin: *`.

| Layer | Product | Extent (west, south, east, north; degrees) | WMTS levels | Attribution |
| --- | --- | --- | --- | --- |
| MGS / MOC global context | `msss_atlas_simp_clon` | -179.9999885, -89.9999958, 179.9999862, 89.9999916 | 0–6 | NASA/JPL/MSSS; served by NASA Trek |
| MRO / CTX controlled Jezero mosaic | `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0` | 77.1604655, 18.2110274, 77.6991776, 18.7211945 | 0–13 | NASA/JPL-Caltech/USGS; served by NASA Trek |
| MRO / HiRISE controlled Jezero mosaic | `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | 77.2229331, 18.3067994, 77.583964, 18.669315 | 0–17 | NASA/JPL-Caltech/University of Arizona/USGS; served by NASA Trek |

Capabilities: [MOC](https://trek.nasa.gov/tiles/Mars/EQ/msss_atlas_simp_clon/1.0.0/WMTSCapabilities.xml), [CTX](https://trek.nasa.gov/tiles/Mars/EQ/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/1.0.0/WMTSCapabilities.xml).

Both use `default` style, `default028mm` tile matrix set, 256-pixel PNG tiles, a top-left origin of (-180°, 90°), level-zero matrix 2 columns × 1 row, doubling each level. Resource templates include a redundant slash after `1.0.0`; tested URLs work with a single slash. The NASA service uses geographic Mars coordinates labeled `urn:ogc:def:crs:EPSG::104905`; this is not Earth EPSG:4326 or Web Mercator. The source catalog's CTX WKT specifies a Mars sphere of radius 3,396,190 metres. The browser constructs that explicit 3,396,190-metre reference sphere and uses it for geographic tiling, projection, the smooth terrain provider and camera conversions. Runtime inspection found that Cesium 1.147.0's `Ellipsoid.MARS` has radii (3396190, 3396190, 3376200) metres, despite reference documentation describing a sphere; that oblate constant is deliberately not used for these spherical-source coordinates. Latitude is planetocentric on the sphere; longitude is east-positive in -180…180° for the display tile grid.

The source catalog describes CTX as a controlled orthomosaic at approximately 6 metres per pixel. That is source metadata, not a precision guarantee for this preview; delivered tile resolution depends on zoom. The global MOC mosaic is low-detail context and may appear blurred at Jezero zoom. Extents do not guarantee valid pixels everywhere. No common-resolution alignment or point-level registration is certified. No multi-layer analysis is performed. The globe has no measured elevation; its reference-sphere height is not a surface measurement.

Added November 12: the controlled HiRISE service is prioritized above CTX, with global context below both. The retained catalog defines a 3,396,190-metre geographic sphere; capabilities define the same Mars tiling grid through level 17. The product identifier describes a 25 cm source orthomosaic, while the catalog's numeric resolution field has no explicit unit in the reviewed record; no ground accuracy is inferred from either. An actual level-17 tile near the candidate Swift Run/Hazeltop position returned HTTP 200, 256 × 256 PNG with nonconstant image data and `Access-Control-Allow-Origin: *`; the dated probe is recorded in `imagery-review.json`. Original roughly 9.8 GB mosaic bytes were not downloaded. Live tile availability is separate from source-coordinate precision and layer registration. Toggle HiRISE off to compare with CTX; CTX/global imagery remain underneath when HiRISE has no data. Viewport extent is shown separately from tile status.

Usage: follow [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) and the [JPL image use policy](https://www.jpl.nasa.gov/jpl-image-use-policy/), retain source credits, and do not imply endorsement. This educational/informational preview uses no NASA logos. Third-party rights must be rechecked if material/use changes. CesiumJS is Apache-2.0 licensed; its bundled attribution UI is retained. The legacy metadata HTML endpoint returned an empty body; capabilities and catalog are used instead. These are public upstream services with no availability guarantee and no offline orbital-imagery package. The preview offers failure/retry states.

## Science records and unresolved positions

The [NASA Mars rock sample catalog](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/) verifies the feature names, sedimentary classification and **sol/date sealed** fields (not an invented crew collection schedule):

| Feature | Primary sample | Sol sealed | Date sealed | Additional sample / sol sealed |
| --- | --- | --- | --- | --- |
| Skinner Ridge | Swift Run | 490 | 2022-07-07 | Skyland / 495 |
| Wildcat Ridge | Hazeltop | 509 | 2022-07-27 | Bearwallow / 516 |
| Amalik | Shuyak | 575 | 2022-10-02 | Mageik / 619 |

NASA's [Wildcat Ridge observations](https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/) provide the outcrop context. Summaries in the interface are paraphrases. User approved NASA's sol sealed 619 for Mageik over the DOCX value 579. Do not silently equate sealing date with drilling time, or a rover position with an exact sample location.

All exact sample coordinates remain `null` / `pending_verification`. The user authorized selected-stop highlights at the dossier's published candidate positions, with an explicit approximate/unverified warning and source link. These are separate display-only references using reported N/E degrees on the shared Mars sphere; their latitude convention and accuracy remain unresolved. No base marker is created. Stop numbering does not define an excursion. Exact drill positions and approach suitability still require verification through [PDS PLACES](https://pds-geosciences.wustl.edu/missions/mars2020/places.htm) and appropriate instrument data.

The camera context (18.4446° N, 77.4509° E) comes from the DOCX and is corroborated by [Bell et al., 2022, on NASA NTRS](https://ntrs.nasa.gov/api/citations/20230016428/downloads/Bell%20et%20al%202022sciadv.pdf). It is an approximate historical landing reference used only to orient the camera. Camera altitude/zoom are display settings, not terrain elevations or a crew base. The selected goal is astronaut destination selection; Jezero investigations are examples. Base and equipment capabilities remain unknown.

## Elevation overlay extension

A local USGS CTX DEM colour overlay has been added after the initial preview. See [terrain processing](terrain-processing.md), the source snapshots in `data/manifests/` and `src/data/generated/elevation.json`. It uses source areoid heights as colours; the reference globe remains smooth. No 3D height conversion or analysis eligibility is claimed.

## Surface reference and position evidence extension

Each stop now includes its primary sample’s NASA Navcam photograph, capture context, credit, original-image link and an expandable PDS position review. Files are retained locally with hashes. See [stop evidence](stop-evidence.md) for per-image provenance, the reviewed PLACES/instrument-frame definitions, reproducible table audit, authorized approximate selection highlights and unresolved exact-placement gates.

## Regional geology extension

USGS SIM 3464 (Sun and Stack, 2020) now supplies a local categorical geological-interpretation overlay and source-linked 14-unit legend. Source-coordinate conversion is checked; independent alignment remains unverified. The user accepted the readme’s approximately 100–200 m offsets from the controlled CTX imagery as a visible regional-context limitation. Invalid/conflicting areas remain transparent, with conservative masks documented in [geology processing](geology-processing.md). Map-extent indicators describe the envelope, not complete valid coverage. The layer neither assigns units to unlocated stops nor provides direct mineral measurements, slopes or route eligibility.

## Estimated slope extension

The separate **Jezero estimated slope** display derives a Horn 3 × 3 gradient from the pinned CTX DEM. Its physical degree scale, explicit row-wise Mars spacing correction, missing-data policy and reproducible checks are documented in [slope processing](slope-processing.md). It is an exploratory areoid-height gradient; physical surface inclination, obstacle resolution and walking feasibility remain unverified. Geology, elevation and slope colour displays are mutually exclusive for legibility. The three orbital imagery controls remain independent.
