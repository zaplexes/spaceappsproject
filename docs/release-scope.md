# Release scope and infrastructure decision

Decision recorded November 12, 2026: the user requested the entire checklist be addressed, with distance estimates by default and user-defined optional mission settings. The user explicitly chose local saving and exports and deferred accounts/backend. Historical MEDA observations are included. The user will complete the competition submission.

## Current architecture

Retain React/TypeScript/Cesium and static GitHub Pages hosting. Browser-local draft storage, JSON import/export and printing meet the requested persistence and sharing needs without a database, authenticated API, job server, object-store account or private credentials. Scientific processing remains a bounded local Python workflow using pinned dependencies and hashed raw inputs. No additional runtime service or spending is introduced.

Backend APIs, SQL, database migrations/indexes, account authorization, async-job cancellation and private-network server management are **deferred by agreement**, not unfinished prerequisites for this release. Revisit them only for an explicit multi-user synchronization or remote processing requirement. No hypothetical accounts, cloud region or budget is selected on the user's behalf.

## Safeguards and operations

Import validation caps file size, stop count and text sizes, constrains versions and coordinates, preserves unknowns and permits only HTTPS source links. Inputs do not become executable HTML, SQL, shell commands or remote fetch URLs. Numeric context files verify SHA-256 before use. Catalogue details still come from reviewed local assets; localStorage failure has a recoverable message and export remains available. No plan or equipment notes are sent to a service. Clearing browser/site data can delete drafts: export backups explicitly.

The current map renders only a selected discovery highlight and up to twelve route stops/segments. Catalogue search retains an index with paginated details; visible-area filtering works across the longitude seam. Marker clustering is unnecessary for this rendering approach because the entire index is never rendered as entities. There is no claim of archive-wide unnamed-crater completeness. Larger datasets still require measured device-specific performance review before widening these bounds.

GitHub Actions uses scoped Pages permissions, immutable action revisions, fixed dependency installation, source-integrity checks, formatting/lint and a repository-prefix hosting smoke check. Development/preview and the Pages prefix are separate configurations; `.env.example` contains no secret. Use a local build for pre-release verification; a separately provisioned staging service is outside this static release. GitHub Pages supplies hosting/HTTPS; its current public deployment must be checked independently. No API/process health checks, server restarts, SQL controls, database backup retention or cloud-spend caps apply to nonexistent services.

## Backup and recovery

The user-plan recovery path is validated export/import; browser-only drafts have no guaranteed retention. Automated tests exercise saving/reloading and JSON restoration, invalid-file rejection and storage-blocked behavior. Keep exported copies outside the browser for durable backup. Source, manifests and lockfiles remain in version control. Bulk rasters remain locally ignored; they can be re-downloaded only while identical reviewed upstream bytes remain available. There is no guaranteed independently backed-up scientific archive. See [operations](operations.md) for publishing and rollback.

## Evidence blockers

- Exact sample drill coordinates remain unverified; candidate locations stay explicitly approximate.
- Terrain source registration, physical inclination validation and areoid/radius conversion remain unverified. Numeric context does not qualify data for ranking or hazard-aware routing.
- Global numeric slope/obstacles, direct mineral measurements, continuous cost-grid routing and certified safety remain unavailable.
- Full per-product upstream metadata (dates, releases, valid-pixel footprints and accuracy) is not always published; no placeholder fact substitutes for it.
- 3D relief cannot be completed by treating areoid elevations as radial displacements. An appropriate reviewed radius product or conversion plus tiling is still required.

These scientific requirements remain unchecked. Distance estimates, user preferences and tests cannot resolve them.


## Public deployment observation

During this pass, a direct HTTPS request to the public Pages URL returned HTTP 200. Its deployed entry points referenced `index-CxxepqiR.js` and `index-DoQAtLbi.css`; the downloaded JavaScript still contained the older standalone Mission settings and no current round-trip planner. Availability of that older release does not verify this workspace. No source commit, push or deployment was performed. Publish the reviewed workspace and rerun the public-site acceptance checks to close the release item.
