import type { CatalogFeature } from '../catalog/catalog';
import { candidateLocations } from '../data/candidate-locations';
import { sourceRecords, type SourceRecord } from '../data/sources';
import type { ScienceStop } from '../data/stops';

export type EvidenceTarget =
  | { kind: 'catalogue'; feature: CatalogFeature }
  | { kind: 'sample'; stop: ScienceStop };
export type SourceCoverage = 'envelope' | 'outside' | 'unknown' | 'linked';
export type EvidenceCategory =
  'Imagery' | 'Terrain' | 'Geology' | 'Rover observations' | 'Catalogue';
export interface EvidenceProduct {
  source: SourceRecord;
  category: EvidenceCategory;
  coverage: SourceCoverage;
}

export function targetPosition(target: EvidenceTarget) {
  if (target.kind === 'catalogue')
    return {
      latitude: target.feature.latitude,
      longitude: target.feature.longitude,
    };
  const candidate = candidateLocations.find(
    (item) => item.stopId === target.stop.id,
  );
  return candidate
    ? {
        latitude: candidate.displayLatitude,
        longitude: candidate.displayLongitude,
      }
    : null;
}

// A point-in-envelope check only. It cannot establish valid pixels, alignment,
// feature footprint coverage, unit membership or an accessible observation site.
export function envelopeContains(
  bounds: readonly number[] | null,
  position: { latitude: number; longitude: number } | null,
): boolean | null {
  if (
    !bounds ||
    bounds.length !== 4 ||
    !position ||
    !bounds.every(Number.isFinite) ||
    !Number.isFinite(position.latitude) ||
    !Number.isFinite(position.longitude) ||
    Math.abs(position.latitude) > 90 ||
    Math.abs(position.longitude) > 180
  )
    return null;
  const [west, south, east, north] = bounds;
  if (
    south > north ||
    south < -90 ||
    north > 90 ||
    west < -180 ||
    west > 180 ||
    east < -180 ||
    east > 180
  )
    return null;
  const longitudes =
    Math.abs(position.longitude) === 180 ? [-180, 180] : [position.longitude];
  return (
    position.latitude >= south &&
    position.latitude <= north &&
    longitudes.some((longitude) =>
      west <= east
        ? longitude >= west && longitude <= east
        : longitude >= west || longitude <= east,
    )
  );
}

function category(source: SourceRecord): EvidenceCategory {
  if (source.kind === 'Orbital image') return 'Imagery';
  if (source.kind === 'Geological interpretation') return 'Geology';
  if (source.kind === 'Rover image') return 'Rover observations';
  if (source.kind === 'Feature catalogue') return 'Catalogue';
  return 'Terrain';
}

export function evidenceProducts(
  target: EvidenceTarget,
  records: readonly SourceRecord[] = sourceRecords,
): EvidenceProduct[] {
  const position = targetPosition(target);
  return records.flatMap((source): EvidenceProduct[] => {
    // Report-time rover weather cannot be associated with another selected site.
    if (source.kind === 'Historical environment') return [];
    if (source.kind === 'Rover image') {
      return target.kind === 'sample' && source.id === target.stop.id
        ? [{ source, category: category(source), coverage: 'linked' }]
        : [];
    }
    const match = envelopeContains(source.bounds, position);
    return [
      {
        source,
        category: category(source),
        coverage: match === null ? 'unknown' : match ? 'envelope' : 'outside',
      },
    ];
  });
}

export function coverageDescription(coverage: SourceCoverage) {
  return coverage === 'envelope'
    ? 'Reference point inside source envelope'
    : coverage === 'outside'
      ? 'Reference point outside source envelope'
      : coverage === 'linked'
        ? 'Linked sample reference · footprint unverified'
        : 'Geographic coverage unknown';
}
