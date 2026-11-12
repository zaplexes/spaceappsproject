import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
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
    plugins: [react()],
    publicDir: 'assets',
    define: { CESIUM_BASE_URL: JSON.stringify(`${base}cesium/`) },
  };
});
