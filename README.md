# Martian Map

A local Jezero Marswalk preview with optional elevation-colour and regional geology overlays, built with React, TypeScript and CesiumJS. Walking astronauts are primary; global imagery provides context. This is pre-event work begun at the user's direction on November 11, 2026. The organizer's [timing clarification](https://github.com/nasa/spaceapps/discussions/1827) requires project work to begin at the official hackathon start; adding features during the event does not resolve use of pre-event work. Competition eligibility is not established.

## Local preview

Use Node **26.11.1** (see `.nvmrc`); the dependency engine minimum is 22.17.0. No credentials, environment variables, Cesium ion account, database or paid services are required.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. If that port is occupied, run `npm run dev -- --port 5174` and open **http://127.0.0.1:5174** (the verified running preview for this session). The server binds to the local machine only. Internet access to `trek.nasa.gov` is required for imagery. If imagery fails, the map reports it and offers retry; science records remain usable. Toggle imagery off to see the smooth Mars reference globe.

```sh
npm run build
npm run preview
```

The production preview opens at **http://127.0.0.1:4173**. Cesium worker/static assets are copied locally on install, dev and build into ignored `assets/cesium/`. No application deployment is configured.

## What is implemented

Interactive Mars reference globe, initial Jezero camera view, global MOC and regional CTX imagery toggles, a local USGS elevation-colour toggle with opacity, datum legend and viewport coverage, a regional USGS geology toggle with unit legend, opacity, source-offset warning and extent, source-linked science records with local NASA Navcam photographs and expandable PDS position evidence, list-to-panel selection, keyboard map controls, responsive layouts, optional support preferences for the current session and unavailable-data states. The goal stays `null`; the base is unset. Support preferences have no equipment or mobility capabilities attached.

Skinner Ridge, Wildcat Ridge and Amalik have **no geographic markers** because exact sample coordinates remain unverified. List numbering is only a list index, not route order. The initial camera center is the published approximate Perseverance landing location, not a simulated base or sample position. 3D terrain relief, slopes, direct mineralogy layers, distances, ranking, routes, field view, saved plans, crater catalog and backend are not implemented. No human route safety is claimed.

## Controls and checks

Drag/scroll for map navigation. Tab to the map canvas: arrow keys pan, `+`/`-` zoom, `H` resets Jezero. Named buttons provide Jezero/global views and zoom. Selecting any stop in the left panel returns the camera to the Jezero regional view, including selecting the same stop again after navigating away. This is regional context, not a verified drill location. Native buttons and checkboxes work with the keyboard. Without WebGL, use the stop list and sources.

```sh
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm test
npm run test:live
```

`npm test` uses intercepted deterministic tile responses for interaction/failure tests; those tests do not verify remote imagery. `npm run test:live` separately requests real NASA imagery and skips unless explicitly enabled through that command. Chromium installation is a one-time browser download; Linux may also require system libraries. Test evidence and limitations are recorded in `docs/implementation-checklist.md`. `npm run format` formats application/tooling files. Scientific briefs and the DOCX are excluded from formatting.

## Layout and sources

- `src/data/`: source-linked records and imagery configuration.
- `src/stops/`: surface photographs, image recovery and unresolved-position evidence.
- `src/map/`: Cesium lifecycle, Mars geometry, imagery, navigation and failure handling.
- `src/`: application interface and styles.
- `tests/`: interaction, scientific-data constraints, outage and live imagery checks.
- `assets/`: retained NASA surface photographs and the generated elevation overlay; Cesium runtime assets are ignored.
- `pipelines/evidence/`: standard-library Python audit of pinned PDS localization and arm records.
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

Enable **Jezero regional geology** for the USGS SIM 3464 interpretation, then open **Geological units (14)**. USGS reports offsets of about 100–200 m from the controlled CTX imagery; alignment remains unverified. Transparent areas are unclassified or withheld. Geology and elevation colours are viewed one at a time. See [geology processing and limitations](docs/geology-processing.md) for source QA, reproduction commands and [desktop](docs/geology-desktop.png)/[mobile](docs/geology-mobile.png) screenshots.
