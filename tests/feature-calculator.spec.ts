import { expect, test } from '@playwright/test';
import {
  distanceKm,
  initialStudyInterest,
  initialWeights,
  MARS_RADIUS_KM,
  rankFeatures,
} from '../src/planning/ranking';
import type { CatalogEntry } from '../src/catalog/catalog';
import { mockWorldTiles } from './mock-world-tiles';
import { fileURLToPath } from 'node:url';

const entry = (
  id: string,
  longitude: number,
  typeCode = 'AA',
): CatalogEntry => ({
  id,
  name: id,
  searchName: id,
  typeCode,
  regionId: 'mc01',
  latitude: 0,
  longitude,
});
const base = { latitude: 0, longitude: 0 };

test('Mars distances handle identical positions, poles, the seam and antipodes', () => {
  expect(distanceKm(base, base)).toBe(0);
  expect(distanceKm(base, { latitude: 0, longitude: 180 })).toBeCloseTo(
    Math.PI * MARS_RADIUS_KM,
    6,
  );
  expect(
    distanceKm(
      { latitude: 0, longitude: 179 },
      { latitude: 0, longitude: -179 },
    ),
  ).toBeCloseTo((2 * Math.PI * MARS_RADIUS_KM) / 180, 6);
  expect(
    distanceKm(
      { latitude: 90, longitude: 0 },
      { latitude: 90, longitude: 180 },
    ),
  ).toBeCloseTo(0, 6);
});

test('value can outrank proximity; terrain remains unknown and weights change the outcome', () => {
  const candidates = [entry('iau-1', 0.01), entry('iau-2', 0.1, 'VA')];
  const ranked = rankFeatures(
    candidates,
    base,
    100,
    initialWeights,
    initialStudyInterest,
  );
  expect(ranked[0].entry.id).toBe('iau-2');
  expect(ranked[0].studyPoints).toBe(50);
  expect(ranked[0].terrainPoints).toBeNull();
  expect(ranked[0].maximumPoints - ranked[0].minimumPoints).toBe(20);
  const distanceOnly = rankFeatures(
    candidates,
    base,
    100,
    { study: 0, distance: 100, terrain: 0 },
    initialStudyInterest,
  );
  expect(distanceOnly[0].entry.id).toBe('iau-1');
  expect(
    rankFeatures(candidates, base, 100, initialWeights, initialStudyInterest),
  ).toEqual(ranked);
});

test('radius boundaries, empty results, ties and invalid mission assumptions', () => {
  const boundary = entry('iau-1', 1);
  const radius = distanceKm(base, boundary);
  expect(
    rankFeatures([boundary], base, radius, initialWeights, {}),
  ).toHaveLength(1);
  expect(
    rankFeatures([boundary], base, radius - 0.001, initialWeights, {}),
  ).toHaveLength(0);
  const tied = rankFeatures(
    [entry('iau-2', 0), entry('iau-1', 0)],
    base,
    100,
    initialWeights,
    {},
  );
  expect(tied.map((result) => result.entry.id)).toEqual(['iau-1', 'iau-2']);
  for (const invalid of [0, -1, NaN, Infinity])
    expect(() => rankFeatures([], base, invalid, initialWeights, {})).toThrow();
  expect(() =>
    rankFeatures([], { latitude: 91, longitude: 0 }, 100, initialWeights, {}),
  ).toThrow();
  expect(() =>
    rankFeatures([], base, 100, { study: 60, distance: 30, terrain: 20 }, {}),
  ).toThrow();
  expect(() =>
    rankFeatures([], base, 100, initialWeights, { AA: 101 }),
  ).toThrow();
});

test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url)),
      contentType: 'image/png',
    }),
  );
});

async function openCalculator(page: import('@playwright/test').Page) {
  await page.getByText('Discover Mars features', { exact: true }).click();
  await page
    .getByText('Calculate best destinations · Top 10', { exact: true })
    .click();
  return page.locator('.feature-calculator');
}

test('base, top ten, explanations, weight validation, detail selection and session reset', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const calc = await openCalculator(page);
  await expect(calc).toContainText(
    'Set your base to calculate recommendations.',
  );
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  await calc.getByLabel('Search radius').fill('1000');
  await expect(calc.locator('.destination-results > li')).toHaveCount(10);
  await expect(calc).toContainText('Provisional recommendation:');
  await expect(calc).toContainText(
    'Terrain evidence could change the recommendation.',
  );
  const first = calc.locator('.destination-results > li').first();
  await expect(first).toContainText('Unknown · 0–20 points unresolved');
  await expect(
    first.getByRole('link', { name: 'Feature data & source' }),
  ).toHaveAttribute('href', /planetarynames.wr.usgs.gov\/Feature\/\d+/);
  await first.getByRole('button').click();
  await expect(
    page.getByRole('region', { name: 'Catalogue feature details' }),
  ).toBeVisible();
  await calc.getByText('Scoring rules & preferences', { exact: true }).click();
  await calc.getByLabel('Study potential weight', { exact: true }).fill('60');
  await expect(calc.getByRole('alert')).toContainText('weights totalling 100');
  await expect(calc.locator('.destination-results > li')).toHaveCount(0);
  await calc.getByRole('button', { name: 'Reset scoring preferences' }).click();
  await expect(calc.locator('.destination-results > li')).toHaveCount(10);
  await calc.getByLabel('Rank feature types').selectOption('AA');
  await calc
    .getByLabel('Crater, craters study interest (%)', { exact: true })
    .fill('100');
  await expect(calc.locator('.destination-results > li').first()).toContainText(
    '50.0 / 50',
  );
  await calc.getByRole('button', { name: 'Reset scoring preferences' }).click();
  await calc.getByLabel('Rank feature types').selectOption('all');
  await calc.getByText('Scoring rules & preferences', { exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await calc.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: 'docs/calculator-desktop.png',
    fullPage: false,
  });
  await calc.getByLabel('Search radius').fill('0.001');
  await expect(calc).toContainText('No named feature centres match.');
  await page.getByRole('button', { name: 'Clear base', exact: true }).click();
  await expect(calc).toContainText(
    'Set your base to calculate recommendations.',
  );
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Simulated astronaut base' }),
  ).toContainText('No base set.');
  expect(errors).toEqual([]);
});

test('map click sets a base only in placement mode', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('.map-host canvas');
  await expect(page.locator('.map-host canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Place base on map' }).click();
  await canvas.click();
  const panel = page.getByRole('region', { name: 'Simulated astronaut base' });
  await expect(panel).toContainText('Simulated base:');
  await expect(page.getByLabel('Base latitude')).not.toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Place base on map' }),
  ).toHaveAttribute('aria-pressed', 'false');
  const text = await panel.innerText();
  await canvas.click({ position: { x: 100, y: 100 } });
  await expect(panel).toHaveText(text, { useInnerText: true });
});

test('mobile coordinate entry works without WebGL and keeps ranking within the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes('webgl')) return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto('/');
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  const calc = await openCalculator(page);
  await calc.getByLabel('Search radius').fill('1000');
  await expect(calc.locator('.destination-results > li')).toHaveCount(10);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await calc.locator('summary').first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: 'docs/calculator-mobile.png',
    fullPage: false,
  });
});
