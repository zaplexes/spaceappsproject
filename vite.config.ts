import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cesiumRuntimePlugin } from './scripts/cesium-runtime-plugin';
// Prepare before Vite caches public files, including when launched directly.
// @ts-expect-error The asset preparation script also runs directly under Node.
import { prepareCesium } from './scripts/prepare-cesium.mjs';
export default defineConfig(async ({ mode }) => {
  await prepareCesium();
  const env = loadEnv(mode, process.cwd(), 'MARTIAN_MAP_');
  const base =
    process.env.MARTIAN_MAP_BASE_PATH ?? env.MARTIAN_MAP_BASE_PATH ?? '/';
  if (
    !base.startsWith('/') ||
    !base.endsWith('/') ||
    base.includes('..') ||
    /[?#\\]/.test(base)
  )
    throw new Error(
      'MARTIAN_MAP_BASE_PATH must be a URL path beginning and ending with /',
    );
  return {
    base,
    plugins: [cesiumRuntimePlugin(base), react()],
    publicDir: 'assets',
    define: { CESIUM_BASE_URL: JSON.stringify(`${base}cesium/`) },
  };
});
