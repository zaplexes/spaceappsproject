import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { initialMission, mobilityProfiles } from '../src/data/mission';
import { investigations } from '../src/data/investigations';
import { stops } from '../src/data/stops';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
test.beforeEach(async ({ page }) => {
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({ path: tile, contentType: 'image/png' }),
  );
});

test('approved goal and three exploration modes preserve unconfigured capabilities', () => {
  expect(initialMission.goal).toBe('destination-selection');
  expect(initialMission.base).toBeNull();
  expect(mobilityProfiles.map((profile) => profile.id)).toEqual([
    'walking',
    'crewed-vehicle',
    'robotic-rover',
  ]);
  for (const profile of mobilityProfiles) {
    expect(
      Object.values(profile.capabilities).every((value) => value === null),
    ).toBe(true);
    expect(profile.requirements.length).toBeGreaterThan(0);
  }
  expect(
    new Set(mobilityProfiles.map((profile) => profile.capabilities)).size,
  ).toBe(3);
  expect(investigations.map((investigation) => investigation.stopId)).toEqual(
    stops.map((stop) => stop.id),
  );
  for (const stop of stops) expect(stop.coordinates).toBeNull();
});

test('calculator replaces mission settings while stop science remains available', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#mission-settings')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Mission', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compare stops' })).toHaveCount(
    0,
  );
  await page
    .getByRole('navigation', { name: 'Exploration steps' })
    .getByRole('link', { name: /Compare destinations/ })
    .click();
  await expect(page.locator('#destination-calculator')).toHaveAttribute('open');
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  const plan = page.getByRole('region', { name: 'Skinner Ridge science plan' });
  await plan.getByText('Proposed science tasks', { exact: true }).click();
  await expect(plan).toContainText('overview and close-up photographs');
  await expect(
    plan.getByRole('link', { name: 'Published Swift Run science context' }),
  ).toBeVisible();
});

test('science records remain usable on mobile without WebGL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  const plan = page.getByRole('region', { name: 'Wildcat Ridge science plan' });
  await plan.getByText('Proposed science tasks', { exact: true }).click();
  await expect(plan).toContainText('Proposed tasks · Walking astronauts');
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  await expect(page.locator('#mission-settings')).toHaveCount(0);
});
