import { mockWorldTiles } from './mock-world-tiles';
import { openJezeroControls } from './jezero-controls';
import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import slope from '../src/data/generated/slope.json' with { type: 'json' };

const contextTile = fileURLToPath(
  new URL('./fixtures/imagery.png', import.meta.url),
);
const hiriseTile = fileURLToPath(
  new URL('./fixtures/hirise.png', import.meta.url),
);
test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: route.request().url().includes('JEZ_hirise')
        ? hiriseTile
        : contextTile,
      contentType: 'image/png',
    }),
  );
});

test('HiRISE stays above CTX after retries and exposes regional extent', async ({
  page,
}) => {
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page, true);
  await expect(page.getByText('Jezero HiRISE imagery: loaded')).toBeVisible();
  const blueDominates = () =>
    page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      if (!gl) throw new Error('Missing WebGL');
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
    });
  await expect.poll(blueDominates).toBe(true);
  await page.getByLabel('Jezero HiRISE imagery').uncheck();
  await expect.poll(blueDominates).toBe(false);
  await page.getByLabel('Jezero HiRISE imagery').check();
  await expect.poll(blueDominates).toBe(true);
  let ctxFails = true;
  await page.route(
    '**/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/**',
    (route) =>
      ctxFails
        ? route.abort()
        : route.fulfill({ path: contextTile, contentType: 'image/png' }),
  );
  // Navigate to uncached context tiles, then retry that layer below HiRISE.
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await page.getByRole('button', { name: /Amalik/ }).click();
  const failure = page.getByText(
    'Jezero CTX imagery: unavailable — partial or no coverage',
  );
  await expect(failure).toBeVisible();
  ctxFails = false;
  await failure
    .locator('..')
    .getByRole('button', { name: 'Retry', exact: true })
    .click();
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible();
  await expect.poll(blueDominates).toBe(true);
  await expect(page.getByTestId('hirise-coverage')).toContainText(
    'Within HiRISE service extent',
  );
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await expect(page.getByTestId('hirise-coverage')).toContainText(
    'part of this viewport',
  );
});

test('HiRISE outage leaves context imagery usable and retry restores detail', async ({
  page,
}) => {
  let failing = true;
  await page.route(
    '**/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/**',
    (route) =>
      failing
        ? route.abort()
        : route.fulfill({ path: hiriseTile, contentType: 'image/png' }),
  );
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page, true);
  const failure = page.getByText(
    'Jezero HiRISE imagery: unavailable — partial or no coverage',
  );
  await expect(failure).toBeVisible();
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible();
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(page.getByTestId('candidate-highlight')).toBeVisible();
  failing = false;
  await failure
    .locator('..')
    .getByRole('button', { name: 'Retry', exact: true })
    .click();
  await expect(page.getByText('Jezero HiRISE imagery: loaded')).toBeVisible();
});

test('estimated slope has a physical scale, source, opacity, coverage and separate colour display', async ({
  page,
}) => {
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page, true);
  await page.getByLabel('Jezero elevation colours').check();
  await page.getByLabel('Jezero estimated slope', { exact: false }).check();
  await expect(page.getByLabel('Jezero elevation colours')).not.toBeChecked();
  await expect(page.getByTestId('slope-status')).toContainText('loaded');
  const legend = page.getByRole('region', { name: 'Estimated slope legend' });
  await expect(legend).toContainText('0°');
  await expect(legend).toContainText('90°');
  await expect(legend).toContainText('20 m');
  await expect(legend).toContainText('no walking limits or risk classes');
  await expect(
    legend.getByRole('link', { name: 'USGS slope source' }),
  ).toHaveAttribute('href', slope.sourcePage);
  const opacity = page.getByLabel('Slope opacity');
  await opacity.focus();
  await opacity.press('Home');
  await expect(opacity).toHaveValue('0');
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await expect(page.getByTestId('slope-coverage')).toContainText(
    'Within slope grid extent',
  );
  await expect(
    page.getByRole('button', { name: 'Compare stops' }),
  ).toBeDisabled();
  await opacity.press('End');
  await page.screenshot({ path: 'docs/slope-desktop.png', fullPage: true });
  await page.getByLabel('Jezero regional geology', { exact: false }).check();
  await expect(
    page.getByLabel('Jezero estimated slope', { exact: false }),
  ).not.toBeChecked();
  await expect(legend).toHaveCount(0);
});

test('slope failure, stale result and retry retain source evidence', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failing = true;
  await page.route('**/jezero-slope.png', async (route) => {
    if (failing) {
      await gate;
      await route.abort();
    } else await route.continue();
  });
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page, true);
  const toggle = page.getByLabel('Jezero estimated slope', { exact: false });
  await toggle.check();
  await expect(page.getByTestId('slope-status')).toContainText('loading');
  await toggle.uncheck();
  release();
  await expect(page.getByTestId('slope-status')).toHaveCount(0);
  await toggle.check();
  await expect(page.getByTestId('slope-status')).toContainText('unavailable');
  await expect(
    page.getByRole('link', { name: 'USGS slope source' }),
  ).toBeVisible();
  failing = false;
  await page.getByRole('button', { name: 'Retry slope' }).click();
  await expect(page.getByTestId('slope-status')).toContainText('loaded');
});

test('slope evidence and keyboard controls work on mobile without WebGL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    }),
  );
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page, true);
  const toggle = page.getByLabel('Jezero estimated slope', { exact: false });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(
    page.getByRole('region', { name: 'Estimated slope legend' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Gradient method reference' }),
  ).toHaveAttribute('href', slope.algorithmReference);
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'docs/slope-mobile.png', fullPage: true });
});
