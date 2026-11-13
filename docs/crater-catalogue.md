# Mars feature catalogue

**Current direction — November 13, 2026:** Help astronauts choose the next destination on Mars. Feature types start with equal 50% study interest and user-adjustable priorities. Jezero investigations are optional examples. This supersedes earlier ancient-water mission and Jezero-only scope decisions below; see [current scope](project-scope.md).


The user selected Mars-wide discovery with region filters and a catalogue refreshed during publishing, using existing GitHub Pages hosting. No backend, account, API key or paid service is introduced.

## Use the catalogue

1. Open **Discover Mars features** beneath **Candidate science stops** in the explorer panel.
2. Search by name and choose a **Catalogue region** and **Feature type**. Craters are the initial type; choose another type or all types for mountains, valleys and other named features. Search ignores accents. Results are paginated in groups of eight.
3. Select a result to open its official catalogue details and centre the map on its published reference position.
4. Choose **Add candidate science stop**. It joins the candidate list, can be selected again and can be removed. Additions last for the current page session; reloading clears them.

The initial retained snapshot has **2,054 unique IAU-adopted features, including 1,242 named craters**, assigned to 30 source map quadrangles plus six features without a quadrangle assignment. The export has 2,055 rows: one exactly duplicated Bohar record (IAU ID 16054) is collapsed and reported in the manifest. Conflicting duplicate IDs reject the import.

The region filter uses the source quadrangle assignment. **Jezero geology map extent** uses centre containment within the existing USGS geology envelope. Neither filter establishes footprint containment, approach access or detailed analysis coverage. The selected marker is the only catalogue marker rendered; viewport queries and marker clustering remain unimplemented.

## Source and scientific limits

- [USGS GIS exports](https://planetarynames.wr.usgs.gov/GIS_Downloads) link the official Mars centre-point KMZ. The downloads page describes nightly exports and planetocentric latitude with east longitude, and identifies the MDIM 2.1 control network.
- [Gazetteer field definitions](https://planetarynames.wr.usgs.gov/Page/Specifics) define feature centres, approximate diameter/longest dimension, map quadrangles and name origins. The feature's official numeric ID is retained in its source link.
- This is a catalogue of named features, not a complete impact-crater inventory. Unnamed craters, small hazards and dunes are not comprehensively represented.
- Feature centres are **discovery references**, not exact observation sites. They are shown on the existing 3,396,190-metre Mars display sphere. Source east longitude is preserved and wrapped to −180…180 for display; KML point and attribute coordinates must agree. Position accuracy and alignment remain unverified. Camera height uses the approximate feature dimension only to frame the view, with no uncertainty circle, terrain or accessibility inference.
- The source's zero dimensions become unknown. The name-origin text explains a name; it is not a scientific observation. No crater composition, age, water history, photograph or science ranking is invented.
- A new candidate has no selected observation site, scientific question, instruments, work time or verified approach. The three mode-specific outcrop investigations are optional Jezero examples within the destination-selection workflow. Global discovery does not enable global routing or rank added features against those outcrops.
- The archive contains legacy XML describing 2012 coverage, 1,690 points and weekly updates; its projection sidecar describes an oblate Mars ellipsoid while the XML describes a sphere. These inconsistencies are disclosed. The documented KML angular convention is used for display. No independent registration or analysis CRS is claimed. Retrieval time is not a scientific observation, source publication or formal release date.

The shared source registry now has fourteen products, including this catalogue. Each selected feature links its official source and exposes limitations and a download of the exact retained export. Every source remains ineligible for route/ranking analysis.

## Refresh and publish

Python 3 standard library only:

```sh
npm run refresh:catalog
npm run check:data
python3 -m unittest discover -s tests/catalog -v
npm run lint
npm run format:check
npm run build
npm test
npm run test:pages
```

The importer downloads only the fixed official HTTPS source, with a timeout and compressed/unpacked size limits. It validates the whole export before writing outputs, checks Mars identity, adopted names, IDs, coordinate range/finiteness and KML agreement, rejects conflicting duplicates and preserves unknown dimensions/regions. On invalid input it exits unsuccessfully without replacing the retained data. Files are individually replaced atomically; an interrupted multi-file import is detected by the integrity gate and must be rerun before release.

The Pages workflow runs the refresh before validation/build on each publication. An upstream failure stops the release; it does not silently publish a claimed fresh catalogue. A previously published site continues serving its existing snapshot. The refresh command can also be run locally before a reviewed commit/publication. Deployment credentials remain the pre-existing separate hosting issue; no push or deployment is performed by this implementation.

To reproduce a retained import without network access, take the source path and retrieval timestamp from `data/manifests/nomenclature-review.json`:

```sh
python3 pipelines/catalog/import_nomenclature.py --source assets/catalog/source-28857438f2b2.kmz --retrieved-at 2026-11-12T21:40:54Z
```

Use the manifest's actual retrieval timestamp to reproduce its exact metadata; the example timestamp above identifies the initial research download. Source bytes and derived JSON stay deterministic for a given snapshot, regardless of retrieval time.

`assets/catalog/` holds a lightweight search index, 31 regional detail files and the exact source export. Filenames contain the source hash. The browser fetches the index only when the catalogue is opened, and a region's details only on selection. The raw KMZ is fetched only by an explicit download. All requests use Vite's hosting prefix. Runtime schema/source-version checks reject invalid or mismatched records; timeouts, aborts and latest-selection checks prevent failed or old requests from overwriting a newer selection. Existing science records remain usable on failure or without WebGL.

`npm run check:data` rebuilds every derived catalogue file from the retained export and compares the manifest and bytes, in addition to the other scientific products. Generated JSON is excluded from formatting to preserve deterministic hashes. Older hash-named catalogue files are not deleted automatically; removal, if needed after a refresh, should be reviewed against the current manifest before publication.

Implementation: `pipelines/catalog/import_nomenclature.py`, `src/catalog/`, the shared candidate-highlight controller and `data/manifests/nomenclature-review.json`.

Review screenshots: [desktop browsing](catalogue-desktop.png), [mobile catalogue](catalogue-mobile.png) and [catalogue centre over live NASA imagery](catalogue-live.png).

The selected feature also opens [Mars-wide map layers](feature-map-layers.md), enables the reviewed global CTX mosaic and updates the explorer heading. Coverage follows the actual viewport; local Jezero products keep their own extents.
