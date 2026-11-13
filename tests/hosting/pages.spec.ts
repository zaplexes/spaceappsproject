import { openJezeroControls } from '../jezero-controls';
import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import catalogueReview from '../../data/manifests/nomenclature-review.json' with { type: 'json' };
import { mockWorldTiles } from '../mock-world-tiles';
const tile = fileURLToPath(new URL('../fixtures/imagery.png', import.meta.url));

test('static hosting loads the globe, all stop photos and both overlays inside its URL prefix', async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Missing hosting base URL');
  await mockWorldTiles(page);
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
  await expect(page).toHaveTitle('Marsway · Choose your next destination');
  await expect(page.locator('.brand-logo')).toHaveAttribute(
    'src',
    `${location.pathname}branding/marsway-logo.png`,
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    'href',
    `${location.pathname}branding/marsway-logo.png`,
  );
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeVisible();
  await openJezeroControls(page, true);
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible();
  await expect(page.getByText('Jezero HiRISE imagery: loaded')).toBeVisible();
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
  await page.getByLabel('Jezero estimated slope', { exact: false }).check();
  await expect(page.getByTestId('slope-status')).toContainText('loaded');
  await expect(page.getByTestId('candidate-highlight')).toBeVisible();
  const plan = page.getByRole('region', { name: 'Amalik science plan' });
  await plan.getByText('Proposed science tasks', { exact: true }).click();
  await expect(plan).toContainText('Proposed tasks · Walking astronauts');
  await page.getByText('Enter coordinates instead', { exact: true }).click();
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  await page
    .getByRole('button', { name: 'Add three Jezero references to trip' })
    .click();
  const trip = page.getByRole('region', { name: 'Round-trip planner' });
  await trip
    .getByText('Sampled terrain context · exploratory', { exact: true })
    .click();
  await expect(trip).toContainText('arc samples have local elevation context');
  const contextResponse = await request.get(
    new URL('terrain-context.json', location).href,
  );
  expect(contextResponse.ok()).toBe(true);
  await expect(
    page.getByRole('region', { name: 'Historical MEDA observations' }),
  ).toContainText('718 Pa');
  const catalogue = page.getByRole('region', {
    name: 'Mars feature catalogue',
  });
  await catalogue.getByText('Discover Mars features', { exact: true }).click();
  await catalogue.getByLabel('Search features').fill('Gale');
  await catalogue.getByRole('button', { name: /^Gale / }).click();
  const feature = page.getByRole('region', {
    name: 'Catalogue feature details',
  });
  await expect(
    feature.getByRole('heading', { name: 'Gale', exact: true }),
  ).toBeVisible();
  await feature
    .getByRole('button', { name: 'Add candidate science stop' })
    .click();
  await expect(page.locator('#science-stops .count')).toHaveText('4');
  await expect(page.getByTestId('candidate-highlight')).toContainText('Gale');
  await expect(
    page.getByText('Global CTX imagery: loaded', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('checkbox', { name: /^Global geological context/ })
    .check();
  await expect(
    page.getByRole('region', { name: 'Global geology legend' }),
  ).toBeVisible();
  await expect(
    page.getByText('Global geological context: loaded', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('checkbox', { name: /^Global elevation context/ })
    .check();
  await expect(
    page.getByText('Global elevation context: loaded', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: /^Global geological context/ }),
  ).not.toBeChecked();
  await feature
    .getByText('Catalogue provenance & limitations', { exact: true })
    .click();
  const exportLink = feature.getByRole('link', {
    name: 'Download retained USGS export',
  });
  await expect(exportLink).toHaveAttribute(
    'href',
    `${location.pathname}${catalogueReview.snapshot.assetUrl.slice(1)}`,
  );
  const exportResponse = await request.get(
    new URL((await exportLink.getAttribute('href'))!, location).href,
  );
  expect(exportResponse.ok()).toBe(true);
  expect(
    createHash('sha256')
      .update(await exportResponse.body())
      .digest('hex'),
  ).toBe(catalogueReview.sourceSha256);
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
