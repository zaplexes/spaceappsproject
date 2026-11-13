import { useEffect, useRef, useState } from 'react';
import { featurePreview, previewSources } from './feature-imagery';
import type { CatalogFeature } from './catalog';
import { RoverImage } from '../stops/RoverImage';
import { stops } from '../data/stops';

function loadImage(url: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancel);
      image.onload = null;
      image.onerror = null;
      if (error) {
        image.src = '';
        reject(error);
      } else resolve(image);
    };
    const cancel = () => finish(new Error('Preview cancelled'));
    const timeout = setTimeout(
      () => finish(new Error('Preview timed out')),
      10000,
    );
    signal.addEventListener('abort', cancel, { once: true });
    image.crossOrigin = 'anonymous';
    image.onload = () => finish();
    image.onerror = () => finish(new Error('Preview unavailable'));
    image.src = url;
  });
}

export function FeatureImagery({ feature }: { feature: CatalogFeature }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = previewSources[sourceIndex];
  const preview = featurePreview(feature, source);
  useEffect(() => {
    const abort = new AbortController();
    setStatus('loading');
    async function draw() {
      for (let index = 0; index < previewSources.length; index++) {
        const plan = featurePreview(feature, previewSources[index]);
        const images = await Promise.allSettled(
          plan.tiles.map((tile) => loadImage(tile.url, abort.signal)),
        );
        if (abort.signal.aborted) return;
        const context = canvas.current?.getContext('2d');
        if (!context) break;
        context.clearRect(0, 0, 512, 512);
        images.forEach((result, tileIndex) => {
          if (result.status === 'fulfilled') {
            const tile = plan.tiles[tileIndex];
            context.drawImage(result.value, tile.x, tile.y, 512, 512);
          }
        });
        // Only show a complete crop; transparent coverage gaps use the overview.
        const pixels = context.getImageData(0, 0, 512, 512).data;
        const firstRow = Math.max(
          0,
          256 - ((90 - feature.latitude) / plan.spanDegrees) * 512,
        );
        const lastRow = Math.min(
          512,
          256 + ((90 + feature.latitude) / plan.spanDegrees) * 512,
        );
        const validRows = lastRow - firstRow;
        let opaque = 0;
        for (let pixel = 3; pixel < pixels.length; pixel += 4)
          if (pixels[pixel] > 0) opaque++;
        if (
          images.every((result) => result.status === 'fulfilled') &&
          opaque >= 512 * validRows * 0.98
        ) {
          setSourceIndex(index);
          setStatus('ready');
          return;
        }
      }
      if (!abort.signal.aborted) setStatus('error');
    }
    void draw().catch(() => {
      if (!abort.signal.aborted) setStatus('error');
    });
    return () => abort.abort();
  }, [feature, attempt]);
  return (
    <div className="feature-imagery">
      <figure
        className="surface-reference"
        aria-label={`${feature.name} orbital overview`}
      >
        <span className="record-tag">ORBITAL OVERVIEW</span>
        <div className="orbital-preview-frame">
          <canvas
            ref={canvas}
            width={512}
            height={512}
            role="img"
            aria-label={`Orbital imagery around ${feature.name}; cross marks the catalogue centre`}
            hidden={status !== 'ready'}
          />
          {status === 'ready' && (
            <span className="orbital-centre" aria-hidden="true">
              +
            </span>
          )}
          {status !== 'ready' && (
            <div className="surface-image-message" role="status">
              {status === 'loading'
                ? 'Loading orbital overview…'
                : 'Orbital overview unavailable.'}
              {status === 'error' && (
                <button onClick={() => setAttempt((value) => value + 1)}>
                  Retry orbital overview
                </button>
              )}
            </div>
          )}
        </div>
        <figcaption>
          {status === 'ready' && (
            <>
              <p>
                {source.name} · {preview.spanDegrees.toFixed(3)}° geographic
                field · North up.
              </p>
              {sourceIndex > 0 && (
                <p>
                  Detailed imagery unavailable; showing a wider MOC overview.
                </p>
              )}
              <p>Credit: {source.credit}</p>
            </>
          )}
          <p>
            Cross: catalogue centre. This geographic crop may show only part of
            an elongated feature. Gaps and image alignment remain unverified;
            individual acquisition dates are not established for these mosaics.
          </p>
          <a
            className="text-link"
            href={
              sourceIndex === 0
                ? 'https://murray-lab.caltech.edu/CTX/beta01.html'
                : 'https://trek.nasa.gov/mars/'
            }
            target="_blank"
            rel="noreferrer"
          >
            Orbital imagery source ↗
          </a>
        </figcaption>
      </figure>
      {feature.id === 'iau-14300' && (
        <details className="jezero-rover-gallery">
          <summary>Perseverance views inside Jezero</summary>
          <p>
            Selected delta outcrops inside the crater, photographed from the
            ground. These are separate sampling sites, away from the catalogue
            centre; exact drill coordinates remain unverified.
          </p>
          {stops.map((stop) => (
            <div key={stop.id}>
              <h3>{stop.name}</h3>
              <RoverImage stopId={stop.id} />
            </div>
          ))}
          <a
            className="text-link"
            href="https://mars.nasa.gov/mars2020/multimedia/raw-images/"
            target="_blank"
            rel="noreferrer"
          >
            Explore Perseverance raw images ↗
          </a>
        </details>
      )}
    </div>
  );
}
