import type { Page } from '@playwright/test';

export async function openWorldLayers(page: Page) {
  const details = page.locator('.world-layer-controls');
  if ((await details.getAttribute('open')) === null)
    await details.locator(':scope > summary').click();
}

export async function openMapStatus(page: Page) {
  await page.locator('.imagery-status, .map-fallback').first().waitFor();
  const details = page.locator('.imagery-status');
  if ((await details.count()) && (await details.getAttribute('open')) === null)
    await details.locator(':scope > summary').click();
}
