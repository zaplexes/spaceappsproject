export type LayerId = 'global' | 'jezero';
export interface ImagerySource {
  id: LayerId;
  name: string;
  productId: string;
  mission: string;
  credit: string;
  maxLevel: number;
  extent: readonly [number, number, number, number];
}
export const imagerySources: readonly ImagerySource[] = [
  {
    id: 'global',
    name: 'Global MOC imagery',
    productId: 'msss_atlas_simp_clon',
    mission: 'Mars Global Surveyor · MOC',
    credit: 'NASA/JPL/MSSS · NASA Trek',
    maxLevel: 6,
    extent: [-179.9999885, -89.9999958, 179.9999862, 89.9999916],
  },
  {
    id: 'jezero',
    name: 'Jezero CTX imagery',
    productId: 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0',
    mission: 'Mars Reconnaissance Orbiter · CTX',
    credit: 'NASA/JPL-Caltech/USGS · NASA Trek',
    maxLevel: 13,
    extent: [77.1604655, 18.2110274, 77.6991776, 18.7211945],
  },
];
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
