import { useRef, useState } from 'react';
import { mobilityProfiles, type MobilityMode } from '../data/mission';
import { localAssetUrl } from '../data/asset-url';
import images from '../../data/manifests/surface-images.json' with { type: 'json' };
import {
  DRAFT_KEY,
  TRIP_VERSION,
  emptyMission,
  estimateTrip,
  exportTrip,
  tripLimitations,
  validateDraft,
  type TripDraft,
  type TripStop,
} from './trip';
import { investigations } from '../data/investigations';
import { TerrainContext } from './TerrainContext';

export function TripPlanner({
  draft,
  onChange,
  onInspect,
}: {
  draft: TripDraft;
  onChange: (draft: TripDraft) => void;
  onInspect: (stop: TripStop) => void;
}) {
  const [notice, setNotice] = useState('');
  const [field, setField] = useState(false);
  const importRequest = useRef(0);
  let estimate: ReturnType<typeof estimateTrip> = null;
  let error = '';
  try {
    estimate = estimateTrip(draft.base, draft.stops, draft.mission);
  } catch (failure) {
    error = (failure as Error).message;
  }
  function updateStop(index: number, patch: Partial<TripStop>) {
    onChange({
      ...draft,
      stops: draft.stops.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }
  function move(index: number, offset: number) {
    const next = [...draft.stops];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange({ ...draft, stops: next });
  }
  function resetMission() {
    onChange({
      ...draft,
      mission: { ...emptyMission },
      stops: draft.stops.map((stop) => {
        const investigation =
          draft.mission.mode !== 'walking' &&
          stop.reference === 'approximate-sample'
            ? investigations.find((i) => i.stopId === stop.id)
            : null;
        if (!investigation) return stop;
        const tasks = [...investigation.tasks.walking];
        return { ...stop, tasks, completed: tasks.map(() => false) };
      }),
    });
  }
  function download() {
    try {
      const blob = new Blob([exportTrip(draft)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'martian-map-trip.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Plan exported. Keep this file as a backup.');
    } catch (failure) {
      setNotice((failure as Error).message);
    }
  }
  return (
    <section
      id="trip-planner"
      className={`trip-planner${field ? ' field-view' : ''}`}
      aria-label="Round-trip planner"
    >
      <header className="trip-heading">
        <div>
          <p className="eyebrow">PLAN / RETURN TO BASE</p>
          <h2>Your round trip</h2>
          <p>
            Build a preliminary trip from the selected destination or science
            stops. Stops are visited in the order below.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={field}
          onClick={() => setField(!field)}
        >
          {field ? 'Close field view' : 'Open field view'}
        </button>
      </header>
      <p className="trip-warning">
        Distance estimate only · terrain feasibility unknown · simulated
        positions
      </p>
      {!draft.base && (
        <p role="status">Set your base above to estimate the round trip.</p>
      )}
      {error && <p role="alert">{error}</p>}
      {estimate && (
        <div className="trip-summary" aria-live="polite">
          <strong>
            {estimate.totalKm.toFixed(2)} km minimum round-trip distance
          </strong>
          <p>Base → {draft.stops.map((s) => s.name).join(' → ')} → Base</p>
          <p>
            {estimate.travelMinutes === null
              ? 'Travel time: enter your speed to estimate.'
              : `Travel time: ${estimate.travelMinutes.toFixed(1)} min at your constant speed.`}
          </p>
          <p>
            {estimate.scheduledMinutes === null
              ? 'Total time: enter speed and work time at every stop.'
              : `Travel + science work: ${estimate.scheduledMinutes.toFixed(1)} min.`}
          </p>
          {estimate.remainingMinutes !== null && (
            <p>
              Time remaining before reserve:{' '}
              {estimate.remainingMinutes.toFixed(1)} min.
            </p>
          )}
          {estimate.distanceExceeded && (
            <p role="alert">Minimum distance exceeds your distance budget.</p>
          )}
          {estimate.timeExceeded === true && (
            <p role="alert">
              Estimated trip leaves less than your return reserve.
            </p>
          )}
          {estimate.timeExceeded === false && (
            <p>
              Time arithmetic fits your entered budget. This does not establish
              a feasible route or safe return.
            </p>
          )}
        </div>
      )}
      <div className="trip-assumption-summary">
        <p>
          Mode:{' '}
          {mobilityProfiles.find((p) => p.id === draft.mission.mode)?.label}.
          Base:{' '}
          {draft.base
            ? `${draft.base.latitude.toFixed(5)}° N, ${draft.base.longitude.toFixed(5)}° E (simulated)`
            : 'unset'}
          .
        </p>
        {Object.entries(draft.mission)
          .filter(([key, value]) => key !== 'mode' && value !== '')
          .map(([key, value]) => (
            <p key={key}>
              {
                (
                  {
                    speedKph: 'Assumed speed (km/h)',
                    availableMinutes: 'Available minutes',
                    reserveMinutes: 'Reserve minutes',
                    maximumDistanceKm: 'Distance budget (km)',
                    maximumSlopeDegrees:
                      'Slope preference (degrees; unenforced)',
                    crewSize: 'Crew size',
                    equipment: 'Equipment / assumptions',
                  } as Record<string, string>
                )[key]
              }
              : {value}
            </p>
          ))}
      </div>
      <details className="trip-mission">
        <summary>Define mission settings (optional)</summary>
        <p>
          Leave fields blank for distance-only planning. Changing mode refreshes
          proposed Jezero tasks and resets their checklist progress. All values
          are your simulation assumptions, not measured capabilities.
        </p>
        <div className="trip-input-grid">
          <label>
            Exploration mode
            <select
              value={draft.mission.mode}
              onChange={(e) =>
                onChange({
                  ...draft,
                  mission: {
                    ...draft.mission,
                    mode: e.target.value as MobilityMode,
                  },
                  stops: draft.stops.map((stop) => {
                    const investigation =
                      stop.reference === 'approximate-sample'
                        ? investigations.find((i) => i.stopId === stop.id)
                        : null;
                    if (!investigation) return stop;
                    const tasks = [
                      ...investigation.tasks[e.target.value as MobilityMode],
                    ];
                    return {
                      ...stop,
                      tasks,
                      completed: tasks.map(() => false),
                    };
                  }),
                })
              }
            >
              {mobilityProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {(
            [
              ['speedKph', 'Assumed travel speed (km/h)', '0.001'],
              ['availableMinutes', 'Available trip time (min)', '0.001'],
              ['reserveMinutes', 'Return reserve (min)', '0'],
              [
                'maximumDistanceKm',
                'Maximum round-trip distance (km)',
                '0.001',
              ],
              ['maximumSlopeDegrees', 'Maximum slope preference (°)', '0'],
              ['crewSize', 'Crew size', '1'],
            ] as const
          ).map(([key, label, min]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={min}
                max={key === 'maximumSlopeDegrees' ? 90 : undefined}
                step={key === 'crewSize' ? 1 : 'any'}
                value={draft.mission[key]}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    mission: { ...draft.mission, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
          <label>
            Equipment and operating assumptions
            <textarea
              maxLength={2000}
              value={draft.mission.equipment}
              onChange={(e) =>
                onChange({
                  ...draft,
                  mission: { ...draft.mission, equipment: e.target.value },
                })
              }
            />
          </label>
        </div>
        <p>
          Slope preferences are recorded for review; no validated route grid is
          available to enforce them. Vehicle dismount, energy and communication
          constraints need separate assessment.
        </p>
        <button type="button" onClick={resetMission}>
          Reset to distance-only
        </button>
      </details>
      {!draft.stops.length && (
        <p>Add a selected destination or a Jezero science stop to begin.</p>
      )}
      <ol className="trip-stops">
        {draft.stops.map((stop, index) => {
          const image = images.images.find((i) => i.stopId === stop.id);
          return (
            <li key={stop.id}>
              <div className="trip-stop-heading">
                <h3>{stop.name}</h3>
                <span>
                  {stop.reference === 'approximate-sample'
                    ? 'Approximate sample reference · unverified'
                    : 'Catalogue centre · observation site unverified'}
                </span>
              </div>
              <p>
                {stop.latitude.toFixed(5)}° N, {stop.longitude.toFixed(5)}° E ·
                simulated display reference
              </p>
              {estimate && (
                <p>
                  From {index === 0 ? 'base' : draft.stops[index - 1].name}:{' '}
                  {estimate.legs[index].toFixed(2)} km minimum
                </p>
              )}
              <div className="trip-stop-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${stop.name} earlier`}
                >
                  ↑ Earlier
                </button>
                <button
                  type="button"
                  disabled={index === draft.stops.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${stop.name} later`}
                >
                  ↓ Later
                </button>
                <button type="button" onClick={() => onInspect(stop)}>
                  Inspect {stop.name}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      stops: draft.stops.filter((s) => s.id !== stop.id),
                    })
                  }
                >
                  Remove {stop.name}
                </button>
              </div>
              <label>
                Work time at {stop.name} (min)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stop.workMinutes}
                  onChange={(e) =>
                    updateStop(index, { workMinutes: e.target.value })
                  }
                />
              </label>
              <p>
                Proposed science checklist · your review progress, not completed
                Mars fieldwork
              </p>
              {stop.tasks.map((task, taskIndex) => (
                <label className="trip-task" key={taskIndex}>
                  <input
                    type="checkbox"
                    checked={stop.completed[taskIndex]}
                    onChange={(e) =>
                      updateStop(index, {
                        completed: stop.completed.map((v, i) =>
                          i === taskIndex ? e.target.checked : v,
                        ),
                      })
                    }
                  />
                  {task}
                </label>
              ))}
              <a href={stop.sourceUrl} target="_blank" rel="noreferrer">
                Reference for {stop.name} ↗
              </a>
              {field && image && (
                <figure>
                  <img
                    src={localAssetUrl(image.assetUrl)}
                    alt={`Published surface reference for ${stop.name}`}
                    loading="lazy"
                  />
                  <figcaption>
                    {image.credit} · {image.camera} · sol {image.acquisitionSol}
                    . Review acquisition context in the evidence inspector.
                  </figcaption>
                </figure>
              )}
            </li>
          );
        })}
      </ol>
      {estimate && (
        <p className="trip-return">
          Return: {draft.stops.at(-1)?.name} → Base ·{' '}
          {estimate.legs.at(-1)!.toFixed(2)} km minimum. Return travel is
          included above.
        </p>
      )}
      <TerrainContext path={estimate?.path ?? null} />
      <ul className="trip-limitations">
        {tripLimitations.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
      <div className="trip-storage-actions">
        <button
          type="button"
          disabled={!!error}
          onClick={() => {
            try {
              const valid = validateDraft(draft);
              window.localStorage.setItem(DRAFT_KEY, JSON.stringify(valid));
              setNotice(
                'Draft saved in this browser. Export a backup before clearing browser data.',
              );
            } catch (failure) {
              setNotice(`Could not save: ${(failure as Error).message}`);
            }
          }}
        >
          Save local draft
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              const raw = window.localStorage.getItem(DRAFT_KEY);
              if (!raw) throw new Error('No saved draft in this browser.');
              onChange(validateDraft(JSON.parse(raw)));
              setNotice('Saved draft loaded.');
            } catch (failure) {
              setNotice(`Could not load: ${(failure as Error).message}`);
            }
          }}
        >
          Load saved draft
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.removeItem(DRAFT_KEY);
              setNotice(
                'Saved draft deleted. The current trip is still on screen.',
              );
            } catch {
              setNotice('Browser storage is unavailable.');
            }
          }}
        >
          Delete saved draft
        </button>
        <button type="button" disabled={!!error} onClick={download}>
          Export plan JSON
        </button>
        <label className="trip-import">
          Import plan JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              const request = ++importRequest.current;
              e.target.value = '';
              if (!file) return;
              try {
                if (file.size > 1000000)
                  throw new Error('Plan file exceeds 1 MB.');
                const text = await file.text();
                const valid = validateDraft(JSON.parse(text));
                if (request === importRequest.current) {
                  onChange(valid);
                  setNotice(
                    'Imported plan loaded. Review its coordinates, assumptions and references.',
                  );
                }
              } catch (failure) {
                if (request === importRequest.current)
                  setNotice(`Could not import: ${(failure as Error).message}`);
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setField(true);
            setTimeout(() => window.print(), 0);
          }}
        >
          Print field plan
        </button>
      </div>
      <p role="status">{notice}</p>
      <small>
        Model {TRIP_VERSION} · drafts stay in this browser until exported · no
        accounts or server storage
      </small>
    </section>
  );
}
