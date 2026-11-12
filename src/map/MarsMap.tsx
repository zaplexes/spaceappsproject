import { useEffect, useRef, useState } from 'react';
import { imagerySources, type LayerId } from '../data/layers';
import type {
  createMarsViewer,
  LayerStatus,
  MapCommand,
} from './create-mars-viewer';
export function MarsMap({ visible }: { visible: Record<LayerId, boolean> }) {
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
          );
          controller.current = active;
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
            {!visible.global && !visible.jezero && (
              <span>Imagery off · smooth reference globe</span>
            )}
          </div>
        </>
      )}
      <div className="map-footnote">
        <span>Drag to pan · scroll to zoom · keyboard controls available</span>
        <strong>No elevation model · no stop markers</strong>
      </div>
    </section>
  );
}
