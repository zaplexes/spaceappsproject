import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mockWorldTiles } from './mock-world-tiles';

for (const width of [1440, 390]) {
  test(`documentation works without JavaScript at ${width}px`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width, height: 900 },
    });
    try {
      const page = await context.newPage();
      const requests: string[] = [];
      const failures: string[] = [];
      page.on('request', (request) => requests.push(request.url()));
      page.on('response', (response) => {
        if (response.status() >= 400) failures.push(response.url());
      });
      const response = await page.goto('/documentation/');
      expect(response?.ok()).toBe(true);
      await expect(page).toHaveTitle('Marsway · Project documentation');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Helping astronauts choose where to go next.',
      );
      for (const name of [
        'The decision Marsway supports',
        'Use Marsway in five steps',
        'How destination suggestions work',
        'NASA data and how it is used',
        'Technical approach and reproducibility',
        'Current limitations and next steps',
        'Credits, AI assistance and project status',
      ])
        await expect(
          page.getByRole('heading', { name, exact: true }),
        ).toBeVisible();
      await page
        .getByRole('navigation', { name: 'Documentation sections' })
        .getByRole('link', { name: 'NASA data' })
        .click();
      await expect(page).toHaveURL(/#data$/);
      await expect(page.locator('#data')).toBeInViewport();
      await expect(
        page.getByRole('link', { name: 'View source code', exact: true }),
      ).toHaveAttribute('href', 'https://github.com/zaplexes/Marsway');
      await expect(page.locator('header img')).toBeVisible();
      await page.getByText('Run the source locally', { exact: true }).click();
      await expect(page.locator('pre')).toBeVisible();
      expect(
        requests.some((url) =>
          /\.(?:m?js)(?:\?|$)|\/cesium\/|trek\.nasa/.test(url),
        ),
      ).toBe(false);
      expect(failures).toEqual([]);
      await page.goto('/documentation/');
      await page.screenshot({
        path: `docs/documentation-${width > 700 ? 'desktop' : 'mobile'}.png`,
      });
    } finally {
      await context.close();
    }
  });
}

test('Docs opens separately and preserves the current base and responsive app layout', async ({
  page,
}) => {
  await mockWorldTiles(page);
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url)),
      contentType: 'image/png',
    }),
  );
  await page.goto('/');
  await page.getByText('Enter coordinates instead', { exact: true }).click();
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  const popupPromise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'Project documentation (opens in a new tab)',
      exact: true,
    })
    .click();
  const documentation = await popupPromise;
  await expect(documentation).toHaveURL(/\/documentation\/$/);
  await expect(documentation).toHaveTitle('Marsway · Project documentation');
  await expect(page.getByText('Base set', { exact: true })).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await documentation.setViewportSize({ width: 390, height: 900 });
  expect(
    await documentation.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await documentation.close();
});
