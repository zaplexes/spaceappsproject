import review from '../../data/manifests/sample-location-review.json' with { type: 'json' };
import type { ScienceStop } from '../data/stops';
import { RoverImage } from './RoverImage';

export function StopEvidence({ stop }: { stop: ScienceStop }) {
  const position = review.entries.find((entry) => entry.sample === stop.sample);
  return (
    <div className="stop-evidence">
      <RoverImage key={stop.id} stopId={stop.id} />
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
