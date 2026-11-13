import { openMapStatus, openWorldLayers } from './map-controls';
import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const detail = fileURLToPath(new URL('./fixtures/hirise.png', import.meta.url));
const ctxPattern =
  'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/**';

async function centreColour(page: Page) {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) throw new Error('WebGL unavailable');
    const rgba = new Uint8Array(4);
    gl.readPixels(
      Math.floor(canvas.width / 2),
      Math.floor(canvas.height / 2),
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba,
    );
    return Array.from(rgba);
  });
}

test('live base and CTX outages retain cached surface imagery, evidence and retries', async ({
  page,
}) => {
  let failing = true;
  await page.route('https://trek.nasa.gov/tiles/**', (route) => route.abort());
  await page.route(ctxPattern, (route) =>
    failing
      ? route.abort()
      : route.fulfill({ path: detail, contentType: 'image/png' }),
  );
  await page.goto('/');
  await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
    'open',
  );
  await openWorldLayers(page);
  await openMapStatus(page);
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(page.getByTestId('imagery-fallback-note')).toBeVisible();
  await expect(page.getByTestId('candidate-highlight')).toBeVisible();
  await expect
    .poll(async () => {
      const [r, g, b] = await centreColour(page);
      return r > 50 && Math.abs(r - g) < 3 && Math.abs(g - b) < 3;
    })
    .toBe(true);
  failing = false;
  await page
    .getByText('Global CTX imagery: unavailable — partial or no coverage', {
      exact: true,
    })
    .locator('..')
    .getByRole('button', { name: 'Retry', exact: true })
    .click();
  await expect
    .poll(async () => {
      const [r, , b] = await centreColour(page);
      return b > r;
    })
    .toBe(true);
});

test('one failed CTX ancestor does not block successful detailed tiles', async ({
  page,
}) => {
  await page.route('https://trek.nasa.gov/tiles/**', (route) => route.abort());
  await page.route(ctxPattern, (route) =>
    /\/tile\/1\//.test(route.request().url())
      ? route.abort()
      : route.fulfill({ path: detail, contentType: 'image/png' }),
  );
  await page.goto('/');
  await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
    'open',
  );
  await openWorldLayers(page);
  await openMapStatus(page);
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(page.getByTestId('imagery-fallback-note')).toBeVisible();
  await expect
    .poll(async () => {
      const [r, , b] = await centreColour(page);
      return b > r;
    })
    .toBe(true);
  await page
    .locator('.map-section')
    .screenshot({ path: 'docs/imagery-fallback.png' });
});

test('stalled detail tiles keep loaded parent imagery after the timeout', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const base = fileURLToPath(
    new URL('./fixtures/imagery.png', import.meta.url),
  );
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({ path: base, contentType: 'image/png' }),
  );
  await page.route(ctxPattern, async (route) => {
    const level = Number(
      route.request().url().split('/tile/')[1].split('/')[0],
    );
    if (level >= 5) {
      await gate;
      await route.abort();
    } else await route.fulfill({ path: detail, contentType: 'image/png' });
  });
  try {
    await page.goto('/');
    await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
      'open',
    );
    await openWorldLayers(page);
    await openMapStatus(page);
    await page.getByRole('button', { name: /Skinner Ridge/ }).click();
    await expect(page.getByTestId('imagery-fallback-note')).toBeVisible({
      timeout: 15000,
    });
    await expect
      .poll(async () => {
        const [r, , b] = await centreColour(page);
        return b > r;
      })
      .toBe(true);
  } finally {
    release();
  }
});
