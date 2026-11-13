import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
export async function mockWorldTiles(page: Page) {
  await page.route(
    'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/**',
    (route) => route.fulfill({ path: tile, contentType: 'image/png' }),
  );
  await page.route(
    'https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/**',
    (route) => route.fulfill({ path: tile, contentType: 'image/png' }),
  );
}
