import { useState } from 'react';
import images from '../../data/manifests/surface-images.json' with { type: 'json' };
import review from '../../data/manifests/sample-location-review.json' with { type: 'json' };
import type { ScienceStop } from '../data/stops';
import { localAssetUrl } from '../data/asset-url';

export function StopEvidence({ stop }: { stop: ScienceStop }) {
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const image = images.images.find((entry) => entry.stopId === stop.id);
  const position = review.entries.find((entry) => entry.sample === stop.sample);
  return (
    <div className="stop-evidence">
      {image && (
        <figure
          className="surface-reference"
          aria-label={`${stop.sample} surface reference`}
        >
          <span className="record-tag">
            ROVER OBSERVATION / SURFACE REFERENCE
          </span>
          <div className="surface-image-frame">
            <a
              href={image.sourceImageUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open NASA ${stop.sample} image`}
            >
              <img
                key={attempt}
                src={`${localAssetUrl(image.assetUrl)}${attempt ? `?retry=${attempt}` : ''}`}
                alt={image.alt}
                width={image.width}
                height={image.height}
                hidden={imageState !== 'ready'}
                onLoad={() => setImageState('ready')}
                onError={() => setImageState('error')}
              />
            </a>
            {imageState !== 'ready' && (
              <div className="surface-image-message" role="status">
                {imageState === 'loading'
                  ? 'Loading surface image…'
                  : 'Surface image unavailable.'}
                {imageState === 'error' && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageState('loading');
                      setAttempt((value) => value + 1);
                    }}
                  >
                    Retry surface image
                  </button>
                )}
              </div>
            )}
          </div>
          <figcaption>
            <p>{image.caption}</p>
            <p>
              {image.camera} · Image sol {image.acquisitionSol}
              <br />
              Image date (NASA caption): {image.dateAsPublished}
            </p>
            <p>Credit: {image.credit}</p>
            <a
              className="text-link"
              href={image.sourceImageUrl}
              target="_blank"
              rel="noreferrer"
            >
              NASA surface image ↗
            </a>
          </figcaption>
        </figure>
      )}
      <div className="evidence-note">
        <strong>Location not yet verified</strong>
        <p>
          A sampling site, rover position and exact drill point are different
          locations. The map highlights the published candidate position as an
          approximate visual reference. Latitude convention and accuracy remain
          unverified; no route is inferred.
        </p>
        {position && (
          <details className="location-review">
            <summary>Review position evidence</summary>
            <p>
              Reported in the sample dossier: {position.reportedLatitudeNorth}°
              N, {position.reportedLongitudeEast}° E. These values are not
              verified drill positions. For the approximate highlight, these
              reported degrees are shown on the shared Mars display sphere
              without a verified latitude conversion.
            </p>
            <p>{review.reviewSummary}</p>
            <p>
              Latitude definition, exact point meaning and horizontal accuracy
              remain unverified.
            </p>
            <a
              className="text-link"
              href={`${review.sourceUrl}#page=${position.pdfPage}`}
              target="_blank"
              rel="noreferrer"
            >
              PDS {stop.sample} dossier · PDF p. {position.pdfPage} ↗
            </a>
            <a
              className="text-link"
              href={`${review.placesSisUrl}#page=7`}
              target="_blank"
              rel="noreferrer"
            >
              PDS rover position definitions ↗
            </a>
            <a
              className="text-link"
              href={review.localizationUrl}
              target="_blank"
              rel="noreferrer"
            >
              PDS localization record ↗
            </a>
            <a
              className="text-link"
              href={review.armUrl}
              target="_blank"
              rel="noreferrer"
            >
              PDS arm joint record ↗
            </a>
            <a
              className="text-link"
              href={review.instrumentFramesUrl}
              target="_blank"
              rel="noreferrer"
            >
              PDS instrument-frame definitions ↗
            </a>
          </details>
        )}
      </div>
    </div>
  );
}
