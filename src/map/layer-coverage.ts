import { classifyCoverage, type Coverage, type Extent } from '../data/coverage';
import { tileSources } from '../data/layers';
import elevation from '../data/generated/elevation.json' with { type: 'json' };
import geology from '../data/generated/geology.json' with { type: 'json' };
import slope from '../data/generated/slope.json' with { type: 'json' };

export type LayerCoverage = Record<string, Coverage>;
export function layerCoverage(view: Extent | null): LayerCoverage {
  return Object.fromEntries([
    ...tileSources.map((source) => [
      source.id,
      classifyCoverage(view, source.extent),
    ]),
    ...(
      [
        ['elevation', elevation.bounds],
        ['geology', geology.bounds],
        ['slope', slope.bounds],
      ] as const
    ).map(([id, bounds]) => [
      id,
      classifyCoverage(view, bounds as [number, number, number, number]),
    ]),
  ]);
}
export function coverageLabel(coverage: Coverage | undefined) {
  return coverage === 'inside'
    ? 'Within service extent · gaps may exist'
    : coverage === 'partial'
      ? 'Partial viewport coverage · gaps may exist'
      : coverage === 'outside'
        ? 'Outside this viewport'
        : 'Coverage unknown';
}
