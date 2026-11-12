import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { initialMission, stops } from '../src/data/stops';
import { marsReferenceEllipsoid } from '../src/map/create-mars-viewer';
import { Cartesian3, Cartographic, Math as CesiumMath } from 'cesium';
const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
test.beforeEach(async ({ page }) => {
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: tile,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
});

test('science constraints: unknown positions, no goal or assumed base', () => {
  expect(initialMission.goal).toBeNull();
  expect(initialMission.base).toBeNull();
  expect(initialMission.mobility).toBe('walking');
  expect(stops).toHaveLength(3);
  expect(new Set(stops.map((stop) => stop.id)).size).toBe(3);
  for (const stop of stops) {
    expect(stop.coordinates).toBeNull();
    expect(stop.coordinateStatus).toBe('pending_verification');
    expect(new URL(stop.source).hostname).toBe('science.nasa.gov');
    expect(stop.solSealed).toBeGreaterThan(0);
  }
  expect(
    stops.find((stop) => stop.id === 'amalik')?.additionalSample.solSealed,
  ).toBe(619);
});

test('stop selection, pending mission settings, support and layer controls', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Every stop has a story.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  for (const stop of stops) {
    await page.getByRole('button', { name: new RegExp(stop.name) }).click();
    await expect(
      page.getByRole('heading', { name: stop.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'NASA sample catalog' }),
    ).toHaveAttribute('href', stop.source);
    await expect(
      page.getByText('Location not yet verified', { exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByLabel('Scientific goal')).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Compare stops' }),
  ).toBeDisabled();
  await page.getByLabel('Crew vehicle', { exact: true }).check();
  await expect(
    page.getByText(
      'Interest recorded for this session; capabilities undefined',
    ),
  ).toBeVisible();
  await page.getByLabel('Global MOC imagery').uncheck();
  await page.getByLabel('Jezero CTX imagery').uncheck();
  await expect(
    page.getByText('Imagery off · smooth reference globe'),
  ).toBeVisible();
  await page.getByLabel('Jezero CTX imagery').check();
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible();
  expect(errors).toEqual([]);
});

test('keyboard navigation and viewport changes', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await canvas.focus();
  for (const key of [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    '+',
    '-',
    'h',
  ])
    await page.keyboard.press(key);
  await expect(canvas).toBeFocused();
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await page.getByRole('button', { name: 'Jezero view' }).click();
  await page.getByRole('button', { name: /Skinner Ridge/ }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Skinner Ridge', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('narrow layout preserves access to stops, mission settings and sources', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Wildcat Ridge', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Robotic system').check();
  await expect(page.getByLabel('Robotic system')).toBeChecked();
  await expect(
    page.getByRole('link', { name: 'NASA media usage guidelines' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('unsupported WebGL keeps list-based science browsing usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    });
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Amalik/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Amalik', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry map' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry map' }).click();
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
});

test('imagery outage is explicit and retry recovers', async ({ page }) => {
  let failing = true;
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    failing
      ? route.abort()
      : route.fulfill({
          path: tile,
          contentType: 'image/png',
          headers: { 'access-control-allow-origin': '*' },
        }),
  );
  await page.goto('/');
  await expect(
    page.getByText('Jezero CTX imagery: unavailable — partial or no coverage'),
  ).toBeVisible();
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Skinner Ridge', exact: true }),
  ).toBeVisible();
  failing = false;
  await page
    .getByText('Jezero CTX imagery: unavailable — partial or no coverage')
    .locator('..')
    .getByRole('button', { name: 'Retry', exact: true })
    .click();
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible();
});

test('Mars display coordinates match the source sphere and east-positive longitude', () => {
  expect(marsReferenceEllipsoid.radii.x).toBe(3396190);
  expect(marsReferenceEllipsoid.radii.y).toBe(3396190);
  expect(marsReferenceEllipsoid.radii.z).toBe(3396190);
  const east = Cartesian3.fromDegrees(90, 0, 0, marsReferenceEllipsoid);
  expect(east.x).toBeCloseTo(0, 5);
  expect(east.y).toBeCloseTo(3396190, 5);
  for (const longitude of [-180, -90, 0, 77.4509, 180]) {
    const cartesian = Cartesian3.fromDegrees(
      longitude,
      18.4446,
      0,
      marsReferenceEllipsoid,
    );
    const result = Cartographic.fromCartesian(
      cartesian,
      marsReferenceEllipsoid,
    );
    expect(CesiumMath.toDegrees(result.latitude)).toBeCloseTo(18.4446, 8);
    expect(CesiumMath.toDegrees(result.longitude)).toBeCloseTo(longitude, 8);
  }
});

test('imagery loading is visible before requests finish', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://trek.nasa.gov/tiles/**', async (route) => {
    await gate;
    await route.fulfill({
      path: tile,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  await page.goto('/');
  await expect(page.getByText('Jezero CTX imagery: loading…')).toBeVisible();
  release();
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible();
});
