import { useEffect, useRef, useState } from 'react';
import { imagerySources, type LayerId } from '../data/layers';
import type {
  createMarsViewer,
  LayerStatus,
  MapCommand,
  RasterOverlayState,
} from './create-mars-viewer';
export function MarsMap({
  focusRequest = 0,
  visible,
  elevationEnabled = false,
  elevationOpacity = 0.65,
  geologyEnabled = false,
  geologyOpacity = 0.5,
}: {
  focusRequest?: number;
  visible: Record<LayerId, boolean>;
  elevationEnabled?: boolean;
  elevationOpacity?: number;
  geologyEnabled?: boolean;
  geologyOpacity?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createMarsViewer> | null>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [status, setStatus] = useState<Record<LayerId, LayerStatus>>({
    global: 'loading',
    jezero: 'loading',
  });
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
                setStatus((previous) => ({ ...previous, [id]: next }));
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
          );
          controller.current = active;
          active.setElevationOpacity(elevationRef.current.opacity);
          active.setElevation(elevationRef.current.enabled);
          active.setGeologyOpacity(geologyRef.current.opacity);
          active.setGeology(geologyRef.current.enabled);
          for (const source of imagerySources)
            if (!visibleRef.current[source.id]) active.toggle(source.id, false);
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
    for (const source of imagerySources)
      controller.current?.toggle(source.id, visible[source.id]);
  }, [visible]);
  useEffect(() => {
    controller.current?.setElevationOpacity(elevationOpacity);
    controller.current?.setElevation(elevationEnabled);
  }, [elevationEnabled, elevationOpacity]);
  useEffect(() => {
    // All current stops belong to Jezero. Use regional camera context while
    // their exact drill positions remain unverified. Replays after map startup
    // or retry, and handles reselecting the same stop after navigating away.
    if (focusRequest > 0 && mapState === 'ready')
      controller.current?.command('jezero');
  }, [focusRequest, mapState]);
  useEffect(() => {
    controller.current?.setGeologyOpacity(geologyOpacity);
    controller.current?.setGeology(geologyEnabled);
  }, [geologyEnabled, geologyOpacity]);
  function command(action: MapCommand) {
    controller.current?.command(action);
  }
  return (
    <section className="map-section" aria-label="Jezero map">
      <div ref={host} className="map-host" data-testid="map-host" />
      <div className="map-caption">
        <span className="eyebrow">MARS / JEZERO</span>
        <strong>Western delta</strong>
        <span>Orbital imagery · regional context</span>
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
            {imagerySources
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
            {!visible.global &&
              !visible.jezero &&
              !elevationEnabled &&
              !geologyEnabled && (
                <span>Imagery off · smooth reference globe</span>
              )}
          </div>
        </>
      )}
      <div className="map-footnote">
        <span>Drag to pan · scroll to zoom · keyboard controls available</span>
        <strong>
          {geologyEnabled
            ? 'Regional geology · alignment unverified'
            : elevationEnabled
              ? 'Elevation colours only · no 3D relief'
              : 'Smooth globe · no stop markers'}
        </strong>
      </div>
    </section>
  );
}
