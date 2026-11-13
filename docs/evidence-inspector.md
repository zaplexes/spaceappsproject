# Inspect the evidence

Implemented for the guide's third step after the user confirmed that meaning of “part 3.” This workspace reviews the app's retained sources; it does not perform new archive discovery or introduce new scientific measurements.

## Workflow

Select a catalogue feature, a calculator result or a Jezero science stop. Choose **Inspect the evidence** in the three-step guide, or **Inspect this destination’s evidence** in the selected-destination panel. The workspace below the map updates to that target. With no selection, it offers links to the calculator and science-stop list.

The workspace separates:

- **Documented facts:** source-linked catalogue metadata or the approved sample record. Published catalogue size and type are separate from measured scientific value, water evidence or composition.
- **Missing evidence:** observation-site precision, verified access, numeric site elevation, validated slope, route, mineral measurements and mission-specific measurement capability.
- **Context products:** imagery, terrain, geological interpretations, linked rover observations and catalogue provenance. Expand each product for scale/detail, dates, source, review citation, coordinate context and limitations. Review timestamps are not observation dates.

Jezero stops retain their mode-specific proposed investigation, single surface-reference photograph with retry, acquisition/sealing distinction and PDS position review. These components moved from the narrow selected-destination panel into the evidence workspace. Catalogue features receive no rover photograph or sample association merely because a stop is nearby, even when the feature is Jezero crater itself.

Use the section links to jump between documented observations, imagery/maps and missing evidence on a narrow screen. Metadata, photographs and source reviews remain available without WebGL.

## Coverage and map actions

`src/evidence/evidence.ts` classifies existing registry products at the **selected reference point**, independent of camera position or zoom. Catalogue features use their published centre; Jezero stops use the explicitly unverified display reference, whose convention and accuracy remain unresolved. Results are conditional metadata comparisons, not location validation.

- **Inside source envelope:** the reference degrees fall within the retained bounding envelope. This does not guarantee valid pixels, precise alignment, whole-feature coverage, geological unit membership or local obstacles.
- **Outside source envelope:** the product is listed separately and offers no map-view action from this context.
- **Geographic coverage unknown:** missing or invalid bounds/position remain unknown.
- **Linked sample reference:** rover evidence is linked by the exact sample stop ID, independent of geographic proximity. Its footprint remains unverified.

Point checks include envelope edges, longitude-seam extents and equivalent ±180° longitude. Invalid/missing positions and bounds do not become envelope matches. Envelope matching never alters source eligibility or calculator points.

**View layer on map** uses the existing map controls and refocuses the selected reference. Imagery actions isolate the requested imagery with coarse base context; global colour and local elevation/geology/slope actions preserve mutually exclusive colour overlays. Selecting global CTX sets its existing manual override. Map loading/failure/coverage labels and source warnings continue to apply. The action does not extract a height, slope or geology measurement and does not assert that a provider is currently available.

## Verification

Run `npm run build`, `npm run lint`, `npm run format:check` and `npm test`. Dedicated checks in `tests/evidence-inspector.spec.ts` cover envelope boundaries/seams/unknowns, exact rover associations, unchanged source eligibility, empty and selected states, target changes, source links, overlay actions, mobile section navigation, mode-specific plans and WebGL fallback. Existing sample image/error/retry and position-evidence tests continue to apply.

Screenshots: [desktop](evidence-inspector-desktop.png), [mobile without WebGL](evidence-inspector-mobile.png). Deterministic browser tests use mocked orbital imagery.

Verified locally: build, lint, formatting and diff checks pass. Full browser suite: **69 passed, 1 intentionally skipped live-imagery check**. Existing Cesium bundle-size warning remains. No remote publication was performed.
