# Martian Map operations and recovery

Scope: the current static frontend and local scientific processing. GitHub Pages serves a compiled `dist/` artifact; NASA Trek supplies remote orbital tiles. No application API, database, accounts, background workers or private server are currently implemented. Maintenance ownership remains an open [team decision](team-decisions.md).

## Prepare and verify a release

Use Node from `.nvmrc`, the committed npm lockfile and Python 3 for the data-integrity gate. The optional terrain/geology environments are only required when rebuilding scientific display products.

```sh
npm ci
npm run check:data
npm run lint
npm run format:check
npm run build
npm test
npm run test:live
npm run test:pages
```

The ordinary tests use intercepted orbital tiles. `test:live` checks real NASA responses separately. `test:pages` rebuilds for `/spaceappsproject/` and tests the configured URL prefix; restore the ordinary root build with `npm run build` afterward if using the local root preview. The Pages smoke check covers the globe, local photographs, all three derived displays, the selected candidate highlight and Cesium runtime assets.

The Pages workflow runs the retained-data gate before compiling. Only `dist/` is uploaded. Retain source/manifests/lockfiles in version control; do not upload raw rasters, local environments, source documents or secrets as the website. Workflow execution and the public site must be verified separately after publishing. Follow [Pages setup](github-pages.md) for the external account settings and recorded Git-credential blocker.

For the public site, inspect the browser console and network panel and exercise these actions:

1. Open Jezero and the Mars globe; verify imagery and source credits.
2. Select each stop; check its approximate/unverified highlight, warning, source link and photograph.
3. Toggle HiRISE and CTX; inspect service-extent and loading/failure messages.
4. Enable elevation, geology and estimated slope in turn; check their distinct legends and source limitations.
5. Open Discover Mars features, search for Gale, select it and add/remove a candidate. Check the catalogue-centre label and source; verify the snapshot retrieval time.
6. Check a narrow viewport and keyboard selection. Confirm that the ancient-water goal is selected, all three exploration modes are available and comparison remains unavailable while operational inputs are undecided.

Record the deployed source commit, Actions result, checked URL, verification date and remaining limitations in the implementation checklist. A local passing build alone does not complete public-release verification.

## Triage failures

| Symptom | Check and response |
| --- | --- |
| Blank site or `/src/main.tsx` request | Check that Pages uses GitHub Actions and the Vite workflow publishes compiled `dist/`, rather than the source branch root. |
| Bundles, photographs, overlays or Cesium workers return 404 | Check the deployed repository prefix and `MARTIAN_MAP_BASE_PATH`. Reproduce with `npm run test:pages`; do not change scientific manifest asset identities to repair hosting paths. |
| Orbital imagery is missing or blurred | Check NASA tile responses and viewport extent. Allow refinement after camera movement. Retry the failed layer, toggle HiRISE off to inspect underlying CTX/global context, and retain credits/coverage limitations. The source registry and local photographs/displays remain available after the app loads. |
| A local overlay fails | Retry it, check its asset URL and run `npm run check:data`. Restore/rebuild the reviewed asset if its checksum differs. |
| Map is unavailable | Inspect WebGL support, console errors and graphics-context loss. Use Retry map or the list/evidence fallback. The current verified browser is Chromium/software WebGL; other graphics configurations may need investigation. |
| An approximate highlight appears unexpected | Inspect the linked dossier and the recorded display assumption. Exact position, latitude convention and accuracy remain unverified. Do not move it by eye or turn an approximate reference into a verified analysis coordinate. |
| A scientific check fails after a source refresh | Stop release preparation. Compare the reviewed source identity, metadata and output; investigate rather than merely replacing the expected hash. |
| GitHub rejects a workflow push or deployment | Review the specific credential/environment/Pages permission error using the hosting guide. Correct it locally through the account owner; never put a token in source, logs or chat. |

There is no packaged offline orbital-imagery mode. For an upstream outage, use the local evidence and displays and clearly identify which imagery is unavailable. Retained screenshots can illustrate the previously checked view, but must be identified as screenshots. No automatic incident monitoring or recovery guarantee is configured.

## Refresh scientific products

Preserve old reviewed manifests before replacing a product. Record the source URL, actual bytes/hash, release/date when established, rights, coordinate conventions, spatial envelope, detail and unknowns. Source-service protocol versions and catalog timestamps are not scientific release versions or observation dates.

- Imagery: retain exact catalog/capabilities snapshots, review identity/CRS/tiling/extent and test actual tiles. Update `imagery-review.json` only after that review. Raw catalog snapshots are excluded from formatting.
- Elevation and slope: use [terrain setup](terrain-processing.md) and [slope processing](slope-processing.md). Verify input bytes and units, rebuild affected outputs and run the terrain tests. Regenerate slope whenever its source DEM changes.
- Geology: follow [geology processing](geology-processing.md), including excluded geometry, source attribute conflicts and alignment warnings.
- Stops and photographs: follow [stop evidence](stop-evidence.md). Keep image acquisition, sample sealing and candidate position claims distinct. Exact target verification requires new scientific evidence, not a UI status edit.

Run the relevant pipeline tests, local integrity gate, build and affected browser checks. Refresh screenshots for visible changes. Update the registry, limitations and checklist together. Reproducible outputs do not independently prove alignment, location precision or analysis suitability.

## Roll back and recover

Identify the failed release's source commit and the last verified release through Git history and Actions. Reproduce the earlier source state in a separate checkout, install from its lockfile, run its data/build/hosting checks and compare its manifests. For an agreed rollback, create a focused revert through the normal version-control workflow, review it and deploy it through Pages. Retain the current source history; avoid resetting a shared branch or hand-editing a published bundle.

Code, local assets and their scientific manifests must be recovered as one compatible release. The workflow's short-lived uploaded artifact is not a durable backup. Bulk scientific inputs remain outside Git and can be recovered from reviewed URLs only if the same bytes remain available; checksums detect changes but do not restore lost upstream data. A versioned bulk-data backup, retention policy and restore exercise are still pending team/infrastructure decisions. There is currently no database or saved user-plan state to restore.

After rollback or recovery, repeat the public-site checks above and record the outcome and limitations. Backup and production recovery checklist items remain incomplete until the team defines and tests the required guarantees.

## Catalogue publication

Pages runs `npm run refresh:catalog` before integrity checks/build. Failed downloads or invalid imports stop publication; the already published snapshot remains available. Use [catalogue refresh and reproduction](crater-catalogue.md) for the commands, retained export and known metadata inconsistencies. A failed catalogue request has its own retry and does not disable the original Jezero evidence. Refreshes are release snapshots, not live browser queries.

## Global feature layers

Verify global CTX, optional THEMIS infrared, global relief and geology at Gale, then a polar view to inspect partial/outside coverage. Check that Jezero local layers retain their names/extents and that returning to Jezero updates the slope gap. Global failures have layer-specific Retry controls; original stop evidence remains available. Refresh these curated products through the [feature-layer source workflow](feature-map-layers.md), independently of the automatic named-feature catalogue refresh. All new services use public endpoints without credentials.
