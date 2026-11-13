# Marsway — Team decisions still needed

**Current direction — November 13, 2026:** Help astronauts choose the next destination on Mars. Feature types start with equal 50% study interest and user-adjustable priorities. Jezero investigations are optional examples. This supersedes earlier ancient-water mission and Jezero-only scope decisions below; see [current scope](project-scope.md).


Updated: November 13, 2026.

Helping astronauts choose the next destination is the agreed goal. Jezero science investigations remain examples. Walking astronauts, astronauts in a crew vehicle and robotic ground rovers are the agreed exploration-mode choices. Detailed excursion assumptions remain undecided. Use this file to record choices when ready. An unchecked item has no agreed answer; examples below are prompts, not selected defaults.

Implementation progress and scientific verification belong in [the implementation checklist](implementation-checklist.md). This file tracks choices the team needs to make.

## 1. Scientific goal and stop activities

- [x] **Main goal:** Help astronauts decide their next destination on Mars using their priorities, location and source evidence.
  - Decision: User changed the goal on November 13, 2026 and selected equal starting feature interests. See [mission science](mission-science.md).
- [x] **Proposed outcome:** Produce a source-linked comparison distinguishing observations, interpretations and missing evidence.
  - Decision: Included in the approved mission direction. Detailed measurement requirements and numerical scoring criteria remain open.
- [x] **Proposed questions and activities:** Define an investigation for each stop and adapt the proposed tasks to each exploration mode.
  - Skinner Ridge: Texture, grain diversity and sediment transport/deposition.
  - Wildcat Ridge: Layering, texture and depositional change.
  - Amalik: Published evidence relevant to alteration and follow-up measurement needs.
  - See [mission science](mission-science.md). Instrument selection, exact measurements and work times remain undecided.

The high-level goal and proposed tasks are defined. Goal-dependent scoring still needs evidence criteria, normalization and weights; scheduling needs equipment and work times.

## 2. Base and study area

- [ ] **Simulated base:** Where should excursions start and finish? Choose a fixed demonstration base or a user-selectable base, and establish its coordinates within supported data coverage.
  - Decision: Undecided.
- [ ] **Detailed planning boundary:** Which part of western Jezero should support excursion analysis?
  - Decision: Undecided.
- [x] **Unverified stop display:** Permit explicitly labeled approximate highlights while exact locations are investigated.
  - Decision: User approved “Use approximate highlights with a visible warning” on November 12, 2026. Exact drill coordinates and analysis eligibility remain unverified.

Needed before: base placement, excursion endpoints and distance estimates. Exact sample-location verification remains a scientific evidence task regardless of the display choice.

## 3. Walking crew and equipment

- [ ] **Crew configuration:** How many people walk, and do they remain together?
  - Decision: Undecided.
- [ ] **Carried equipment:** Which tools and instruments are available, what can they measure, and what carrying limits affect the plan?
  - Decision: Undecided.
- [ ] **Walking model:** What speed assumptions and terrain adjustments should the simulation use, and what evidence supports them?
  - Decision: Undecided.
- [ ] **Stop work:** How long does each scientific task take? Include setup, documentation and any planned breaks.
  - Decision: Undecided.

Needed before: task eligibility, travel-time estimates and excursion duration.

## 4. Time, distance and return reserve

- [ ] **Available time:** What is the total excursion duration, including outbound travel, science work and the return?
  - Decision: Undecided.
- [ ] **Travel limits:** Is there a maximum walking distance, distance from base or other resource limit?
  - Decision: Undecided.
- [ ] **Return reserve:** What time or resource margin must remain, and how should it be calculated?
  - Decision: Undecided.
- [ ] **Terrain limits:** Which slopes and mapped obstacles should exclude a route or increase its estimated cost? Thresholds need supporting evidence.
  - Decision: Undecided.

Needed before: round-trip feasibility and terrain-aware routing. These are simulation assumptions and do not certify human safety.

## 5. Comparison and ranking

November 12, 2026: user approved a separate global discovery calculator with a user-selected simulated base, top ten feature suggestions and adjustable study/distance/terrain weights of 50/30/20. Study potential uses explicitly labeled editable feature-type heuristics; missing terrain stays unknown with score ranges. This does not resolve the evidence-based mission scoring choices below. See [destination calculator](destination-calculator.md).

Decide after the scientific goal and excursion assumptions are agreed.

- [ ] **Science features:** Which evidence should contribute to scientific value?
  - Decision: Undecided.
- [ ] **Normalization and weights:** How should features be compared and weighted? Agree how scientific value, travel cost and terrain difficulty affect the result.
  - Decision: Undecided.
- [ ] **Evidence requirements:** What location precision, coverage, alignment and resolution are sufficient for each type of analysis?
  - Decision: Undecided.

Missing evidence remains unknown. Data confidence is displayed separately from the score and is never a probability of safety.

## 6. Optional scope and infrastructure

These choices can wait until the core walking excursion is defined. They are not prerequisites for browsing the current map.

- [ ] **Support profiles:** Include a crew vehicle or robot in the next version, or explicitly defer them? If included, define each profile's equipment, range, speed and limits separately.
  - Decision: Walking, crewed-vehicle and robotic ground-rover modes are selectable. Detailed capabilities for every mode remain undecided; selecting a mode does not configure them.
- [ ] **Additional features:** Which belong in the next release, and which should be deferred: global crater discovery, MEDA observations, image comparison, 3D relief, alternative routes or additional stops?
  - Decision: Release priorities and explicit deferrals remain open.
- [ ] **Saved work:** Are local drafts and export sufficient, or are accounts and shared plans required? What export format does the team need?
  - Decision: Undecided; accounts and shared plans require an explicit request.
- [ ] **Backend need:** Which agreed features actually require a server, database or remote processing?
  - Decision: Undecided; the technical brief's backend is a proposal.
- [ ] **Additional services, if needed:** Who owns and maintains them? What provider, region, spending limit, retention and recovery requirements apply?
  - Decision: Undecided; the accepted static hosting choice does not authorize additional services.

## 7. Submission and handoff

- [ ] **Event details:** Which local or universal event is the team entering, and what timezone and deadline apply?
  - Decision: Not yet recorded.
- [ ] **Submission scope:** Which demonstrated features will the team submit, and who prepares the project description, demonstration and references?
  - Decision: Undecided. Required format and language must follow the applicable event requirements.
- [ ] **Pre-event work:** Obtain organizer clarification on how the existing pre-event implementation may be used in the intended submission.
  - Outcome: Not established; see the existing timing notes in [README](../README.md).
- [ ] **Maintenance owner:** Who will maintain the app, refresh reviewed scientific data and handle release issues after handoff?
  - Decision: Undecided.

## Already agreed

- Mars-wide destination discovery is the main workflow; western Jezero provides detailed local examples and Skinner Ridge, Wildcat Ridge and Amalik are candidate science stops.
- Destination selection is the agreed goal. Walking astronauts are the initial mode; crewed vehicles and robotic ground rovers are selectable alternatives. Base-to-stops-to-base planning and a field view remain the intended direction.
- React, TypeScript and CesiumJS are selected; public credential-free imagery is used.
- The regional geology display may show the accepted alignment warning.
- Static hosting is GitHub Pages on the default repository URL, with no custom domain or paid hosting service in the accepted scope.

## Evidence and operational blockers

These need investigation or action rather than an invented team preference:

- Exact stop coordinates: reference point, coordinate convention and uncertainty remain unresolved. See [stop evidence](stop-evidence.md).
- Dataset coverage, alignment, height conversion and analysis suitability still need verification. See [the implementation checklist](implementation-checklist.md).
- The repository was renamed to Marsway. The public HTML still referenced the old asset prefix during review; publishing the corrected build and verifying live assets remain pending; see [hosting instructions](github-pages.md).

When a decision is made, replace its answer, record who agreed and the date, and update the implementation checklist where it changes the authorized scope. Choosing an answer does not by itself complete the corresponding implementation.

## Catalogue connection — decided November 12, 2026

- [x] Mars-wide catalogue discovery with region filters.
- [x] Import the official IAU/USGS export and refresh during publication using existing GitHub Pages hosting. No separately hosted live API.

Added catalogue candidates still need individual scientific questions, precise observation sites and mission/access review. Their existence does not validate access, choose an expedition base or assign a scientific question to a destination. See [catalogue workflow](crater-catalogue.md).


## Full-checklist pass — November 12, 2026

These decisions supersede earlier descriptions of undecided persistence and the removed standalone Mission settings screen:

- The user requested the entire checklist be addressed, using distance estimates by default and allowing users to define mission settings. The planner accepts mode, speed, work time, available duration, reserve, distance limit, slope preference, crew size and equipment notes. Blank values remain unknown; no fixed mission capabilities are selected.
- The user chose local draft saving and exports and explicitly deferred accounts/backend. A database, API or cloud job service is not required for this release.
- The user requested reviewed historical MEDA observations. Two report windows are included with source links; they do not represent current conditions or alter eligibility.
- The user will finish the competition submission. Event-specific details, ownership and final submission fields belong to that handoff; no form was submitted or organizer contacted.
- A user-selectable simulated base is implemented for discovery and distance estimates. A validated analysis boundary and exact drill-point coordinates remain scientific blockers, not silently selected defaults.
- Terrain-aware routing, scientific registration/height conversion and exact site verification remain incomplete. Saving a preference or calculating time does not resolve them.
