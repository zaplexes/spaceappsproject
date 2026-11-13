import { openJezeroControls } from './jezero-controls';
import { expect, test } from '@playwright/test';
import { worldSources, tileUrl } from '../src/data/layers';
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
  const worldImages = new Map<string, Set<string>>();
  const worldFailures: string[] = [];
  page.on('response', (response) => {
    for (const source of worldSources) {
      if (response.url().startsWith(tileUrl(source).split('{z}')[0])) {
        if (
          response.ok() &&
          response.headers()['content-type']?.startsWith('image/')
        ) {
          const images = worldImages.get(source.id) ?? new Set<string>();
          images.add(response.url());
          worldImages.set(source.id, images);
        } else if (response.status() >= 400)
          worldFailures.push(`${response.status()} ${response.url()}`);
      }
    }
    if (
      response.url().startsWith('https://trek.nasa.gov/tiles/') &&
      response.ok() &&
      response.headers()['content-type']?.includes('image')
    )
      tiles.push(response.url());
  });
  page.on('requestfailed', (request) => {
    if (
      worldSources.some((source) =>
        request.url().startsWith(tileUrl(source).split('{z}')[0]),
      ) &&
      !request.failure()?.errorText.includes('ERR_ABORTED')
    )
      worldFailures.push(`${request.failure()?.errorText} ${request.url()}`);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeVisible();
  await openJezeroControls(page, true);
  await expect(page.getByText('Jezero CTX imagery: loaded')).toBeVisible({
    timeout: 60000,
  });
  expect(tiles.some((url) => url.includes('JEZ_ctx_B_soc_008'))).toBe(true);
  await expect(page.getByText('Jezero HiRISE imagery: loaded')).toBeVisible({
    timeout: 60000,
  });
  expect(tiles.some((url) => url.includes('JEZ_hirise_soc_006'))).toBe(true);
  const selectedDetail = page.waitForResponse(
    (response) =>
      response.url().includes('/JEZ_hirise_soc_006_') &&
      response.url().endsWith('.png') &&
      response.ok(),
  );
  const selectedImagery = page.waitForResponse(
    (response) =>
      response
        .url()
        .includes('/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/') &&
      response.url().endsWith('.png') &&
      response.ok(),
  );
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await selectedImagery;
  await selectedDetail;
  await expect(page.getByText('Jezero HiRISE imagery: loaded')).toBeVisible({
    timeout: 60000,
  });
  await expect(page.getByTestId('candidate-highlight')).toBeVisible();
  await expect(page.getByTestId('candidate-warning')).toContainText(
    'Approximate / unverified location',
  );
  await expect(page.locator('.surface-reference img')).toBeVisible();
  await page
    .getByRole('region', { name: 'Jezero map', exact: true })
    .screenshot({ path: 'docs/candidate-highlight-live.png' });
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
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel('Jezero estimated slope', { exact: false }).check();
  await expect(page.getByTestId('slope-status')).toContainText('loaded');
  await expect(
    page.getByLabel('Jezero regional geology', { exact: false }),
  ).not.toBeChecked();
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await page.screenshot({ path: 'docs/slope-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/slope-mobile.png', fullPage: true });
  await page
    .getByRole('region', { name: 'Jezero map', exact: true })
    .screenshot({ path: 'docs/slope-map-mobile.png' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.getByLabel('Jezero estimated slope', { exact: false }).uncheck();
  const catalogue = page.getByRole('region', {
    name: 'Mars feature catalogue',
  });
  await catalogue.getByText('Discover Mars features', { exact: true }).click();
  await catalogue.getByLabel('Search features').fill('Gale');
  await catalogue.getByRole('button', { name: /^Gale / }).click();
  const feature = page.getByRole('region', {
    name: 'Catalogue feature details',
  });
  await feature
    .getByRole('button', { name: 'Add candidate science stop' })
    .click();
  await expect(page.getByText('Global MOC imagery: loaded')).toBeVisible({
    timeout: 60000,
  });
  await expect(page.getByTestId('candidate-highlight')).toBeVisible();
  await expect(page.getByTestId('candidate-warning')).toContainText(
    'Catalogue centre',
  );
  await page
    .getByRole('region', { name: 'Mars discovery map' })
    .screenshot({ path: 'docs/catalogue-live.png' });
  await expect
    .poll(() => worldImages.get('ctx-global')?.size ?? 0, { timeout: 60000 })
    .toBeGreaterThan(0);
  await expect(
    page.getByText(/^Global CTX imagery: (loaded|unavailable)/),
  ).toBeVisible({ timeout: 60000 });
  await page
    .getByRole('region', { name: 'Mars discovery map' })
    .screenshot({ path: 'docs/world-ctx-live.png' });
  await page
    .getByRole('checkbox', { name: /^Global geological context/ })
    .check();
  await expect
    .poll(() => worldImages.get('geology-global')?.size ?? 0, {
      timeout: 60000,
    })
    .toBeGreaterThan(0);
  await expect(
    page.getByText(/^Global geological context: (loaded|unavailable)/),
  ).toBeVisible({ timeout: 60000 });
  await page
    .getByRole('region', { name: 'Mars discovery map' })
    .screenshot({ path: 'docs/world-geology-live.png' });
  await page
    .getByRole('checkbox', { name: /^Global elevation context/ })
    .check();
  await expect
    .poll(() => worldImages.get('relief-global')?.size ?? 0, { timeout: 60000 })
    .toBeGreaterThan(0);
  await expect(
    page.getByText(/^Global elevation context: (loaded|unavailable)/),
  ).toBeVisible({ timeout: 60000 });
  await page
    .getByRole('region', { name: 'Mars discovery map' })
    .screenshot({ path: 'docs/world-relief-live.png' });
  await page
    .getByRole('checkbox', { name: /^Global elevation context/ })
    .uncheck();
  await page
    .getByRole('checkbox', { name: /^THEMIS daytime infrared/ })
    .check();
  await expect
    .poll(() => worldImages.get('themis')?.size ?? 0, { timeout: 60000 })
    .toBeGreaterThan(0);
  await expect(
    page.getByText(/^THEMIS daytime infrared: (loaded|unavailable)/),
  ).toBeVisible({ timeout: 60000 });
  await page
    .getByRole('region', { name: 'Mars discovery map' })
    .screenshot({ path: 'docs/world-themis-live.png' });
  await test.info().attach('global-layer-requests', {
    body: JSON.stringify(
      {
        successfulTileCounts: Object.fromEntries(
          [...worldImages].map(([id, images]) => [id, images.size]),
        ),
        failures: worldFailures,
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
  expect(errors).toEqual([]);
});
