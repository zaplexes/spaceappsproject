import { defineConfig } from '@playwright/test';
import shared from './playwright.config';

export default defineConfig({
  ...shared,
  testDir: './tests/development',
  testMatch: '**/*.dev.ts',
  use: { ...shared.use, baseURL: 'http://127.0.0.1:5176' },
  webServer: {
    // Launch directly: asset preparation must not depend on npm's predev hook.
    command: 'npx vite --host 127.0.0.1 --port 5176 --strictPort',
    url: 'http://127.0.0.1:5176',
    reuseExistingServer: false,
  },
});
