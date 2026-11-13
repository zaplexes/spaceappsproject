import { openMapStatus, openWorldLayers } from './map-controls';
import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mockWorldTiles } from './mock-world-tiles';
import { layerCoverage } from '../src/map/layer-coverage';
import { tileSources, tileUrl } from '../src/data/layers';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
const infraredTile = fileURLToPath(
  new URL('./fixtures/hirise.png', import.meta.url),
);
test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: route.request().url().includes('THEMIS_DayIR')
        ? infraredTile
        : tile,
      contentType: 'image/png',
    }),
  );
});

test('coverage follows actual extents across regions, poles and longitude seam', () => {
  const gale = layerCoverage([137, -6, 138, -5]);
  expect(gale['ctx-global']).toBe('inside');
  expect(gale['relief-global']).toBe('inside');
  expect(gale['geology-global']).toBe('inside');
  expect(gale.slope).toBe('outside');
  expect(gale.hirise).toBe('outside');
  expect(layerCoverage([30, 85, 40, 89]).themis).toBe('outside');
  expect(layerCoverage([170, -5, -170, 5])['ctx-global']).toBe('inside');
  expect(
    Object.values(layerCoverage(null)).every((value) => value === 'unknown'),
  ).toBe(true);
  const source = tileSources.find((entry) => entry.id === 'ctx-global')!;
  expect(source.tileSize).toBe(512);
  expect(tileUrl(source)).toBe(
    'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/{z}/{y}/{x}',
  );
});

test('Gale receives global layers, clear local gaps, a service legend and mutually exclusive overlays', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
    'open',
  );
  await openWorldLayers(page);
  await openMapStatus(page);
  const catalogue = page.getByRole('region', {
    name: 'Mars feature catalogue',
  });
  await catalogue.getByText('Discover Mars features', { exact: true }).click();
  await catalogue.getByLabel('Search features').fill('Gale');
  await catalogue.getByRole('button', { name: /^Gale / }).click();
  await expect(
    page.getByRole('heading', { name: 'Gale exploration' }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Global CTX imagery', { exact: false }),
  ).toBeChecked();
  await expect(
    page.getByText('Global CTX imagery: loaded', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('control-ctx-global-coverage')).toContainText(
    'Within service extent',
  );
  await page.locator('.regional-layer-controls > summary').click();
  await expect(
    page.getByText('Slope unavailable in this viewport.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('checkbox', { name: /^Global elevation context/ })
    .check();
  const relief = page.getByRole('region', {
    name: 'Global elevation context legend',
  });
  await expect(relief).toContainText('No height readout');
  await expect(page.getByTestId('relief-global-coverage')).toContainText(
    'Within service extent',
  );
  await relief.getByLabel('Global context opacity').fill('40');
  await page
    .getByRole('checkbox', { name: /^Global geological context/ })
    .check();
  await expect(
    page.getByRole('checkbox', { name: /^Global elevation context/ }),
  ).not.toBeChecked();
  const geology = page.getByRole('region', { name: 'Global geology legend' });
  await geology
    .getByText('Global geological units (44)', { exact: true })
    .click();
  await expect(geology.locator('li')).toHaveCount(44);
  await expect(geology).toContainText('Amazonian and Hesperian impact unit');
  await expect(geology.locator('img').first()).toHaveJSProperty(
    'complete',
    true,
  );
  await expect(
    page.getByText('Global geological context: loaded', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Jezero estimated slope', { exact: false }).check();
  await expect(
    page.getByRole('checkbox', { name: /^Global geological context/ }),
  ).not.toBeChecked();
  await expect(page.getByTestId('slope-coverage')).toContainText(
    'Outside slope coverage',
  );
  await page
    .getByRole('checkbox', { name: /^Global elevation context/ })
    .check();
  await expect(
    page.getByLabel('Jezero estimated slope', { exact: false }),
  ).not.toBeChecked();
  await page.getByRole('button', { name: 'Jezero view', exact: false }).click();
  await expect(page.locator('.layer-gap')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compare stops' })).toHaveCount(
    0,
  );
  await page
    .getByRole('checkbox', { name: /^Global elevation context/ })
    .uncheck();
  await page.getByLabel('THEMIS daytime infrared', { exact: false }).check();
  await expect
    .poll(() =>
      page.locator('.map-host canvas').evaluate((canvas: HTMLCanvasElement) => {
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        if (!gl) return false;
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
        return rgba[2] > rgba[0];
      }),
    )
    .toBe(true);
  await page.locator('.world-layer-controls').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/world-layers-desktop.png' });
  expect(errors).toEqual([]);
});

test('global imagery and geology failures have working retries and keep candidate evidence', async ({
  page,
}) => {
  let failCtx = true;
  await page.route(
    'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/**',
    (route) =>
      failCtx
        ? route.abort()
        : route.fulfill({ path: tile, contentType: 'image/png' }),
  );
  await page.goto('/');
  await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
    'open',
  );
  await openWorldLayers(page);
  await openMapStatus(page);
  await page.getByLabel('Global CTX imagery', { exact: false }).check();
  const ctxFailure = page.getByText(
    'Global CTX imagery: unavailable — partial or no coverage',
    { exact: true },
  );
  await expect(ctxFailure).toBeVisible();
  await expect(
    page.getByText('Global MOC imagery: loaded', { exact: true }),
  ).toBeVisible();
  failCtx = false;
  await ctxFailure
    .locator('..')
    .getByRole('button', { name: 'Retry', exact: true })
    .click();
  await expect(
    page.getByText('Global CTX imagery: loaded', { exact: true }),
  ).toBeVisible();
  let failGeology = true;
  await page.route(
    'https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/**',
    (route) =>
      failGeology
        ? route.abort()
        : route.fulfill({ path: tile, contentType: 'image/png' }),
  );
  await page
    .getByRole('checkbox', { name: /^Global geological context/ })
    .check();
  const geoFailure = page.getByText(
    'Global geological context: unavailable — partial or no coverage',
    { exact: true },
  );
  await expect(geoFailure).toBeVisible();
  await page.getByRole('button', { name: /Amalik/ }).click();
  await expect(page.locator('.surface-reference img')).toBeVisible();
  failGeology = false;
  await geoFailure
    .locator('..')
    .getByRole('button', { name: 'Retry', exact: true })
    .click();
  await expect(
    page.getByText('Global geological context: loaded', { exact: true }),
  ).toBeVisible();
  await page
    .locator('.map-host canvas')
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
    );
  await page.getByRole('button', { name: 'Retry map', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeVisible();
  await openMapStatus(page);
  await expect(
    page.getByText('Global geological context: loaded', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('candidate-highlight')).toContainText('Amalik');
});

test('mobile polar discovery labels THEMIS and slope gaps; controls remain usable without WebGL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
    'open',
  );
  await openWorldLayers(page);
  await openMapStatus(page);
  const catalogue = page.getByRole('region', {
    name: 'Mars feature catalogue',
  });
  await catalogue.getByText('Discover Mars features', { exact: true }).click();
  await catalogue.getByLabel('Feature type').selectOption('all');
  await catalogue.getByLabel('Search features').fill('Vastitas Borealis');
  await catalogue.getByRole('button', { name: /^Vastitas Borealis / }).click();
  await expect(page.getByTestId('control-themis-coverage')).toContainText(
    'Partial viewport coverage',
  );
  for (let i = 0; i < 6; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByTestId('control-themis-coverage')).toContainText(
    'Outside this viewport',
  );
  await page.locator('.regional-layer-controls > summary').click();
  await expect(page.locator('.layer-gap')).toBeVisible();
  await page
    .getByRole('checkbox', { name: /^Global geological context/ })
    .check();
  await expect(
    page.getByRole('region', { name: 'Global geology legend' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .locator('.world-layer-controls')
    .screenshot({ path: 'docs/world-layers-mobile.png' });
  await page.addInitScript(() =>
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    }),
  );
  await page.reload();
  await openWorldLayers(page);
  await openMapStatus(page);
  await page
    .getByRole('checkbox', { name: /^Global elevation context/ })
    .check();
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Global elevation context legend' }),
  ).toBeVisible();
  await expect(page.getByTestId('control-relief-global-coverage')).toHaveText(
    'Coverage unknown',
  );
});

for (const width of [1440, 390]) {
  test(`Mars-wide defaults and discovery are visible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
      'open',
    );
    await openWorldLayers(page);
    await openMapStatus(page);
    await expect(
      page.getByRole('heading', { name: 'Mars exploration', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.world-layer-controls')).toHaveAttribute(
      'open',
      '',
    );
    await expect(page.locator('.regional-layer-controls')).not.toHaveAttribute(
      'open',
    );
    await expect(
      page.getByLabel('Global CTX imagery', { exact: false }),
    ).not.toBeChecked();
    await expect(
      page.getByLabel('Jezero CTX imagery', { exact: false }),
    ).not.toBeChecked();
    await expect(
      page.getByLabel('Jezero HiRISE imagery', { exact: false }),
    ).not.toBeChecked();
    await expect(page.locator('.map-caption')).toContainText(
      'Mars-wide context',
    );
    await expect(
      page.getByText('Global MOC imagery: loaded', { exact: true }),
    ).toBeVisible();
    const discovery = page.getByText('Discover Mars features', { exact: true });
    await discovery.scrollIntoViewIfNeeded();
    await expect(discovery).toBeInViewport();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Layers', exact: true })
      .click();
    await expect(
      page.getByText('Mars-wide context', { exact: true }).first(),
    ).toBeInViewport();
    await page.screenshot({
      path: `docs/mars-default-${width === 390 ? 'mobile' : 'desktop'}.png`,
    });
    await discovery.click();
    await expect(page.getByLabel('Search features')).toBeVisible();
    await page.getByLabel('Search features').fill('Gale');
    await page.getByRole('button', { name: /^Gale / }).click();
    await expect(
      page.getByRole('heading', { name: 'Gale exploration' }),
    ).toBeVisible();
    await page
      .locator('#science-stops')
      .getByRole('button', { name: /Skinner Ridge/ })
      .click();
    await expect(page.locator('.regional-layer-controls')).toHaveAttribute(
      'open',
      '',
    );
    await expect(page.getByTestId('candidate-highlight')).toContainText(
      'Skinner Ridge',
    );
  });
}

test('CTX follows zoom automatically and loads only at close range', async ({
  page,
}) => {
  const ctxRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/OnMars/CTX/MapServer/tile/'))
      ctxRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
    'open',
  );
  await openWorldLayers(page);
  await openMapStatus(page);
  const ctx = page.getByLabel('Global CTX imagery', { exact: false });
  const zoomIn = page.getByRole('button', { name: 'Zoom in', exact: true });
  await expect(zoomIn).toBeVisible();
  await expect(ctx).not.toBeChecked();
  expect(ctxRequests).toHaveLength(0);
  await expect(page.getByTestId('ctx-mode')).toContainText('Automatic');
  for (let i = 0; i < 6; i++) await zoomIn.click();
  await expect(ctx).not.toBeChecked();
  await zoomIn.click();
  await expect(ctx).toBeChecked();
  await expect(
    page.getByText('Global CTX imagery: loaded', { exact: true }),
  ).toBeVisible();
  expect(ctxRequests.length).toBeGreaterThan(0);
  for (let i = 0; i < 1; i++)
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(ctx).not.toBeChecked();
  await page.locator('.map-host canvas').focus();
  await page.keyboard.press('+');
  await expect(ctx).toBeChecked();
  await page.keyboard.press('-');
  await expect(ctx).not.toBeChecked();
  await page.getByRole('button', { name: 'Jezero view', exact: false }).click();
  await expect(ctx).toBeChecked();
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await expect(ctx).not.toBeChecked();
});

for (const manual of [true, false]) {
  test(`manual CTX ${manual ? 'on' : 'off'} survives zoom, discovery and map retry`, async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
      'open',
    );
    await openWorldLayers(page);
    await openMapStatus(page);
    const ctx = page.getByLabel('Global CTX imagery', { exact: false });
    const jezero = page.getByRole('button', {
      name: 'Jezero view',
      exact: false,
    });
    await expect(jezero).toBeVisible();
    if (!manual) {
      await jezero.click();
      await expect(ctx).toBeChecked();
    }
    await ctx.setChecked(manual);
    await expect(page.getByTestId('ctx-mode')).toContainText('Manual');
    await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
    await expect(ctx).toBeChecked({ checked: manual });
    await jezero.click();
    await expect(ctx).toBeChecked({ checked: manual });
    await page.getByText('Discover Mars features', { exact: true }).click();
    await page.getByLabel('Search features').fill('Gale');
    await page.getByRole('button', { name: /^Gale / }).click();
    await expect(
      page.getByRole('heading', { name: 'Gale exploration' }),
    ).toBeVisible();
    await expect(ctx).toBeChecked({ checked: manual });
    await page
      .locator('.map-host canvas')
      .evaluate((canvas) =>
        canvas.dispatchEvent(
          new Event('webglcontextlost', { cancelable: true }),
        ),
      );
    await page.getByRole('button', { name: 'Retry map', exact: true }).click();
    await openMapStatus(page);
    await expect(
      page.getByRole('button', { name: 'Zoom in', exact: true }),
    ).toBeVisible();
    await expect(ctx).toBeChecked({ checked: manual });
    await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
    await expect(ctx).toBeChecked({ checked: manual });
    await page.reload();
    await openWorldLayers(page);
    await openMapStatus(page);
    await expect(
      page.getByRole('button', { name: 'Zoom in', exact: true }),
    ).toBeVisible();
    await expect(ctx).not.toBeChecked();
    await expect(page.getByTestId('ctx-mode')).toContainText('Automatic');
  });
}
