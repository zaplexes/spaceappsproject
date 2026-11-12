import { defineConfig } from '@playwright/test';
import shared from './playwright.config';
const base = process.env.MARTIAN_MAP_BASE_PATH ?? '/spaceappsproject/';
const url = `http://127.0.0.1:4175${base}`;
export default defineConfig({
  ...shared,
  testDir: './tests/hosting',
  use: { ...shared.use, baseURL: url },
  webServer: {
    command: 'npm run preview -- --port 4175',
    env: { MARTIAN_MAP_BASE_PATH: base },
    url,
    reuseExistingServer: false,
  },
});
