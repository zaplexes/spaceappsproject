import { openMapStatus, openWorldLayers } from './map-controls';
import type { Page } from '@playwright/test';

// Regional checks explicitly choose the local view instead of relying on startup defaults.
export async function openJezeroControls(page: Page, imagery = false) {
  await openWorldLayers(page);
  const regional = page.locator('.regional-layer-controls');
  if ((await regional.getAttribute('open')) === null)
    await regional.locator(':scope > summary').click();
  const jezero = page.getByRole('button', {
    name: 'Jezero view',
    exact: false,
  });
  if (await jezero.count()) await jezero.click();
  await openMapStatus(page);
  if (imagery) {
    await page.getByLabel('Jezero CTX imagery').check();
    await page.getByLabel('Jezero HiRISE imagery').check();
  }
}
