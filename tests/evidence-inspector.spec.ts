import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import {
  envelopeContains,
  evidenceProducts,
  type EvidenceTarget,
} from '../src/evidence/evidence';
import { sourceRecords } from '../src/data/sources';
import { stops } from '../src/data/stops';
import { mockWorldTiles } from './mock-world-tiles';

const catalogueTarget = (
  latitude: number,
  longitude: number,
): EvidenceTarget => ({
  kind: 'catalogue',
  feature: {
    id: 'iau-1',
    name: 'Test feature',
    searchName: 'test feature',
    typeCode: 'AA',
    type: 'Crater, craters',
    regionId: 'mc01',
    regionName: 'Test region',
    latitude,
    longitude,
    longitudeEast: longitude < 0 ? longitude + 360 : longitude,
    dimensionKm: null,
    nameOrigin: null,
    sourceUrl: 'https://planetarynames.wr.usgs.gov/Feature/1',
  },
});

test('evidence envelope checks handle edges, seam, poles and unknown/invalid inputs', () => {
  expect(
    envelopeContains([170, -10, -170, 10], { latitude: 0, longitude: 179 }),
  ).toBe(true);
  expect(
    envelopeContains([170, -10, -170, 10], { latitude: 0, longitude: -179 }),
  ).toBe(true);
  expect(
    envelopeContains([170, -10, -170, 10], { latitude: 0, longitude: 0 }),
  ).toBe(false);
  expect(
    envelopeContains([-180, 80, -170, 90], { latitude: 90, longitude: 180 }),
  ).toBe(true);
  expect(
    envelopeContains([0, 0, 10, 10], { latitude: 10, longitude: 10 }),
  ).toBe(true);
  expect(
    envelopeContains([0, 0, 10, 10], { latitude: 10.001, longitude: 10 }),
  ).toBe(false);
  expect(envelopeContains(null, { latitude: 0, longitude: 0 })).toBeNull();
  expect(envelopeContains([-180, -90, 180, 90], null)).toBeNull();
  expect(
    envelopeContains([0, 10, 10, 0], { latitude: 0, longitude: 0 }),
  ).toBeNull();
  expect(
    envelopeContains([-180, -91, 180, 90], { latitude: 0, longitude: 0 }),
  ).toBeNull();
  expect(
    envelopeContains([-180, -90, 180, 90], { latitude: NaN, longitude: 0 }),
  ).toBeNull();
});

test('only a matching sample can link rover evidence; context never changes eligibility', () => {
  const before = structuredClone(sourceRecords);
  const far = evidenceProducts(catalogueTarget(0, 0));
  expect(
    far.filter((product) => product.category === 'Rover observations'),
  ).toHaveLength(0);
  expect(far.find((product) => product.source.id === 'geology')?.coverage).toBe(
    'outside',
  );
  expect(
    far.find((product) => product.source.id === 'ctx-global')?.coverage,
  ).toBe('envelope');
  for (const stop of stops) {
    const sample = evidenceProducts({ kind: 'sample', stop });
    const rover = sample.filter(
      (product) => product.category === 'Rover observations',
    );
    expect(rover.map((product) => product.source.id)).toEqual([stop.id]);
    expect(rover[0].coverage).toBe('linked');
    expect(
      sample.every((product) => product.source.analysisEligible === false),
    ).toBe(true);
  }
  expect(sourceRecords).toEqual(before);
  const unknown = evidenceProducts(catalogueTarget(0, 0), [
    { ...sourceRecords[0], bounds: null },
  ]);
  expect(unknown[0].coverage).toBe('unknown');
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

test('step three opens an empty state, then shows catalogue evidence and working map actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const inspector = page.locator('#evidence-inspector');
  await page
    .getByRole('navigation', { name: 'Exploration steps' })
    .getByRole('link', { name: /Inspect the evidence/ })
    .click();
  await expect(
    inspector.getByText('Choose a place to investigate', { exact: true }),
  ).toBeInViewport();
  await expect(inspector.locator('.evidence-product')).toHaveCount(0);
  await page.getByText('Discover Mars features', { exact: true }).click();
  await page.getByLabel('Search features').fill('Jezero');
  await page.getByRole('button', { name: /^Jezero / }).click();
  await page
    .getByRole('link', { name: 'Inspect this destination’s evidence' })
    .click();
  await expect(
    inspector.getByRole('heading', { name: 'Jezero · evidence' }),
  ).toBeInViewport();
  await expect(inspector).toContainText(
    'Catalogue centre; not a selected observation site.',
  );
  await expect(inspector).toContainText('No rover surface record is linked');
  await expect(inspector.locator('img')).toHaveCount(0);
  const geology = inspector.locator('[data-source-id="geology"]');
  await geology.locator(':scope > summary').click();
  await expect(geology).toContainText('Reference point inside source envelope');
  await expect(geology).toContainText(
    'not approved for route or terrain scoring',
  );
  await expect(
    geology.getByRole('link', { name: 'Open product source' }),
  ).toHaveAttribute('href', 'https://pubs.usgs.gov/publication/sim3464');
  await geology.getByRole('button', { name: 'View layer on map' }).click();
  await expect(page.getByLabel('Jezero regional geology')).toBeChecked();
  await expect(
    page.getByLabel('Global geological context', { exact: false }),
  ).not.toBeChecked();
  await expect(
    page.getByRole('region', { name: 'Mars discovery map' }),
  ).toBeInViewport();
  const slope = inspector.locator('[data-source-id="slope"]');
  await slope.locator(':scope > summary').click();
  await slope.getByRole('button', { name: 'View layer on map' }).click();
  await expect(page.getByLabel('Jezero estimated slope')).toBeChecked();
  await expect(page.getByLabel('Jezero regional geology')).not.toBeChecked();
  await inspector.evaluate((element) =>
    element.scrollIntoView({ block: 'start' }),
  );
  await page.screenshot({ path: 'docs/evidence-inspector-desktop.png' });
  await page.getByLabel('Search features').fill('Olympus');
  await page.getByLabel('Feature type').selectOption('MO');
  await page.getByRole('button', { name: /^Olympus Mons / }).click();
  await expect(
    inspector.getByRole('heading', { name: 'Olympus Mons · evidence' }),
  ).toBeVisible();
  await expect(inspector).not.toContainText('Jezero · evidence');
  await expect(
    inspector.locator('.evidence-context [data-source-id="geology"]'),
  ).toHaveCount(1);
  const outside = inspector.locator('.outside-evidence');
  await outside.locator(':scope > summary').click();
  const outsideGeology = outside.locator('[data-source-id="geology"]');
  await outsideGeology.locator(':scope > summary').click();
  await expect(outsideGeology).toContainText(
    'Reference point outside source envelope',
  );
  await expect(
    outsideGeology.getByRole('button', { name: 'View layer on map' }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Jezero evidence keeps distinct photos, position sources and mode-specific plans on mobile', async ({
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
  const inspector = page.locator('#evidence-inspector');
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await page
    .getByRole('link', { name: 'Inspect this destination’s evidence' })
    .click();
  await expect(
    inspector
      .getByRole('figure', { name: 'Swift Run surface reference' })
      .getByRole('img'),
  ).toBeVisible();
  await expect(
    inspector.getByRole('region', { name: 'Rover observations evidence' }),
  ).toContainText('Swift Run surface reference');
  await expect(
    inspector.getByRole('region', { name: 'Rover observations evidence' }),
  ).not.toContainText('Hazeltop');
  await inspector.getByText('Proposed science tasks', { exact: true }).click();
  await expect(inspector).toContainText('scale references');
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await expect(
    inspector
      .getByRole('figure', { name: 'Hazeltop surface reference' })
      .getByRole('img'),
  ).toBeVisible();
  await expect(
    inspector.getByRole('figure', { name: 'Swift Run surface reference' }),
  ).toHaveCount(0);
  await inspector
    .getByText('Review position evidence', { exact: true })
    .click();
  await expect(
    inspector.getByRole('link', { name: 'PDS localization record' }),
  ).toBeVisible();
  await inspector
    .getByRole('navigation', { name: 'Evidence sections' })
    .getByRole('link', { name: 'Imagery & maps' })
    .click();
  await expect(
    inspector.getByRole('heading', { name: 'Explore the context products' }),
  ).toBeInViewport();
  await inspector.evaluate((element) =>
    element.scrollIntoView({ block: 'start' }),
  );
  await page.screenshot({ path: 'docs/evidence-inspector-mobile.png' });
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
