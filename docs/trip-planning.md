# Round trips, mission assumptions and field plans

The planner starts in distance-only mode: set a simulated base, select a destination and choose **Add selected destination to trip**, or add the three Jezero references. Up to twelve distinct stops can be reordered or removed. The last leg always returns to the base. Dashed cyan map segments represent hypothetical shortest surface arcs, never a historical rover track or validated traverse.

Distances use the same 3,396,190 m sphere as the map and calculator. They are lower bounds between display references: exact sample drill points and catalogue observation sites remain unverified. No obstacle avoidance, walkability, vertical travel or safe return is inferred. Antipodal points have a defined distance but no unique shortest path; numerical terrain context omits such legs.

## Optional mission settings

Expand **Define mission settings (optional)**. Choose walking, crew vehicle or robotic rover and enter your own speed, available time, reserve, distance budget, slope preference, crew size and equipment notes. Nothing selects a scientific capability or default speed on your behalf. Mode changes update proposed Jezero tasks and clear their review progress. Equipment notes do not prove that an instrument can complete a task.

Work time is entered separately for each stop; blank means unknown and zero explicitly means no work time. Travel time is total distance / assumed speed. Scheduled time includes all stop work and the return leg. A time-budget check requires speed, every work duration, available time and an explicit return reserve. A distance-budget overrun can be reported independently. A budget that fits is arithmetic under your assumptions, not proof of terrain access, physical feasibility, energy sufficiency or safety. Slope preferences are retained but unenforced until a validated cost grid exists. Crew-vehicle dismount and energy/communication scheduling are not modeled.

## Numerical terrain context

The optional **Sampled terrain context** review uses 37,611 retained samples from the checksum-pinned CTX DEM. Every eighth source pixel is retained, beginning at row/column 4, at 160 m spacing in the source projection. Heights are rounded to 0.1 m and exploratory Horn gradients to 0.01 degree. Runtime sampling uses the nearest retained centre; each shortest arc has 33 sample positions. No interpolation, continuous corridor checks, slope eligibility or ascent total is implied.

Heights remain relative to the source Mars areoid, not radius above the renderer sphere. Independent registration and height-datum conversion remain unresolved. The interface reports covered sample counts and missing samples, plus sampled elevation range/maximum exploratory gradient where present. These values do not change calculator scores or route eligibility. The sparse grid loads only when a base and stops exist, verifies SHA-256 before use and offers retry on failure.

Rebuild with:

```sh
.venv-terrain/bin/python -m pipelines.terrain.build_context
npm run check:data
```

The pipeline reuses `data/raw/` and the terrain environment documented in [terrain processing](terrain-processing.md). It checks original source bytes before retaining values. The generated grid and manifest are committed; bulk rasters remain ignored.

## Drafts, export and field view

**Save local draft** validates and saves one draft in browser localStorage; **Load saved draft** restores it, including base, order, assumptions, work times and checklist progress. Saving is explicit; reloading starts a fresh visible plan until you load a saved draft. **Delete saved draft** removes only the browser copy, leaving the displayed trip untouched. Storage-blocked browsers can still export.

**Export plan JSON** produces a versioned `round-trip-v1` file containing inputs, calculated lower bounds and limitations. **Import plan JSON** accepts at most 1 MB and twelve unique stops, rejects invalid coordinates, versions, task lists, numbers and non-HTTPS source links, and preserves the current plan on failure. Importing a plan does not verify its scientific claims or observation locations. Imported text is rendered as text, never HTML.

Open **field view** for numbered stops, source links, task-review checkboxes and locally retained Jezero surface photographs with credits. The positions and tasks are simulated and proposed; checkmarks record user review progress, not completed Mars fieldwork. **Print field plan** opens the browser print dialog; save as PDF if desired. Printed plans include the base, assumptions, time/distance summary, references, limitations and field images. There is no GPS or live location claim. Export files are backups; no account or backend receives them.

## Historical environment

The historical MEDA panel shows two separate windows from the [NASA/JPL report of April 6, 2021](https://www.jpl.nasa.gov/news/nasas-first-weather-report-from-jezero-crater-on-mars/): the first observing session and the report for sols 43–44. Unknown values remain unreported. These are local historical summaries, not a live forecast, a global layer or inputs to route eligibility. Exact sensor positions, calibrated time series and uncertainty are not established by this article. Curated values, provenance and limitations are in `data/manifests/meda-history.json`; the upstream HTML was readable via the web tool but direct retention returned HTTP 403. Its missing upstream checksum is explicit.
