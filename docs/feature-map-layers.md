# Map layers for catalogue features

The user approved showing reviewed imagery, elevation/relief, slope and geology where available, with explicit gaps. The layer controls now work across Mars. Selecting a catalogue feature updates the explorer heading and enables the reviewed global CTX mosaic. Source coverage follows the **current viewport**, including subsequent panning, zooming and returning to Jezero. It does not claim that a service envelope contains usable pixels everywhere.

## Controls

Open **Mars-wide context** under Map layers. It opens automatically when a catalogue feature is selected.

| Layer | Contribution | Important limits |
| --- | --- | --- |
| Global CTX imagery | Visible context from the uncontrolled Caltech beta01 mosaic, served by Esri | Source imagery about 5 m/pixel; the reviewed levels reach about 10 m per equatorial tile pixel. Uncontrolled mosaic, gaps and alignment unverified. |
| THEMIS daytime infrared | Mars Odyssey daytime infrared brightness/morphology | About 100 m source pixels, roughly 65° S to 65° N. Drawn above visible imagery while enabled. Brightness is not a height or mineral measurement. |
| Global elevation context | MOLA/HRSC colour hillshade, including NASA MGS and ESA Mars Express data | Product name describes a 200 m grid. Broad relief colours and artificial shading, with no numeric height readout, validated numeric colour bar, slope derivation or 3D terrain. |
| Global geological context | USGS SIM 3292 regional interpretation, Tanaka et al. (2014) | 1:20,000,000 scale; zoom does not add site-scale geological evidence. Forty-four service legend units with exact retained swatches/labels. No geological unit assigned to a stop. |

Global MOC remains the coarse base. Global CTX automatically turns on at camera heights of 500 km or less and off above that. Changing its checkbox takes manual control until reload; zoom, feature selection and map retries preserve that choice. Controlled Jezero CTX and HiRISE appear above global visible CTX where their footprints overlap; enabling the infrared alternative places it above visible imagery. Global geology/elevation and local Jezero geology/elevation/slope colours are mutually exclusive, with opacity controls. Layers survive map retry and imagery retries preserve drawing order. New world services load only when enabled.

The **Base imagery & Jezero detail** controls retain each local product's name and extent. Outside their coverage they show a gap rather than becoming falsely labelled global products. A separate message reports when no reviewed slope grid covers the viewport. Returning to Jezero removes the gap where its estimated-slope grid applies. No global slope or direct mineralogy layer has been fabricated.

Coverage states mean *within service extent*, *partial viewport coverage*, *outside this viewport* or *unknown*. A large polar feature can initially frame enough of Mars to overlap THEMIS's midlatitude coverage; zooming closer to the pole changes that from partial to outside. Longitude-seam views are handled in the same geographic extent logic. Without WebGL the coverage remains unknown, but source notes, legends, catalogue and stop evidence remain usable.

These controls expose the reviewed products connected to this app, not a guarantee of discovering the highest-resolution observation in every archive. The sparse global HiRISE mosaic is not connected: its reviewed Trek WMTS high-level matrix dimensions conflict with the expected geographic grid, and no valid-pixel footprints were established. The controlled Jezero HiRISE service remains available within its own extent.

## Reviewed sources

- [NASA Trek WMTS documentation](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars): capabilities declare resource URLs, formats, tile sizes, grids and geographic service envelopes. Remote missing tiles mean missing coverage, not absence of terrain.
- [Caltech beta01 CTX mosaic](https://murray-lab.caltech.edu/CTX/beta01.html) and the NASA Trek product catalogue: source use/credit and uncontrolled imagery context. The NASA capabilities delegate CTX tiles to `astro.arcgis.com`; direct service metadata explicitly defines the 3,396,190-metre Mars sphere.
- [USGS MOLA/HRSC blended relief](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_mex_hrsc_blended_shaded_relief_200m) and the NASA Trek colour-hillshade catalogue/capabilities. The source product name does not establish positional accuracy or a numeric colour scale.
- [USGS SIM 3292](https://pubs.usgs.gov/sim/3292/): global geology, published 2014, scale 1:20,000,000. NASA-hosted ArcGIS service metadata and its legend are retained.

`data/manifests/world-layers-review.json` records four products, exact rendering parameters, source links, limits, tile probe URLs/hashes and eleven retained metadata snapshots. Protocol versions and catalogue timestamps do not establish scientific release or observation dates. Full WKT is explicit for CTX and the geology catalogue; the reviewed relief and THEMIS services declare Mars EPSG:104905 without an independent full source-WKT review here. Their display on the common sphere does not establish scientific registration.

Actual representative tile requests returned images and browser access headers without credentials. CTX uses 512 × 512 tiles; the other products use 256 × 256 tiles. The relief service is JPEG, while the others are PNG. The geology endpoint comes from the advertised ArcGIS WMTS resource rather than a guessed NASA `/tiles` URL. Global geology uses nearest-neighbour display filtering to avoid blending categorical colours. Source metadata's small rounded CTX level-3 angular resolution is compared with a 1e-9-degree numerical tolerance; this is not a positional accuracy claim.

The source registry now has fourteen products. All remain ineligible for scientific ranking or route-feasibility analysis. Coverage, image detail, horizontal precision, source alignment and access feasibility remain separate claims.

## Verify and refresh

```sh
npm run check:data
python3 -m unittest discover -s tests/catalog -v
npm run lint
npm run format:check
npm run build
npm test
npm run test:live
npm run test:pages
npm run build
```

The local integrity gate verifies 62 retained scientific files, including these eleven snapshots, and checks each world product's identity, format, endpoint, tile size, geographic matrix, source/service extent agreement, analysis flag and source legend. The CTX direct service's WKT and resolution grid are independently compared. No full remote mosaic is downloaded or snapshotted.

To refresh world products, fetch the exact capabilities/catalogue/service/legend URLs listed in the review manifest, compare their contracts, review scientific changes, update the retained snapshots and review together, then run data, pipeline and browser checks. These layer definitions are curated; the automatic feature-names catalogue refresh does not silently replace scientific layer products.

No backend, token, account, paid service, new dependency, scientific source raster processing or deployment is introduced. Local DEM/slope generation and their existing limitations are unchanged.

Screenshots of real services: [global CTX at Gale](world-ctx-live.png), [global geology](world-geology-live.png), [global relief](world-relief-live.png) and [THEMIS infrared](world-themis-live.png). The [desktop controls](world-layers-desktop.png) and [mobile controls](world-layers-mobile.png) use deterministic browser tile fixtures.

## Verification outcome

Build/lint/format/data checks passed; the Python catalogue suite passed 15 checks, and the full deterministic browser suite passed 48 with the live check intentionally skipped. The dedicated live check and Pages-prefix smoke check each passed separately. Actual CTX rendered detailed imagery at Gale while reporting incomplete tile availability; valid imagery stays visible with the partial/no-coverage warning. The live check requires real successful image responses for each new service and permits that warning, rather than equating an envelope with complete coverage. Global geology, relief and THEMIS rendered successfully and their screenshots were visually reviewed. This is local verification; no public deployment was performed.
