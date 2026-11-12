import imageryReview from '../../data/manifests/imagery-review.json' with { type: 'json' };

export type LayerId = 'global' | 'jezero' | 'hirise';
export interface ImagerySource {
  id: LayerId;
  name: string;
  productId: string;
  mission: string;
  credit: string;
  maxLevel: number;
  extent: readonly [number, number, number, number];
}
export const imagerySources: readonly ImagerySource[] =
  imageryReview.sources.map((source) => {
    if (!['global', 'jezero', 'hirise'].includes(source.layerId))
      throw new Error(`Unknown imagery layer: ${source.layerId}`);
    if (source.extent.length !== 4)
      throw new Error(`Invalid imagery extent: ${source.productId}`);
    return {
      id: source.layerId as LayerId,
      name: source.name,
      productId: source.productId,
      mission: source.mission,
      credit: source.credit,
      maxLevel: source.maxLevel,
      extent: source.extent as [number, number, number, number],
    };
  });
export function tileUrl(source: ImagerySource) {
  return `https://trek.nasa.gov/tiles/Mars/EQ/${source.productId}/1.0.0/default/default028mm/{z}/{y}/{x}.png`;
}
export function capabilitiesUrl(source: ImagerySource) {
  return `https://trek.nasa.gov/tiles/Mars/EQ/${source.productId}/1.0.0/WMTSCapabilities.xml`;
}
// Camera context from Space Apps.docx, corroborated by Bell et al. (2022). Not a simulated base or sample position.
export const jezeroView = {
  latitude: 18.4446,
  longitude: 77.4509,
  cameraHeight: 24000,
};
export const cameraReference =
  'https://ntrs.nasa.gov/api/citations/20230016428/downloads/Bell%20et%20al%202022sciadv.pdf';
