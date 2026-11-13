import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { promisify } from 'node:util';

async function expectSurface(page: Page) {
  await expect
    .poll(() =>
      page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        if (!gl) throw new Error('WebGL unavailable');
        const pixel = new Uint8Array(4);
        gl.readPixels(
          Math.floor(canvas.width / 2),
          Math.floor(canvas.height / 2),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixel,
        );
        // The empty map background is RGB(16, 28, 32).
        return pixel[0] > 45;
      }),
    )
    .toBe(true);
}

test('development serves real workers and draws the globe after runtime preparation repeats', async ({
  page,
  request,
}) => {
  const tile = fileURLToPath(
    new URL('../fixtures/imagery.png', import.meta.url),
  );
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({ path: tile, contentType: 'image/png' }),
  );
  for (const name of [
    'createVerticesFromHeightmap.js',
    'transferTypedArrayTest.js',
  ]) {
    const worker = await request.get(`/cesium/Workers/${name}`);
    expect(worker.ok()).toBe(true);
    expect(worker.headers()['content-type']).toMatch(/javascript/);
    expect(await worker.text()).not.toContain('<!doctype html>');
  }
  const missing = await request.get('/cesium/Workers/does-not-exist.js');
  expect(missing.status()).toBe(404);
  await page.goto('/');
  await expect(
    page.getByText('Global MOC imagery: loaded', { exact: true }),
  ).toBeVisible();
  await expectSurface(page);
  const path = 'assets/cesium/Workers/transferTypedArrayTest.js';
  const before = await stat(path);
  await promisify(execFile)(process.execPath, ['scripts/prepare-cesium.mjs']);
  const after = await stat(path);
  expect(after.ino).toBe(before.ino);
  expect(after.mtimeMs).toBe(before.mtimeMs);
  await page.reload();
  await expectSurface(page);
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(page.getByTestId('candidate-highlight')).toBeVisible();
  await expectSurface(page);
});

test('development draws the cached overview when live imagery is unreachable', async ({
  page,
}) => {
  await page.route('https://trek.nasa.gov/tiles/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByTestId('imagery-fallback-note')).toBeVisible();
  await expectSurface(page);
  await page
    .locator('.map-section')
    .screenshot({ path: 'docs/development-globe-fallback.png' });
});
