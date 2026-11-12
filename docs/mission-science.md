# Ancient-water investigation and exploration modes

Accepted November 12, 2026: the user approved the proposed science mission and requested options for astronauts in vehicles and robotic ground rovers. “Hovers” was clarified as **robotic ground rovers**. The available modes are walking astronauts, astronauts in a crew vehicle and a robotic ground rover; walking is the initial selection.

## Scientific goal

**Investigate ancient water in Jezero.** Use orbital imagery, terrain context and published rover observations to plan observations at Skinner Ridge, Wildcat Ridge and Amalik.

Main question: how can sedimentary features at these three sites help investigate Jezero's ancient water environment?

Expected result: a source-linked comparison distinguishing documented observations, interpretations and missing evidence. Defining the goal does not establish a scoring formula or prove a scientific conclusion.

The [NASA Mars rock sample catalog](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/) identifies sedimentary cores associated with all three candidate stops. NASA also documents [Wildcat Ridge sampling and composition investigation](https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/). Detailed context is linked from the reviewed [PDS sample dossier](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume2.pdf).

The following are proposed investigation questions and activities. They are not new measurements, verified scientific results, completed fieldwork or proof that a particular instrument can perform a task.

| Stop | Proposed question | Evidence and activity focus |
| --- | --- | --- |
| Skinner Ridge / Swift Run | What could textures and grain diversity reveal about sediment transport and deposition? | Review published descriptions and surface references; plan context/close-up imaging with scale references and record unresolved detail. [Dossier PDF p. 14](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume2.pdf#page=14). |
| Wildcat Ridge / Hazeltop | What could layering and texture reveal about changes in deposition? | Review published rover observations; propose views of exposed layers and identify measurements needed to test interpretations. [Dossier PDF p. 58](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume2.pdf#page=58). |
| Amalik / Shuyak | Which published observations could help investigate water-related alteration, and what remains uncertain? | Review reported observations and interpretations; plan context imaging and identify instruments needed for follow-up measurements. [Dossier PDF p. 100](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume2.pdf#page=100). |

Direct mineral measurements remain unavailable in the map. Orbital images, surface reference photographs and regional geological interpretations have different resolutions and evidence meanings. An image cannot resolve every proposed feature; missing evidence remains unknown.

## Exploration modes

Choose **Exploration mode** in Mission settings. The selection updates the exploration description, profile requirements and the selected stop's **Proposed science tasks**. It lasts for the current page session. The agreed science goal remains active when changing modes and after reload.

| Mode | Proposed activity pattern | Inputs still needed |
| --- | --- | --- |
| Walking astronauts | Plan on-foot context/close-up observations and identify measurements requiring tools. | Crew size, tools, task duration, speed, terrain limits, suit duration and return reserve. |
| Astronauts in a crew vehicle | Plan vehicle-based overview observations; separately assess work requiring crew dismount. | Vehicle type, payload, range, driving and resource limits, crew information and reserve; walking assumptions for any dismounted work. |
| Robotic ground rover | Plan observations conditional on camera reach, image resolution and instrument payload. | Rover model, instruments, task duration, speed, terrain limits, range/energy budget, reserve and communication/command constraints. |

Profiles have separate unconfigured capability records. No speed, range, slope limit, available equipment, time budget or return reserve is assigned by selecting a mode. The crew vehicle is a proposed exploration role, not an assumed Earth car or a specified Mars vehicle. The robotic option does not automatically inherit Perseverance's instruments or capabilities. No flying or fictional hovering vehicle is included.

## Analysis gates and implementation

The goal is selected, but comparison and routing remain unavailable. They still require a base, verified stop locations, evidence eligibility, actual equipment/mobility assumptions, budgets, scoring features/weights and validation. Approximate selection highlights remain display-only; exact stop coordinates remain null. Changing modes does not create a route or compute feasibility.

- `src/data/mission.ts`: agreed goal, initial state and separate mobility profiles.
- `src/data/investigations.ts`: per-stop questions, proposed evidence review and mode-specific tasks with dossier links.
- `src/MissionSettings.tsx`: selected goal, exploration-mode control, profile requirements and remaining comparison gates.
- `src/StopInvestigation.tsx`: selected stop's proposed investigation, clearly separated from its historical sample record.

Automated checks cover mode switching, task/source consistency, selection persistence, independent unconfigured capabilities, goal state, remaining analysis gates, mobile keyboard interaction, WebGL fallback and session reset. See [team decisions](team-decisions.md) for unresolved numerical and operational assumptions.
