import { RequestState, type UrlTemplateImageryProvider } from 'cesium';
import { localAssetUrl } from '../data/asset-url';
import overview from '../data/generated/moc-overview.json' with { type: 'json' };

const overviewImages = new Map<number, Promise<HTMLImageElement>>();
function loadOverview(hemisphere: number) {
  let pending = overviewImages.get(hemisphere);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        overviewImages.delete(hemisphere);
        reject(new Error('Cached Mars overview unavailable'));
      };
      image.src = localAssetUrl(overview.tiles[hemisphere].assetUrl);
    });
    overviewImages.set(hemisphere, pending);
  }
  return pending;
}

// Let descendants load even when a coarse ancestor tile fails. Transparent
// tiles reuse a loaded ancestor where possible; otherwise overlays reveal the
// base and failed base tiles use the matching overview crop.
export function addImageryFallback(
  provider: UrlTemplateImageryProvider,
  base: boolean,
  onFallback: () => void,
) {
  const requestImage = provider.requestImage.bind(provider);
  const loaded = new Map<
    string,
    HTMLImageElement | HTMLCanvasElement | ImageBitmap
  >();
  provider.requestImage = (x, y, level, request) => {
    const pending = requestImage(x, y, level, request);
    // Undefined means Cesium throttled this request; preserve its retry path.
    if (!pending) return undefined;
    let timeout: ReturnType<typeof setTimeout>;
    const deadline = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error('Live imagery timed out')),
        8000,
      );
    });
    return Promise.race([pending, deadline])
      .then((image) => {
        if (
          image instanceof HTMLImageElement ||
          image instanceof HTMLCanvasElement ||
          image instanceof ImageBitmap
        ) {
          loaded.set(`${level}/${x}/${y}`, image);
          if (loaded.size > 128) loaded.delete(loaded.keys().next().value!);
        }
        return image;
      })
      .finally(() => clearTimeout(timeout))
      .catch(async (error: unknown) => {
        if (request?.state === RequestState.CANCELLED) throw error;
        onFallback();
        const canvas = document.createElement('canvas');
        canvas.width = provider.tileWidth;
        canvas.height = provider.tileHeight;
        // Keep already loaded detail when a child is missing or corrupt.
        for (let parent = level - 1; parent >= 0; parent--) {
          const scale = 2 ** (level - parent);
          const image = loaded.get(
            `${parent}/${Math.floor(x / scale)}/${Math.floor(y / scale)}`,
          );
          if (!image) continue;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot draw parent imagery');
          context.drawImage(
            image,
            ((x % scale) / scale) * image.width,
            ((y % scale) / scale) * image.height,
            image.width / scale,
            image.height / scale,
            0,
            0,
            canvas.width,
            canvas.height,
          );
          return canvas;
        }
        if (base) {
          const scale = 2 ** level;
          const hemisphere = Math.floor(x / scale);
          const image = await loadOverview(hemisphere);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot draw Mars overview');
          context.drawImage(
            image,
            ((x % scale) / scale) * image.width,
            (y / scale) * image.height,
            image.width / scale,
            image.height / scale,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
        return canvas;
      });
  };
}
