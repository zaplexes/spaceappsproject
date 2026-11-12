import {
  Cartesian3,
  Ellipsoid,
  EllipsoidalOccluder,
  Math as CesiumMath,
  SceneTransforms,
  type Viewer,
} from 'cesium';
import type { CandidateLocation } from '../data/candidate-locations';

// A fixed-size screen marker represents selection, not a measured uncertainty
// radius. Project its reference position each frame so pan/zoom/resize stay in sync.
export function createCandidateHighlight(
  viewer: Viewer,
  mars: Ellipsoid,
  element: HTMLElement,
) {
  let position: Cartesian3 | null = null;
  function update() {
    if (!position) {
      element.hidden = true;
      return;
    }
    const occluder = new EllipsoidalOccluder(mars, viewer.camera.positionWC);
    const window = SceneTransforms.worldToWindowCoordinates(
      viewer.scene,
      position,
    );
    const visible =
      window &&
      occluder.isPointVisible(position) &&
      window.x >= 0 &&
      window.y >= 0 &&
      window.x <= viewer.canvas.clientWidth &&
      window.y <= viewer.canvas.clientHeight;
    element.hidden = !visible;
    if (visible && window) {
      element.style.left = `${window.x}px`;
      element.style.top = `${window.y}px`;
    }
  }
  const removePostRender = viewer.scene.postRender.addEventListener(update);
  return {
    select(candidate: CandidateLocation | null, focus: boolean) {
      position = candidate
        ? Cartesian3.fromDegrees(
            candidate.displayLongitude,
            candidate.displayLatitude,
            0,
            mars,
          )
        : null;
      if (candidate && focus) {
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(
            candidate.displayLongitude,
            candidate.displayLatitude,
            candidate.focusHeightMetres ?? 4500,
            mars,
          ),
          orientation: { heading: 0, pitch: -CesiumMath.PI_OVER_TWO, roll: 0 },
        });
      }
      update();
      viewer.scene.requestRender();
    },
    destroy() {
      removePostRender();
      element.hidden = true;
    },
  };
}
