import type { BasePosition } from '../planning/BasePoint';
import type { Extent } from '../data/coverage';
export function withinViewport(
  point: BasePosition,
  viewport: Extent | null,
): boolean {
  if (!viewport || !viewport.every(Number.isFinite)) return false;
  const [west, south, east, north] = viewport;
  return (
    point.latitude >= south &&
    point.latitude <= north &&
    (west <= east
      ? point.longitude >= west && point.longitude <= east
      : point.longitude >= west || point.longitude <= east)
  );
}
