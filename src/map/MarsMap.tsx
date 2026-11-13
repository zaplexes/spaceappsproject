import { useEffect, useRef, useState } from 'react';
import {
  initialLayerVisibility,
  tileSources,
  type LayerId,
} from '../data/layers';
import { coverageLabel, type LayerCoverage } from './layer-coverage';
import {
  candidateLocations,
  type CandidateLocation,
} from '../data/candidate-locations';
import type { Extent } from '../data/coverage';
import type { Coverage } from '../data/coverage';
import type { BasePosition } from '../planning/BasePoint';
import type {
  createMarsViewer,
  LayerStatus,
  MapCommand,
  RasterOverlayState,
} from './create-mars-viewer';
export function MarsMap({
  base = null,
  tripPath = [],
  onViewportChange,
  placingBase = false,
  onBaseChange,
  onBasePlaced,
  onCancelBasePlacement,
  focusRequest = 0,
  selectedStopId = null,
  catalogCandidate = null,
  worldOpacity = 0.65,
  onCoverageChange,
  onCameraHeightChange,
  visible,
  elevationEnabled = false,
  elevationOpacity = 0.65,
  geologyEnabled = false,
  geologyOpacity = 0.5,
  slopeEnabled = false,
  slopeOpacity = 0.65,
}: {
  base?: BasePosition | null;
  tripPath?: readonly BasePosition[];
  onViewportChange?: (extent: Extent | null) => void;
  placingBase?: boolean;
  onBaseChange?: (base: BasePosition) => void;
  onBasePlaced?: () => void;
  onCancelBasePlacement?: () => void;
  focusRequest?: number;
  selectedStopId?: string | null;
  catalogCandidate?: CandidateLocation | null;
  worldOpacity?: number;
  onCoverageChange?: (coverage: LayerCoverage) => void;
  onCameraHeightChange?: (height: number) => void;
  visible: Record<LayerId, boolean>;
  elevationEnabled?: boolean;
  elevationOpacity?: number;
  geologyEnabled?: boolean;
  geologyOpacity?: number;
  slopeEnabled?: boolean;
  slopeOpacity?: number;
}) {
  const viewportCallback = useRef(onViewportChange);
  viewportCallback.current = onViewportChange;
  const baseInteraction = useRef({ placingBase, onBaseChange, onBasePlaced });
  baseInteraction.current = { placingBase, onBaseChange, onBasePlaced };
  const cameraHeightCallback = useRef(onCameraHeightChange);
  cameraHeightCallback.current = onCameraHeightChange;
  const host = useRef<HTMLDivElement>(null);
  const highlightElement = useRef<HTMLDivElement>(null);
  const candidate =
    catalogCandidate ??
    candidateLocations.find((entry) => entry.stopId === selectedStopId) ??
    null;
  const catalogueCentre = candidate?.referenceKind === 'catalogue-centre';
  const controller = useRef<ReturnType<typeof createMarsViewer> | null>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [status, setStatus] = useState<Record<LayerId, LayerStatus>>(
    () =>
      Object.fromEntries(
        tileSources.map((source) => [
          source.id,
          initialLayerVisibility[source.id] ? 'loading' : 'hidden',
        ]),
      ) as Record<LayerId, LayerStatus>,
  );
  const [coverage, setCoverage] = useState<LayerCoverage>({});
  const worldOpacityRef = useRef(worldOpacity);
  worldOpacityRef.current = worldOpacity;
  const [hiriseCoverage, setHiRISECoverage] = useState<Coverage>('unknown');
  const elevationRef = useRef({
    enabled: elevationEnabled,
    opacity: elevationOpacity,
  });
  elevationRef.current = {
    enabled: elevationEnabled,
    opacity: elevationOpacity,
  };
  const [elevationState, setElevationState] = useState<RasterOverlayState>({
    status: 'hidden',
    coverage: 'unknown',
  });
  const geologyRef = useRef({
    enabled: geologyEnabled,
    opacity: geologyOpacity,
  });
  geologyRef.current = { enabled: geologyEnabled, opacity: geologyOpacity };
  const [geologyState, setGeologyState] = useState<RasterOverlayState>({
    status: 'hidden',
    coverage: 'unknown',
  });
  const [attempt, setAttempt] = useState(0);
  const slopeRef = useRef({ enabled: slopeEnabled, opacity: slopeOpacity });
  slopeRef.current = { enabled: slopeEnabled, opacity: slopeOpacity };
  const [slopeState, setSlopeState] = useState<RasterOverlayState>({
    status: 'hidden',
    coverage: 'unknown',
  });
  useEffect(() => {
    let disposed = false;
    let active: ReturnType<typeof createMarsViewer> | null = null;
    setMapState('loading');
    import('./create-mars-viewer')
      .then(({ createMarsViewer }) => {
        if (disposed || !host.current) return;
        try {
          host.current.replaceChildren();
          active = createMarsViewer(
            host.current,
            (id, next) => {
              if (!disposed)
                setStatus((previous) =>
                  previous[id] === next
                    ? previous
                    : { ...previous, [id]: next },
                );
            },
            () => {
              if (!disposed) setMapState('failed');
            },
            (next) => {
              if (!disposed) setElevationState(next);
            },
            (next) => {
              if (!disposed) setGeologyState(next);
            },
            highlightElement.current ?? undefined,
            (coverage) => {
              if (!disposed) setHiRISECoverage(coverage);
            },
            (next) => {
              if (!disposed) setSlopeState(next);
            },
            (next) => {
              if (!disposed) {
                setCoverage((previous) =>
                  JSON.stringify(previous) === JSON.stringify(next)
                    ? previous
                    : next,
                );
                onCoverageChange?.(next);
              }
            },
            (height) => {
              if (!disposed) cameraHeightCallback.current?.(height);
            },
            (position) => {
              if (!disposed && baseInteraction.current.placingBase) {
                baseInteraction.current.onBaseChange?.(position);
                baseInteraction.current.onBasePlaced?.();
              }
            },
            (extent) => {
              if (!disposed) viewportCallback.current?.(extent);
            },
          );
          controller.current = active;
          active.setElevationOpacity(elevationRef.current.opacity);
          active.setElevation(elevationRef.current.enabled);
          active.setGeologyOpacity(geologyRef.current.opacity);
          active.setGeology(geologyRef.current.enabled);
          active.setSlopeOpacity(slopeRef.current.opacity);
          active.setSlope(slopeRef.current.enabled);
          active.setWorldOpacity(worldOpacityRef.current);
          for (const source of tileSources)
            active.toggle(source.id, visibleRef.current[source.id]);
          setMapState('ready');
        } catch {
          host.current?.replaceChildren();
          setMapState('failed');
        }
      })
      .catch(() => {
        if (!disposed) setMapState('failed');
      });
    return () => {
      disposed = true;
      active?.destroy();
      controller.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    if (mapState === 'ready') controller.current?.setTripPath(tripPath);
  }, [tripPath, mapState]);
  useEffect(() => {
    if (mapState === 'ready') controller.current?.setBase(base);
  }, [base, mapState]);
  useEffect(() => {
    for (const source of tileSources)
      controller.current?.toggle(source.id, visible[source.id]);
  }, [visible]);
  useEffect(() => {
    controller.current?.setWorldOpacity(worldOpacity);
  }, [worldOpacity]);
  useEffect(() => {
    controller.current?.setElevationOpacity(elevationOpacity);
    controller.current?.setElevation(elevationEnabled);
  }, [elevationEnabled, elevationOpacity]);
  useEffect(() => {
    // Replay selection after startup/retry and on same-stop reselection.
    if (mapState === 'ready')
      controller.current?.highlightCandidate?.(candidate, focusRequest > 0);
  }, [candidate, focusRequest, mapState]);
  useEffect(() => {
    controller.current?.setGeologyOpacity(geologyOpacity);
    controller.current?.setGeology(geologyEnabled);
  }, [geologyEnabled, geologyOpacity]);
  function command(action: MapCommand) {
    controller.current?.command(action);
  }
  useEffect(() => {
    controller.current?.setSlopeOpacity(slopeOpacity);
    controller.current?.setSlope(slopeEnabled);
  }, [slopeEnabled, slopeOpacity]);
  return (
    <section
      className={`map-section${placingBase ? ' placing-base' : ''}`}
      aria-label={selectedStopId ? 'Jezero map' : 'Mars discovery map'}
    >
      {tripPath.length > 0 && (
        <p className="map-trip-label">
          Cyan dashed lines: hypothetical shortest-distance trip · not a
          validated route or historical rover track
        </p>
      )}
      <div ref={host} className="map-host" data-testid="map-host" />
      {placingBase && (
        <div className="base-placement-banner" role="status">
          <div>
            <strong>Choose your starting point</strong>
            <p>Click the Mars surface to place your simulated base.</p>
          </div>
          <button onClick={onCancelBasePlacement}>Cancel placement</button>
        </div>
      )}
      <div className="candidate-overlay" hidden={mapState !== 'ready'}>
        <div
          ref={highlightElement}
          className="candidate-highlight"
          data-testid="candidate-highlight"
          hidden
          role="img"
          aria-label={
            candidate
              ? catalogueCentre
                ? `${candidate.name}: catalogue centre, observation site unverified`
                : `${candidate.name}: approximate, unverified location`
              : undefined
          }
        >
          <span className="candidate-ring" aria-hidden="true" />
          <span className="candidate-label">
            <strong>{candidate?.name}</strong>
            <small>
              {catalogueCentre
                ? 'Catalogue centre / site unverified'
                : 'Approximate / unverified'}
            </small>
          </span>
        </div>
      </div>
      <div className="map-caption">
        <span className="eyebrow">
          {selectedStopId ? 'MARS / JEZERO' : 'MARS / DISCOVERY'}
        </span>
        <strong>
          {catalogueCentre
            ? 'Catalogue reference'
            : selectedStopId
              ? 'Western delta'
              : 'Mars-wide context'}
        </strong>
        <span>
          {catalogueCentre
            ? 'Named feature · coverage varies'
            : selectedStopId
              ? 'Orbital imagery · regional context'
              : 'Global imagery · discover Mars features'}
        </span>
      </div>
      {mapState === 'loading' && (
        <div className="map-message" role="status">
          Starting the Mars map…
        </div>
      )}
      {mapState === 'failed' && (
        <div className="map-fallback" role="alert">
          <h3>Map unavailable</h3>
          <p>
            WebGL may be unsupported, the graphics context may have been lost,
            or map assets could not load. You can still explore every science
            stop in the list.
          </p>
          <button onClick={() => setAttempt((n) => n + 1)}>Retry map</button>
        </div>
      )}
      {mapState === 'ready' && (
        <>
          <div className="map-toolbar" aria-label="Map navigation">
            <button onClick={() => command('jezero')}>↗ Jezero view</button>
            <button onClick={() => command('global')}>Mars globe</button>
            <button aria-label="Zoom in" onClick={() => command('in')}>
              +
            </button>
            <button aria-label="Zoom out" onClick={() => command('out')}>
              −
            </button>
          </div>
          <div className="imagery-status" aria-live="polite">
            {tileSources
              .filter((source) => visible[source.id])
              .map((source) => (
                <div key={source.id}>
                  <span className={`status-dot ${status[source.id]}`} />
                  <span>
                    {source.name}:{' '}
                    {status[source.id] === 'ready'
                      ? 'loaded'
                      : status[source.id] === 'failed'
                        ? 'unavailable — partial or no coverage'
                        : 'loading…'}
                  </span>
                  {status[source.id] === 'failed' && (
                    <button
                      onClick={() => controller.current?.retry(source.id)}
                    >
                      Retry
                    </button>
                  )}
                </div>
              ))}
            {tileSources
              .filter(
                (source) =>
                  visible[source.id] &&
                  !['global', 'jezero', 'hirise'].includes(source.id),
              )
              .map((source) => (
                <p
                  key={source.id}
                  className="coverage-status"
                  data-testid={`${source.id}-coverage`}
                >
                  {source.name}: {coverageLabel(coverage[source.id])}
                </p>
              ))}
            {((visible.global && status.global === 'failed') ||
              (visible['ctx-global'] && status['ctx-global'] === 'failed')) && (
              <p
                className="coverage-status"
                data-testid="imagery-fallback-note"
              >
                Some live tiles failed. Available imagery and a cached,
                low-resolution MOC overview provide fallback context.
              </p>
            )}
            {visible['ctx-global'] && (
              <p className="coverage-status">
                Global CTX is uncontrolled · alignment and valid pixels
                unverified
              </p>
            )}
            {visible.hirise && (
              <p className="coverage-status" data-testid="hirise-coverage">
                {hiriseCoverage === 'inside'
                  ? 'Within HiRISE service extent'
                  : hiriseCoverage === 'partial'
                    ? 'HiRISE covers part of this viewport'
                    : hiriseCoverage === 'outside'
                      ? 'Outside HiRISE coverage · context imagery below'
                      : 'HiRISE coverage unknown'}
              </p>
            )}
            {elevationEnabled && (
              <div data-testid="elevation-status">
                <span className={`status-dot ${elevationState.status}`} />
                <span>
                  Jezero elevation:{' '}
                  {elevationState.status === 'ready'
                    ? 'loaded'
                    : elevationState.status === 'failed'
                      ? 'unavailable'
                      : 'loading…'}
                </span>
                {elevationState.status === 'failed' && (
                  <button onClick={() => controller.current?.retryElevation()}>
                    Retry elevation
                  </button>
                )}
              </div>
            )}
            {elevationEnabled && (
              <p className="coverage-status" data-testid="elevation-coverage">
                {elevationState.coverage === 'inside'
                  ? 'Elevation covers this viewport'
                  : elevationState.coverage === 'partial'
                    ? 'Elevation covers part of this viewport'
                    : elevationState.coverage === 'outside'
                      ? 'Outside elevation coverage'
                      : 'Elevation coverage unknown'}
              </p>
            )}
            {geologyEnabled && (
              <>
                <div data-testid="geology-status">
                  <span className={`status-dot ${geologyState.status}`} />
                  <span>
                    Jezero geology:{' '}
                    {geologyState.status === 'ready'
                      ? 'loaded'
                      : geologyState.status === 'failed'
                        ? 'unavailable'
                        : 'loading…'}
                  </span>
                  {geologyState.status === 'failed' && (
                    <button onClick={() => controller.current?.retryGeology()}>
                      Retry geology
                    </button>
                  )}
                </div>
                <p className="coverage-status" data-testid="geology-coverage">
                  {geologyState.coverage === 'inside'
                    ? 'Within geology map extent'
                    : geologyState.coverage === 'partial'
                      ? 'Geology map covers part of this viewport'
                      : geologyState.coverage === 'outside'
                        ? 'Outside geology map extent'
                        : 'Geology map extent unknown'}
                </p>
              </>
            )}
            {slopeEnabled && (
              <>
                <div data-testid="slope-status">
                  <span className={`status-dot ${slopeState.status}`} />
                  <span>
                    Jezero slope:{' '}
                    {slopeState.status === 'ready'
                      ? 'loaded'
                      : slopeState.status === 'failed'
                        ? 'unavailable'
                        : 'loading…'}
                  </span>
                  {slopeState.status === 'failed' && (
                    <button onClick={() => controller.current?.retrySlope()}>
                      Retry slope
                    </button>
                  )}
                </div>
                <p className="coverage-status" data-testid="slope-coverage">
                  {slopeState.coverage === 'inside'
                    ? 'Within slope grid extent · edges/gaps unknown'
                    : slopeState.coverage === 'partial'
                      ? 'Slope grid covers part of this viewport'
                      : slopeState.coverage === 'outside'
                        ? 'Outside slope coverage'
                        : 'Slope coverage unknown'}
                </p>
              </>
            )}
            {!tileSources.some((source) => visible[source.id]) &&
              !elevationEnabled &&
              !geologyEnabled &&
              !slopeEnabled && (
                <span>Imagery off · smooth reference globe</span>
              )}
          </div>
        </>
      )}
      <div className="map-footnote">
        <span>Drag to pan · scroll to zoom · keyboard controls available</span>
        <strong>
          {visible['geology-global']
            ? 'Global geology · regional scale 1:20,000,000'
            : visible['relief-global']
              ? 'Global colour hillshade · no height readout or 3D relief'
              : geologyEnabled
                ? 'Regional geology · alignment unverified'
                : elevationEnabled
                  ? 'Elevation colours only · no 3D relief'
                  : slopeEnabled
                    ? 'Estimated DEM gradient · no walkability assessment'
                    : candidate
                      ? 'Approximate candidate reference · smooth globe'
                      : 'Smooth globe · select a science stop'}
        </strong>
      </div>
      {candidate && mapState === 'ready' && (
        <div
          className="candidate-warning"
          role="status"
          data-testid="candidate-warning"
        >
          <strong>
            {candidate.name} ·{' '}
            {catalogueCentre
              ? 'Catalogue centre / observation site unverified'
              : 'Approximate / unverified location'}
          </strong>
          <p>
            {catalogueCentre
              ? 'Published planetocentric / east-longitude reference. Alignment and accuracy unverified; this is not an observation site. Marker size does not indicate accuracy.'
              : 'Latitude convention and precision unverified. Highlight is a visual reference; its size does not indicate accuracy.'}
          </p>
          <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">
            Published candidate position ↗
          </a>
        </div>
      )}
    </section>
  );
}
