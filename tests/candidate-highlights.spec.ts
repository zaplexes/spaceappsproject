import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { candidateLocations } from '../src/data/candidate-locations';
import { stops } from '../src/data/stops';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
test.beforeEach(async ({ page }) => {
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({ path: tile, contentType: 'image/png' }),
  );
});

test('candidate references retain the published values without verifying stop coordinates', () => {
  expect(
    candidateLocations.map((location) => [
      location.name,
      location.displayLatitude,
      location.displayLongitude,
    ]),
  ).toEqual([
    ['Skinner Ridge', 18.458931, 77.40617078],
    ['Wildcat Ridge', 18.45863707, 77.40588851],
    ['Amalik', 18.45068954, 77.40143171],
  ]);
  for (const stop of stops) {
    expect(stop.coordinates).toBeNull();
    expect(stop.coordinateStatus).toBe('pending_verification');
  }
});

for (const mobile of [false, true]) {
  test(`selected candidate follows the real globe on ${mobile ? 'mobile' : 'desktop'}`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    const marker = page.getByTestId('candidate-highlight');
    const warning = page.getByTestId('candidate-warning');
    await expect(marker).toBeHidden();
    await expect(warning).toHaveCount(0);
    const centered = async () => {
      const point = await marker.boundingBox();
      const map = await page.locator('canvas').boundingBox();
      return (
        !!point &&
        !!map &&
        Math.abs(point.x + point.width / 2 - (map.x + map.width / 2)) < 2 &&
        Math.abs(point.y + point.height / 2 - (map.y + map.height / 2)) < 2
      );
    };
    for (const candidate of candidateLocations) {
      await page
        .getByRole('button', { name: new RegExp(candidate.name) })
        .click();
      await expect(marker).toBeVisible();
      await expect(marker).toHaveAttribute(
        'aria-label',
        `${candidate.name}: approximate, unverified location`,
      );
      await expect.poll(centered).toBe(true);
      await expect(warning).toContainText('Approximate / unverified location');
      await expect(warning.getByRole('link')).toHaveAttribute(
        'href',
        candidate.sourceUrl,
      );
      const label = await marker.locator('.candidate-label').boundingBox();
      const note = await warning.boundingBox();
      expect(label && note && label.y + label.height < note.y).toBe(true);
    }
    await page.locator('canvas').focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(centered).toBe(false);
    await page.getByRole('button', { name: /Amalik/ }).click();
    await expect.poll(centered).toBe(true);
    // A resize must reproject the anchor against the actual canvas dimensions.
    await page.setViewportSize(
      mobile ? { width: 430, height: 900 } : { width: 1440, height: 900 },
    );
    await expect.poll(centered).toBe(true);
    const point = await marker.boundingBox();
    const note = await warning.boundingBox();
    expect(point && note && point.y + point.height < note.y).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole('button', { name: 'Compare stops' }),
    ).toBeDisabled();
    await page
      .getByRole('region', { name: 'Jezero map', exact: true })
      .screenshot({
        path: `docs/candidate-highlight-${mobile ? 'mobile' : 'desktop'}.png`,
      });
    expect(errors).toEqual([]);
  });
}

test('selection made during map loading survives startup and map retry', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/assets/create-mars-viewer-*.js', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await expect(page.getByTestId('candidate-highlight')).toBeHidden();
  release();
  const marker = page.getByTestId('candidate-highlight');
  await expect(marker).toBeVisible();
  await expect(marker).toContainText('Wildcat Ridge');
  await page.locator('canvas').evaluate((canvas) => {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  });
  await expect(page.getByRole('button', { name: 'Retry map' })).toBeVisible();
  await expect(marker).toBeHidden();
  await page.getByRole('button', { name: 'Retry map' }).click();
  await expect(marker).toBeVisible();
  await expect(marker).toContainText('Wildcat Ridge');
});
