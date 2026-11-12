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
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium';
import {
  imagerySources,
  jezeroView,
  tileUrl,
  type LayerId,
} from '../data/layers';
export type LayerStatus = 'loading' | 'ready' | 'failed' | 'hidden';
export type MapCommand =
  'jezero' | 'global' | 'in' | 'out' | 'north' | 'west' | 'south' | 'east';
// Reference sphere specified by the selected NASA Trek CTX catalog WKT.
export const marsReferenceEllipsoid = new Ellipsoid(3396190, 3396190, 3396190);
export function createMarsViewer(
  container: HTMLElement,
  onStatus: (id: LayerId, status: LayerStatus) => void,
  onMapFailure: () => void,
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
    const regional = entries.get('jezero');
    if (regional) viewer.imageryLayers.raiseToTop(regional.layer);
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
