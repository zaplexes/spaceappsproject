import { useCallback, useMemo, useState } from 'react';
import elevation from './data/generated/elevation.json' with { type: 'json' };
import {
  imagerySources,
  initialLayerVisibility,
  globalCtxMaximumAutoHeight,
  isWorldColour,
  worldSources,
  tileSources,
  type LayerId,
} from './data/layers';
import { coverageLabel, type LayerCoverage } from './map/layer-coverage';
import { WorldLayerLegend } from './WorldLayerLegend';
import { stops } from './data/stops';
import { mobilityProfile } from './data/mission';
import { MarsMap } from './map/MarsMap';
import { EvidenceInspector } from './evidence/EvidenceInspector';
import { GeologyLegend } from './GeologyLegend';
import { SourceRegistry } from './SourceRegistry';
import { SlopeLegend } from './SlopeLegend';
import { CatalogBrowser } from './catalog/CatalogBrowser';
import { CatalogFeatureDetails } from './catalog/CatalogFeatureDetails';
import { catalogLocation, type CatalogFeature } from './catalog/catalog';
import { BasePoint, type BasePosition } from './planning/BasePoint';
import { UsageGuide } from './UsageGuide';
import { TripPlanner } from './planning/TripPlanner';
import {
  emptyMission,
  MAX_STOPS,
  TRIP_VERSION,
  type TripStop,
  type TripDraft,
} from './planning/trip';
import { candidateLocations } from './data/candidate-locations';
import { investigations } from './data/investigations';
import type { Extent } from './data/coverage';
import { localAssetUrl } from './data/asset-url';
import { HistoricalEnvironment } from './HistoricalEnvironment';
export default function App() {
  const [base, setBase] = useState<BasePosition | null>(null);
  const [placingBase, setPlacingBase] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mapCoverage, setMapCoverage] = useState<LayerCoverage>({});
  const onCoverageChange = useCallback(
    (next: LayerCoverage) =>
      setMapCoverage((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      ),
    [],
  );
  const [worldOpacity, setWorldOpacity] = useState(0.65);
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
  const [visible, setVisible] = useState<Record<LayerId, boolean>>(
    initialLayerVisibility,
  );
  const [ctxOverride, setCtxOverride] = useState<boolean | null>(null);
  const [ctxCloseEnough, setCtxCloseEnough] = useState(false);
  const onCameraHeightChange = useCallback((height: number) => {
    setCtxCloseEnough(height <= globalCtxMaximumAutoHeight);
  }, []);
  const mapVisible = useMemo(
    () => ({ ...visible, 'ctx-global': ctxOverride ?? ctxCloseEnough }),
    [visible, ctxOverride, ctxCloseEnough],
  );
  function clearWorldColours() {
    setVisible((previous) => ({
      ...previous,
      'relief-global': false,
      'geology-global': false,
    }));
  }
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [mission, setMission] = useState({ ...emptyMission });
  const [tripNotice, setTripNotice] = useState('');
  const [viewport, setViewport] = useState<Extent | null>(null);
  const mobility = mission.mode;
  const tripPath = useMemo(
    () => (base && tripStops.length ? [base, ...tripStops, base] : []),
    [base, tripStops],
  );
  const onViewportChange = useCallback(
    (extent: Extent | null) =>
      setViewport((previous) =>
        JSON.stringify(previous) === JSON.stringify(extent) ? previous : extent,
      ),
    [],
  );
  const draft: TripDraft = {
    schemaVersion: 1,
    modelVersion: TRIP_VERSION,
    base,
    stops: tripStops,
    mission,
  };
  function changeDraft(next: TripDraft) {
    setBase(next.base);
    setTripStops(next.stops);
    setMission(next.mission);
    setPlacingBase(false);
  }
  function addToTrip(items: TripStop[]) {
    const distinct = items.filter(
      (item) => !tripStops.some((s) => s.id === item.id),
    );
    if (tripStops.length + distinct.length > MAX_STOPS) {
      setTripNotice('A trip supports up to 12 stops.');
      return;
    }
    setTripStops((previous) => [...previous, ...distinct]);
    setTripNotice(
      distinct.length
        ? 'Added to your round trip. Review the order and mission settings below.'
        : 'Already in your trip.',
    );
  }
  function sampleTripStop(id: string): TripStop | null {
    const candidate = candidateLocations.find((c) => c.stopId === id);
    const investigation = investigations.find((i) => i.stopId === id);
    if (!candidate || !investigation) return null;
    const tasks = [...investigation.tasks[mobility]];
    return {
      id,
      name: candidate.name,
      latitude: candidate.displayLatitude,
      longitude: candidate.displayLongitude,
      reference: 'approximate-sample',
      sourceUrl: candidate.sourceUrl,
      tasks,
      completed: tasks.map(() => false),
      workMinutes: '',
    };
  }
  const [elevationEnabled, setElevationEnabled] = useState(false);
  const [geologyEnabled, setGeologyEnabled] = useState(false);
  const [slopeEnabled, setSlopeEnabled] = useState(false);
  const [slopeOpacity, setSlopeOpacity] = useState(0.65);
  const [geologyOpacity, setGeologyOpacity] = useState(0.5);
  const [elevationOpacity, setElevationOpacity] = useState(0.65);
  const selected = stops.find((stop) => stop.id === selectedId);
  function viewEvidenceLayer(id: string) {
    setElevationEnabled(id === 'elevation');
    setGeologyEnabled(id === 'geology');
    setSlopeEnabled(id === 'slope');
    const layer = tileSources.find((source) => source.id === id);
    if (layer) {
      if (isWorldColour(layer.id)) {
        setVisible((previous) => ({
          ...previous,
          'relief-global': false,
          'geology-global': false,
          [layer.id]: true,
        }));
        if (worldOpacity === 0) setWorldOpacity(0.65);
      } else {
        setCtxOverride(layer.id === 'ctx-global');
        setVisible({
          global: true,
          'ctx-global': false,
          jezero: false,
          hirise: false,
          themis: false,
          'relief-global': false,
          'geology-global': false,
          [layer.id]: true,
        });
      }
    } else clearWorldColours();
    setFocusRequest((request) => request + 1);
    document
      .getElementById('exploration-map')
      ?.scrollIntoView({ block: 'start' });
  }
  return (
    <>
      <a className="skip-link" href="#science-stops">
        Skip to science stops
      </a>
      <header className="site-header">
        <a className="brand" href="#">
          <img
            className="brand-logo"
            src={localAssetUrl('/branding/marsway-logo.png')}
            alt=""
            width={52}
            height={52}
          />
          <span>
            MARSWAY
            <small>EXPLORATION STARTS WITH EVIDENCE</small>
          </span>
        </a>
        <div className="header-context">
          <span className="live-dot" /> MARS EXPLORATION{' '}
          <span className="separator">/</span> LOCAL PREVIEW
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#exploration-map">Map</a>
          <a
            href="#map-layers"
            onClick={() => {
              const layers = document.querySelector<HTMLDetailsElement>(
                '.world-layer-controls',
              );
              if (layers) layers.open = true;
            }}
          >
            Layers
          </a>
          <a href="#expedition-base">Plan</a>
          <a href="#trip-planner">Trip</a>
          <a
            href={localAssetUrl('/documentation/')}
            target="_blank"
            rel="noreferrer"
            aria-label="Project documentation (opens in a new tab)"
          >
            Docs ↗
          </a>
          <a className="source-nav" href="#sources">
            Data & sources ↗
          </a>
        </nav>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">HUMAN EXPLORATION / MARS</p>
            <h1>Choose your next destination on Mars.</h1>
            <p>
              Help your crew decide where to go next. Compare destinations from
              your base, inspect NASA imagery and plan the return trip.
            </p>
          </div>
          <span className="preview-tag">
            {mobility === 'robotic-rover'
              ? 'SIMULATED ROBOTIC EXPLORATION'
              : 'SIMULATED CREW EXPLORATION'}
          </span>
        </div>
        <UsageGuide />
        <nav className="planning-guide" aria-label="Exploration steps">
          <a href="#expedition-base">
            <span className="step-number">1</span>
            <span>
              <strong>Choose your base</strong>
              <small>Pick a starting point on Mars</small>
            </span>
          </a>
          <a
            href="#destination-calculator"
            onClick={(event) => {
              event.preventDefault();
              const planner = document.getElementById(
                'destination-calculator',
              ) as HTMLDetailsElement | null;
              if (planner) {
                planner.open = true;
                planner.scrollIntoView({ block: 'start' });
                planner.querySelector('summary')?.focus();
              }
            }}
          >
            <span className="step-number">2</span>
            <span>
              <strong>Compare destinations</strong>
              <small>See your top 10 and their scores</small>
            </span>
          </a>
          <a href="#evidence-inspector">
            <span className="step-number">3</span>
            <span>
              <strong>Inspect the evidence</strong>
              <small>Explore features, images and sources</small>
            </span>
          </a>
        </nav>
        <div
          className={`workspace${catalogOpen || catalogFeature ? ' catalogue-workspace' : ''}`}
        >
          <aside className="explorer-panel">
            <div className="panel-heading">
              <span className="eyebrow">YOUR EXPLORATION WORKSPACE</span>
              <h2>
                {catalogFeature
                  ? `${catalogFeature.name} exploration`
                  : selected
                    ? 'Jezero exploration'
                    : 'Mars exploration'}
              </h2>
              <p>Plan a visit or browse Mars at your own pace.</p>
            </div>
            <BasePoint
              key={base ? `${base.latitude},${base.longitude}` : 'unset'}
              base={base}
              placing={placingBase}
              onPlacingChange={(placing) => {
                setPlacingBase(placing);
                if (placing)
                  document
                    .getElementById('exploration-map')
                    ?.scrollIntoView({ block: 'start' });
              }}
              onChange={setBase}
            />
            <CatalogBrowser
              base={base}
              viewport={viewport}
              onSelect={selectFeature}
              selectedId={catalogFeature?.id ?? null}
              selectionRevision={focusRequest}
              onOpenChange={setCatalogOpen}
            />
            <section
              id="map-layers"
              className="layer-panel"
              aria-labelledby="layers-heading"
            >
              <h3 id="layers-heading">
                Map layers{catalogFeature ? ` · ${catalogFeature.name}` : ''}
              </h3>
              <p className="quiet">
                Layer coverage follows the current viewport. Global products
                provide regional context; detailed coverage varies.
              </p>
              <details className="world-layer-controls">
                <summary>Mars-wide context</summary>
                {worldSources.map((source) => (
                  <div key={source.id}>
                    <label className="layer-row">
                      <input
                        type="checkbox"
                        checked={mapVisible[source.id]}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          if (source.id === 'ctx-global')
                            setCtxOverride(checked);
                          setVisible((previous) => ({
                            ...previous,
                            ...(checked && isWorldColour(source.id)
                              ? {
                                  'relief-global': false,
                                  'geology-global': false,
                                }
                              : {}),
                            [source.id]: checked,
                          }));
                          if (checked && isWorldColour(source.id)) {
                            setElevationEnabled(false);
                            setGeologyEnabled(false);
                            setSlopeEnabled(false);
                          }
                        }}
                      />
                      <span>
                        {source.name}
                        <small>{source.mission}</small>
                      </span>
                    </label>
                    <p
                      className="layer-availability"
                      data-testid={`control-${source.id}-coverage`}
                    >
                      {coverageLabel(mapCoverage[source.id])}
                    </p>
                    {source.id === 'ctx-global' && (
                      <p className="layer-availability" data-testid="ctx-mode">
                        {ctxOverride === null
                          ? 'Automatic · on when closer than 500 km. Change the checkbox to take control.'
                          : 'Manual · your choice stays on zoom.'}
                      </p>
                    )}
                    <details className="layer-source-note">
                      <summary>Detail & limitations · {source.name}</summary>
                      <p>{source.detail}</p>
                      <a
                        href={source.sourcePage}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source ↗
                      </a>
                    </details>
                  </div>
                ))}
                {(visible['relief-global'] || visible['geology-global']) && (
                  <WorldLayerLegend
                    geology={visible['geology-global']}
                    opacity={worldOpacity}
                    onOpacity={setWorldOpacity}
                  />
                )}
              </details>
              <details className="regional-layer-controls">
                <summary>Base imagery & Jezero detail</summary>
                {imagerySources.map((source) => (
                  <label className="layer-row" key={source.id}>
                    <input
                      type="checkbox"
                      checked={mapVisible[source.id]}
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
                      {source.id !== 'global' && (
                        <small className="layer-availability">
                          {coverageLabel(mapCoverage[source.id])}
                        </small>
                      )}
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
                        clearWorldColours();
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
                <p className="layer-availability">
                  {coverageLabel(mapCoverage.elevation)}
                </p>
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
                      Colour indicates elevation, not risk. This overlay does
                      not show 3D relief.
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
                        clearWorldColours();
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
                <p className="layer-availability">
                  {coverageLabel(mapCoverage.geology)}
                </p>
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
                        clearWorldColours();
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
                <p className="layer-availability">
                  {coverageLabel(mapCoverage.slope)}
                </p>
                {mapCoverage.slope === 'outside' && (
                  <p className="layer-gap" role="status">
                    Slope unavailable in this viewport. No reviewed global slope
                    grid is connected.
                  </p>
                )}
                {slopeEnabled && (
                  <SlopeLegend
                    opacity={slopeOpacity}
                    onOpacity={setSlopeOpacity}
                  />
                )}
                {(geologyEnabled || elevationEnabled || slopeEnabled) && (
                  <p className="quiet">
                    Local and global geology, elevation and slope colours are
                    viewed separately.
                  </p>
                )}
                <p className="quiet">
                  3D terrain relief awaits verified height conversion.
                </p>
                <p className="quiet">
                  Direct mineralogy layers are not available in this preview.
                </p>
              </details>
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
            <p className="scope-note">
              Explore Mars-wide context, then zoom in to investigate local
              science evidence.
            </p>
          </aside>
          <div id="exploration-map" className="map-column">
            <MarsMap
              base={base}
              tripPath={tripPath}
              onViewportChange={onViewportChange}
              placingBase={placingBase}
              onBaseChange={setBase}
              onBasePlaced={() => setPlacingBase(false)}
              onCancelBasePlacement={() => setPlacingBase(false)}
              focusRequest={focusRequest}
              selectedStopId={selectedId}
              catalogCandidate={catalogCandidate}
              worldOpacity={worldOpacity}
              onCoverageChange={onCoverageChange}
              visible={mapVisible}
              onCameraHeightChange={onCameraHeightChange}
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
          <aside
            id="science-information"
            className="details-panel"
            aria-label="Science information"
          >
            <span className="eyebrow">02 / UNDERSTAND</span>
            {(catalogFeature || selected) && (
              <a className="inspect-evidence-link" href="#evidence-inspector">
                Inspect this destination’s evidence ↓
              </a>
            )}
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
                <p className="quiet">
                  The evidence workspace below contains the proposed
                  investigation, surface photograph and position review.
                </p>
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
                  sources. Access for simulated exploration remains unverified.
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
        <div className="trip-add-actions">
          <button
            type="button"
            disabled={!selected && !catalogFeature}
            onClick={() => {
              if (catalogFeature) {
                const tasks = [
                  'Define a scientific question and exact observation site.',
                  'Review imagery, terrain gaps, instruments and access before fieldwork.',
                ];
                addToTrip([
                  {
                    id: catalogFeature.id,
                    name: catalogFeature.name,
                    latitude: catalogFeature.latitude,
                    longitude: catalogFeature.longitude,
                    reference: 'catalogue-centre',
                    sourceUrl: catalogFeature.sourceUrl,
                    tasks,
                    completed: tasks.map(() => false),
                    workMinutes: '',
                  },
                ]);
              } else if (selected) {
                const stop = sampleTripStop(selected.id);
                if (stop) addToTrip([stop]);
              }
            }}
          >
            Add selected destination to trip
          </button>
          <button
            type="button"
            onClick={() =>
              addToTrip(
                stops.flatMap((s) => {
                  const item = sampleTripStop(s.id);
                  return item ? [item] : [];
                }),
              )
            }
          >
            Add three Jezero references to trip
          </button>
          <p role="status">{tripNotice}</p>
        </div>
        <TripPlanner
          draft={draft}
          onChange={changeDraft}
          onInspect={(stop) => {
            if (
              stop.reference === 'approximate-sample' &&
              stops.some((s) => s.id === stop.id)
            ) {
              setCatalogFeature(null);
              setSelectedId(stop.id);
              setFocusRequest((n) => n + 1);
              document
                .getElementById('evidence-inspector')
                ?.scrollIntoView({ block: 'start' });
            } else {
              const feature =
                addedFeatures.find((f) => f.id === stop.id) ??
                (catalogFeature?.id === stop.id ? catalogFeature : null);
              if (feature) {
                selectFeature(feature);
                document
                  .getElementById('evidence-inspector')
                  ?.scrollIntoView({ block: 'start' });
              } else {
                setTripNotice(
                  'Use the stop’s reference link or find it in Discover Mars features to review its official details.',
                );
              }
            }
          }}
        />
        <EvidenceInspector
          key={catalogFeature?.id ?? selected?.id ?? 'no-evidence-target'}
          target={
            catalogFeature
              ? { kind: 'catalogue', feature: catalogFeature }
              : selected
                ? { kind: 'sample', stop: selected }
                : null
          }
          mode={mobility}
          onViewLayer={viewEvidenceLayer}
        />
        <HistoricalEnvironment />
        <footer id="sources">
          <div>
            <span className="eyebrow">DATA & PROVENANCE</span>
            <h2>Know what you’re looking at.</h2>
            <p>
              Public imagery via NASA Trek and Caltech/Esri, global relief and
              geological context, plus local Jezero elevation and estimated
              slope. Feature-value suggestions use editable simulation
              preferences; terrain-aware routing and 3D relief remain
              unavailable.
            </p>
          </div>
          <SourceRegistry />
          <p className="footer-bottom">
            MARSWAY / LOCAL PREVIEW{' '}
            <span>
              Destination planning · {mobilityProfile(mobility).label} ·
              {base ? 'Simulated base set' : 'Base unset'} · Distance estimates
              only
            </span>
          </p>
        </footer>
      </main>
    </>
  );
}
