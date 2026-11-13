import {
  imagerySources,
  worldSources,
  tileUrl,
  type ImagerySource,
} from '../data/layers';
import type { CatalogFeature } from './catalog';

export const previewSources = [
  worldSources.find((source) => source.id === 'ctx-global')!,
  imagerySources.find((source) => source.id === 'global')!,
];

// These reviewed geographic services have two columns and one row at level 0.
// Crop around the catalogue centre; wrap longitude and clip at the poles.
export function featurePreview(feature: CatalogFeature, source: ImagerySource) {
  const kmPerDegree = (Math.PI * 3396.19) / 180;
  const latitudeFactor = Math.max(
    0.1,
    Math.cos((feature.latitude * Math.PI) / 180),
  );
  const desiredSpan = Math.min(
    180,
    Math.max(
      0.05,
      ((feature.dimensionKm ?? 20) * 1.5) / (kmPerDegree * latitudeFactor),
    ),
  );
  const level = Math.max(
    0,
    Math.min(source.maxLevel, Math.floor(Math.log2(180 / desiredSpan))),
  );
  const rows = 2 ** level;
  const columns = rows * 2;
  const tileDegrees = 180 / rows;
  const longitude = (((feature.longitude + 180) % 360) + 360) % 360;
  const centreX = longitude / tileDegrees;
  const centreY = (90 - feature.latitude) / tileDegrees;
  const left = centreX - 0.5;
  const top = centreY - 0.5;
  const tiles: { url: string; x: number; y: number }[] = [];
  for (let y = Math.floor(top); y < Math.ceil(top + 1); y++) {
    if (y < 0 || y >= rows) continue;
    for (let x = Math.floor(left); x < Math.ceil(left + 1); x++) {
      const wrappedX = ((x % columns) + columns) % columns;
      tiles.push({
        url: tileUrl(source)
          .replace('{z}', String(level))
          .replace('{y}', String(y))
          .replace('{x}', String(wrappedX)),
        x: (x - left) * 512,
        y: (y - top) * 512,
      });
    }
  }
  return { tiles, spanDegrees: tileDegrees, level };
}
