# Martian Map — Agreed Project Direction

## Purpose

Help plan and review a simulated science expedition in Jezero crater by walking astronauts, astronauts in a crew vehicle or a robotic ground rover. The global Mars globe and crater catalog provide discovery and context; detailed excursion planning is regional.

## Agreed experience

1. Explore Mars and enter the detailed Jezero region.
2. Select a simulated local base and crew profile.
3. Inspect aligned imagery, terrain, and geological or mineralogical evidence.
4. Investigate ancient water in Jezero through a source-linked comparison of Skinner Ridge, Wildcat Ridge and Amalik. **This scientific goal is selected.**
5. Compare reachable local science stops using scientific value, travel difficulty, and data confidence.
6. Review a base-to-stops-to-base excursion, including travel, stop activities, equipment assumptions, and data gaps.
7. Open a field-use view with numbered stops, science tasks, and reference surface images. Any simulated position must be labeled.

Walking astronauts are the initial exploration mode. Crewed vehicles and robotic ground rovers are selectable alternatives; their detailed capabilities remain undecided. Local targets can be outcrops, deposits, or viewpoints rather than crater centers.

## Demonstration evidence

- Identify specific products from multiple NASA missions and explain what each contributes.
- Verify coverage, coordinate systems, resolution, and alignment before combining layers.
- Each stop should explain its scientific question, proposed observation or measurement, supporting evidence, and source.
- Skinner Ridge, Wildcat Ridge, and Amalik are candidate stops from `Space Apps.docx`; their coordinates and suitability still require verification.
- Show return travel and science work time. Keep historical rover tracks separate from hypothetical crew routes.
- Leave missing evidence unknown. Do not rank a route as feasible when required coverage is absent.

## Decisions still open

A global feature-value discovery calculator is now authorized separately: selectable simulated base, top ten, editable 50/30/20 study/distance/terrain weights, explicit study heuristics and unknown-terrain score ranges. See [destination calculator](destination-calculator.md). This is separate from terrain-aware excursion analysis.

Scoring features and weights; equipment and mobility assumptions; simulated base and supported analysis area. See [team decisions](team-decisions.md) for the current decision list. Exact stop locations remain a scientific verification task. Static GitHub Pages hosting and visibly unverified approximate selection highlights are approved.

## Scope boundaries

Catalog-wide browsing does not imply detailed analysis for every crater. Live environmental feeds, global routing, helmet HUDs, and accounts are not initial priorities. Route difficulty is a documented simulation assessment, not a certified safety rating.

## Documents

- `project-workflow.pdf`: visual user journey.
- `technical-architecture.pdf`: proposed technical architecture.
- `technical-brief.md`: editable technical detail and references.

This records the accepted direction and updates the briefs. The local React + TypeScript + CesiumJS preview is implemented; verified behavior and remaining work are tracked in `implementation-checklist.md`. Backend, hosting and analysis architecture remain proposals. `Space Apps.docx` remains unchanged.

See [mission science and exploration modes](mission-science.md) for the agreed goal, proposed stop activities and remaining analysis gates.

Mars-wide named-feature discovery with source region/type filters and session-only candidate additions is implemented from a retained IAU/USGS export, refreshed during Pages publication. Catalogue centres remain separate from verified observation sites. See [catalogue scope and limits](crater-catalogue.md).

The layer controls now apply to every browsed feature using reviewed global CTX, THEMIS, MOLA/HRSC relief and global geological context, with viewport coverage/gap labels and retained Jezero detail. A global slope grid, numeric global heights and highest-resolution archive-wide image discovery remain unavailable. See [feature layers](feature-map-layers.md).

The guide's third step opens a selected-destination evidence workspace with documented facts, explicit data gaps, existing context-product reviews and map actions. Jezero investigations, surface references and position evidence are integrated there. Coverage checks concern the selected display reference, not a verified site or the complete feature. No additional scientific measurements, source alignment, eligibility or global rover associations are inferred. See [evidence workspace](evidence-inspector.md).


## Current release decisions — November 12, 2026

The user authorized addressing the full checklist with distance estimates by default and optional user-defined mission settings. A working round-trip planner now handles base → ordered display references → base, user assumptions, task review, field photographs, explicit local draft storage, validated JSON export/import and printing. The calculator remains provisional; source alignment, exact sample coordinates, 3D relief and terrain-aware eligibility remain unresolved.

The user chose local saves and exports and explicitly deferred accounts/backend. Historical MEDA observations are included as dated local report summaries, with no forecast or route-eligibility use. The user will finish the official submission. See [release scope](release-scope.md), [trip planning](trip-planning.md) and [submission draft](submission-draft.md).
