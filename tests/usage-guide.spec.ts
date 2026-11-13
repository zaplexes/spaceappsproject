import { expect, test } from '@playwright/test';
import { mockWorldTiles } from './mock-world-tiles';

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await mockWorldTiles(page);
});

test('first visit can skip, remembers dismissal and can reopen from the beginning', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Marsway · Choose your next destination');
  const logo = page.locator('.brand-logo');
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    'href',
    '/branding/marsway-logo.png',
  );
  const guide = page.getByRole('region', { name: 'How to use Marsway' });
  await expect(guide).toBeVisible();
  await expect(
    guide.getByRole('button', { name: 'Back', exact: true }),
  ).toBeDisabled();
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.getByRole('heading')).toHaveText('Choose where to start');
  await guide.getByRole('button', { name: 'Skip tutorial' }).click();
  await expect(guide).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'How to use', exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(guide).toHaveCount(0);
  await page.getByRole('button', { name: 'How to use', exact: true }).click();
  await expect(guide.getByRole('heading')).toHaveText(
    'Get to know your Mars map',
  );
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await guide.getByRole('heading').press('Escape');
  await expect(guide).toHaveCount(0);
});

test('mobile guide supports back, completion and keyboard navigation without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const guide = page.getByRole('region', { name: 'How to use Marsway' });
  await expect(page.locator('.map-toolbar')).toBeVisible();
  await expect(page.locator('.guide-spotlight')).toHaveAttribute(
    'data-target',
    '.map-toolbar, .map-host',
  );
  await page.screenshot({ path: 'docs/tutorial-mobile.png' });
  await guide.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(guide.getByRole('heading')).toBeFocused();
  await guide.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(guide).toContainText('Step 1 of 6');
  for (let step = 2; step <= 6; step++) {
    await guide.getByRole('button', { name: 'Next', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(guide).toContainText(`Step ${step} of 6`);
    const spotlight = page.locator('.guide-spotlight');
    await expect(spotlight).toHaveAttribute(
      'data-target',
      [
        '',
        '',
        '#expedition-base',
        '#destination-calculator > summary',
        '.world-layer-controls > summary',
        '#evidence-inspector .evidence-heading',
        '#trip-planner .trip-heading',
      ][step],
    );
    const highlightBox = await spotlight.boundingBox();
    const cardBox = await guide.boundingBox();
    expect(highlightBox!.height).toBeGreaterThan(10);
    expect(cardBox!.y).toBeGreaterThanOrEqual(0);
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(800);
    expect(
      highlightBox!.y + highlightBox!.height <= cardBox!.y ||
        cardBox!.y + cardBox!.height <= highlightBox!.y,
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await guide.getByRole('button', { name: 'Finish tutorial' }).click();
  await expect(guide).toHaveCount(0);
  await page.reload();
  await expect(guide).toHaveCount(0);
});

test('blocked storage does not prevent skipping or reopening the guide', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage blocked');
      },
    });
  });
  await page.goto('/');
  const guide = page.getByRole('region', { name: 'How to use Marsway' });
  await expect(guide).toBeVisible();
  await expect(page.locator('.map-toolbar')).toBeVisible();
  await expect
    .poll(async () => {
      const highlight = await page.locator('.guide-spotlight').boundingBox();
      const target = await page.locator('.map-toolbar').boundingBox();
      return Math.abs(highlight!.width - target!.width - 12);
    })
    .toBeLessThan(1);
  await page.screenshot({ path: 'docs/tutorial-desktop.png' });
  await guide.getByRole('button', { name: 'Skip tutorial' }).click();
  await expect(guide).toHaveCount(0);
  await page.getByRole('button', { name: 'How to use', exact: true }).click();
  await expect(guide).toBeVisible();
});
