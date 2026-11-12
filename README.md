# Martian Map

A local Jezero Marswalk preview with HiRISE/CTX orbital imagery and optional elevation, estimated-slope and regional geology overlays, built with React, TypeScript and CesiumJS. Walking astronauts, astronauts in a crew vehicle and robotic ground rovers share an ancient-water investigation; global imagery provides context. This is pre-event work begun at the user's direction on November 11, 2026. The organizer's [timing clarification](https://github.com/nasa/spaceapps/discussions/1827) requires project work to begin at the official hackathon start; adding features during the event does not resolve use of pre-event work. Competition eligibility is not established.

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

Interactive Mars reference globe, initial Jezero camera view, global MOC, regional CTX and prioritized regional HiRISE imagery toggles, a local USGS elevation-colour toggle with opacity, datum legend and viewport coverage, an exploratory DEM slope display with degree legend and source/method links, a regional USGS geology toggle with unit legend, opacity, source-offset warning and extent, source-linked science records with local NASA Navcam photographs and expandable PDS position evidence, list-to-panel selection, keyboard map controls, responsive layouts, selectable exploration modes and proposed science tasks for each stop and unavailable-data states. The ancient-water scientific goal is selected; the base is unset. Walking is the initial exploration mode. Each mode has its own unconfigured capability record, with no assumed speed, range, equipment or resource budget.

Selecting Skinner Ridge, Wildcat Ridge or Amalik shows an **approximate, unverified highlight** at the primary sample's published candidate position. The selected highlight has a fixed screen size, a visible warning and a PDS source link. The reported N/E degrees are displayed on the shared Mars sphere; source latitude convention, point definition and accuracy remain unresolved. Exact sample coordinates remain null and unavailable for analysis. List numbering is only a list index, not route order. The initial camera center is the published approximate Perseverance landing location, not a simulated base or sample position. 3D terrain relief, direct mineralogy layers, distances, ranking, routes, field view, saved plans and backend are not implemented. No human route safety is claimed.

See the [selected candidate over live NASA imagery](docs/candidate-highlight-live.png) and [mobile highlight layout](docs/candidate-highlight-mobile.png).

Open **Discover Mars features** below the candidate list to search the imported IAU/USGS catalogue across Mars. Filter by region and feature type, select a result for a labelled catalogue-centre highlight, then choose **Add candidate science stop**. Additions are session-only and need their own observation site and science plan. The catalogue contains named features, not every crater. It refreshes during Pages publication; run `npm run refresh:catalog` to refresh locally. See [catalogue sources, controls and refresh](docs/crater-catalogue.md).

## Controls and checks

Drag/scroll for map navigation. Tab to the map canvas: arrow keys pan, `+`/`-` zoom, `H` resets Jezero. Named buttons provide Jezero/global views and zoom. Selecting a stop in the left panel centers the camera on its approximate candidate position and highlights it, including selecting the same stop again after navigating away. The highlight follows pan/zoom/resize and is hidden when outside the viewport or behind the globe. Choose **Exploration mode** in Mission settings to switch between walking astronauts, astronauts in a crew vehicle and a robotic ground rover. Open **Proposed science tasks** in a selected stop to see its mode-specific investigation. Native controls work with the keyboard. Without WebGL, use the stop list and sources.

```sh
npm run lint
npm run format:check
npm run check:data
npm run build
npx playwright install chromium
npm test
npm run test:live
```

`npm test` uses intercepted deterministic tile responses for interaction/failure tests; those tests do not verify remote imagery. `npm run test:live` separately requests real NASA imagery and skips unless explicitly enabled through that command. Chromium installation is a one-time browser download; Linux may also require system libraries. Test evidence and limitations are recorded in `docs/implementation-checklist.md`. `npm run format` formats application/tooling files. Scientific briefs and the DOCX are excluded from formatting.

`npm run check:data` requires Python 3 and verifies retained scientific metadata and display assets without network access. The frontend itself does not require Python. See [source registry and integrity checks](docs/source-registry.md) for the ten registered products, explicit metadata unknowns and failure/refresh procedures. In the app, expand **Data & provenance → Review sources and limitations (10)** to inspect the evidence types and source records.

## Layout and sources

- `src/data/`: source-linked records and imagery configuration.
- `src/catalog/`: lazy catalogue browsing, validation and candidate details.
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

See [mission science and exploration modes](docs/mission-science.md) for the agreed goal, per-stop questions, proposed tasks and remaining assumptions.
