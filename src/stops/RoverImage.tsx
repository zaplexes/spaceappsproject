import { useState } from 'react';
import images from '../../data/manifests/surface-images.json' with { type: 'json' };
import { localAssetUrl } from '../data/asset-url';

export function RoverImage({ stopId }: { stopId: string }) {
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const image = images.images.find((entry) => entry.stopId === stopId);
  return (
    <>
      {image && (
        <figure
          className="surface-reference"
          aria-label={`${image.sample} surface reference`}
        >
          <span className="record-tag">
            ROVER OBSERVATION / SURFACE REFERENCE
          </span>
          <div className="surface-image-frame">
            <a
              href={image.sourceImageUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open NASA ${image.sample} image`}
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
    </>
  );
}
