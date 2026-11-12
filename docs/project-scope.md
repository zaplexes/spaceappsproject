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
