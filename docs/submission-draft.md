# Marsway — submission and demonstration draft

This is an editable handoff for the user, who will complete the submission. It is not an official form, a submitted entry or proof of eligibility. Project work began before the official event; retain that disclosure and confirm permitted use with the organizer. No organizer message has been sent.

## Public project links

- Interactive app: https://zaplexes.github.io/Marsway/
- HTML documentation: https://zaplexes.github.io/Marsway/documentation/
- Public source code: https://github.com/zaplexes/Marsway
- Video: to be supplied separately by the team before submission.

## Project description draft

Marsway helps astronauts decide where to go next on Mars. Crews set a simulated base, compare nearby destinations with adjustable interests and distance preferences, inspect NASA imagery and supporting evidence, and prepare a round-trip field plan. Every feature type starts with equal study interest; the app does not impose a water-finding mission. Jezero provides an optional worked example using Perseverance sample observations.
The evidence inspector distinguishes documented observations, mapped interpretations and missing data. Orbital context includes Mars Global Surveyor MOC, Mars Reconnaissance Orbiter CTX/HiRISE, Mars Odyssey THEMIS, MOLA/HRSC relief and USGS geology. Local elevation and exploratory gradients retain source provenance. Historical MEDA reports are explicitly dated and local to the rover.

The round-trip planner orders selected references and includes the return to base. It starts with minimum surface-distance estimates; users can supply speed, stop work time, available time and reserve assumptions. A field view includes proposed science tasks and Jezero reference photographs. Local drafts, validated JSON import/export and printing let users review and share a plan without an account.

The prototype does not certify astronaut access or safety. Exact sample locations, independent dataset alignment, physical slope validation, direct mineral measurements, 3D height conversion and obstacle-aware routing remain unresolved. Terrain stays unknown in ranking. Catalogue centres and approximate sample references are not verified observation sites; shortest arcs are not traversable routes.

## Proposed demonstration script

This sequence is a suggested walkthrough, not an assertion of the official required video duration or format.

1. State the decision: “Where should our crew go next, and what evidence supports that choice?”
2. Set a simulated base and open Compare destinations. Show the shortlist, equal starting interests and distance from the base.
3. Open one destination. Show its orbital overview and source evidence, then distinguish documented facts from unknown terrain.
4. Add it to a round trip. Show the return leg and user-defined time/reserve assumptions. Explain that the line is a distance estimate, not an obstacle-avoiding route.
5. Export the field plan. Finish with the next engineering step: verified local terrain and route analysis. Jezero surface photos are an optional example, not the central mission.

A presentation-ready narration and slide outline are in [presentation guide](presentation-guide.md). Confirm the current official media requirements before recording.

## Challenge mapping

| Theme | Demonstrated behavior | Limit |
| --- | --- | --- |
| Multi-mission information | MOC, CTX/HiRISE, THEMIS, relief/geology and Perseverance references | Context products differ in scale, coverage and registration |
| Local exploration | Jezero evidence and proposed investigations at three outcrops | Exact drill sites remain unverified |
| Destination decision | Adjustable exploration interests, distance comparison and source-linked evidence | Type-interest scores are preferences, not scientific measurements |
| Mobility planning | Optional mode/budget inputs, ordered stops, return leg and field plan | Distance-only lower bounds; no certified feasibility or hazard avoidance |
| Accessibility | Keyboard controls, responsive UI, non-WebGL records/planning and skippable walkthrough | Interactive map needs WebGL; remote imagery can fail |
| Reproducibility | Pinned dependencies, source checksums, pipeline manifests, tests and export model version | Some upstream metadata and full scientific validation remain unavailable |

## References and attribution

Use the app’s Data & sources registry and [source registry guide](source-registry.md) for product-level citations, retained metadata and rights. Other references:

- [NASA Mars rock samples](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/).
- [PDS Mars 2020 PLACES](https://pds-geosciences.wustl.edu/missions/mars2020/places.htm).
- [USGS CTX DTM release](https://www.usgs.gov/data/mars-2020-terrain-relative-navigation-ctx-dtm-mosaic), DOI 10.5066/P906QQT8.
- [NASA/JPL MEDA report, April 6, 2021](https://www.jpl.nasa.gov/news/nasas-first-weather-report-from-jezero-crater-on-mars/).
- Software: React, TypeScript, Vite and CesiumJS; retain their upstream notices and map credits.
- NASA/JPL-Caltech surface photographs remain credited. Derived displays are identified as local processing rather than original observations.

AI-assistance disclosure draft: “OpenAI Codex assisted with implementation, documentation, source investigation and automated checks. OpenAI image generation created the app emblem using the team logo as a style reference. The team is responsible for reviewing the results and scientific limitations.” Adjust to accurately describe the team’s full use of AI and the final official rules. No AI-generated scientific measurements are presented.

## Items the user completes

- Confirm local/universal event, timezone, deadline, team details, challenge selection, contact and any maintenance responsibility.
- Review the official submission guide when available, required fields/language, presentation/media requirements and current AI/attribution rules.
- Decide the final demonstrated scope, record the demonstration and submit the official entry.
- Confirm organizer treatment of the pre-event implementation; eligibility is not established here.
- Confirm the public site and project/source links work for judges before submission.

Official guide status checked November 12, 2026: the [organizer’s November 5 answer](https://github.com/nasa/spaceapps/discussions/1839) says the Project Submission Guide will be posted November 13 on the [resources page](https://www.spaceappschallenge.org/resources/). The resources page returned HTTP 502 during this review. Current official form/media requirements cannot be marked verified before the guide is reviewed.
