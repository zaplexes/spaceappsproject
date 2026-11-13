import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { featurePreview, previewSources } from '../src/catalog/feature-imagery';
import type { CatalogFeature } from '../src/catalog/catalog';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
const ctxPattern =
  'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/**';
const headers = { 'access-control-allow-origin': '*' };

async function select(page: Page, name: string, type = 'AA') {
  const browser = page.getByRole('region', { name: 'Mars feature catalogue' });
  const disclosure = browser.locator('details.catalog-discovery');
  if ((await disclosure.getAttribute('open')) === null)
    await browser.getByText('Discover Mars features', { exact: true }).click();
  await browser.getByLabel('Feature type').selectOption(type);
  await browser.getByLabel('Search features').fill(name);
  await browser.getByRole('button', { name: new RegExp(`^${name} `) }).click();
  return page.getByRole('figure', {
    name: `${name} orbital overview`,
    exact: true,
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({ path: tile, contentType: 'image/png', headers }),
  );
  await page.route(ctxPattern, (route) =>
    route.fulfill({ path: tile, contentType: 'image/png', headers }),
  );
});

test('orbital crops wrap at the date line, clip at the poles, and preserve centre placement', () => {
  for (const latitude of [-90, -45, 0, 89.99, 90]) {
    for (const longitude of [-180, 179.999, 180, 226.1975]) {
      const feature = {
        latitude,
        longitude,
        dimensionKm: 40,
      } as CatalogFeature;
      const plan = featurePreview(feature, previewSources[0]);
      expect(plan.tiles.length).toBeGreaterThan(0);
      expect(plan.tiles.length).toBeLessThanOrEqual(4);
      expect(plan.spanDegrees).toBeGreaterThan(0);
      for (const entry of plan.tiles) {
        const [level, row, column] = new URL(entry.url).pathname
          .split('/')
          .slice(-3)
          .map(Number);
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(2 ** level);
        expect(column).toBeGreaterThanOrEqual(0);
        expect(column).toBeLessThan(2 ** (level + 1));
        expect(entry.x).toBeGreaterThan(-512);
        expect(entry.x).toBeLessThan(512);
        expect(entry.y).toBeGreaterThan(-512);
        expect(entry.y).toBeLessThan(512);
      }
    }
  }
  const jezero = {
    latitude: 18.4082,
    longitude: 77.6873,
    dimensionKm: 45,
  } as CatalogFeature;
  const plan = featurePreview(jezero, previewSources[0]);
  for (const entry of plan.tiles) {
    const [level, row, column] = new URL(entry.url).pathname
      .split('/')
      .slice(-3)
      .map(Number);
    const degrees = 180 / 2 ** level;
    expect(
      entry.x + ((jezero.longitude + 180) / degrees - column) * 512,
    ).toBeCloseTo(256);
    expect(
      entry.y + ((90 - jezero.latitude) / degrees - row) * 512,
    ).toBeCloseTo(256);
  }
});

test('catalogue displays orbital imagery and a sourced Jezero rover gallery, then switches features', async ({
  page,
}) => {
  await page.goto('/');
  const jezero = await select(page, 'Jezero');
  await expect(jezero.getByRole('img')).toBeVisible();
  await expect(jezero).toContainText('Global CTX imagery');
  await expect(jezero).toContainText('NASA/JPL/MSSS');
  const gallery = page.locator('.jezero-rover-gallery');
  await gallery
    .getByText('Perseverance views inside Jezero', { exact: true })
    .click();
  await expect(gallery.getByRole('img')).toHaveCount(3);
  await expect(gallery).toContainText('Image sol 490');
  await expect(gallery).toContainText('Image sol 509');
  await expect(gallery).toContainText('Image sol 575');
  await expect(gallery).toContainText(
    'exact drill coordinates remain unverified',
  );
  const olympus = await select(page, 'Olympus Mons', 'MO');
  await expect(olympus.getByRole('img')).toBeVisible();
  await expect(page.locator('.jezero-rover-gallery')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await olympus.scrollIntoViewIfNeeded();
  await expect(olympus.getByRole('img')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'docs/feature-imagery-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await olympus.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/feature-imagery-desktop.png' });
});

for (const failure of ['http', 'transparent'] as const) {
  test(`${failure} CTX previews use the credited MOC overview`, async ({
    page,
  }) => {
    await page.route(ctxPattern, (route) =>
      route.fulfill(
        failure === 'http'
          ? { status: 503, headers }
          : {
              body: Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAarVyFEAAAAASUVORK5CYII=',
                'base64',
              ),
              contentType: 'image/png',
              headers,
            },
      ),
    );
    await page.goto('/');
    const figure = await select(page, 'Jezero');
    await expect(figure.getByRole('img')).toBeVisible();
    await expect(figure).toContainText('showing a wider MOC overview');
    await expect(figure).toContainText('NASA/JPL/MSSS · NASA Trek');
  });
}

test('unavailable previews support retry and do not leak previous feature images', async ({
  page,
}) => {
  await page.route(ctxPattern, (route) =>
    route.fulfill({ status: 503, headers }),
  );
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({ status: 503, headers }),
  );
  await page.goto('/');
  const figure = await select(page, 'Jezero');
  await expect(figure).toContainText('Orbital overview unavailable.');
  await expect(figure.getByRole('img')).toBeHidden();
  await page.route(ctxPattern, (route) =>
    route.fulfill({ path: tile, contentType: 'image/png', headers }),
  );
  await figure.getByRole('button', { name: 'Retry orbital overview' }).click();
  await expect(figure.getByRole('img')).toBeVisible();
  const olympus = await select(page, 'Olympus Mons', 'MO');
  await expect(olympus.getByRole('img')).toBeVisible();
  await expect(
    page.getByRole('figure', { name: 'Jezero orbital overview', exact: true }),
  ).toHaveCount(0);
});
