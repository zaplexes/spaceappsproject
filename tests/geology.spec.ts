import { mockWorldTiles } from './mock-world-tiles';
import { openJezeroControls } from './jezero-controls';
import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import geology from '../src/data/generated/geology.json' with { type: 'json' };
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

test('geology exposes the source units, offset warning, opacity and extent without changing mission constraints', async ({
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
  const toggle = page.getByLabel('Jezero regional geology', { exact: false });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect(page.getByTestId('geology-status')).toContainText('loaded');
  const legend = page.getByRole('region', { name: 'Geological unit legend' });
  await expect(legend).toContainText('100–200 m');
  await expect(legend).toContainText('1:75,000');
  await expect(legend).toContainText(
    'Transparent areas are unclassified or withheld',
  );
  await expect(
    legend.getByRole('link', { name: /USGS SIM 3464/ }),
  ).toHaveAttribute('href', geology.sourcePage);
  await legend.getByText('Geological units (14)', { exact: true }).click();
  for (const unit of geology.units)
    await expect(legend.getByText(unit.name, { exact: false })).toBeVisible();
  const opacity = page.getByLabel('Geology opacity');
  await opacity.focus();
  await opacity.press('Home');
  await opacity.press('ArrowRight');
  await expect(opacity).toHaveValue('5');
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await expect(page.getByTestId('geology-coverage')).toContainText(
    'part of this viewport',
  );
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await expect(page.getByTestId('geology-coverage')).toContainText(
    'Within geology map extent',
  );
  await expect(
    page.getByText('Location not yet verified', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Scientific goal')).toHaveValue('ancient-water');
  await expect(
    page.getByRole('button', { name: 'Compare stops' }),
  ).toBeDisabled();
  await page.getByLabel('Jezero elevation colours').check();
  await expect(toggle).not.toBeChecked();
  await expect(legend).toHaveCount(0);
  await toggle.check();
  await expect(page.getByLabel('Jezero elevation colours')).not.toBeChecked();
  await expect(page.getByTestId('geology-status')).toContainText('loaded');
  expect(errors).toEqual([]);
});

test('geology loading, failure and retry preserve source evidence', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failing = true;
  await page.route('**/jezero-geology.png', async (route) => {
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
  await openJezeroControls(page);
  await page.getByLabel('Jezero regional geology', { exact: false }).check();
  await expect(page.getByTestId('geology-status')).toContainText('loading');
  release();
  await expect(page.getByTestId('geology-status')).toContainText('unavailable');
  await expect(
    page.getByRole('link', { name: /USGS data & offset note/ }),
  ).toBeVisible();
  failing = false;
  await page.getByRole('button', { name: 'Retry geology' }).click();
  await expect(page.getByTestId('geology-status')).toContainText('loaded');
});

test('turning geology off while pending ignores its late result and can load again', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/jezero-geology.png', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page);
  const toggle = page.getByLabel('Jezero regional geology', { exact: false });
  await toggle.check();
  await expect(page.getByTestId('geology-status')).toContainText('loading');
  await toggle.uncheck();
  release();
  await expect(page.getByTestId('geology-status')).toHaveCount(0);
  await toggle.check();
  await expect(page.getByTestId('geology-status')).toContainText('loaded');
});

test('geology legend remains readable on mobile and without WebGL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    });
  });
  await page.goto('/');
  if (!test.info().title.includes('without WebGL'))
    await page
      .getByRole('button', { name: 'Jezero view', exact: false })
      .waitFor();
  await openJezeroControls(page);
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  const toggle = page.getByLabel('Jezero regional geology', { exact: false });
  await toggle.focus();
  await page.keyboard.press('Space');
  await page.getByText('Geological units (14)', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('NHjf2 · Jezero fan 2 unit', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /USGS data & offset note/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
