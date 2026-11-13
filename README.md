# Martian Map

A local Jezero Marswalk preview with HiRISE/CTX orbital imagery and optional elevation, estimated-slope and regional geology overlays, built with React, TypeScript and CesiumJS. Walking astronauts, astronauts in a crew vehicle and robotic ground rovers share an ancient-water investigation; global imagery and feature-dependent layer controls provide context. This is pre-event work begun at the user's direction on November 11, 2026. The organizer's [timing clarification](https://github.com/nasa/spaceapps/discussions/1827) requires project work to begin at the official hackathon start; adding features during the event does not resolve use of pre-event work. Competition eligibility is not established.

## Local preview

Use Node **26.11.1** (see `.nvmrc`); the dependency engine minimum is 22.17.0. No credentials, environment variables, Cesium ion account, database or paid services are required.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. If that port is occupied, run `npm run dev -- --port 5174` and open **http://127.0.0.1:5174**. The server binds to the local machine only. Internet access to `trek.nasa.gov` is required for imagery. If imagery fails, the map reports it and offers retry; science records remain usable. Toggle imagery off to see the smooth Mars reference globe.

```sh
npm run build
npm run preview
```

The production preview opens at **http://127.0.0.1:4173**. Cesium worker/static assets are copied locally on install, dev and build into ignored `assets/cesium/`. GitHub Pages publishing is configured in `.github/workflows/pages.yml`; see the hosting instructions below.

## What is implemented

Interactive Mars reference globe, initial Mars globe view with automatic global CTX and Jezero detail off, global MOC, regional CTX and prioritized regional HiRISE imagery toggles, a local USGS elevation-colour toggle with opacity, datum legend and viewport coverage, an exploratory DEM slope display with degree legend and source/method links, a regional USGS geology toggle with unit legend, opacity, source-offset warning and extent, source-linked science records with local NASA Navcam photographs and expandable PDS position evidence, list-to-panel selection, keyboard map controls, responsive layouts, proposed walking-exploration science tasks for each stop and unavailable-data states. The ancient-water scientific goal is selected; the base is unset. Walking is the initial exploration mode. No speed, range, equipment or resource budget is assumed.

Selecting Skinner Ridge, Wildcat Ridge or Amalik shows an **approximate, unverified highlight** at the primary sample's published candidate position. The selected highlight has a fixed screen size, a visible warning and a PDS source link. The reported N/E degrees are displayed on the shared Mars sphere; source latitude convention, point definition and accuracy remain unresolved. Exact sample coordinates remain null and unavailable for analysis. List numbering is only a list index, not route order. The initial camera shows the Mars globe; Jezero view uses the published approximate Perseverance landing location, not a simulated base or sample position. 3D terrain relief, direct mineralogy layers and terrain-aware rankings/routes remain unavailable. Preliminary distance-only round trips, optional mission assumptions, field view, local draft storage and JSON import/export are implemented; accounts/backend are deferred by agreement. No human route safety is claimed.

Set a **simulated base** using **Place base on map** and a surface click, or expand **Enter coordinates instead**. Open **Calculate best destinations · Top 10** directly, or use **Compare destinations** in the three-step guide for value-based suggestions. The calculator uses the whole imported catalogue with its own radius/type filter. Starting weights are study potential 50, distance 30, terrain 20; weights and feature-type interests are editable. Study interest is a simulation heuristic, not measured scientific value. Terrain remains unknown and contributes an unresolved score range, so the top result is provisional. Result cards show score ranges and distance; expand **Why this score?** for criterion points, out-and-back surface-distance lower bounds and source links. The calculator works through coordinate entry without WebGL. Calculator base and preferences are session-only; the round-trip planner can explicitly save and restore a local draft. See [calculator rules and limitations](docs/destination-calculator.md).

See the [selected candidate over live NASA imagery](docs/candidate-highlight-live.png) and [mobile highlight layout](docs/candidate-highlight-mobile.png).

Open **Discover Mars features** below the planning controls to search the imported IAU/USGS catalogue across Mars. Filter by region and feature type, select a result for a labelled catalogue-centre highlight, then choose **Add candidate science stop**. Additions are session-only and need their own observation site and science plan. The catalogue contains named features, not every crater. It refreshes during Pages publication; run `npm run refresh:catalog` to refresh locally. See [catalogue sources, controls and refresh](docs/crater-catalogue.md).

Use the expanded **Mars-wide context** group in Map layers for global CTX visible imagery, optional THEMIS infrared, MOLA/HRSC elevation context and global geology. Global CTX starts in automatic mode: off at globe scale and on at camera heights of 500 km or less. Changing its checkbox switches to manual control for the rest of the page session, including feature selection and map retries. Reloading restores automatic mode. Base imagery & Jezero detail is collapsed initially and opens when a Jezero science stop is selected. Selecting a catalogue feature follows the same automatic zoom rule unless the user has taken manual control. Coverage labels follow the current viewport; Jezero detail keeps its regional limits. Global elevation is colour hillshade rather than a numeric height or slope grid. See [feature map layers, sources and gaps](docs/feature-map-layers.md).

Choose **Inspect the evidence** in step 3, or **Inspect this destination’s evidence** in the selected-destination panel. The evidence workspace below the map follows the selected catalogue feature or Jezero stop. It separates documented facts, missing evidence and imagery/terrain/geology product reviews. Product coverage is a reference-point envelope check, not a valid-pixel or whole-feature guarantee. Expand a product for scale, dates, provenance and limitations; **View layer on map** enables that existing layer and returns to the selected reference. Jezero sample investigations, surface photographs and PDS position reviews live in this workspace. Catalogue features do not inherit nearby rover observations. See [evidence workspace behavior and limits](docs/evidence-inspector.md).

## Round trips and saved field plans

Select a destination, then choose **Add selected destination to trip**, or add the three Jezero references. **Trip** opens an ordered base → stops → base planner with minimum surface distances and dashed hypothetical map segments. Expand **Define mission settings (optional)** for mode, assumed speed, available time, reserve, distance budget, slope preference, crew size and equipment. Enter work time per stop to estimate total duration. Blank inputs remain unknown; slope preferences are recorded but unenforced.

**Open field view** shows task-review checklists and Jezero photographs. **Save local draft**, **Load saved draft**, **Export plan JSON**, **Import plan JSON** and **Print field plan** support review and backup. No accounts or server receive plans. Numerical terrain context is a sparse exploratory source review, not a corridor or hazard check. See [trip workflow, calculations, privacy and limitations](docs/trip-planning.md).

The historical MEDA panel provides two separately dated NASA/JPL observation windows at Perseverance. It is not a current/global forecast and does not affect trip eligibility. **Only features in current map view** filters catalogue centres using the current camera envelope, including longitude-seam views. Results remain paginated.

See [release scope and infrastructure decisions](docs/release-scope.md) and the [submission/demo draft](docs/submission-draft.md). The user handles the final competition submission; external scientific verification and public-release checks remain explicit checklist items.

## Controls and checks

A six-step **How to use** overlay tutorial opens on the first visit and covers navigation, base placement, destination comparison, evidence, layers and the trip planner. It scrolls to and spotlights the control being explained, with an explanation beside it and the rest of the page dimmed. **Skip tutorial** is available on every step; **Back** and **Next** control progress. Skipping, pressing Escape inside the guide or finishing remembers dismissal in this browser. **How to use** reopens the guide from the beginning. If browser storage is blocked, dismissal still works for the current page.

The header provides direct **Map**, **Layers**, **Plan**, **Trip** and **Data & sources** links. A three-step guide leads from base placement to destination comparison and evidence review. Coordinate entry, score explanations, type preferences and technical methodology expand on demand. Mobile map placement scrolls to the map and shows a cancel action. See the [desktop overview](docs/ui-overview-desktop.png) and [mobile results](docs/ui-results-mobile.png).

Drag/scroll for map navigation. Tab to the map canvas: arrow keys pan, `+`/`-` zoom, `H` resets Jezero. Named buttons provide Jezero/global views and zoom. Selecting a stop in the left panel centers the camera on its approximate candidate position and highlights it, including selecting the same stop again after navigating away. The highlight follows pan/zoom/resize and is hidden when outside the viewport or behind the globe. Open **Proposed science tasks** in a selected stop to see its proposed walking investigation. Native controls work with the keyboard. Without WebGL, use the stop list and sources.

```sh
npm run lint
npm run format:check
npm run check:data
npm run build
npx playwright install chromium
npm test
npm run test:dev
npm run test:live
```

`npm test` uses intercepted deterministic tile responses for interaction/failure tests; those tests do not verify remote imagery. `npm run test:live` separately requests real NASA imagery and skips unless explicitly enabled through that command. Chromium installation is a one-time browser download; Linux may also require system libraries. Test evidence and limitations are recorded in `docs/implementation-checklist.md`. `npm run format` formats application/tooling files. Scientific briefs and the DOCX are excluded from formatting.

`npm run test:dev` checks worker delivery and map rendering through Vite's development server. Vite prepares Cesium assets before startup and serves runtime files directly from disk, including when launched directly. Repeated preparation preserves unchanged worker files, so installs/builds alongside the running dev server do not invalidate worker delivery. Missing runtime files return 404 rather than HTML.

`npm run check:data` requires Python 3 and verifies retained scientific metadata and display assets without network access. The frontend itself does not require Python. See [source registry and integrity checks](docs/source-registry.md) for the fifteen registered products, explicit metadata unknowns and failure/refresh procedures. In the app, expand **Data & provenance → Review sources and limitations (15)** to inspect the evidence types and source records.

## Layout and sources

- `src/data/`: source-linked records and imagery configuration.
- `src/catalog/`: lazy catalogue browsing, validation and candidate details.
- `src/planning/`: base controls, explainable ranking, preliminary trip calculations, optional mission assumptions, terrain context, drafts/export and field plans.
- `assets/catalog/`: hash-named search index, regional records and retained official export.
- `src/stops/`: surface photographs, image recovery and unresolved-position evidence.
- `src/map/`: Cesium lifecycle, Mars geometry, imagery, navigation and failure handling.
- `src/`: application interface and styles.
- `tests/`: interaction, scientific-data constraints, outage and live imagery checks.
- `assets/`: retained NASA surface photographs and the generated elevation, geology and slope overlays; Cesium runtime assets are ignored.
- `pipelines/evidence/`: standard-library Python audit of pinned PDS localization and arm records.
- `pipelines/catalog/`: standard-library catalogue import and integrity checks for retained metadata, imagery configuration and display assets.
- `pipelines/geology/`: optional, isolated GIS-to-display processing and hashed dependencies.
- `pipelines/terrain/`: optional local Python processing, pinned hashed requirements and Ruff configuration.
- `data/manifests/`: small scientific metadata snapshots; raw rasters are ignored.
- `scripts/`: repeatable local asset preparation.
- `docs/implementation-checklist.md`: persistent implementation tracker.
- `docs/preview-sources.md`: source verification, coordinate conventions and known limitations.

See [source verification](docs/preview-sources.md) for attribution and usage policies. No secret tokens are used. Any future browser token would be public to users and must be deliberately scoped/restricted; do not add a secret token to frontend code or any `VITE_` variable.

Review the captured [desktop preview](docs/preview-desktop.png) and [mobile preview](docs/preview-mobile.png), generated with live NASA imagery.

The measured elevation layer is a colour overlay, with heights relative to the source Mars areoid. It does not displace the globe or establish walkability. See [terrain processing](docs/terrain-processing.md) for reproducible Python setup, data checks and the remaining 3D height-conversion gate. Python is not required to open the preview.

View the [elevation overlay on desktop](docs/elevation-desktop.png) or [mobile](docs/elevation-mobile.png).

See [stop evidence and position review](docs/stop-evidence.md) for image provenance, the rover-frame versus drill-point distinction, reproducible PDS audit commands and outstanding placement blockers. Surface photos are served locally; orbital imagery still needs internet access.

Enable **Jezero regional geology** for the USGS SIM 3464 interpretation, then open **Geological units (14)**. USGS reports offsets of about 100–200 m from the controlled CTX imagery; alignment remains unverified. Transparent areas are unclassified or withheld. Geology, elevation and slope colours are viewed one at a time. See [geology processing and limitations](docs/geology-processing.md) for source QA, reproduction commands and [desktop](docs/geology-desktop.png)/[mobile](docs/geology-mobile.png) screenshots.

## GitHub Pages

The intended public URL is **https://zaplexes.github.io/spaceappsproject/**. Select **Settings → Pages → Source → GitHub Actions** and leave **Custom domain** empty. The included workflow builds the Vite app and deploys only `dist/`; publishing the source branch root causes a blank page. Remote publication is complete only after the Actions build/deploy jobs and the public-site smoke check succeed.

`npm run test:pages` verifies the `/spaceappsproject/` build, including Cesium, photographs and all three local overlays. `MARTIAN_MAP_BASE_PATH` controls the public prefix; `.env.example` contains its non-secret default. Ordinary local development stays at `/`. See [hosting setup and troubleshooting](docs/github-pages.md) for the exact workflow, permissions and verification steps.

Enable **Jezero HiRISE imagery** for finer orbital context above CTX; its service extent and loading/failure status are shown on the map. Enable **Jezero estimated slope** for the exploratory degree-valued DEM gradient. See [slope processing](docs/slope-processing.md) for the algorithm, reproducible build and limitations; it does not establish walking feasibility.

See the [operations and recovery guide](docs/operations.md) for release checks, outage triage, scientific-data refresh and rollback procedures.

See [mission science context](docs/mission-science.md) for the agreed goal, per-stop questions, proposed tasks and remaining assumptions. The old standalone Mission settings and disabled comparison block have been replaced by optional settings inside the working round-trip planner.

If live global MOC tiles fail, the map uses matching crops of two bundled, unmodified NASA Trek level-zero tiles. Failed tiles reuse loaded parent imagery where possible; otherwise CTX tiles become transparent so the base can still render. Requests that stall for eight seconds also use fallback imagery. The map reports partial availability and retains Retry. These fallback images are coarse context only; provenance is in `src/data/generated/moc-overview.json`.

## Feature images

Catalogue details request a north-up orbital crop centred on the IAU/USGS
feature centre, sized from the feature’s approximate dimension. The reviewed
Caltech/Esri CTX service supplies detailed views; missing, transparent or failed
tiles fall back to the coarser NASA Trek MOC overview. If both fail, the panel
shows an unavailable state and a retry button. No geographic coordinates are
inferred from photographs. The cross marks the catalogue centre, not a science
observation site. Geographic crops can distort polar features and may not contain
an entire elongated feature. Mosaic acquisition dates and alignment are not
independently established. Credits and source links accompany each preview.

Jezero’s catalogue record also includes an expandable gallery of the three
retained NASA Perseverance Navcam images, with their sampling-site names,
camera, image sol, NASA caption date and credits. The same image component is
used in each science stop. The gallery does not place these photos at the crater
centre or assign them to unrelated features. Images are already retained in
`assets/stops/`; their provenance remains in `data/manifests/surface-images.json`.

Verify image crops, fallback, feature switching and Jezero gallery attribution
with `npm test -- tests/feature-imagery.spec.ts tests/stop-evidence.spec.ts` after
`npm run build`.
