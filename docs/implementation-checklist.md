# Martian Map — Implementation Checklist

## How the agent must use this checklist

- Use `[ ]` for unfinished work and `[x]` only for completed, verified work. The existing briefs are proposals, not proof of implementation.
- Update this file after each completed milestone. Record relevant commands, results, limitations, and changed scope in the progress log below.
- For blocked items, keep the box unchecked and state the blocker in the progress log. Ask specific questions; do not invent an answer.
- Complete work in milestone order. Begin with milestone 1 only; later sections describe the full intended scope and do not authorize paid services or deployment.
- A scientific goal, scoring weights, exact base coordinates, and equipment capabilities remain undecided. Do not choose them silently.
- Mark optional items explicitly deferred with the user's agreement; do not mark deferred work complete.

## 0. Readiness and essential decisions

- [x] Read `AGENTS.md`, `Space Apps.docx`, `docs/project-scope.md`, and `docs/technical-brief.md`.
- [x] Inspect existing files, Git state, runtime availability, and applicable instructions.
- [x] Check official competition timing and rules; clarify intended use if implementation would precede the permitted start.
- [x] Confirm frontend stack compatibility and choose exact dependency versions; ask about unresolved material choices.
- [ ] Establish a usable Mars imagery/terrain source, attribution, licensing, access, and token requirements.
- [x] Define local preview commands and the first milestone's verification criteria.

## 1. Working local preview — first implementation milestone

- [x] Scaffold the frontend with reproducible dependencies and a lockfile.
- [x] Render an interactive Mars globe with the correct planetary geometry and a Jezero initial view.
- [x] Provide responsive map, layer controls, science-stop list, information panel, and mission settings.
- [x] Keep the scientific goal null/unselected and ranking unavailable until a goal is defined.
- [x] Add source-linked records for Skinner Ridge, Wildcat Ridge, and Amalik from verified sources.
- [ ] Verify candidate stop coordinates before placing geographic markers; keep unverified stops in a list.
- [x] Implement selection between the stop list, information panel, and any verified markers.
- [x] Include clear loading, unavailable-data, imagery-failure, and unsupported-WebGL states.
- [x] Support keyboard-accessible controls and readable narrow-screen layouts.
- [x] Keep secrets out of source and distinguish intentionally public, restricted browser tokens.
- [x] Run appropriate build and interaction checks; document anything that could not be verified.
- [x] Provide a working local preview and record exact startup instructions.

## 2. Verified multi-mission Jezero layers

- [ ] Identify specific products from multiple NASA missions and record their scientific contribution.
- [ ] Record product IDs, URLs, citations, rights, dates, versions, checksums, footprints, and resolution.
- [ ] Normalize Mars coordinate systems, longitude conventions, latitude definitions, units, and height datums.
- [ ] Obtain and align appropriate imagery, elevation, and geological/mineralogical evidence.
- [ ] Check nodata, spatial alignment, coverage, and resolution before combining datasets.
- [ ] Provide functional layer toggles, legends, provenance, and coverage indicators.
- [ ] Distinguish orbital observations, rover measurements, and derived interpretations.
- [ ] Preserve raw snapshots and reproducible processing manifests; keep bulk assets outside Git.
- [ ] Separate visual terrain assets from analysis rasters and expose their limitations.

## 3. Scientific mission and local stops

- [ ] Ask the team to select the scientific goal before implementing goal-dependent scoring.
- [ ] Confirm a simulated local base, supported study area, and verified stop locations.
- [ ] Define a scientific question and proposed observation, measurement, or sampling activity for each stop.
- [ ] Attach evidence and appropriate surface reference imagery to each stop.
- [ ] Agree walking-crew assumptions, carried equipment, work time, travel limits, and return reserve.
- [ ] Define optional crew-vehicle and robotic support profiles separately with explicit assumptions.
- [ ] Keep historical rover paths visually and semantically separate from hypothetical crew excursions.

## 4. Explainable comparison and ranking

- [ ] Agree feature definitions, normalization, scoring weights, and eligibility thresholds with the team.
- [ ] Filter candidate local stops by mission constraints and required evidence coverage.
- [ ] Calculate scientific value, travel cost, and terrain difficulty as separate components.
- [ ] Display data confidence separately; never present it as a probability of safety.
- [ ] Treat missing evidence as unknown, never as low risk or a favorable score.
- [ ] Show explanations, source references, exclusions, and model/data versions for each result.
- [ ] Recalculate appropriately when the base, goal, profile, budget, or data version changes.
- [ ] Test known cases, missing data, budget boundaries, reproducibility, and sensitivity to assumptions.

## 5. Round-trip Marswalk and field view

- [ ] Show a base-to-stops-to-base excursion with ordered stops and planned scientific tasks.
- [ ] Distinguish preliminary distance-only estimates from terrain-aware route analysis.
- [ ] Include return travel, work time, reserves, elevation information, and terrain concerns.
- [ ] For terrain-aware routing, define and validate a bounded local cost grid and mode-specific limits.
- [ ] Prevent routes outside supported coverage or through excluded terrain; explain failure cases.
- [ ] Show route segments, stop references, limitations, and assumptions without claiming certified safety.
- [ ] Provide a field-use view with numbered stops, a science checklist, and reference images.
- [ ] Label any simulated position and provide a review/export option for the excursion.
- [ ] Test route endpoints, return feasibility, blocked paths, data gaps, and user interaction.

## 6. Backend, storage, and processing — when justified

- [ ] Confirm which tasks need a server rather than local/static data before adding infrastructure.
- [ ] Implement bounded catalog, stop, layer, and analysis API contracts with structured validation errors.
- [ ] Define provenance-aware records for regions, craters, stops, datasets, observations, excursions, and analysis runs.
- [ ] Add database migrations and spatial indexes using explicit Mars reference systems.
- [ ] Keep bulk raster/imagery assets in versioned object storage with metadata in the database.
- [ ] Run heavy scientific processing outside interactive API requests.
- [ ] If asynchronous jobs are needed, persist state and define progress, cancellation, expiry, and safe retries.
- [ ] Apply pagination, request limits, timeouts, and cache keys containing input and data/model versions.
- [ ] Test API contracts, invalid requests, processing failures, and external-source outages.

## 7. Global discovery and optional extensions

- [ ] Add catalog-wide crater discovery with a clearly stated catalog completeness limit.
- [ ] Support search, viewport queries, marker clustering or tiling, and on-demand details.
- [ ] Distinguish globally browsable catalog records from regions eligible for detailed analysis.
- [ ] Verify camera navigation, longitude-seam behavior, and rendering performance with larger datasets.
- [ ] Evaluate saved accounts, shared plans, or environmental layers only if requested; otherwise document deferral.
- [ ] If environmental observations are added, show location and observation time without implying live global conditions.

## 8. Security, release, and server management

- [ ] Agree hosting provider, region, ownership, domain, budget, and any deployment authorization.
- [ ] Separate development, staging, and production configuration; provide example environment variables.
- [ ] Apply HTTPS, private database access, least privilege, secret management, and restricted cross-origin access.
- [ ] Validate requests, parameterize SQL, and restrict remotely fetched data sources.
- [ ] Protect administrative operations and enforce object authorization if shared saved plans are introduced.
- [ ] Build reproducible artifacts; configure health checks, restarts, shutdown, and resource limits.
- [ ] Add structured logs and operational metrics without leaking credentials or unnecessary user data.
- [ ] Configure budget/quota monitoring, processing caps, and an upstream-outage demo fallback.
- [ ] Establish backups, retention, recovery targets, and a tested restore procedure.
- [ ] Document troubleshooting, data refresh, incident handling, and rollback procedures.
- [ ] Run relevant automated checks and staging smoke checks before an authorized release.
- [ ] Verify the deployed version and record remaining limitations if deployment is authorized.

## 9. Competition submission and handoff

- [ ] Recheck current official submission requirements and the team's local event deadlines.
- [ ] Map the demonstrated behavior to the challenge's multi-mission, local exploration, science, and mobility objectives.
- [ ] Verify required NASA resource usage and include all scientific and third-party references.
- [ ] Disclose AI assistance and satisfy current applicable attribution and generated-media rules.
- [ ] Prepare the required project description and demonstration in the official format and language.
- [ ] Confirm judges can access required project links and supporting evidence.
- [ ] Document what works, what is simulated, what is unverified, and what is deferred.
- [ ] Provide setup instructions, configuration requirements, and a final checklist status for the team.

## Progress log

Initial state: no implementation was verified before the work recorded below. Existing visual and technical briefs describe the agreed direction only. Current completion is represented by the checkboxes and dated verification entries.

### 2026-11-11 — Readiness inspection; implementation pending clarification

- Read all five requested files. Extracted DOCX paragraphs and tables with Python `zipfile` and `xml.etree.ElementTree`; no embedded images were present. Left the DOCX unchanged.
- Verification: `rg --files`, `ls -la`, `git status --short --branch`, `git log -3 --oneline`, runtime version checks, and ancestor instruction checks. Results: no app scaffold or dependency manifests; branch `master`, initial commit `41b4e59`, existing `docs/` untracked. Node v26.11.1, npm 12.2.1, Python 3.14.8 and Firefox available. No ancestor AGENTS.md files found.
- Checked https://www.spaceappschallenge.org/2026/ and the official organizer answer at https://github.com/nasa/spaceapps/discussions/1827 (November 5 clarification). Official event is November 14–15, 2026; project work starts Saturday at 09:00 local event time, or team-owner local time for the Universal Event. Research and resource review are permitted before then. Direct event-page fetch also returned HTTP 502; indexed official content and the organizer answer were readable.
- BLOCKER: today precedes the permitted start. Asked whether this is an independent learning prototype to build now or the intended submission to wait for. No application implementation begun while that answer is pending. Timing readiness item remains unchecked until intended use is clarified.
- Asked for stack acceptance: React + TypeScript + CesiumJS, public imagery without credentials, or an existing Cesium ion account. No versions or provider committed yet. Cesium Mars documentation confirms ion account access is required for its 3D tileset: https://cesium.com/platform/cesium-ion/content/cesium-mars/. NASA Trek WMTS documentation is a public-imagery candidate, not yet an established source: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars.
- No build or interaction checks are possible yet. No local preview/startup command exists. All section 1 items and later milestones remain unchecked; no deployment or paid resources created.

### 2026-11-11 — Submission timing confirmed; implementation on hold

- User confirmed: “Intended submission — wait until official start.” Timing/readiness check is now complete. Do not begin application implementation before the permitted start.
- Resume only at or after November 14, 2026, 09:00 in the Local Event timezone, or the team owner's residence timezone for the Universal Event. Confirm which event/timezone applies before resuming; the workstation timezone alone does not establish eligibility.
- Frontend stack acceptance is still unanswered; source availability, licensing/access, exact dependency versions, preview commands, and verification criteria remain unresolved. No credentials have been requested or supplied.
- Section 0: document reading, repository/runtime inspection, and timing clarification verified. Section 1: no implementation, build, interaction checks, or preview yet. Later sections remain unchanged.
- Verification for this documentation milestone: reread section 0 and the appended progress log; `git diff --check` (note: checklist remains an existing untracked file, so this command alone does not validate its content).

### 2026-11-11 — Frontend direction approved

- User approved React + TypeScript + CesiumJS for the local preview, using public imagery without credentials. No Cesium ion integration, account, token, paid service, or deployment is authorized by this choice.
- Terrain elevation will remain unavailable until a suitable source is verified; the preview must label the absence of local relief and leave elevation/slope measurements unavailable. Public imagery still needs source, attribution, licensing, coordinate/coverage, and access verification.
- Stack acceptance is resolved. The combined stack compatibility/exact-version checklist item remains unchecked until compatibility and pinned dependency versions are verified. No new implementation items are complete.
- The instruction to wait for the official competition start remains in force. No scaffold, dependency installation, application code, or local preview was created. Applicable event/timezone confirmation remains pending before resuming.
- Verification: Python assertions confirmed the approval is recorded, the stack/version readiness item remains unchecked, all section 1 items remain unchecked, and the checklist has no trailing whitespace.

### 2026-11-11 — User directed immediate pre-event implementation

- User superseded the earlier instruction to wait: “we are gonna start the project now so when the day come we only add what they ask”. Recorded this as pre-event work for the intended submission, not an independent prototype or evidence of eligibility. Informed the user that adding event-day features does not resolve the organizer timing issue. No deployment or paid service is authorized.
- Approved frontend stack: React + TypeScript + CesiumJS; public credential-free imagery. User approved NASA's current Mageik value (sol sealed 619) over the DOCX's 579. The DOCX remains unchanged.
- Initial source probes: NASA Trek API documentation/catalog and live MOC/global and CTX/Jezero WMTS capabilities read; representative tiles returned HTTP 200, valid 256×256 PNG, `Access-Control-Allow-Origin: *`, no token. Rejected a guessed Viking endpoint after HTTP 404; the uncontrolled CTX beta capabilities delegate to another provider, so it was not selected. Selected the directly served controlled regional CTX mosaic. Metadata HTML endpoint returned no content; capabilities/catalog are the current metadata sources.
- Scaffold and interface written, but no new checkboxes marked complete yet. Dependency install, compilation, interaction tests, live rendering, source documentation and startup verification still required.

### 2026-11-11 — Milestone 0 readiness verification

- Accepted stack is installed and compiles: React/React DOM 19.3.1, TypeScript 5.9.3, CesiumJS 1.147.0, Vite 7.3.8 and React plugin 5.1.1. Exact direct dependency pins and package lockfile are present. Node 26.11.1/npm 12.2.1 used. Minimum Node version 22.17.0; use `.nvmrc` for the verified runtime.
- Verification: `npm install`, `npm run build`, `npm run lint`, and `npm audit --json`. Build and lint passed. Initial dependency findings were addressed by Vite 7.3.8 and a minimatch 11.0.1 override; subsequent install audit reported zero vulnerabilities. Transitive lint override passed lint.
- Defined startup and verification criteria in README and browser suite: compile; Mars geometry/coordinate conventions; list/panel selection; null goal/unset base; disabled ranking; imagery toggles; loading, outage/retry, WebGL fallback; keyboard and 390-pixel layout; separate live-imagery test. Local dev `npm run dev` at http://127.0.0.1:5173; production preview `npm run build` then `npm run preview` at http://127.0.0.1:4173.
- Runtime check of Cesium's built-in `Ellipsoid.MARS` returned oblate radii (3396190, 3396190, 3376200), conflicting with online documentation's sphere description. Renderer now explicitly constructs the selected CTX source's spherical 3396190-metre model; uses it for globe, geographic tiling, projection, smooth terrain and camera conversions. Coordinate round-trip/east-positive longitude tests pass. No Earth basemap, Earth CRS or Earth distance functions are used.
- Source registry and limitations recorded in `docs/preview-sources.md`; live MOC and controlled CTX tiles verified. The combined imagery/terrain readiness item stays unchecked because measured terrain elevation remains unavailable, as agreed. No DEM, slope or alignment analysis has been implemented.

### 2026-11-11 — Milestone 1 local Jezero preview verified

- Implemented interactive Jezero/global Mars reference views, credential-free NASA imagery, separate layer toggles, responsive explorer/map/details panels, list selection, source links, scientific goal `null`, base unset, walking-crew emphasis, session-only optional support preferences without capabilities, and disabled comparison with reasons. Added loading, imagery failure/retry, unavailable layers, keyboard map controls and list-based WebGL fallback. No routes, distances, slopes, scoring or base/sample markers are rendered.
- Sample records verified against NASA: Skinner Ridge/Swift Run, Wildcat Ridge/Hazeltop, Amalik/Shuyak; extra samples are source-linked, with user-approved Mageik sol sealed 619. Dates/sols are explicitly labeled “sealed”; no invented scientific measurements. All positions remain null. The combined stop-coordinate verification item remains unchecked until exact sample coordinates are verified; its list-only placement restriction is implemented.
- Reproducibility/final checks: `npm ci` passed from the lockfile; `npm run build` passed TypeScript and the production build; `npm run lint` passed; `npm run format:check` passed; `npm audit` reported zero vulnerabilities. npm 12 warned that the esbuild postinstall script was blocked; the installed platform binary worked and the clean-install build succeeded.
- `npx playwright install chromium` succeeded using Playwright's Ubuntu fallback browser build on this OS. `npm test`: 8 passed, 1 intentionally skipped live-network test. Covers scientific state constraints, source sphere/east-positive coordinates including the longitude seam, stop selection, layers/support settings, keyboard controls, 390-pixel layout with no horizontal overflow, unsupported WebGL/retry, imagery outage/recovery, and pending imagery requests. Tests intercept imagery with a synthetic fixture and do not constitute remote imagery verification.
- Separate `npm run test:live`: 1 passed with real NASA tiles, both regional/global view navigation and no uncaught browser errors. Refreshed screenshot capture after resetting page scroll; final live rerun passed. Captured and visually inspected `docs/preview-desktop.png` and `docs/preview-mobile.png`. Actual delta imagery, list/panel selection, narrow layout and source credits are visible.
- Early checks found two TypeScript optional-object errors, a Cesium error overlay obstructing retry, and a stale indexed retry locator in the test. Fixed all three issues; subsequent build and all 8 interaction/data tests passed.
- Local startup: default `npm run dev` correctly stopped because port 5173 was occupied. Started `npm run dev -- --port 5174`, serving only http://127.0.0.1:5174/. Left the existing process on 5173 untouched. Production `npm run preview` on 4173 was exercised by the browser suite. README documents installation, startup, build, checks, source limitations and layout.
- Limitations: measured terrain elevation remains unavailable; the combined imagery/terrain readiness item remains unchecked. Exact sample positions, scientific goal, base, equipment/capabilities, budgets, work time, scoring and human routes remain undecided/unverified. Later checklist sections remain unchecked. Imagery requires internet access and may fail upstream. Cesium's lazy-loaded renderer chunk is about 4.23 MB minified / 1.14 MB gzip, producing a build size warning; performance tuning is outside this bounded milestone. Tested in Chromium with software WebGL, not hardware GPU/Firefox or every assistive technology.
- Timing: this is explicitly recorded pre-event work begun at the user's direction; no submission eligibility is claimed. No credentials, cloud resources, deployment or paid services were added. DOCX unchanged. No Git commit created.

- Final dev smoke check: a Playwright-driven Chromium session opened http://127.0.0.1:5174/, waited for live CTX imagery, selected Amalik and verified its information panel. Passed. Captured request hosts were only `127.0.0.1` and `trek.nasa.gov`; no ion/Earth-provider request occurred.
- Final tracker validation: section 0 has 5/6 checked, section 1 has 11/12 checked, and all later sections remain unchecked. Python verified these counts and no trailing whitespace in new source/tooling/docs. `git diff --check` passed and `git diff --exit-code -- 'Space Apps.docx'` confirmed the tracked DOCX is unchanged.
