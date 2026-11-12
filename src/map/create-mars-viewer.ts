import { localAssetUrl } from '../data/asset-url';
import {
  Cartesian3,
  Color,
  Ellipsoid,
  EllipsoidTerrainProvider,
  GeographicProjection,
  GeographicTilingScheme,
  Globe,
  Math as CesiumMath,
  Rectangle,
  SingleTileImageryProvider,
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium';
import {
  imagerySources,
  jezeroView,
  tileUrl,
  type LayerId,
} from '../data/layers';
import elevation from '../data/generated/elevation.json' with { type: 'json' };
import { classifyCoverage, type Extent, type Coverage } from '../data/coverage';
import { createGeologyOverlay } from './create-geology-overlay';
export interface RasterOverlayState {
  status: LayerStatus;
  coverage: Coverage;
}
export type LayerStatus = 'loading' | 'ready' | 'failed' | 'hidden';
export type MapCommand =
  'jezero' | 'global' | 'in' | 'out' | 'north' | 'west' | 'south' | 'east';
// Reference sphere specified by the selected NASA Trek CTX catalog WKT.
export const marsReferenceEllipsoid = new Ellipsoid(3396190, 3396190, 3396190);
export function createMarsViewer(
  container: HTMLElement,
  onStatus: (id: LayerId, status: LayerStatus) => void,
  onMapFailure: () => void,
  onElevationChange?: (state: RasterOverlayState) => void,
  onGeologyChange?: (state: RasterOverlayState) => void,
) {
  const mars = marsReferenceEllipsoid;
  Ellipsoid.default = mars;
  const viewer = new Viewer(container, {
    globe: new Globe(mars),
    mapProjection: new GeographicProjection(mars),
    terrainProvider: new EllipsoidTerrainProvider({ ellipsoid: mars }),
    showRenderLoopErrors: false,
    baseLayer: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    skyBox: false,
    skyAtmosphere: false,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    contextOptions: { webgl: { alpha: false, preserveDrawingBuffer: true } },
  });
  viewer.scene.backgroundColor = Color.fromCssColorString('#101c20');
  viewer.scene.globe.baseColor = Color.fromCssColorString('#79574b');
  viewer.scene.globe.showGroundAtmosphere = false;
  viewer.scene.globe.enableLighting = false;
  if (viewer.scene.sun) viewer.scene.sun.show = false;
  if (viewer.scene.moon) viewer.scene.moon.show = false;
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 500;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 16000000;
  viewer.scene.screenSpaceCameraController.enableTilt = false;
  const canvas = viewer.canvas;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'Interactive Mars map. Use arrow keys to pan, plus or minus to zoom, and H to return to Jezero.',
  );
  const entries = new Map<
    LayerId,
    {
      layer: ReturnType<typeof viewer.imageryLayers.addImageryProvider>;
      timer: ReturnType<typeof setTimeout>;
      removeError: () => void;
      removeProgress: () => void;
      failed: boolean;
    }
  >();
  let alive = true;
  let elevationEnabled = false;
  let elevationStatus: LayerStatus = 'hidden';
  let elevationLayer: ReturnType<
    typeof viewer.imageryLayers.addImageryProvider
  > | null = null;
  let elevationRequest = 0;
  let elevationOpacity = 0.65;
  function reportElevation() {
    const rectangle = viewer.camera.computeViewRectangle(mars);
    const view: Extent | null = rectangle
      ? ([rectangle.west, rectangle.south, rectangle.east, rectangle.north].map(
          CesiumMath.toDegrees,
        ) as [number, number, number, number])
      : null;
    onElevationChange?.({
      status: elevationStatus,
      coverage: classifyCoverage(
        view,
        elevation.bounds as [number, number, number, number],
      ),
    });
  }
  function orderLayers() {
    const regional = entries.get('jezero');
    if (regional) viewer.imageryLayers.raiseToTop(regional.layer);
    if (elevationLayer) viewer.imageryLayers.raiseToTop(elevationLayer);
    if (geologyOverlay.layer)
      viewer.imageryLayers.raiseToTop(geologyOverlay.layer);
  }
  const geologyOverlay = createGeologyOverlay(viewer, mars, onGeologyChange);
  function loadElevation() {
    const request = ++elevationRequest;
    elevationStatus = 'loading';
    reportElevation();
    SingleTileImageryProvider.fromUrl(localAssetUrl(elevation.assetUrl), {
      rectangle: Rectangle.fromDegrees(
        ...(elevation.bounds as [number, number, number, number]),
      ),
      ellipsoid: mars,
      credit:
        'NASA/JPL-Caltech/MSSS/USGS · Fergason et al. 2020 · CTX elevation colours',
    })
      .then((provider) => {
        if (!alive || request !== elevationRequest || !elevationEnabled) return;
        if (elevationLayer) viewer.imageryLayers.remove(elevationLayer, true);
        elevationLayer = viewer.imageryLayers.addImageryProvider(provider);
        elevationLayer.alpha = elevationOpacity;
        elevationStatus = 'ready';
        orderLayers();
        reportElevation();
        viewer.scene.requestRender();
      })
      .catch(() => {
        if (alive && request === elevationRequest && elevationEnabled) {
          elevationStatus = 'failed';
          reportElevation();
        }
      });
  }
  const removeCameraChanged =
    viewer.camera.changed.addEventListener(reportElevation);
  viewer.camera.percentageChanged = 0.05;
  function install(id: LayerId, show = true) {
    const source = imagerySources.find((s) => s.id === id)!;
    const previous = entries.get(id);
    if (previous) {
      clearTimeout(previous.timer);
      previous.removeError();
      previous.removeProgress();
      viewer.imageryLayers.remove(previous.layer, true);
    }
    const provider = new UrlTemplateImageryProvider({
      url: tileUrl(source),
      tilingScheme: new GeographicTilingScheme({ ellipsoid: mars }),
      rectangle: Rectangle.fromDegrees(...source.extent),
      maximumLevel: source.maxLevel,
      tileWidth: 256,
      tileHeight: 256,
      credit: source.credit,
    });
    const layer = viewer.imageryLayers.addImageryProvider(provider);
    layer.show = show;
    const fail = () => {
      const entry = entries.get(id);
      if (entry && entry.layer === layer && layer.show) {
        entry.failed = true;
        clearTimeout(entry.timer);
        onStatus(id, 'failed');
      }
    };
    const timer = setTimeout(fail, 20000);
    const removeError = provider.errorEvent.addEventListener(fail);
    const removeProgress =
      viewer.scene.globe.tileLoadProgressEvent.addEventListener(
        (pending: number) => {
          if (pending === 0 && layer.show && !entries.get(id)?.failed) {
            clearTimeout(timer);
            onStatus(id, 'ready');
          }
        },
      );
    entries.set(id, {
      layer,
      timer,
      removeError,
      removeProgress,
      failed: false,
    });
    // Keep the regional layer above global imagery, including after retry.
    orderLayers();
    onStatus(id, show ? 'loading' : 'hidden');
    viewer.scene.requestRender();
  }
  function command(action: MapCommand) {
    const camera = viewer.camera;
    if (action === 'jezero' || action === 'global') {
      camera.setView({
        destination: Cartesian3.fromDegrees(
          jezeroView.longitude,
          jezeroView.latitude,
          action === 'jezero' ? jezeroView.cameraHeight : 10000000,
          mars,
        ),
        orientation: { heading: 0, pitch: -CesiumMath.PI_OVER_TWO, roll: 0 },
      });
    } else {
      const step = camera.positionCartographic.height * 0.18;
      if (action === 'in') camera.zoomIn(step * 2);
      if (action === 'out') camera.zoomOut(step * 2);
      if (action === 'north') camera.moveUp(step);
      if (action === 'south') camera.moveDown(step);
      if (action === 'west') camera.moveLeft(step);
      if (action === 'east') camera.moveRight(step);
    }
    viewer.scene.requestRender();
  }
  const keys: Record<string, MapCommand> = {
    ArrowUp: 'north',
    ArrowDown: 'south',
    ArrowLeft: 'west',
    ArrowRight: 'east',
    '+': 'in',
    '=': 'in',
    '-': 'out',
    h: 'jezero',
    H: 'jezero',
  };
  const onKey = (event: KeyboardEvent) => {
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      command(action);
    }
  };
  canvas.addEventListener('keydown', onKey);
  const onLost = (event: Event) => {
    event.preventDefault();
    onMapFailure();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  const removeRenderError =
    viewer.scene.renderError.addEventListener(onMapFailure);
  command('jezero');
  install('global');
  install('jezero');
  return {
    command,
    setGeology: geologyOverlay.setEnabled,
    setGeologyOpacity: geologyOverlay.setOpacity,
    retryGeology: geologyOverlay.retry,
    setElevationOpacity(opacity: number) {
      elevationOpacity = Math.max(0, Math.min(1, opacity));
      if (elevationLayer) {
        elevationLayer.alpha = elevationOpacity;
        viewer.scene.requestRender();
      }
    },
    setElevation(enabled: boolean) {
      if (enabled === elevationEnabled) return;
      elevationEnabled = enabled;
      if (!enabled) {
        elevationRequest++;
        if (elevationLayer) elevationLayer.show = false;
        elevationStatus = 'hidden';
        reportElevation();
        viewer.scene.requestRender();
      } else if (elevationLayer) {
        elevationLayer.show = true;
        elevationStatus = 'ready';
        reportElevation();
        viewer.scene.requestRender();
      } else loadElevation();
    },
    retryElevation() {
      if (elevationEnabled) loadElevation();
    },
    toggle(id: LayerId, show: boolean) {
      const entry = entries.get(id);
      if (entry && entry.layer.show !== show) {
        entry.layer.show = show;
        onStatus(id, show ? (entry.failed ? 'failed' : 'loading') : 'hidden');
        viewer.scene.requestRender();
      }
    },
    retry(id: LayerId) {
      install(id);
    },
    destroy() {
      alive = false;
      elevationRequest++;
      removeCameraChanged();
      geologyOverlay.destroy();
      for (const entry of entries.values()) {
        clearTimeout(entry.timer);
        entry.removeError();
        entry.removeProgress();
      }
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('webglcontextlost', onLost);
      removeRenderError();
      if (!viewer.isDestroyed()) viewer.destroy();
    },
  };
}
