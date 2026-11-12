import review from '../../data/manifests/sample-location-review.json' with { type: 'json' };
import { stops } from './stops';

export interface CandidateLocation {
  stopId: string;
  name: string;
  displayLatitude: number;
  displayLongitude: number;
  sourceUrl: string;
  referenceKind?: 'catalogue-centre';
  focusHeightMetres?: number;
}

// Display-only references authorized by the user. These do not populate the
// verified ScienceStop.coordinates fields or qualify any stop for analysis.
// The reported N/E degrees are shown on the shared Mars display sphere;
// the source latitude definition and horizontal accuracy remain unresolved.
export const candidateLocations: readonly CandidateLocation[] = stops.flatMap(
  (stop) => {
    const entry = review.entries.find(
      (record) => record.sample === stop.sample,
    );
    if (!entry) return [];
    const latitude = Number(entry.reportedLatitudeNorth);
    const longitude = Number(entry.reportedLongitudeEast);
    if (
      !entry.reportedLatitudeNorth.trim() ||
      !entry.reportedLongitudeEast.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    )
      return [];
    return [
      {
        stopId: stop.id,
        name: stop.name,
        displayLatitude: latitude,
        displayLongitude: longitude,
        sourceUrl: `${review.sourceUrl}#page=${entry.pdfPage}`,
      },
    ];
  },
);
