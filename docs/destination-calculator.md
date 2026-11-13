# Destination calculator

Accepted November 12, 2026: the user requested a selectable astronaut base, the top ten destinations ranked by value rather than proximity, and reasons/points for each criterion. The user approved adjustable starting weights: study potential 50, distance 30, terrain 20, feature-type study heuristics, and unknown-terrain score ranges.

## Use

Set a simulated base by clicking **Place base on map**, then the Mars surface, or expand **Enter coordinates instead** to enter planetocentric latitude and east-positive longitude in the range −180 to 180. Map clicks outside placement mode leave the base unchanged; sky clicks do nothing. A cyan marker identifies the simulated base. Coordinate entry and ranking also work without WebGL.

Open **Calculate best destinations · Top 10** directly in the explorer panel, or choose **Compare destinations** in the three-step guide. The calculator and **Discover Mars features** share one version-checked IAU/USGS index, loaded only when either control is opened. Its radius and feature-type filters operate independently of the alphabetical browser filters. The initial 100 km radius is an editable discovery setting, not a travel capability. Results recalculate when base, radius, types, weights or interests change. Selecting a result loads its validated details and map highlight using the existing abortable catalogue workflow. Compact result cards show score ranges and distance. Expand **Why this score?** for criterion points and source links; expand **Scoring rules & preferences → Study interest by feature type** to adjust type interests. Methodology and version details remain available under **How suggestions work & data sources**.

## Model `feature-value-v1`

All scores express simulation preferences. Weights must be nonnegative and total 100; type interest must lie between 0 and 100. Empty, invalid or incomplete inputs suppress results rather than retaining an old recommendation.

- **Study points:** study weight × type interest / 100. Starting type interests are valleys 100, chaos 90, chasms 80, craters 70, plains/cavities/labyrinths 60, other types 40. These are editable priorities for questions relevant to the ancient-water theme, not evidence that an individual feature contains water, sediments, minerals or accessible study sites. Name-origin text never supplies scientific evidence. Feature size is not equated with science value.
- **Distance points:** distance weight × max(0, 1 − distance / radius). The haversine distance uses the same 3,396,190 m reference sphere as the map. The radius boundary is inclusive. Distances are to catalogue centres; twice the one-way surface distance is only a round-trip lower bound.
- **Terrain points:** unknown. The retained slope product is exploratory and explicitly analysis-ineligible. No global numeric slope grid, validated obstacle map or route corridor is available. Bounding-box coverage and relief colours cannot supply easy-terrain points. Results retain a null terrain component and display its entire unresolved interval, from zero to the terrain weight.

Sort by earned study + distance points, then shorter distance and catalogue ID for reproducible ties. Show up to ten candidates, including fewer or zero when appropriate. Display the earned-to-possible score range for each. A result with the highest earned score is a **provisional recommendation**; warn when another candidate's range could exceed its earned score. The catalogue checksum and model version identify the inputs. Base and preference changes last for the page session; reloading resets them.

The calculator expands global discovery with heuristic suggestions. It does not change any dataset's analysis eligibility or verify Jezero sample locations. Mission equipment, duration, work times, return reserves and actual range remain unconfigured. Selection cannot prove route feasibility, safe access or a scientifically best destination. The round-trip planner accepts optional user-defined mission assumptions separately; no terrain-aware eligibility is inferred. See [trip planning](trip-planning.md).

## Implementation and validation

`src/planning/` contains the base controls, pure ranking model and destination interface. `CatalogBrowser` shares its validated index and detail-selection flow. `MarsMap` passes explicit placement clicks to application state and retains the marker across map retries.

Run `npm run build`, `npm run lint` and `npm test -- tests/feature-calculator.spec.ts tests/catalog-browser.spec.ts tests/mission.spec.ts`. The calculator checks cover Mars geometry, scoring sensitivity, reproducible ties, radius boundaries, invalid input, missing terrain, top-ten interaction, source/detail links, map placement, session reset, and mobile operation without WebGL.

Verified locally: build, lint and repository formatting pass; all 13 calculator/catalogue/mission checks pass. Vite retains the existing Cesium bundle-size warning. Screenshots: [desktop](calculator-desktop.png), [mobile without WebGL](calculator-mobile.png). No remote publication was performed.
