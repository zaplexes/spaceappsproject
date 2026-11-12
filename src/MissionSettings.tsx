import {
  initialMission,
  mobilityProfile,
  mobilityProfiles,
  scientificGoal,
  type MobilityMode,
} from './data/mission';

export function MissionSettings({
  mode,
  onModeChange,
}: {
  mode: MobilityMode;
  onModeChange: (mode: MobilityMode) => void;
}) {
  const profile = mobilityProfile(mode);
  return (
    <section className="mission-panel" aria-labelledby="mission-heading">
      <div className="mission-intro">
        <span className="eyebrow">03 / PREPARE</span>
        <h2 id="mission-heading">Mission settings</h2>
        <p>{scientificGoal.objective}</p>
      </div>
      <div className="mission-fields">
        <label>
          Scientific goal
          <select value={initialMission.goal} disabled>
            <option value={scientificGoal.id}>{scientificGoal.title}</option>
          </select>
        </label>
        <label>
          Exploration mode
          <select
            value={mode}
            onChange={(event) => {
              const selected = mobilityProfiles.find(
                (candidate) => candidate.id === event.target.value,
              );
              if (selected) onModeChange(selected.id);
            }}
            aria-describedby="mobility-summary"
          >
            {mobilityProfiles.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mission-purpose">
          <h3>Scientific question</h3>
          <p>{scientificGoal.question}</p>
          <h3>Expected result</h3>
          <p>{scientificGoal.outcome}</p>
        </div>
        <div className="mobility-profile" aria-live="polite">
          <h3 data-testid="active-mobility">{profile.label}</h3>
          <p id="mobility-summary">{profile.summary}</p>
          <strong>Needed to assess this mode</strong>
          <ul>
            {profile.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
          <p>
            Capabilities are not configured. Choosing a mode does not establish
            speed, range, terrain access or available instruments.
          </p>
        </div>
        <div className="ranking-gate">
          <button disabled aria-describedby="ranking-reason">
            Compare stops ↗
          </button>
          <p id="ranking-reason">
            Unavailable: base, verified locations, equipment, mobility limits,
            budgets, scoring weights and analysis-ready evidence remain
            undefined.
          </p>
        </div>
      </div>
    </section>
  );
}
