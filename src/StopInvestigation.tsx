import type { ScienceStop } from './data/stops';
import { investigations } from './data/investigations';
import { mobilityProfile, type MobilityMode } from './data/mission';

export function StopInvestigation({
  stop,
  mode,
}: {
  stop: ScienceStop;
  mode: MobilityMode;
}) {
  const investigation = investigations.find(
    (candidate) => candidate.stopId === stop.id,
  );
  if (!investigation) return null;
  return (
    <section
      className="stop-investigation"
      aria-label={`${stop.name} science plan`}
    >
      <span className="record-tag">
        JEZERO EXAMPLE / PROPOSED INVESTIGATION
      </span>
      <h3>Question at this stop</h3>
      <p>{investigation.question}</p>
      <details>
        <summary>Proposed science tasks</summary>
        <h3>Evidence to review</h3>
        <ul>
          {investigation.observations.map((observation) => (
            <li key={observation}>{observation}</li>
          ))}
        </ul>
        <h3>Proposed tasks · {mobilityProfile(mode).label}</h3>
        <ol>
          {investigation.tasks[mode].map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ol>
        <p className="quiet">
          Tasks require equipment and access checks before scheduling. These are
          planned activities; no field results or completion are recorded.
        </p>
        <a
          className="text-link"
          href={investigation.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Published {stop.sample} science context ↗
        </a>
      </details>
    </section>
  );
}
