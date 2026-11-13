import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import review from '../data/manifests/nomenclature-review.json' with { type: 'json' };
import { mockWorldTiles } from './mock-world-tiles';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
const index = JSON.parse(
  readFileSync(
    new URL(`../assets${review.index.assetUrl}`, import.meta.url),
    'utf8',
  ),
);
const indexPattern = '**/catalog/index-*.json';

test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({ path: tile, contentType: 'image/png' }),
  );
});

test('real catalogue supports bounded browsing, region/type filters and candidate selection', async ({
  page,
}) => {
  const errors: string[] = [];
  const catalogRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('/catalog/'))
      catalogRequests.push(request.url());
  });
  await page.goto('/');
  expect(catalogRequests).toHaveLength(0);
  const browser = page.getByRole('region', { name: 'Mars feature catalogue' });
  await browser.getByText('Discover Mars features', { exact: true }).click();
  await expect(
    browser.getByText(`${review.craterCount} matching features`, {
      exact: true,
    }),
  ).toBeVisible();
  expect(catalogRequests).toHaveLength(1);
  await expect(browser.locator('.catalog-results button')).toHaveCount(8);
  await browser.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(
    browser.getByRole('button', { name: 'Previous', exact: true }),
  ).toBeEnabled();
  await browser.getByLabel('Search features').fill('Jezero');
  await expect(
    browser.getByRole('button', { name: 'Previous', exact: true }),
  ).toBeDisabled();
  await browser.getByLabel('Catalogue region').selectOption('mc23');
  await expect(
    browser.getByText('0 matching features', { exact: true }),
  ).toBeVisible();
  await browser.getByLabel('Catalogue region').selectOption('jezero');
  await expect(browser.getByRole('button', { name: /^Jezero / })).toBeVisible();
  await browser.getByRole('button', { name: /^Jezero / }).click();
  const details = page.getByRole('region', {
    name: 'Catalogue feature details',
  });
  await expect(
    details.getByRole('heading', { name: 'Jezero', exact: true }),
  ).toBeVisible();
  await expect(details).toContainText('18.4082');
  await expect(details).toContainText('77.6873');
  await expect(
    details.getByRole('link', { name: 'Official feature record' }),
  ).toHaveAttribute('href', 'https://planetarynames.wr.usgs.gov/Feature/14300');
  const marker = page.getByTestId('candidate-highlight');
  await expect(marker).toBeVisible();
  await expect(marker).toHaveAttribute(
    'aria-label',
    'Jezero: catalogue centre, observation site unverified',
  );
  await expect(page.getByTestId('candidate-warning')).toContainText(
    'not an observation site',
  );
  await details
    .getByRole('button', { name: 'Add candidate science stop' })
    .click();
  const stops = page.locator('#science-stops');
  await expect(stops.locator('.count')).toHaveText('4');
  await expect(
    details.getByRole('button', { name: 'Added to candidate stops' }),
  ).toBeDisabled();
  await expect(stops.getByRole('button', { name: /Jezero/ })).toBeVisible();
  await stops.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(marker).toHaveAttribute(
    'aria-label',
    'Skinner Ridge: approximate, unverified location',
  );
  await stops.getByRole('button', { name: /Jezero/ }).click();
  await expect(details).toContainText('Candidate science stop · review needed');
  await details.getByRole('button', { name: 'Remove candidate stop' }).click();
  await expect(stops.locator('.count')).toHaveText('3');
  await browser.getByLabel('Catalogue region').selectOption('all');
  await browser.getByLabel('Search features').fill('Olympus');
  await expect(
    browser.getByText('0 matching features', { exact: true }),
  ).toBeVisible();
  await browser.getByLabel('Feature type').selectOption('MO');
  await browser.getByRole('button', { name: /^Olympus Mons / }).click();
  await expect(
    details.getByRole('heading', { name: 'Olympus Mons' }),
  ).toBeVisible();
  await expect(details).toContainText('226.1975° E');
  await expect(marker).toBeVisible();
  await expect(marker).toContainText('Olympus Mons');
  await expect(
    page.getByLabel('Jezero HiRISE imagery').locator('..'),
  ).toContainText('Outside this viewport');
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await browser.getByRole('button', { name: /^Olympus Mons / }).click();
  await expect(marker).toBeVisible();
  await details
    .getByRole('button', { name: 'Add candidate science stop' })
    .click();
  await expect(page.getByRole('button', { name: 'Compare stops' })).toHaveCount(
    0,
  );
  await details
    .getByText('Catalogue provenance & limitations', { exact: true })
    .click();
  await expect(details).toContainText('legacy metadata');
  await expect(details).toContainText('not a complete catalogue');
  await details
    .getByText('Catalogue provenance & limitations', { exact: true })
    .click();
  await page.locator('.details-panel').evaluate((panel) => {
    panel.scrollTop = 0;
  });
  await browser.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await page.screenshot({ path: 'docs/catalogue-desktop.png' });
  await page.reload();
  await expect(page.locator('#science-stops .count')).toHaveText('3');
  expect(errors).toEqual([]);
});

test('catalogue loading, version/coordinate failures and retry preserve science evidence', async ({
  page,
}) => {
  let mode: 'fail' | 'wrong-version' | 'wrong-coordinates' | 'success' = 'fail';
  await page.route(indexPattern, async (route) => {
    if (mode === 'fail')
      return route.fulfill({ status: 503, body: 'Unavailable' });
    if (mode === 'success') return route.continue();
    const payload = structuredClone(index);
    if (mode === 'wrong-version') payload.sourceSha256 = 'wrong';
    else payload.entries[0].latitude = 200;
    return route.fulfill({ json: payload });
  });
  await page.goto('/');
  const browser = page.getByRole('region', { name: 'Mars feature catalogue' });
  await browser.getByText('Discover Mars features', { exact: true }).click();
  const retry = browser.getByRole('button', { name: 'Retry catalogue' });
  await expect(retry).toBeVisible();
  for (const next of ['wrong-version', 'wrong-coordinates'] as const) {
    mode = next;
    await retry.click();
    await expect(retry).toBeVisible();
    await expect(browser.getByLabel('Search features')).toHaveCount(0);
  }
  await page
    .locator('#science-stops')
    .getByRole('button', { name: /Amalik/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Amalik', exact: true }),
  ).toBeVisible();
  mode = 'success';
  await retry.click();
  await expect(browser.getByLabel('Search features')).toBeVisible();
  await browser.getByLabel('Search features').fill('Gale');
  let failDetails = true;
  await page.route('**/catalog/mc23-*.json', (route) =>
    failDetails ? route.fulfill({ status: 503 }) : route.continue(),
  );
  await browser.getByRole('button', { name: /^Gale / }).click();
  await expect(
    browser.getByRole('button', { name: 'Retry feature details' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Amalik', exact: true }),
  ).toBeVisible();
  failDetails = false;
  await browser.getByRole('button', { name: 'Retry feature details' }).click();
  await expect(
    page.getByRole('heading', { name: 'Gale', exact: true }),
  ).toBeVisible();
});

test('late feature requests cannot override a newer choice or changed filters', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/catalog/mc13-*.json', async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto('/');
  const browser = page.getByRole('region', { name: 'Mars feature catalogue' });
  await browser.getByText('Discover Mars features', { exact: true }).click();
  await browser.getByLabel('Search features').fill('Jezero');
  await browser.getByRole('button', { name: /^Jezero / }).click();
  await expect(
    browser.getByText('Loading Jezero details…', { exact: true }),
  ).toBeVisible();
  await browser.getByLabel('Search features').fill('Gale');
  await browser.getByRole('button', { name: /^Gale / }).click();
  await expect(
    page.getByRole('heading', { name: 'Gale', exact: true }),
  ).toBeVisible();
  await browser.getByLabel('Search features').fill('Jezero');
  await browser.getByRole('button', { name: /^Jezero / }).click();
  await page
    .locator('#science-stops')
    .getByRole('button', { name: /Skinner Ridge/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Skinner Ridge', exact: true }),
  ).toBeVisible();
  release();
  await expect(
    browser.getByText('Loading Jezero details…', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Skinner Ridge', exact: true }),
  ).toBeVisible();
});

test('mobile keyboard browsing and candidate records work without WebGL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    }),
  );
  await page.goto('/');
  const browser = page.getByRole('region', { name: 'Mars feature catalogue' });
  const summary = browser.getByText('Discover Mars features', { exact: true });
  await summary.focus();
  await summary.press('Enter');
  await browser.getByLabel('Search features').fill('Gale');
  await browser.getByRole('button', { name: /^Gale / }).focus();
  await page.keyboard.press('Enter');
  const details = page.getByRole('region', {
    name: 'Catalogue feature details',
  });
  await expect(details.getByRole('heading', { name: 'Gale' })).toBeVisible();
  await details
    .getByRole('button', { name: 'Add candidate science stop' })
    .click();
  await expect(page.locator('#science-stops .count')).toHaveText('4');
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await browser.screenshot({ path: 'docs/catalogue-mobile.png' });
});
