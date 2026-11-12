import review from '../../data/manifests/nomenclature-review.json' with { type: 'json' };
import type { CandidateLocation } from '../data/candidate-locations';

export { review as catalogReview };

export interface CatalogEntry {
  id: string;
  name: string;
  searchName: string;
  typeCode: string;
  regionId: string;
  latitude: number;
  longitude: number;
}

export interface CatalogFeature extends CatalogEntry {
  type: string;
  regionName: string;
  longitudeEast: number;
  dimensionKm: number | null;
  nameOrigin: string | null;
  sourceUrl: string;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid catalogue record');
  return value as Record<string, unknown>;
}

function validEntry(value: unknown): value is CatalogEntry {
  const record = object(value);
  return (
    typeof record.id === 'string' &&
    /^iau-\d+$/.test(record.id) &&
    typeof record.name === 'string' &&
    record.name.trim().length > 0 &&
    typeof record.searchName === 'string' &&
    review.types.some((type) => type.code === record.typeCode) &&
    review.regions.some((region) => region.id === record.regionId) &&
    typeof record.latitude === 'number' &&
    Number.isFinite(record.latitude) &&
    record.latitude >= -90 &&
    record.latitude <= 90 &&
    typeof record.longitude === 'number' &&
    Number.isFinite(record.longitude) &&
    record.longitude >= -180 &&
    record.longitude <= 180
  );
}

async function read(
  url: string,
  signal: AbortSignal,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}${url.replace(/^\//, '')}`,
    {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      cache: 'no-cache',
    },
  );
  if (!response.ok)
    throw new Error(`Catalogue request failed (${response.status})`);
  const payload = object(await response.json());
  if (
    payload.schemaVersion !== 1 ||
    payload.sourceSha256 !== review.sourceSha256
  )
    throw new Error('Catalogue version differs from this app release');
  return payload;
}

export async function loadCatalogIndex(
  signal: AbortSignal,
): Promise<CatalogEntry[]> {
  const payload = await read(review.index.assetUrl, signal);
  if (
    !Array.isArray(payload.entries) ||
    payload.entries.length !== review.count ||
    !payload.entries.every(validEntry)
  )
    throw new Error('Invalid catalogue index');
  const entries = payload.entries as CatalogEntry[];
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
    throw new Error('Duplicate catalogue IDs');
  return entries;
}

export async function loadCatalogFeature(
  entry: CatalogEntry,
  signal: AbortSignal,
): Promise<CatalogFeature> {
  const region = review.regions.find(
    (candidate) => candidate.id === entry.regionId,
  );
  if (!region) throw new Error('Unknown catalogue region');
  const payload = await read(region.assetUrl, signal);
  if (payload.regionId !== region.id || !Array.isArray(payload.features))
    throw new Error('Invalid catalogue region');
  const feature = payload.features.find(
    (candidate: unknown) => object(candidate).id === entry.id,
  );
  const record = object(feature);
  if (
    !validEntry(feature) ||
    record.name !== entry.name ||
    record.regionId !== entry.regionId ||
    record.latitude !== entry.latitude ||
    record.longitude !== entry.longitude ||
    record.typeCode !== entry.typeCode ||
    typeof record.type !== 'string' ||
    !review.types.some(
      (type) => type.code === record.typeCode && type.name === record.type,
    ) ||
    record.regionName !== region.name ||
    typeof record.longitudeEast !== 'number' ||
    !Number.isFinite(record.longitudeEast) ||
    record.longitudeEast < 0 ||
    record.longitudeEast > 360 ||
    Math.abs(((record.longitudeEast + 180) % 360) - 180 - entry.longitude) >
      1e-7 ||
    !(
      record.dimensionKm === null ||
      (typeof record.dimensionKm === 'number' &&
        Number.isFinite(record.dimensionKm) &&
        record.dimensionKm > 0)
    ) ||
    !(record.nameOrigin === null || typeof record.nameOrigin === 'string') ||
    record.sourceUrl !==
      `https://planetarynames.wr.usgs.gov/Feature/${entry.id.slice(4)}`
  )
    throw new Error('Feature details disagree with the catalogue index');
  return feature as CatalogFeature;
}

export function catalogLocation(feature: CatalogFeature): CandidateLocation {
  return {
    stopId: feature.id,
    name: feature.name,
    displayLatitude: feature.latitude,
    displayLongitude: feature.longitude,
    sourceUrl: feature.sourceUrl,
    referenceKind: 'catalogue-centre',
    // Camera framing only. A feature's approximate dimension is not a route,
    // measured uncertainty radius or assumed accessible observation site.
    focusHeightMetres: Math.min(
      8_000_000,
      Math.max(15_000, (feature.dimensionKm ?? 0) * 1600),
    ),
  };
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}
