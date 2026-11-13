import manifest from '../data/generated/terrain-context.json' with { type: 'json' };
import { localAssetUrl } from '../data/asset-url';
import type { BasePosition } from './BasePoint';
import { validPosition } from './ranking';
export interface TerrainGrid {
  schemaVersion: 1;
  width: number;
  height: number;
  westCentre: number;
  northCentre: number;
  stepDegrees: number;
  samples: [number | null, number | null][];
}
export async function loadTerrainContext(
  signal: AbortSignal,
): Promise<TerrainGrid> {
  const response = await fetch(localAssetUrl(manifest.assetUrl), { signal });
  if (!response.ok) throw new Error('Terrain context could not load.');
  const bytes = await response.arrayBuffer();
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('');
  if (hash !== manifest.assetSha256)
    throw new Error('Terrain context checksum mismatch.');
  const grid = JSON.parse(new TextDecoder().decode(bytes)) as TerrainGrid;
  if (
    grid.schemaVersion !== 1 ||
    !Number.isInteger(grid.width) ||
    !Number.isInteger(grid.height) ||
    grid.width <= 0 ||
    grid.height <= 0 ||
    grid.width * grid.height !== manifest.sampleCount ||
    !Number.isFinite(grid.westCentre) ||
    !Number.isFinite(grid.northCentre) ||
    !Number.isFinite(grid.stepDegrees) ||
    grid.stepDegrees <= 0 ||
    !Array.isArray(grid.samples) ||
    grid.samples.length !== manifest.sampleCount ||
    grid.samples.some(
      (s) =>
        !Array.isArray(s) ||
        s.length !== 2 ||
        s.some((n) => n !== null && !Number.isFinite(n)),
    )
  )
    throw new Error('Invalid terrain context grid.');
  return grid;
}
export function terrainAt(
  point: BasePosition,
  grid: TerrainGrid,
): [number | null, number | null] | null {
  if (!validPosition(point)) return null;
  const [west, south, east, north] = manifest.bounds;
  if (
    point.longitude < west ||
    point.longitude > east ||
    point.latitude < south ||
    point.latitude > north
  )
    return null;
  const x = Math.round((point.longitude - grid.westCentre) / grid.stepDegrees);
  const y = Math.round((grid.northCentre - point.latitude) / grid.stepDegrees);
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return null;
  return grid.samples[y * grid.width + x];
}
// Spherical interpolation on the same reference sphere as distance estimates.
// Exactly antipodal legs have no unique shortest arc and remain unsampled.
export function arcSamples(
  a: BasePosition,
  b: BasePosition,
  count = 32,
): BasePosition[] {
  const vector = (p: BasePosition) => {
    const lat = (p.latitude * Math.PI) / 180,
      lon = (p.longitude * Math.PI) / 180;
    return [
      Math.cos(lat) * Math.cos(lon),
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
    ];
  };
  const u = vector(a),
    v = vector(b);
  const angle = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        u.reduce((sum, n, i) => sum + n * v[i], 0),
      ),
    ),
  );
  if (Math.PI - angle < 1e-8) return [];
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const x =
      angle < 1e-8 ? 1 - t : Math.sin((1 - t) * angle) / Math.sin(angle);
    const y = angle < 1e-8 ? t : Math.sin(t * angle) / Math.sin(angle);
    const p = u.map((n, j) => n * x + v[j] * y);
    return {
      latitude: (Math.atan2(p[2], Math.hypot(p[0], p[1])) * 180) / Math.PI,
      longitude: (Math.atan2(p[1], p[0]) * 180) / Math.PI,
    };
  });
}
export function summarizeTerrain(
  path: readonly BasePosition[],
  grid: TerrainGrid,
) {
  const samples = path
    .slice(1)
    .flatMap((point, i) => arcSamples(path[i], point));
  const values = samples.map((p) => terrainAt(p, grid));
  const heights = values.flatMap((v) =>
    v?.[0] === null || v?.[0] === undefined ? [] : [v[0]],
  );
  const slopes = values.flatMap((v) =>
    v?.[1] === null || v?.[1] === undefined ? [] : [v[1]],
  );
  return {
    sampled: samples.length,
    heights: heights.length,
    slopes: slopes.length,
    minimum: heights.length ? Math.min(...heights) : null,
    maximum: heights.length ? Math.max(...heights) : null,
    maximumGradient: slopes.length ? Math.max(...slopes) : null,
  };
}
