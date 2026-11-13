import { Buffer } from 'node:buffer';
import { expect, test } from '@playwright/test';
import { mockWorldTiles } from './mock-world-tiles';
import {
  emptyMission,
  estimateTrip,
  exportTrip,
  validateDraft,
  TRIP_VERSION,
  type TripStop,
  type TripDraft,
} from '../src/planning/trip';
import { withinViewport } from '../src/catalog/viewport';
import { arcSamples } from '../src/planning/terrain-context';
const stop: TripStop = {
  id: 'sample',
  name: 'Sample',
  latitude: 0,
  longitude: 1,
  reference: 'catalogue-centre',
  sourceUrl: 'https://example.org/source',
  tasks: ['Review source'],
  completed: [false],
  workMinutes: '',
};
const draft: TripDraft = {
  schemaVersion: 1,
  modelVersion: TRIP_VERSION,
  base: { latitude: 0, longitude: 0 },
  stops: [stop],
  mission: { ...emptyMission },
};

test('return distance and budget boundaries preserve unknown work and terrain', () => {
  const estimate = estimateTrip(draft.base, draft.stops, draft.mission)!;
  expect(estimate.totalKm).toBeCloseTo((2 * Math.PI * 3396.19) / 180, 8);
  expect(estimate.legs).toHaveLength(2);
  expect(estimate.travelMinutes).toBeNull();
  expect(estimate.timeExceeded).toBeNull();
  const mission = {
    ...emptyMission,
    speedKph: String(estimate.totalKm),
    availableMinutes: '80',
    reserveMinutes: '10',
    maximumDistanceKm: String(estimate.totalKm),
  };
  const timed = estimateTrip(
    draft.base,
    [{ ...stop, workMinutes: '10' }],
    mission,
  )!;
  expect(timed.scheduledMinutes).toBeCloseTo(70);
  expect(timed.timeExceeded).toBe(false);
  expect(timed.distanceExceeded).toBe(false);
  expect(timed.terrainFeasibility).toBe('unknown');
  expect(
    estimateTrip(draft.base, [{ ...stop, workMinutes: '11' }], mission)!
      .timeExceeded,
  ).toBe(true);
  expect(
    estimateTrip(draft.base, [stop], mission)!.scheduledMinutes,
  ).toBeNull();
  expect(() =>
    estimateTrip(draft.base, [stop], { ...mission, speedKph: '0' }),
  ).toThrow();
  expect(() =>
    estimateTrip(draft.base, [stop], { ...mission, reserveMinutes: '81' }),
  ).toThrow();
  expect(() => estimateTrip(draft.base, [stop, stop], mission)).toThrow();
});

test('plan imports reject invalid records and preserve export/restore content', () => {
  expect(validateDraft(JSON.parse(exportTrip(draft)))).toEqual(draft);
  expect(() => validateDraft({ ...draft, schemaVersion: 2 })).toThrow();
  expect(() =>
    validateDraft({
      ...draft,
      stops: [{ ...stop, sourceUrl: 'javascript:alert(1)' }],
    }),
  ).toThrow();
  expect(() =>
    validateDraft({ ...draft, stops: [{ ...stop, latitude: 91 }] }),
  ).toThrow();
  expect(() =>
    validateDraft({ ...draft, stops: [{ ...stop, completed: [] }] }),
  ).toThrow();
  expect(() =>
    validateDraft({
      ...draft,
      mission: { ...emptyMission, equipment: 'x'.repeat(2001) },
    }),
  ).toThrow();
});

test('viewport and shortest arcs handle the longitude seam, poles and antipodes', () => {
  expect(
    withinViewport({ latitude: 0, longitude: 179 }, [170, -10, -170, 10]),
  ).toBe(true);
  expect(
    withinViewport({ latitude: 0, longitude: -179 }, [170, -10, -170, 10]),
  ).toBe(true);
  expect(
    withinViewport({ latitude: 0, longitude: 0 }, [170, -10, -170, 10]),
  ).toBe(false);
  expect(
    withinViewport({ latitude: 90, longitude: 0 }, [-180, 80, 180, 90]),
  ).toBe(true);
  const arc = arcSamples(
    { latitude: 0, longitude: 179 },
    { latitude: 0, longitude: -179 },
  );
  expect(arc.every((p) => Math.abs(p.longitude) >= 179)).toBe(true);
  expect(
    arcSamples({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 }),
  ).toEqual([]);
});

test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
});

async function planJezero(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByText('Enter coordinates instead', { exact: true }).click();
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  await page
    .getByRole('button', { name: 'Add three Jezero references to trip' })
    .click();
  return page.getByRole('region', { name: 'Round-trip planner' });
}

test('trip ordering, time budgets, local backup, import and field checks survive reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const planner = await planJezero(page);
  await expect(planner.locator('.trip-stops > li')).toHaveCount(3);
  await expect(page.locator('.map-trip-label')).toContainText(
    'not a validated route',
  );
  await expect(planner).toContainText('minimum round-trip distance');
  await planner.getByRole('button', { name: 'Move Amalik earlier' }).click();
  await expect(planner.locator('.trip-stops > li').nth(1)).toContainText(
    'Amalik',
  );
  await planner
    .getByText('Define mission settings (optional)', { exact: true })
    .click();
  await planner.getByLabel('Assumed travel speed').fill('4');
  await planner.getByLabel('Available trip time').fill('1');
  await planner.getByLabel('Return reserve (min)').fill('0');
  for (const name of ['Skinner Ridge', 'Wildcat Ridge', 'Amalik'])
    await planner.getByLabel(`Work time at ${name} (min)`).fill('10');
  await expect(planner.getByRole('alert')).toContainText(
    'less than your return reserve',
  );
  await planner.getByRole('button', { name: 'Open field view' }).click();
  await expect(planner.locator('figure img')).toHaveCount(3);
  await planner.locator('.trip-task input').first().check();
  await planner.getByRole('button', { name: 'Save local draft' }).click();
  await expect(planner.getByRole('status')).toContainText('Draft saved');
  const download = page.waitForEvent('download');
  await planner.getByRole('button', { name: 'Export plan JSON' }).click();
  expect((await download).suggestedFilename()).toBe('marsway-trip.json');
  await planner.screenshot({ path: 'docs/trip-planner-desktop.png' });
  await page.reload();
  await expect(planner.locator('.trip-stops > li')).toHaveCount(0);
  await planner.getByRole('button', { name: 'Load saved draft' }).click();
  await expect(planner.locator('.trip-stops > li')).toHaveCount(3);
  await expect(planner.locator('.trip-task input').first()).toBeChecked();
  await planner.getByLabel('Import plan JSON').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":99}'),
  });
  await expect(planner.getByRole('status')).toContainText('Could not import');
  await expect(planner.locator('.trip-stops > li')).toHaveCount(3);
  await planner.getByLabel('Import plan JSON').setInputFiles({
    name: 'plan.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exportTrip(draft)),
  });
  await expect(planner.locator('.trip-stops > li')).toHaveCount(1);
  await expect(planner).toContainText('Sample');
  expect(errors).toEqual([]);
});

test('mobile planning without WebGL, terrain failure recovery and historical observations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    }),
  );
  let fail = true;
  await page.route('**/terrain-context.json', (route) =>
    fail ? route.fulfill({ status: 503 }) : route.continue(),
  );
  const planner = await planJezero(page);
  await planner
    .getByText('Sampled terrain context · exploratory', { exact: true })
    .click();
  await expect(planner.getByRole('alert')).toContainText(
    'Terrain context unavailable',
  );
  fail = false;
  await planner.getByRole('button', { name: 'Retry terrain context' }).click();
  await expect(planner).toContainText(
    'arc samples have local elevation context',
  );
  await expect(planner).toContainText('relative to the source Mars areoid');
  await planner.getByRole('button', { name: 'Open field view' }).click();
  await planner.screenshot({ path: 'docs/trip-planner-mobile.png' });
  const weather = page.getByRole('region', {
    name: 'Historical MEDA observations',
  });
  await expect(weather).toContainText('718 Pa');
  await weather.getByLabel('Observation period').selectOption('sols-43-44');
  await expect(weather).toContainText('-83 to -22°C');
  await expect(weather).toContainText('About 10 m/s');
  await expect(weather).not.toContainText('718 Pa');
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('visible-area discovery filters the real catalogue and mission modes refresh tasks', async ({
  page,
}) => {
  await mockWorldTiles(page);
  const planner = await planJezero(page);
  await planner
    .getByText('Define mission settings (optional)', { exact: true })
    .click();
  await planner.getByLabel('Exploration mode').selectOption('robotic-rover');
  await expect(planner).toContainText('camera reach and resolution');
  await planner.getByRole('button', { name: 'Reset to distance-only' }).click();
  await expect(planner).toContainText('scale references');
  await expect(planner).not.toContainText('camera reach and resolution');
  const catalogue = page.getByRole('region', {
    name: 'Mars feature catalogue',
  });
  await catalogue.getByText('Discover Mars features', { exact: true }).click();
  const filter = catalogue.getByLabel('Only features in current map view');
  await expect(filter).toBeEnabled();
  await catalogue
    .getByRole('combobox', { name: 'Feature type', exact: true })
    .selectOption('all');
  const all = await catalogue.locator('.catalog-results-count').textContent();
  await page.getByRole('button', { name: /Jezero view/ }).click();
  await filter.check();
  await expect(catalogue.locator('.catalog-results-count')).not.toHaveText(
    all!,
  );
  expect(
    await catalogue.locator('.catalog-results > li').count(),
  ).toBeLessThanOrEqual(8);
  await filter.uncheck();
  await expect(catalogue.locator('.catalog-results-count')).toHaveText(all!);
});

test('blocked storage, corrupted terrain bytes and printable field plans remain recoverable', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage blocked');
      },
    });
  });
  // This test is about planning; dismiss onboarding even when storage is blocked.
  await page.route('**/terrain-context.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip tutorial' }).click();
  await page.getByText('Enter coordinates instead', { exact: true }).click();
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  await page
    .getByRole('button', { name: 'Add three Jezero references to trip' })
    .click();
  const planner = page.getByRole('region', { name: 'Round-trip planner' });
  await planner.getByRole('button', { name: 'Save local draft' }).click();
  await expect(planner.getByRole('status')).toContainText('Could not save');
  await planner
    .getByText('Sampled terrain context · exploratory', { exact: true })
    .click();
  await expect(planner.getByRole('alert')).toContainText(
    'Terrain context unavailable',
  );
  const download = page.waitForEvent('download');
  await planner.getByRole('button', { name: 'Export plan JSON' }).click();
  await download;
  await planner.getByRole('button', { name: 'Open field view' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(planner).toBeVisible();
  await expect(planner.locator('.trip-assumption-summary')).toBeVisible();
  const pdf = await page.pdf({
    path: testInfo.outputPath('field-plan.pdf'),
    format: 'A4',
  });
  expect(pdf.byteLength).toBeGreaterThan(10000);
});
