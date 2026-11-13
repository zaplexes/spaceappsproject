import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mockWorldTiles } from './mock-world-tiles';

test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url)),
      contentType: 'image/png',
    }),
  );
});

test('guided keyboard planning opens the calculator without opening catalogue browsing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  let requests = 0;
  page.on('request', (request) => {
    if (/\/catalog\/index-/.test(request.url())) requests++;
  });
  await page.goto('/');
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }),
  ).toBeVisible();
  await expect(page.locator('.coordinate-entry')).not.toHaveAttribute('open');
  expect(requests).toBe(0);
  await expect(page.locator('.map-host canvas')).toBeVisible();
  await expect(
    page.getByText('Starting the Mars map…', { exact: true }),
  ).toBeHidden();
  await expect(
    page.getByText('Global MOC imagery: loaded', { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/ui-overview-desktop.png' });
  await page.getByText('Enter coordinates instead', { exact: true }).click();
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  const inputBox = await page.getByLabel('Base latitude').boundingBox();
  expect(inputBox!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  await expect(page.getByText('Base set', { exact: true })).toBeVisible();
  await expect(page.locator('.coordinate-entry')).not.toHaveAttribute('open');
  const compare = page
    .getByRole('navigation', { name: 'Exploration steps' })
    .getByRole('link', { name: /Compare destinations/ });
  await compare.focus();
  await page.keyboard.press('Enter');
  const calculator = page.locator('.feature-calculator');
  await expect(calculator).toHaveAttribute('open');
  await expect(page.locator('.catalog-discovery')).not.toHaveAttribute('open');
  await expect(calculator.getByText('Loading destinations…')).toBeHidden();
  await calculator.getByLabel('Search radius').fill('1000');
  await expect(calculator.locator('.destination-results > li')).toHaveCount(10);
  expect(requests).toBe(1);
  const first = calculator.locator('.destination-results > li').first();
  await expect(first.locator('.score-explanation')).not.toHaveAttribute('open');
  await first.getByText('Why this score?', { exact: true }).click();
  await expect(
    first.getByRole('link', { name: 'Feature data & source' }),
  ).toBeVisible();
  await expect(first).toContainText('Unknown · 0–20 points unresolved');
  await calculator
    .getByText('Scoring rules & preferences', { exact: true })
    .click();
  await calculator.getByLabel('Study potential weight').fill('49');
  await expect(calculator.getByRole('alert')).toBeVisible();
  await calculator.getByLabel('Distance weight', { exact: true }).fill('31');
  await expect(calculator.getByRole('alert')).toHaveCount(0);
  await expect(calculator.locator('.destination-results > li')).toHaveCount(10);
});

test('standalone calculator recovers from a catalogue outage', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/catalog/index-*.json', (route) =>
    fail ? route.fulfill({ status: 503 }) : route.continue(),
  );
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Exploration steps' })
    .getByRole('link', { name: /Compare destinations/ })
    .click();
  const calculator = page.locator('.feature-calculator');
  await expect(calculator.getByRole('alert')).toContainText(
    'Destinations could not load.',
  );
  fail = false;
  await calculator.getByRole('button', { name: 'Retry destinations' }).click();
  await expect(calculator.getByRole('alert')).toHaveCount(0);
  await expect(calculator.getByText('Loading destinations…')).toBeHidden();
  await expect(calculator).toContainText(
    'Set your base to calculate recommendations.',
  );
});

test('mobile navigation, base placement guidance and compact results remain accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.map-host canvas')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Plan', exact: true })
    .click();
  await page.getByRole('button', { name: 'Place base on map' }).click();
  await expect(page.locator('.base-placement-banner')).toBeInViewport();
  await page
    .getByRole('button', { name: 'Cancel placement', exact: true })
    .click();
  await expect(page.locator('.base-placement-banner')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Simulated astronaut base' }),
  ).toContainText('No base set.');
  await page.getByText('Enter coordinates instead', { exact: true }).click();
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  await page.locator('.feature-calculator > summary').click();
  const calculator = page.locator('.feature-calculator');
  await calculator.getByLabel('Search radius').fill('1000');
  await expect(calculator.locator('.destination-results > li')).toHaveCount(10);
  await calculator.locator('.evidence-note').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/ui-results-mobile.png' });
  for (const width of [360, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
