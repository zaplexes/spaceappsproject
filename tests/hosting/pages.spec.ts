import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const tile = fileURLToPath(new URL('../fixtures/imagery.png', import.meta.url));

test('static hosting loads the globe, all stop photos and both overlays inside its URL prefix', async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Missing hosting base URL');
  const location = new URL(baseURL.endsWith('/') ? baseURL : baseURL + '/');
  const errors: string[] = [];
  const escapedAssets: string[] = [];
  const badResponses: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (
      url.origin === location.origin &&
      !url.pathname.startsWith(location.pathname) &&
      url.pathname !== '/favicon.ico'
    )
      escapedAssets.push(url.pathname);
  });
  page.on('response', (res) => {
    if (new URL(res.url()).origin === location.origin && res.status() >= 400)
      badResponses.push(`${res.status()} ${res.url()}`);
  });
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: tile,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
  await page.goto('./');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible();
  for (const name of ['Skinner Ridge', 'Wildcat Ridge', 'Amalik']) {
    await page.getByRole('button', { name: new RegExp(name) }).click();
    const image = page.locator('.surface-reference img');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute(
      'src',
      new RegExp(`^${location.pathname}stops/`),
    );
  }
  await page.getByLabel('Jezero elevation colours').check();
  await expect(page.getByTestId('elevation-status')).toContainText('loaded');
  await page.getByLabel('Jezero regional geology', { exact: false }).check();
  await expect(page.getByTestId('geology-status')).toContainText('loaded');
  for (const path of [
    'cesium/Workers/createVerticesFromHeightmap.js',
    'cesium/Assets/approximateTerrainHeights.json',
  ]) {
    const response = await request.get(new URL(path, location).href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).not.toContain('text/html');
  }
  expect(errors).toEqual([]);
  expect(escapedAssets).toEqual([]);
  expect(badResponses).toEqual([]);
});
