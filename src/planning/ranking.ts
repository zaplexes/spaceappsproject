import type { CatalogEntry } from '../catalog/catalog';
import type { BasePosition } from './BasePoint';

export const MODEL_VERSION = 'feature-value-v1';
export const MARS_RADIUS_KM = 3396.19;
export const initialWeights = { study: 50, distance: 30, terrain: 20 };
export type Weights = typeof initialWeights;

// Editable simulation preferences for investigating ancient-water questions.
// These are hypotheses to investigate, not evidence of water at a feature.
export const initialStudyInterest: Readonly<Record<string, number>> = {
  VA: 100,
  CH: 90,
  CM: 80,
  AA: 70,
  PL: 60,
  CB: 60,
  LB: 60,
};
export const defaultStudyInterest = 40;

export function distanceKm(a: BasePosition, b: BasePosition): number {
  const radians = Math.PI / 180;
  const h =
    Math.sin(((b.latitude - a.latitude) * radians) / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(((b.longitude - a.longitude) * radians) / 2) ** 2;
  return 2 * MARS_RADIUS_KM * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}

export function validPosition(position: BasePosition): boolean {
  return (
    Number.isFinite(position.latitude) &&
    Math.abs(position.latitude) <= 90 &&
    Number.isFinite(position.longitude) &&
    Math.abs(position.longitude) <= 180
  );
}

export interface RankedFeature {
  entry: CatalogEntry;
  distanceKm: number;
  studyInterest: number;
  studyPoints: number;
  distancePoints: number;
  terrainPoints: null;
  minimumPoints: number;
  maximumPoints: number;
}

export function rankFeatures(
  entries: readonly CatalogEntry[],
  base: BasePosition,
  radiusKm: number,
  weights: Weights,
  interest: Readonly<Record<string, number>>,
): RankedFeature[] {
  if (
    !validPosition(base) ||
    !Number.isFinite(radiusKm) ||
    radiusKm <= 0 ||
    Object.values(weights).some(
      (value) => !Number.isFinite(value) || value < 0,
    ) ||
    Math.abs(weights.study + weights.distance + weights.terrain - 100) > 1e-8 ||
    Object.values(interest).some(
      (value) => !Number.isFinite(value) || value < 0 || value > 100,
    )
  ) {
    throw new Error(
      'Use valid Mars coordinates, a positive radius, weights totalling 100 and study interest from 0 to 100.',
    );
  }
  return entries
    .flatMap((entry): RankedFeature[] => {
      if (!validPosition(entry)) return [];
      const distance = distanceKm(base, entry);
      if (distance > radiusKm + 1e-9) return [];
      const studyInterest = interest[entry.typeCode] ?? defaultStudyInterest;
      const studyPoints = (weights.study * studyInterest) / 100;
      const distancePoints =
        weights.distance * Math.max(0, 1 - distance / radiusKm);
      const minimumPoints = studyPoints + distancePoints;
      return [
        {
          entry,
          distanceKm: distance,
          studyInterest,
          studyPoints,
          distancePoints,
          terrainPoints: null,
          minimumPoints,
          maximumPoints: minimumPoints + weights.terrain,
        },
      ];
    })
    .sort(
      (a, b) =>
        b.minimumPoints - a.minimumPoints ||
        a.distanceKm - b.distanceKm ||
        a.entry.id.localeCompare(b.entry.id),
    );
}
