import { mockWorldTiles } from './mock-world-tiles';
import { openJezeroControls } from './jezero-controls';
import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { classifyCoverage } from '../src/data/coverage';
import elevation from '../src/data/generated/elevation.json' with { type: 'json' };
const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: tile,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
});

test('coverage handles contained, partial, missing, outside and longitude seam cases', () => {
  const extent = [77, 18, 78, 19] as const;
  expect(classifyCoverage([77.2, 18.2, 77.8, 18.8], extent)).toBe('inside');
  expect(classifyCoverage([76, 18, 77.5, 19], extent)).toBe('partial');
  expect(classifyCoverage([78, 18, 79, 19], extent)).toBe('outside');
  expect(classifyCoverage([77, 20, 78, 21], extent)).toBe('outside');
  expect(classifyCoverage(null, extent)).toBe('unknown');
  expect(classifyCoverage([179, 18, -179, 19], extent)).toBe('outside');
  expect(classifyCoverage([179, -1, -179, 1], [170, -10, -170, 10])).toBe(
    'inside',
  );
  expect(classifyCoverage([160, -1, -179, 1], [170, -10, -170, 10])).toBe(
    'partial',
  );
});

test('elevation overlay has a source-based datum legend, opacity and limited coverage', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page);
  const toggle = page.getByLabel('Jezero elevation colours');
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect(page.getByTestId('elevation-status')).toContainText('loaded');
  await expect(
    page.getByText('Elevation relative to Mars areoid', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(`${elevation.minimumMetres.toFixed(0)} m`, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(`${elevation.maximumMetres.toFixed(0)} m`, { exact: true }),
  ).toBeVisible();
  const opacity = page.getByLabel('Elevation opacity');
  await opacity.focus();
  await opacity.press('Home');
  await opacity.press('ArrowRight');
  await expect(opacity).toHaveValue('5');
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await expect(page.getByTestId('elevation-coverage')).toContainText(
    'part of this viewport',
  );
  await toggle.uncheck();
  await expect(page.getByTestId('elevation-status')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compare stops' })).toHaveCount(
    0,
  );
  expect(errors).toEqual([]);
});

test('local elevation failure is explicit and can recover', async ({
  page,
}) => {
  await page.route('**/jezero-elevation.png', (route) => route.abort());
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page);
  await page.getByLabel('Jezero elevation colours').check();
  await expect(page.getByTestId('elevation-status')).toContainText(
    'unavailable',
  );
  await page.unroute('**/jezero-elevation.png');
  await page
    .getByRole('button', { name: 'Retry elevation', exact: true })
    .click();
  await expect(page.getByTestId('elevation-status')).toContainText('loaded');
});

test('turning elevation off while loading ignores the stale result', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/jezero-elevation.png', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page);
  const toggle = page.getByLabel('Jezero elevation colours');
  await toggle.check();
  await expect(page.getByTestId('elevation-status')).toContainText('loading');
  await toggle.uncheck();
  release();
  await expect(page.getByTestId('elevation-status')).toHaveCount(0);
  await toggle.check();
  await expect(page.getByTestId('elevation-status')).toContainText('loaded');
});

test('elevation controls and legend fit a narrow display', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page);
  await page.getByLabel('Jezero elevation colours').check();
  await expect(page.getByLabel('Elevation colour legend')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('committed display asset matches its provenance manifest', () => {
  const bytes = readFileSync(
    fileURLToPath(new URL('../assets/jezero-elevation.png', import.meta.url)),
  );
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(
    elevation.assetSha256,
  );
  expect(bytes.readUInt32BE(16)).toBe(elevation.width);
  expect(bytes.readUInt32BE(20)).toBe(elevation.height);
  expect(elevation.validPixels + elevation.nodataPixels).toBe(
    elevation.width * elevation.height,
  );
  expect(elevation.verticalDatumConverted).toBe(false);
  expect(elevation.analysisEligible).toBe(false);
});
