import { useMemo, useState } from 'react';
import elevation from './data/generated/elevation.json' with { type: 'json' };
import { imagerySources, type LayerId } from './data/layers';
import { stops } from './data/stops';
import {
  initialMission,
  mobilityProfile,
  scientificGoal,
  type MobilityMode,
} from './data/mission';
import { MissionSettings } from './MissionSettings';
import { StopInvestigation } from './StopInvestigation';
import { MarsMap } from './map/MarsMap';
import { StopEvidence } from './stops/StopEvidence';
import { GeologyLegend } from './GeologyLegend';
import { SourceRegistry } from './SourceRegistry';
import { SlopeLegend } from './SlopeLegend';
import { CatalogBrowser } from './catalog/CatalogBrowser';
import { CatalogFeatureDetails } from './catalog/CatalogFeatureDetails';
import { catalogLocation, type CatalogFeature } from './catalog/catalog';
export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogFeature, setCatalogFeature] = useState<CatalogFeature | null>(
    null,
  );
  const [addedFeatures, setAddedFeatures] = useState<readonly CatalogFeature[]>(
    [],
  );
  const catalogCandidate = useMemo(
    () => (catalogFeature ? catalogLocation(catalogFeature) : null),
    [catalogFeature],
  );
  function selectFeature(feature: CatalogFeature) {
    setCatalogFeature(feature);
    setSelectedId(null);
    setFocusRequest((request) => request + 1);
  }
  const [visible, setVisible] = useState<Record<LayerId, boolean>>({
    global: true,
    jezero: true,
    hirise: true,
  });
  const [mobility, setMobility] = useState<MobilityMode>(
    initialMission.mobility,
  );
  const [elevationEnabled, setElevationEnabled] = useState(false);
  const [geologyEnabled, setGeologyEnabled] = useState(false);
  const [slopeEnabled, setSlopeEnabled] = useState(false);
  const [slopeOpacity, setSlopeOpacity] = useState(0.65);
  const [geologyOpacity, setGeologyOpacity] = useState(0.5);
  const [elevationOpacity, setElevationOpacity] = useState(0.65);
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
          <span className="live-dot" /> JEZERO SCIENCE MISSION{' '}
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
              {scientificGoal.title}. Explore the evidence and plan observations
              across Jezero’s western delta.
            </p>
          </div>
          <span className="preview-tag">
            {mobility === 'robotic-rover'
              ? 'SIMULATED ROBOTIC EXPLORATION'
              : 'SIMULATED CREW EXPLORATION'}
          </span>
        </div>
        <div
          className={`workspace${catalogOpen || catalogFeature ? ' catalogue-workspace' : ''}`}
        >
          <aside className="explorer-panel">
            <div className="panel-heading">
              <span className="eyebrow">01 / EXPLORE</span>
              <h2>Jezero exploration</h2>
              <p>
                {mobilityProfile(mobility).label}. Start with the places
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
              <label className="layer-row">
                <input
                  type="checkbox"
                  checked={elevationEnabled}
                  onChange={(event) => {
                    setElevationEnabled(event.target.checked);
                    if (event.target.checked) {
                      setGeologyEnabled(false);
                      setSlopeEnabled(false);
                    }
                  }}
                />
                <span>
                  Jezero elevation colours
                  <small>MRO / CTX · 20 m source pixels</small>
                </span>
              </label>
              {elevationEnabled && (
                <div
                  className="elevation-legend"
                  aria-label="Elevation colour legend"
                >
                  <strong>Elevation relative to Mars areoid</strong>
                  <div className="elevation-ramp" />
                  <div className="legend-values">
                    <span>{elevation.minimumMetres.toFixed(0)} m</span>
                    <span>{elevation.maximumMetres.toFixed(0)} m</span>
                  </div>
                  <p>
                    Colour indicates elevation, not risk. This overlay does not
                    show 3D relief.
                  </p>
                  <label>
                    Elevation opacity
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(elevationOpacity * 100)}
                      onChange={(event) =>
                        setElevationOpacity(Number(event.target.value) / 100)
                      }
                    />
                  </label>
                  <a
                    href={elevation.sourcePage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    USGS source & limitations ↗
                  </a>
                </div>
              )}
              <label className="layer-row">
                <input
                  type="checkbox"
                  checked={geologyEnabled}
                  onChange={(event) => {
                    setGeologyEnabled(event.target.checked);
                    if (event.target.checked) {
                      setElevationEnabled(false);
                      setSlopeEnabled(false);
                    }
                  }}
                />
                <span>
                  Jezero regional geology
                  <small>USGS · Sun & Stack (2020) · 1:75,000</small>
                </span>
              </label>
              {geologyEnabled && (
                <GeologyLegend
                  opacity={geologyOpacity}
                  onOpacity={setGeologyOpacity}
                />
              )}
              <label className="layer-row">
                <input
                  type="checkbox"
                  checked={slopeEnabled}
                  onChange={(event) => {
                    setSlopeEnabled(event.target.checked);
                    if (event.target.checked) {
                      setElevationEnabled(false);
                      setGeologyEnabled(false);
                    }
                  }}
                />
                <span>
                  Jezero estimated slope
                  <small>Derived CTX gradient · 20 m source cells</small>
                </span>
              </label>
              {slopeEnabled && (
                <SlopeLegend
                  opacity={slopeOpacity}
                  onOpacity={setSlopeOpacity}
                />
              )}
              {(geologyEnabled || elevationEnabled || slopeEnabled) && (
                <p className="quiet">
                  Geology, elevation and slope colours are viewed separately.
                </p>
              )}
              <p className="quiet">
                3D terrain relief awaits verified height conversion.
              </p>
              <p className="quiet">
                Direct mineralogy layers are not available in this preview.
              </p>
            </section>
            <section id="science-stops" aria-labelledby="stops-heading">
              <div className="section-title">
                <h3 id="stops-heading">Candidate science stops</h3>
                <span className="count">
                  {stops.length + addedFeatures.length}
                </span>
              </div>
              <p className="quiet">
                Select a stop to highlight its approximate location. Exact
                coordinates remain unverified.
              </p>
              <ul className="stop-list">
                {stops.map((stop, index) => (
                  <li key={stop.id}>
                    <button
                      aria-pressed={selectedId === stop.id}
                      onClick={() => {
                        setCatalogFeature(null);
                        setSelectedId(stop.id);
                        setFocusRequest((request) => request + 1);
                      }}
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
                {addedFeatures.map((feature, index) => (
                  <li key={feature.id}>
                    <button
                      className="stop-button"
                      aria-pressed={catalogFeature?.id === feature.id}
                      onClick={() => selectFeature(feature)}
                    >
                      <span className="stop-number">
                        {String(stops.length + index + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <strong>{feature.name}</strong>
                        <small>Catalogue candidate · site unverified</small>
                      </span>
                      <span aria-hidden="true" className="stop-arrow">
                        ↗
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!!addedFeatures.length && (
                <p className="quiet">
                  Catalogue candidates are added for this page session.
                  Observation sites and science plans need review.
                </p>
              )}
            </section>
            <CatalogBrowser
              onSelect={selectFeature}
              selectedId={catalogFeature?.id ?? null}
              selectionRevision={focusRequest}
              onOpenChange={setCatalogOpen}
            />
            <p className="scope-note">
              Global imagery provides context.
              <br />
              <strong>The local science expedition is the focus.</strong>
            </p>
          </aside>
          <div className="map-column">
            <MarsMap
              focusRequest={focusRequest}
              selectedStopId={selectedId}
              catalogCandidate={catalogCandidate}
              visible={visible}
              elevationEnabled={elevationEnabled}
              elevationOpacity={elevationOpacity}
              geologyEnabled={geologyEnabled}
              geologyOpacity={geologyOpacity}
              slopeEnabled={slopeEnabled}
              slopeOpacity={slopeOpacity}
            />
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
            {catalogFeature ? (
              <CatalogFeatureDetails
                feature={catalogFeature}
                added={addedFeatures.some(
                  (feature) => feature.id === catalogFeature.id,
                )}
                onAdd={() =>
                  setAddedFeatures((previous) =>
                    previous.some((feature) => feature.id === catalogFeature.id)
                      ? previous
                      : [...previous, catalogFeature],
                  )
                }
                onRemove={() =>
                  setAddedFeatures((previous) =>
                    previous.filter(
                      (feature) => feature.id !== catalogFeature.id,
                    ),
                  )
                }
              />
            ) : selected ? (
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
                <StopInvestigation
                  key={selected.id}
                  stop={selected}
                  mode={mobility}
                />
                <StopEvidence key={selected.id} stop={selected} />
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
                  sources. Access for the selected exploration mode remains
                  unverified.
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
                    Select a stop for an approximate map highlight. Exact sample
                    locations remain unverified.
                  </p>
                </div>
              </section>
            )}
          </aside>
        </div>
        <MissionSettings mode={mobility} onModeChange={setMobility} />
        <footer id="sources">
          <div>
            <span className="eyebrow">DATA & PROVENANCE</span>
            <h2>Know what you’re looking at.</h2>
            <p>
              Public imagery via NASA Trek, plus local USGS elevation and
              estimated slope colours and regional geological interpretation. No
              3D relief, ranking or route analysis.
            </p>
          </div>
          <SourceRegistry />
          <p className="footer-bottom">
            MARTIAN MAP / LOCAL PREVIEW{' '}
            <span>
              Ancient water investigation · {mobilityProfile(mobility).label} ·
              Base unset · Routes unavailable
            </span>
          </p>
        </footer>
      </main>
    </>
  );
}
