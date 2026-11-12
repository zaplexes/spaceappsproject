export type Extent = readonly [number, number, number, number];
export type Coverage = 'inside' | 'partial' | 'outside' | 'unknown';
function longitudeParts(west: number, east: number): [number, number][] {
  return west <= east
    ? [[west, east]]
    : [
        [west, 180],
        [-180, east],
      ];
}
export function classifyCoverage(view: Extent | null, data: Extent): Coverage {
  if (!view) return 'unknown';
  const [west, south, east, north] = view;
  if (south >= data[3] || north <= data[1]) return 'outside';
  const parts = longitudeParts(west, east);
  const dataParts = longitudeParts(data[0], data[2]);
  if (!parts.some(([a, b]) => dataParts.some(([c, d]) => a < d && b > c)))
    return 'outside';
  const contained = parts.every(([a, b]) =>
    dataParts.some(([c, d]) => a >= c && b <= d),
  );
  return contained && south >= data[1] && north <= data[3]
    ? 'inside'
    : 'partial';
}
