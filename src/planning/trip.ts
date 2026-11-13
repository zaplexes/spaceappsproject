import type { BasePosition } from './BasePoint';
import { distanceKm, validPosition } from './ranking';
import { mobilityProfiles, type MobilityMode } from '../data/mission';

export const TRIP_VERSION = 'round-trip-v1';
export const DRAFT_KEY = 'martian-map-trip-v1';
export const MAX_STOPS = 12;
export interface TripStop extends BasePosition {
  id: string;
  name: string;
  reference: 'approximate-sample' | 'catalogue-centre';
  sourceUrl: string;
  tasks: string[];
  completed: boolean[];
  workMinutes: string;
}
export interface MissionInputs {
  mode: MobilityMode;
  speedKph: string;
  availableMinutes: string;
  reserveMinutes: string;
  maximumDistanceKm: string;
  maximumSlopeDegrees: string;
  crewSize: string;
  equipment: string;
}
export const emptyMission: MissionInputs = {
  mode: 'walking',
  speedKph: '',
  availableMinutes: '',
  reserveMinutes: '',
  maximumDistanceKm: '',
  maximumSlopeDegrees: '',
  crewSize: '',
  equipment: '',
};
export interface TripDraft {
  schemaVersion: 1;
  modelVersion: typeof TRIP_VERSION;
  base: BasePosition | null;
  stops: TripStop[];
  mission: MissionInputs;
}
export function optionalNumber(
  value: string,
  name: string,
  positive = false,
): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || (positive ? number <= 0 : number < 0))
    throw new Error(
      `${name} must be ${positive ? 'greater than zero' : 'zero or greater'}.`,
    );
  return number;
}
export function estimateTrip(
  base: BasePosition | null,
  stops: readonly TripStop[],
  mission: MissionInputs,
) {
  const speed = optionalNumber(mission.speedKph, 'Speed', true);
  const available = optionalNumber(
    mission.availableMinutes,
    'Available time',
    true,
  );
  const reserve = optionalNumber(mission.reserveMinutes, 'Return reserve');
  const maxDistance = optionalNumber(
    mission.maximumDistanceKm,
    'Maximum round-trip distance',
    true,
  );
  const slope = optionalNumber(mission.maximumSlopeDegrees, 'Maximum slope');
  const crew = optionalNumber(mission.crewSize, 'Crew size', true);
  if (
    (slope !== null && slope > 90) ||
    (crew !== null && !Number.isInteger(crew))
  )
    throw new Error('Use a slope from 0 to 90 degrees and a whole crew size.');
  if (reserve !== null && available !== null && reserve > available)
    throw new Error('Return reserve cannot exceed available time.');
  const work = stops.map((s) =>
    optionalNumber(s.workMinutes, `${s.name} work time`),
  );
  if (!base || !stops.length) return null;
  if (!validPosition(base) || stops.some((s) => !validPosition(s)))
    throw new Error('Invalid trip coordinates.');
  if (
    stops.length > MAX_STOPS ||
    new Set(stops.map((s) => s.id)).size !== stops.length
  )
    throw new Error('Use up to 12 distinct stops.');
  const path = [base, ...stops, base];
  const legs = path
    .slice(1)
    .map((point, index) => distanceKm(path[index], point));
  const totalKm = legs.reduce((sum, length) => sum + length, 0);
  const travelMinutes = speed === null ? null : (totalKm / speed) * 60;
  if (travelMinutes !== null && !Number.isFinite(travelMinutes))
    throw new Error('Speed is too small to produce a finite trip time.');
  const workMinutes = work.every((n) => n !== null)
    ? work.reduce<number>((sum, n) => sum + n!, 0)
    : null;
  const scheduledMinutes =
    travelMinutes === null || workMinutes === null
      ? null
      : travelMinutes + workMinutes;
  if (
    (workMinutes !== null && !Number.isFinite(workMinutes)) ||
    (scheduledMinutes !== null && !Number.isFinite(scheduledMinutes))
  )
    throw new Error(
      'Mission values are too large to produce a finite trip time.',
    );
  const remainingMinutes =
    scheduledMinutes === null || available === null
      ? null
      : available - scheduledMinutes;
  return {
    path,
    legs,
    totalKm,
    travelMinutes,
    workMinutes,
    scheduledMinutes,
    remainingMinutes,
    distanceExceeded: maxDistance !== null && totalKm > maxDistance,
    timeExceeded:
      remainingMinutes !== null && reserve !== null
        ? remainingMinutes < reserve
        : null,
    // A time arithmetic result never establishes terrain access or safe return.
    terrainFeasibility: 'unknown' as const,
  };
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid plan file.');
  return value as Record<string, unknown>;
}
function shortText(value: unknown, limit = 200): value is string {
  return typeof value === 'string' && value.length <= limit;
}
export function validateDraft(value: unknown): TripDraft {
  const draft = record(value);
  const mission = record(draft.mission);
  if (
    draft.schemaVersion !== 1 ||
    draft.modelVersion !== TRIP_VERSION ||
    !Array.isArray(draft.stops) ||
    draft.stops.length > MAX_STOPS ||
    !mobilityProfiles.some((p) => p.id === mission.mode) ||
    Object.keys(emptyMission).some(
      (key) => !shortText(mission[key], key === 'equipment' ? 2000 : 80),
    )
  )
    throw new Error(
      'Unsupported or invalid plan. Use a Martian Map round-trip-v1 export.',
    );
  const base = draft.base === null ? null : record(draft.base);
  if (base && !validPosition(base as unknown as BasePosition))
    throw new Error('Invalid base coordinates.');
  const stops: TripStop[] = draft.stops.map((value) => {
    const stop = record(value);
    if (
      !shortText(stop.id, 80) ||
      !shortText(stop.name) ||
      !validPosition(stop as unknown as BasePosition) ||
      !['approximate-sample', 'catalogue-centre'].includes(
        String(stop.reference),
      ) ||
      !shortText(stop.sourceUrl, 1000) ||
      !stop.sourceUrl.startsWith('https://') ||
      !Array.isArray(stop.tasks) ||
      stop.tasks.length > 20 ||
      !stop.tasks.every((t) => shortText(t, 1000)) ||
      !Array.isArray(stop.completed) ||
      stop.completed.length !== stop.tasks.length ||
      !stop.completed.every((c) => typeof c === 'boolean') ||
      !shortText(stop.workMinutes, 80)
    )
      throw new Error('Invalid stop in plan file.');
    // Project only known fields; imported objects never acquire app privileges.
    return {
      id: stop.id,
      name: stop.name,
      latitude: stop.latitude as number,
      longitude: stop.longitude as number,
      reference: stop.reference as TripStop['reference'],
      sourceUrl: stop.sourceUrl,
      tasks: stop.tasks as string[],
      completed: stop.completed as boolean[],
      workMinutes: stop.workMinutes,
    };
  });
  if (new Set(stops.map((s) => s.id)).size !== stops.length)
    throw new Error('Duplicate stops in plan.');
  const inputs = Object.fromEntries(
    Object.keys(emptyMission).map((k) => [k, mission[k]]),
  ) as unknown as MissionInputs;
  const position = base
    ? { latitude: base.latitude as number, longitude: base.longitude as number }
    : null;
  estimateTrip(position, stops, inputs);
  return {
    schemaVersion: 1,
    modelVersion: TRIP_VERSION,
    base: position,
    stops,
    mission: inputs,
  };
}
export const tripLimitations = [
  'Shortest surface arcs between display references; no obstacle avoidance or terrain-aware routing.',
  'Approximate sample references and catalogue centres are not verified observation sites.',
  'Times use your constant-speed and work-time assumptions; terrain access and safe return remain unknown.',
];
export function exportTrip(draft: TripDraft) {
  const checked = validateDraft(draft);
  const estimate = estimateTrip(checked.base, checked.stops, checked.mission);
  return JSON.stringify(
    {
      ...checked,
      exportedAt: new Date().toISOString(),
      estimate: estimate
        ? {
            ...estimate,
            path: estimate.path.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            })),
          }
        : null,
      limitations: tripLimitations,
    },
    null,
    2,
  );
}
