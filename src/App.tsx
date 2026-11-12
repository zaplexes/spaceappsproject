import { useState } from 'react';
import { capabilitiesUrl, imagerySources, type LayerId } from './data/layers';
import { initialMission, stops } from './data/stops';
import { MarsMap } from './map/MarsMap';
export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<LayerId, boolean>>({
    global: true,
    jezero: true,
  });
  const [support, setSupport] = useState({
    vehicle: initialMission.vehicleSupport as boolean,
    robot: initialMission.robotSupport as boolean,
  });
  const selected = stops.find((stop) => stop.id === selectedId);
  return (
    <>
      <a className="skip-link" href="#science-stops">
        Skip to science stops
      </a>
      <header className="site-header">
        <a className="brand" href="#">
          <span className="brand-orbit" aria-hidden="true">
            ◉
          </span>
          <span>
            MARTIAN<span className="brand-light"> MAP</span>
            <small>EXPLORATION STARTS WITH EVIDENCE</small>
          </span>
        </a>
        <div className="header-context">
          <span className="live-dot" /> JEZERO MARSWALK{' '}
          <span className="separator">/</span> LOCAL PREVIEW
        </div>
        <a className="source-nav" href="#sources">
          Data & sources ↗
        </a>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">HUMAN EXPLORATION / MARS</p>
            <h1>One region. A world to explore.</h1>
            <p>
              Explore Jezero’s western delta. Get to know the evidence before
              planning a Marswalk.
            </p>
          </div>
          <span className="preview-tag">SIMULATED CREW EXPLORATION</span>
        </div>
        <div className="workspace">
          <aside className="explorer-panel">
            <div className="panel-heading">
              <span className="eyebrow">01 / EXPLORE</span>
              <h2>Jezero Marswalk</h2>
              <p>
                Walking astronauts are the primary crew. Start with the places
                Perseverance studied.
              </p>
            </div>
            <section className="layer-panel" aria-labelledby="layers-heading">
              <h3 id="layers-heading">Map layers</h3>
              {imagerySources.map((source) => (
                <label className="layer-row" key={source.id}>
                  <input
                    type="checkbox"
                    checked={visible[source.id]}
                    onChange={(event) =>
                      setVisible((previous) => ({
                        ...previous,
                        [source.id]: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    {source.name}
                    <small>{source.mission}</small>
                  </span>
                </label>
              ))}
              <label className="layer-row unavailable">
                <input type="checkbox" disabled />
                <span>
                  Terrain elevation<small>Source verification pending</small>
                </span>
              </label>
              <p className="quiet">
                Geology and mineralogy layers are not available in this preview.
              </p>
            </section>
            <section id="science-stops" aria-labelledby="stops-heading">
              <div className="section-title">
                <h3 id="stops-heading">Candidate science stops</h3>
                <span className="count">{stops.length}</span>
              </div>
              <p className="quiet">
                Coordinates pending verification. Listed here without map
                markers.
              </p>
              <ul className="stop-list">
                {stops.map((stop, index) => (
                  <li key={stop.id}>
                    <button
                      aria-pressed={selectedId === stop.id}
                      onClick={() => setSelectedId(stop.id)}
                      className="stop-button"
                    >
                      <span className="stop-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <strong>{stop.name}</strong>
                        <small>{stop.sample} · sedimentary</small>
                      </span>
                      <span aria-hidden="true" className="stop-arrow">
                        ↗
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <p className="scope-note">
              Global imagery provides context.
              <br />
              <strong>The local Marswalk is the focus.</strong>
            </p>
          </aside>
          <div className="map-column">
            <MarsMap visible={visible} />
            <div className="map-summary">
              <span className="summary-icon" aria-hidden="true">
                ◎
              </span>
              <div>
                <strong>Look closer. Keep the unknowns visible.</strong>
                <p>
                  These images support exploration. They do not establish a
                  feasible human route.
                </p>
              </div>
              <span className="data-badge">SOURCE-LINKED</span>
            </div>
          </div>
          <aside className="details-panel" aria-label="Science information">
            <span className="eyebrow">02 / UNDERSTAND</span>
            {selected ? (
              <section aria-live="polite">
                <span className="record-tag">PERSEVERANCE / SAMPLE RECORD</span>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
                <dl className="sample-facts">
                  <div>
                    <dt>Primary sample</dt>
                    <dd>{selected.sample}</dd>
                  </div>
                  <div>
                    <dt>Rock type</dt>
                    <dd>{selected.rockType}</dd>
                  </div>
                  <div>
                    <dt>Sol sealed</dt>
                    <dd>{selected.solSealed}</dd>
                  </div>
                  <div>
                    <dt>Date sealed</dt>
                    <dd>{selected.dateSealed}</dd>
                  </div>
                  <div>
                    <dt>Additional sample</dt>
                    <dd>
                      {selected.additionalSample.name}
                      <small>
                        Sol sealed {selected.additionalSample.solSealed}
                      </small>
                    </dd>
                  </div>
                </dl>
                <div className="evidence-note">
                  <strong>Location not yet verified</strong>
                  <p>
                    Sample coordinates are unknown. No marker, distance, or
                    route is inferred from the rover’s position.
                  </p>
                </div>
                <a
                  className="text-link"
                  href={selected.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  NASA sample catalog ↗
                </a>
                {selected.contextSource && (
                  <a
                    className="text-link"
                    href={selected.contextSource}
                    target="_blank"
                    rel="noreferrer"
                  >
                    NASA outcrop observations ↗
                  </a>
                )}
                <p className="quiet">
                  Orbital imagery and rover observations are separate evidence
                  sources. Human approach suitability remains unknown.
                </p>
              </section>
            ) : (
              <section className="empty-detail">
                <span className="empty-symbol" aria-hidden="true">
                  ⌖
                </span>
                <h2>Every stop has a story.</h2>
                <p>
                  Select a candidate stop to review its sample record and
                  scientific source.
                </p>
                <div className="evidence-note">
                  <strong>Evidence before placement</strong>
                  <p>
                    The three stops stay in the list until their exact locations
                    are verified.
                  </p>
                </div>
              </section>
            )}
          </aside>
        </div>
        <section className="mission-panel" aria-labelledby="mission-heading">
          <div className="mission-intro">
            <span className="eyebrow">03 / PREPARE</span>
            <h2 id="mission-heading">Mission settings</h2>
            <p>A walking crew, with the important decisions still open.</p>
          </div>
          <div className="mission-fields">
            <label>
              Scientific goal
              <select value={initialMission.goal ?? ''} disabled>
                <option value="">Unselected — team decision pending</option>
              </select>
            </label>
            <div>
              <span className="field-label">Crew mobility</span>
              <strong className="fixed-value">Walking astronauts</strong>
              <small>Capabilities, equipment and limits undecided</small>
            </div>
            <div>
              <span className="field-label">Optional support</span>
              <label className="support-option">
                <input
                  type="checkbox"
                  checked={support.vehicle}
                  onChange={(event) =>
                    setSupport((previous) => ({
                      ...previous,
                      vehicle: event.target.checked,
                    }))
                  }
                />{' '}
                Crew vehicle
              </label>
              <label className="support-option">
                <input
                  type="checkbox"
                  checked={support.robot}
                  onChange={(event) =>
                    setSupport((previous) => ({
                      ...previous,
                      robot: event.target.checked,
                    }))
                  }
                />{' '}
                Robotic system
              </label>
              <small>
                {support.vehicle || support.robot
                  ? 'Interest recorded for this session; capabilities undefined'
                  : 'No support selected'}
              </small>
            </div>
            <div className="ranking-gate">
              <button disabled aria-describedby="ranking-reason">
                Compare stops ↗
              </button>
              <p id="ranking-reason">
                Unavailable: goal, base, capabilities and evidence coverage are
                not defined.
              </p>
            </div>
          </div>
        </section>
        <footer id="sources">
          <div>
            <span className="eyebrow">DATA & PROVENANCE</span>
            <h2>Know what you’re looking at.</h2>
            <p>
              Public imagery via NASA Trek. A smooth Mars reference globe; no
              elevation, slope, ranking or route analysis.
            </p>
          </div>
          <div className="source-list">
            {imagerySources.map((source) => (
              <a
                key={source.id}
                href={capabilitiesUrl(source)}
                target="_blank"
                rel="noreferrer"
              >
                <strong>{source.name} ↗</strong>
                <span>{source.credit}</span>
                <small>
                  {source.id === 'global'
                    ? 'Global context; limited detail at local zoom.'
                    : 'Regional mosaic; coverage does not establish walkability.'}
                </small>
              </a>
            ))}
            <a
              href="https://www.nasa.gov/nasa-brand-center/images-and-media/"
              target="_blank"
              rel="noreferrer"
            >
              NASA media usage guidelines ↗
            </a>
          </div>
          <p className="footer-bottom">
            MARTIAN MAP / LOCAL PREVIEW{' '}
            <span>
              Scientific goal unselected · Base unset · Routes unavailable
            </span>
          </p>
        </footer>
      </main>
    </>
  );
}
