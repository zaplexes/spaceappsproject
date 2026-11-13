import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    // Feature tests start after onboarding; usage-guide.spec.ts tests first visits.
    storageState: {
      cookies: [],
      origins: [4173, 4175, 5176].map((port) => ({
        origin: `http://127.0.0.1:${port}`,
        localStorage: [
          { name: 'martian-map-guide-dismissed-v1', value: 'true' },
        ],
      })),
    },
    launchOptions: {
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    },
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  reporter: 'list',
});
