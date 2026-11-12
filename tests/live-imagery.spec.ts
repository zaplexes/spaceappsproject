import { expect, test } from '@playwright/test';
test('live NASA imagery renders, navigates and produces review screenshots', async ({
  page,
}) => {
  test.skip(
    process.env.LIVE_IMAGERY !== '1',
    'Explicit live-network check; run npm run test:live',
  );
  test.setTimeout(90000);
  const tiles: string[] = [];
  const errors: string[] = [];
  page.on('response', (response) => {
    if (
      response.url().startsWith('https://trek.nasa.gov/tiles/') &&
      response.ok() &&
      response.headers()['content-type']?.includes('image')
    )
      tiles.push(response.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible({
    timeout: 60000,
  });
  expect(tiles.some((url) => url.includes('JEZ_ctx_B_soc_008'))).toBe(true);
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await expect(page.locator('.surface-reference img')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/preview-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Mars globe', exact: true }).click();
  await expect
    .poll(() => tiles.some((url) => url.includes('msss_atlas_simp_clon')))
    .toBe(true);
  await page.getByRole('button', { name: 'Jezero view' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/preview-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel('Jezero elevation colours').check();
  await expect(page.getByTestId('elevation-status')).toContainText('loaded');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/elevation-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/elevation-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel('Jezero regional geology', { exact: false }).check();
  await expect(page.getByTestId('geology-status')).toContainText('loaded');
  await expect(page.getByLabel('Jezero elevation colours')).not.toBeChecked();
  await page.getByText('Geological units (14)', { exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/geology-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/geology-mobile.png', fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
