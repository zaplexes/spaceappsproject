import type { Ellipsoid, Viewer } from 'cesium';
import geology from '../data/generated/geology.json' with { type: 'json' };
import { createRasterOverlay } from './create-raster-overlay';
import type { RasterOverlayState } from './create-mars-viewer';

export function createGeologyOverlay(
  viewer: Viewer,
  mars: Ellipsoid,
  onChange?: (state: RasterOverlayState) => void,
) {
  return createRasterOverlay(
    viewer,
    mars,
    {
      assetUrl: geology.assetUrl,
      bounds: geology.bounds,
      credit:
        geology.credit + ' · SIM 3464 · regional geology; alignment unverified',
      categorical: true,
    },
    onChange,
  );
}
