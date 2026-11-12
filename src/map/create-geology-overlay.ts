import {
  Ellipsoid,
  Rectangle,
  SingleTileImageryProvider,
  TextureMagnificationFilter,
  TextureMinificationFilter,
  Viewer,
} from 'cesium';
import { Math as CesiumMath } from 'cesium';
import geology from '../data/generated/geology.json' with { type: 'json' };
import { classifyCoverage, type Extent } from '../data/coverage';
import type { LayerStatus, RasterOverlayState } from './create-mars-viewer';

export function createGeologyOverlay(
  viewer: Viewer,
  mars: Ellipsoid,
  onChange?: (state: RasterOverlayState) => void,
) {
  let alive = true;
  let enabled = false;
  let status: LayerStatus = 'hidden';
  let opacity = 0.5;
  let request = 0;
  let layer: ReturnType<typeof viewer.imageryLayers.addImageryProvider> | null =
    null;
  function report() {
    const rectangle = viewer.camera.computeViewRectangle(mars);
    const view: Extent | null = rectangle
      ? ([rectangle.west, rectangle.south, rectangle.east, rectangle.north].map(
          CesiumMath.toDegrees,
        ) as [number, number, number, number])
      : null;
    onChange?.({
      status,
      coverage: classifyCoverage(
        view,
        geology.bounds as [number, number, number, number],
      ),
    });
  }
  function load() {
    const current = ++request;
    status = 'loading';
    report();
    SingleTileImageryProvider.fromUrl(geology.assetUrl, {
      rectangle: Rectangle.fromDegrees(
        ...(geology.bounds as [number, number, number, number]),
      ),
      ellipsoid: mars,
      credit:
        geology.credit + ' · SIM 3464 · regional geology; alignment unverified',
    })
      .then((provider) => {
        if (!alive || !enabled || request !== current) return;
        if (layer) viewer.imageryLayers.remove(layer, true);
        layer = viewer.imageryLayers.addImageryProvider(provider);
        // Categorical unit colours must not be interpolated into new colours.
        layer.minificationFilter = TextureMinificationFilter.NEAREST;
        layer.magnificationFilter = TextureMagnificationFilter.NEAREST;
        layer.alpha = opacity;
        status = 'ready';
        report();
        viewer.scene.requestRender();
      })
      .catch(() => {
        if (alive && enabled && request === current) {
          status = 'failed';
          report();
        }
      });
  }
  const removeCameraChanged = viewer.camera.changed.addEventListener(report);
  return {
    get layer() {
      return layer;
    },
    setOpacity(value: number) {
      opacity = Math.max(0, Math.min(1, value));
      if (layer) {
        layer.alpha = opacity;
        viewer.scene.requestRender();
      }
    },
    setEnabled(value: boolean) {
      if (enabled === value) return;
      enabled = value;
      if (!enabled) {
        request++;
        if (layer) layer.show = false;
        status = 'hidden';
        report();
        viewer.scene.requestRender();
      } else if (layer) {
        layer.show = true;
        status = 'ready';
        report();
        viewer.scene.requestRender();
      } else load();
    },
    retry() {
      if (enabled) load();
    },
    destroy() {
      alive = false;
      request++;
      removeCameraChanged();
      if (layer) viewer.imageryLayers.remove(layer, true);
    },
  };
}
