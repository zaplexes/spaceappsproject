# Marsway — Technical Architecture Brief

**Current direction — November 13, 2026:** Help astronauts choose the next destination on Mars. Feature types start with equal 50% study interest and user-adjustable priorities. Jezero investigations are optional examples. This supersedes earlier ancient-water mission and Jezero-only scope decisions below; see [current scope](project-scope.md).


Status: proposed full architecture for team review. A local React + TypeScript + CesiumJS frontend preview, source-linked NASA surface references/PDS position review, and local elevation-colour/regional-geology pipelines are now implemented, along with controlled HiRISE imagery and an exploratory estimated-slope display; see `implementation-checklist.md` for verified scope. Mars-wide named-feature discovery, filters and session-only candidate additions are implemented through a retained IAU/USGS export, refreshed during the static Pages build. No backend, cloud resources, scoring formula or verified deployment has been implemented. Destination selection is the goal; walking, crewed-vehicle and robotic ground-rover modes are implemented with unconfigured capabilities.

Accepted direction: Mars-wide destination comparison, source evidence and round-trip planning. Jezero provides detailed example science stops and local terrain context. Reviewed global CTX, THEMIS, MOLA/HRSC colour hillshade and global geology are available through feature-aware controls with viewport coverage labels; global slope and numerical global heights remain unavailable. Destination selection is the goal; walking, crewed-vehicle and robotic ground-rover modes are implemented with unconfigured capabilities.

Based on `Space Apps.docx` and the discussion. The service endpoints and full system modules below are proposals. The current catalogue uses static search/region files and requires no application server; see [catalogue implementation](crater-catalogue.md).

## System architecture

Proposed service boundaries and the path from scientific sources to the browser.

### Browser application

React + TypeScript + CesiumJS proposed. Global discovery leads into a detailed Jezero Marswalk. Local layers, science stops, round-trip planning and a field view are central. The selected goal helps astronauts choose their next destination.

### Static hosting / CDN

Serve compiled frontend assets through HTTPS. Browser requests imagery and 3D tiles directly from approved providers or object storage. Keep bulk tile traffic away from the API process.

### Application API

Python + FastAPI proposed. Validate requests, search the catalog, return evidence, apply mission constraints and calculate lightweight rankings. Publish a versioned OpenAPI contract.

### Spatial database

PostgreSQL + PostGIS proposed. Store crater records, footprints, scientific observations, dataset versions and analysis results. Use spatial indexes and explicit Mars coordinate reference systems.

### Processing jobs

Python + GDAL proposed. Import source data and precompute regional terrain features. Use a separate batch process for heavy raster work; persistent queued jobs can be added when interactive routing needs them.

### Scientific assets

Versioned object storage for raw snapshots, derived rasters and display tiles. NASA / USGS / PDS are source systems, not databases we assume are always reachable. Cesium ion is an optional visual terrain provider.

## Frontend & API contracts

Responsive globe navigation with explicit request boundaries and empty states.

### Frontend modules

GlobeView: global discovery and local Jezero view. MissionPanel: base, crew profile, limits and goal. LayersPanel: imagery, terrain and geology. StopPanel: tasks and evidence. FieldView: numbered stops, route and checklist.

### State and accessibility

Walking astronauts are the initial mode; crewed vehicles and robotic ground rovers are selectable alternatives. Destination selection is the goal. Keep map, mission and cached-data state separate. Support keyboard navigation, stale-request cancellation and explicit loading/error states.

### Catalog endpoints — proposed

GET /v1/craters for bounded global search; GET /v1/craters/{id} for context; GET /v1/regions/jezero/stops for local science stops; GET /v1/layers for coverage and provenance. Support bbox filters and cursor pagination.

### Analysis endpoints — proposed

POST /v1/rankings compares local stops using base, goal_id, crew/support profile and limits. Return component scores, planned science tasks, explanations and versions. Missing goal blocks ranking but not browsing. No global traversability claim.

### Route jobs — later extension

POST /v1/routes creates a bounded analysis job and returns 202 + job_id. GET /v1/jobs/{id} reports progress; GET /v1/routes/{id} returns completed results. Define timeouts, cancellation, expiry and retry-safe submission IDs.

### Browser performance

Cluster or tile markers at low zoom and fetch details on demand. Debounce searches, cache immutable assets and preserve attribution. Provide a list-based fallback when WebGL is unavailable. Do not download the full catalog into every browser.

## Scientific data pipeline

Discover → snapshot → validate → normalize → derive → review → publish.

### Source registry and ingestion

Select specific products from multiple NASA missions for Jezero: candidate sources include MRO imagery, MGS topography and Perseverance observations. Verify coverage and alignment. Record product IDs, citations, timestamps, licenses and checksums.

### Planetary coordinate handling

Record body, CRS, latitude type, longitude direction/range, height datum and units for each product. Normalize explicitly; handle the longitude seam and poles. Do not label Mars positions EPSG:4326 or use Earth distances by default.

### Raster processing

Retain original DEM and imagery. Produce validated analysis rasters and separate display tiles. GDAL COG is a proposed storage format; COG is not a ready-to-use Cesium terrain tileset. Derive slope only with verified horizontal and vertical units.

### Core data entities

craters/regions: discovery context. stops: verified coordinates, science tasks, tools and work time. datasets/observations: provenance, resolution and values. excursions: base, ordered stops and return. runs: input, model and dataset versions.

### Coverage and quality gates

Check duplicates, units, coordinate transforms, nodata, raster alignment and valid geometry. Treat footprints and pixel resolution as eligibility inputs. Sample-level coordinates remain pending until verified; a rover location is not automatically a drill location.

### Serving and refresh

Publish reviewed dataset versions atomically. Store large rasters outside database rows; index footprints and metadata in PostGIS. Serve prebuilt display tiles via storage/CDN. Refresh deliberately, retaining old versions for reproducible rankings and rollback.

## Ranking & route analysis

An explainable decision-support model; destination selection is the goal and scoring weights remain open.

### Required mission inputs

Jezero base, selected goal, walking crew profile, optional vehicle/robot support, time/range budget and return reserve. Include carried equipment, science work time and crew configuration. All capabilities are versioned assumptions awaiting agreement.

### Candidate filtering

Rank reachable science stops within verified Jezero coverage, not distant crater centers. Stops may be outcrops, deposits or viewpoints. Verify coordinates before placement. Exclude stops outside round-trip limits or without required approach data.

### Separate score components

Science value: evidence relevant to the chosen goal. Travel cost: route length, time and elevation change. Terrain difficulty: mapped slopes and obstacles. Data confidence: coverage and resolution; show it separately, not as a probability of safety.

### Priority model — not yet defined

Normalize comparable features with fixed documented bounds. Version weights and feature definitions. Show each contribution and exclusion. Do not choose weights, thresholds or goals silently. Missing data stays unknown and must not improve a score.

### Route engine — staged scope

Marswalk planning includes base-to-stops-to-base travel, stop work time, terrain concerns and assumptions. Use clearly labeled distance estimates first; bounded grid routing comes later. Field view shows numbered stops, science tasks and reference imagery.

### Scientific validation

Check known examples, projection math, nodata behavior and budget exclusions. Test whether rankings change sensibly with goals and profiles. Evaluate sensitivity to weights and data resolution. No hazard probability, validated human route or certified safety rating is claimed.

## Hosting & server management

A small managed deployment first, with explicit responsibilities and cost controls.

### Proposed deployment topology

Static frontend on a CDN; API in a managed Linux container; managed PostgreSQL/PostGIS; object storage for assets. Run imports as separate batch jobs. Add a dedicated worker and durable queue only when long-running route workloads justify them.

### Runtime management

Pin dependencies and build immutable images. Configure process startup, health checks, restart policy and graceful shutdown. Size API concurrency around memory and database connections. Offload CPU-heavy terrain work so it cannot block catalog requests.

### Environment and networking

Separate local development, staging and production configuration. Keep database private with least-privilege credentials. Use managed TLS termination and explicit allowed origins. Record provider, region, domain, monthly budget and ownership as team decisions.

### Monitoring and incident handling

Capture structured logs with request/job IDs and dataset/model versions. Track API errors, latency, job failures, queue depth, storage and database health. Alert on persistent failures. Keep a short runbook: triage, pause jobs, rollback and restore.

### Backups and recovery

Schedule database backups and define retention plus recovery targets with the team. Test restoring into an isolated environment. Version scientific assets; keep rebuild scripts and source checksums. Persist jobs and state outside ephemeral container filesystems.

### Capacity and cost management

Cap query area, candidate count, raster resolution, job runtime and concurrent jobs. Use cache keys containing mission and dataset versions. Watch database, storage, bandwidth and imagery-provider quotas. Keep a small precomputed demo dataset for upstream outages.

## Security, delivery & open decisions

Development ownership, verification, release flow and handoff.

### Security boundaries

Keep source-access credentials and database passwords on the server. Any browser imagery token must be deliberately public, scoped and origin-restricted where supported. Use parameterized SQL, request size limits and an allowlist for remotely fetched source URLs.

### Identity and saved work

Default proposal: anonymous browsing with browser-local mission drafts and JSON export. Shared plans/accounts are optional, not assumed. If added, enforce server-side authorization on every saved object. Authenticate ingestion and administrative operations.

### Repository and local setup

Proposed layout: frontend/, backend/, pipelines/, data/manifests/, infra/, tests/ and docs/. Commit schema migrations, example environment variables and lockfiles. Keep raw scientific data, credentials and generated bulk assets out of Git.

### Checks and release pipeline

Pull request → build frontend → backend tests → scientific-data checks → staging → smoke test → release. Test mission validation, coordinate transforms, score invariants, source provenance and job failures. Store immutable artifacts and support code plus schema rollback plans.

### Phased delivery

1: verify Jezero sources and stops; destination selection is agreed. 2: build local layered map and evidence panels. 3: compare stops and review a round-trip excursion. 4: add field view and global discovery. No application or infrastructure is deployed.

### Decisions awaiting the team

Accepted: Jezero Marswalk centerpiece; global crater discovery supports it. Still open: scoring weights, exact base and stops, crew/vehicle/rover capabilities, any additional infrastructure budget and accounts. Ask before implementation that depends on these choices.

## Architecture connections

Browser → CDN for the frontend; browser → API for metadata and analysis; browser → approved imagery providers for visualization. API → spatial database and asset metadata. Batch jobs → NASA/USGS/PDS sources → object storage and reviewed database versions. Optional routing queue → worker → stored results → API.

## References

- [Cesium Mars: imagery, terrain and attribution](https://cesium.com/platform/cesium-ion/content/cesium-mars/)
- [FastAPI container deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [PostGIS distance units and CRS behavior](https://postgis.net/docs/ST_DWithin.html)
- [GDAL Cloud Optimized GeoTIFF driver](https://gdal.org/en/stable/drivers/raster/cog.html)
- [NASA scientific objectives](https://science.nasa.gov/planetary-science/programs/mars-exploration/mars-science-objectives/)
- [USGS Jezero regional geologic map](https://www.usgs.gov/maps/geologic-map-jezero-crater-and-nili-planum-region-mars)

## Competition timing

The November 5, 2026 organizer clarification permits pre-event research and resource review, while project work begins at the official hackathon start. Confirm treatment of pre-event design artifacts with the organizer before using them in the submission.

Source: https://github.com/nasa/spaceapps/discussions/1827

Current static implementation: [feature map layers](feature-map-layers.md) connect four public services with retained metadata, source legends and failure/coverage states. This is a curated visual layer registry rather than the proposed analysis API or global image-archive search.
