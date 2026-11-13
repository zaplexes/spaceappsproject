import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mockWorldTiles } from './mock-world-tiles';

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

for (const width of [1440, 390]) {
  test(`destination-first presentation keeps map controls compact at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page).toHaveTitle('Marsway · Choose your next destination');
    await expect(
      page.getByRole('heading', {
        name: 'Choose your next destination on Mars.',
      }),
    ).toBeVisible();
    const status = page.locator('.imagery-status');
    await expect(status).toBeVisible();
    await expect(status).not.toHaveAttribute('open');
    await expect(page.locator('.world-layer-controls')).not.toHaveAttribute(
      'open',
    );
    await expect(page.locator('.regional-layer-controls')).not.toHaveAttribute(
      'open',
    );
    expect((await status.boundingBox())!.height).toBeLessThan(60);
    await status.locator(':scope > summary').click();
    await expect(
      page.getByText('Global MOC imagery: loaded', { exact: true }),
    ).toBeVisible();
    await status.locator(':scope > summary').click();
    await page.getByRole('button', { name: /Skinner Ridge/ }).click();
    const warning = page.getByTestId('candidate-warning');
    await expect(
      warning.getByText('Skinner Ridge · Approximate / unverified location', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(warning.locator('details')).not.toHaveAttribute('open');
    expect((await warning.boundingBox())!.height).toBeLessThan(90);
    await warning.locator('summary').click();
    await expect(
      warning.getByRole('link', { name: 'Published candidate position' }),
    ).toBeVisible();
    await warning.locator('summary').click();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Layers', exact: true })
      .click();
    await expect(page.locator('.world-layer-controls')).toHaveAttribute(
      'open',
      '',
    );
    await page.locator('.world-layer-controls > summary').click();
    if (width > 700) {
      const panel = page.locator('.explorer-panel');
      expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(1000);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `docs/destination-workspace-${width > 700 ? 'desktop' : 'mobile'}.png`,
    });
  });
}

test('mission interests start equally and can be adjusted for the crew', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Compare destinations/ }).click();
  const calculator = page.locator('#destination-calculator');
  await expect(calculator).toContainText('equal starting interests');
  await calculator
    .getByText('Scoring rules & preferences', { exact: true })
    .click();
  await calculator
    .getByText('Study interest by feature type', { exact: true })
    .click();
  const interests = calculator.locator('.type-preferences input');
  expect(await interests.count()).toBeGreaterThan(1);
  for (const value of await interests.evaluateAll((inputs) =>
    inputs.map((input) => (input as HTMLInputElement).value),
  ))
    expect(value).toBe('50');
  await interests.first().fill('80');
  await expect(interests.first()).toHaveValue('80');
  await expect(interests.nth(1)).toHaveValue('50');
});
