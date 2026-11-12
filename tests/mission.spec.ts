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
  expect(initialMission.goal).toBe('ancient-water');
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

test('mode changes update the proposed science plan while preserving selection, source and analysis gates', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByLabel('Scientific goal')).toHaveValue('ancient-water');
  const mode = page.getByLabel('Exploration mode');
  await expect(mode).toHaveValue('walking');
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  const plan = page.getByRole('region', { name: 'Skinner Ridge science plan' });
  await plan.getByText('Proposed science tasks', { exact: true }).click();
  await expect(plan).toContainText('overview and close-up photographs');
  const source = plan.getByRole('link', {
    name: 'Published Swift Run science context',
  });
  const sourceUrl = await source.getAttribute('href');
  await mode.selectOption('crewed-vehicle');
  await expect(page.getByTestId('active-mobility')).toHaveText(
    'Astronauts in a crew vehicle',
  );
  await expect(plan).toContainText('separately assessed walking task');
  await expect(plan).not.toContainText(
    'Describe visible textures and identify',
  );
  await mode.selectOption('robotic-rover');
  await expect(page.getByTestId('active-mobility')).toHaveText(
    'Robotic ground rover',
  );
  await expect(plan).toContainText('camera reach and resolution');
  await expect(plan).not.toContainText('separately assessed walking task');
  await expect(source).toHaveAttribute('href', sourceUrl!);
  await expect(page.getByTestId('candidate-highlight')).toHaveAttribute(
    'aria-label',
    'Skinner Ridge: approximate, unverified location',
  );
  await expect(
    page.getByRole('button', { name: 'Compare stops' }),
  ).toBeDisabled();
  await expect(page.locator('#ranking-reason')).toContainText(
    'verified locations',
  );
  await expect(page.locator('#ranking-reason')).not.toContainText('goal');
  for (const name of ['Wildcat Ridge', 'Amalik']) {
    await page.getByRole('button', { name: new RegExp(name) }).click();
    const selectedPlan = page.getByRole('region', {
      name: `${name} science plan`,
    });
    await selectedPlan
      .getByText('Proposed science tasks', { exact: true })
      .click();
    await expect(
      selectedPlan.getByRole('heading', {
        name: 'Proposed tasks · Robotic ground rover',
      }),
    ).toBeVisible();
  }
  await page
    .locator('.mission-panel')
    .screenshot({ path: 'docs/mission-desktop.png' });
  expect(errors).toEqual([]);
});

test('keyboard mode changes work on mobile without WebGL; reload retains the agreed goal and default mode', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    }),
  );
  await page.goto('/');
  const mode = page.getByLabel('Exploration mode');
  await mode.focus();
  await mode.press('Home');
  await mode.press('ArrowDown');
  await mode.press('Enter');
  await expect(mode).toHaveValue('crewed-vehicle');
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  const plan = page.getByRole('region', { name: 'Wildcat Ridge science plan' });
  await plan.getByText('Proposed science tasks', { exact: true }).click();
  await expect(plan).toContainText('walking task with its own limits');
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  await expect(page.getByLabel('Scientific goal')).toHaveValue('ancient-water');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .locator('.mission-panel')
    .screenshot({ path: 'docs/mission-mobile.png' });
  await page.reload();
  await expect(mode).toHaveValue('walking');
  await expect(page.getByLabel('Scientific goal')).toHaveValue('ancient-water');
});
