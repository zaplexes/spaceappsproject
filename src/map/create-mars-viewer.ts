import { addImageryFallback } from './imagery-fallback';
import { localAssetUrl } from '../data/asset-url';
import {
  Cartesian3,
  ConstantPositionProperty,
  Color,
  ArcType,
  PolylineDashMaterialProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  Ellipsoid,
  EllipsoidTerrainProvider,
  GeographicProjection,
  GeographicTilingScheme,
  Globe,
  TextureMagnificationFilter,
  TextureMinificationFilter,
  Math as CesiumMath,
  Rectangle,
  SingleTileImageryProvider,
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium';
import {
  tileSources,
  jezeroView,
  tileUrl,
  initialLayerVisibility,
  type LayerId,
} from '../data/layers';
import elevation from '../data/generated/elevation.json' with { type: 'json' };
import { classifyCoverage, type Extent, type Coverage } from '../data/coverage';
import { createGeologyOverlay } from './create-geology-overlay';
import { createCandidateHighlight } from './create-candidate-highlight';
import { createRasterOverlay } from './create-raster-overlay';
import slope from '../data/generated/slope.json' with { type: 'json' };
import { layerCoverage, type LayerCoverage } from './layer-coverage';
import { isWorldColour } from '../data/layers';
import type { BasePosition } from '../planning/BasePoint';
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
  candidateElement?: HTMLElement,
  onHiRISECoverage?: (coverage: Coverage) => void,
  onSlopeChange?: (state: RasterOverlayState) => void,
  onLayerCoverage?: (coverage: LayerCoverage) => void,
  onCameraHeightChange?: (height: number) => void,
  onSurfaceClick?: (position: BasePosition) => void,
  onViewportChange?: (extent: Extent | null) => void,
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
  const baseMarker = viewer.entities.add({
    name: 'Simulated astronaut base',
    show: false,
    point: {
      pixelSize: 14,
      color: Color.CYAN,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: 'Simulated base',
      font: '14px sans-serif',
      pixelOffset: new Cartesian2(0, -24),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
  const surfaceClicks = new ScreenSpaceEventHandler(canvas);
  surfaceClicks.setInputAction((event: { position: Cartesian2 }) => {
    const point = viewer.camera.pickEllipsoid(event.position, mars);
    if (!point) return;
    const coordinates = mars.cartesianToCartographic(point);
    onSurfaceClick?.({
      latitude: CesiumMath.toDegrees(coordinates.latitude),
      longitude: CesiumMath.toDegrees(coordinates.longitude),
    });
  }, ScreenSpaceEventType.LEFT_CLICK);
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
  let worldOpacity = 0.65;
  function reportElevation() {
    onCameraHeightChange?.(viewer.camera.positionCartographic.height);
    const rectangle = viewer.camera.computeViewRectangle(mars);
    const view: Extent | null = rectangle
      ? ([rectangle.west, rectangle.south, rectangle.east, rectangle.north].map(
          CesiumMath.toDegrees,
        ) as [number, number, number, number])
      : null;
    onViewportChange?.(view);
    const hirise = tileSources.find((source) => source.id === 'hirise');
    if (hirise) onHiRISECoverage?.(classifyCoverage(view, hirise.extent));
    onLayerCoverage?.(layerCoverage(view));
    onElevationChange?.({
      status: elevationStatus,
      coverage: classifyCoverage(
        view,
        elevation.bounds as [number, number, number, number],
      ),
    });
  }
  function orderLayers() {
    for (const id of [
      'global',
      'ctx-global',
      'jezero',
      'hirise',
      'themis',
      'relief-global',
      'geology-global',
    ] as const) {
      const regional = entries.get(id);
      if (regional) viewer.imageryLayers.raiseToTop(regional.layer);
    }
    if (elevationLayer) viewer.imageryLayers.raiseToTop(elevationLayer);
    if (geologyOverlay.layer)
      viewer.imageryLayers.raiseToTop(geologyOverlay.layer);
    if (slopeOverlay.layer) viewer.imageryLayers.raiseToTop(slopeOverlay.layer);
  }
  const geologyOverlay = createGeologyOverlay(viewer, mars, onGeologyChange);
  const slopeOverlay = createRasterOverlay(
    viewer,
    mars,
    {
      assetUrl: slope.assetUrl,
      bounds: slope.bounds,
      credit:
        'USGS · Fergason et al. (2020) · locally derived DEM gradient; not walkability',
    },
    onSlopeChange,
  );
  const candidateHighlight = candidateElement
    ? createCandidateHighlight(viewer, mars, candidateElement)
    : null;
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
  const removeCameraMoveEnd =
    viewer.camera.moveEnd.addEventListener(reportElevation);
  viewer.camera.percentageChanged = 0.05;
  function install(id: LayerId, show = true) {
    const source = tileSources.find((s) => s.id === id)!;
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
      tileWidth: source.tileSize ?? 256,
      tileHeight: source.tileSize ?? 256,
      credit: source.credit,
    });
    const layer = viewer.imageryLayers.addImageryProvider(provider);
    if (isWorldColour(id)) layer.alpha = worldOpacity;
    if (id === 'geology-global') {
      layer.magnificationFilter = TextureMagnificationFilter.NEAREST;
      layer.minificationFilter = TextureMinificationFilter.NEAREST;
    }
    layer.show = show;
    const fail = () => {
      const entry = entries.get(id);
      if (entry && entry.layer === layer && layer.show) {
        entry.failed = true;
        clearTimeout(entry.timer);
        onStatus(id, 'failed');
      }
    };
    if (id === 'global' || id === 'ctx-global')
      addImageryFallback(provider, id === 'global', fail);
    const timer = setTimeout(fail, 20000);
    const removeError = provider.errorEvent.addEventListener(fail);
    const removeProgress =
      viewer.scene.globe.tileLoadProgressEvent.addEventListener(
        (pending: number) => {
          if (layer.show && !entries.get(id)?.failed) {
            if (pending === 0) clearTimeout(timer);
            onStatus(id, pending === 0 ? 'ready' : 'loading');
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
    reportElevation();
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
  command('global');
  for (const source of tileSources) {
    if (initialLayerVisibility[source.id]) install(source.id);
  }
  const tripLines: ReturnType<typeof viewer.entities.add>[] = [];
  return {
    setTripPath(path: readonly BasePosition[]) {
      for (const line of tripLines) viewer.entities.remove(line);
      tripLines.length = 0;
      for (let i = 1; i < path.length; i++) {
        // Per-leg geometry avoids joining through the globe or across a seam.
        tripLines.push(
          viewer.entities.add({
            name: 'Hypothetical distance-only segment; not a rover track or validated route',
            polyline: {
              positions: Cartesian3.fromDegreesArray(
                [
                  path[i - 1].longitude,
                  path[i - 1].latitude,
                  path[i].longitude,
                  path[i].latitude,
                ],
                mars,
              ),
              width: 3,
              arcType: ArcType.GEODESIC,
              material: new PolylineDashMaterialProperty({ color: Color.CYAN }),
            },
          }),
        );
      }
      viewer.scene.requestRender();
    },
    setBase(base: BasePosition | null) {
      baseMarker.show = base !== null;
      if (base)
        baseMarker.position = new ConstantPositionProperty(
          Cartesian3.fromDegrees(base.longitude, base.latitude, 0, mars),
        );
      viewer.scene.requestRender();
    },
    command,
    highlightCandidate: candidateHighlight?.select,
    setGeology: geologyOverlay.setEnabled,
    setGeologyOpacity: geologyOverlay.setOpacity,
    retryGeology: geologyOverlay.retry,
    setSlope: slopeOverlay.setEnabled,
    setSlopeOpacity: slopeOverlay.setOpacity,
    retrySlope: slopeOverlay.retry,
    setWorldOpacity(opacity: number) {
      worldOpacity = Math.max(0, Math.min(1, opacity));
      for (const [id, entry] of entries)
        if (isWorldColour(id)) entry.layer.alpha = worldOpacity;
      viewer.scene.requestRender();
    },
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
      if (!entry && show) {
        install(id);
        return;
      }
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
      surfaceClicks.destroy();
      alive = false;
      elevationRequest++;
      removeCameraChanged();
      removeCameraMoveEnd();
      geologyOverlay.destroy();
      slopeOverlay.destroy();
      candidateHighlight?.destroy();
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
