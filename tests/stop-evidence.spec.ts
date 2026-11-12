import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import images from '../data/manifests/surface-images.json' with { type: 'json' };
import review from '../data/manifests/sample-location-review.json' with { type: 'json' };
import audit from '../data/manifests/pds-position-audit.json' with { type: 'json' };
import { stops } from '../src/data/stops';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));
test.beforeEach(async ({ page }) => {
  await page.route('https://trek.nasa.gov/tiles/**', (route) =>
    route.fulfill({
      path: tile,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
});

test('each candidate stop has an intact NASA image and unresolved position evidence', () => {
  expect(images.images).toHaveLength(stops.length);
  expect(new Set(images.images.map((image) => image.stopId)).size).toBe(
    stops.length,
  );
  for (const stop of stops) {
    const image = images.images.find((entry) => entry.stopId === stop.id)!;
    const position = review.entries.find(
      (entry) => entry.sample === stop.sample,
    )!;
    expect(image.sample).toBe(stop.sample);
    expect(new URL(image.sourceImageUrl).hostname).toBe('science.nasa.gov');
    expect(image.credit).toBe('NASA/JPL-Caltech');
    expect(image.modified).toBe(false);
    const bytes = readFileSync(
      new URL(`../assets${image.assetUrl}`, import.meta.url),
    );
    expect(bytes.length).toBe(image.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(image.sha256);
    expect(bytes.readUInt32BE(16)).toBe(image.width);
    expect(bytes.readUInt32BE(20)).toBe(image.height);
    expect(position.exactDrillLocationConfirmed).toBe(false);
    expect(position.latitudeDefinition).toBeNull();
    expect(position.horizontalAccuracyMetres).toBeNull();
    expect(position.placementStatus).toBe('pending_verification');
    expect(stop.coordinates).toBeNull();
  }
  expect(audit.eventJoinVerified).toBe(false);
  expect(audit.drillTipTransformApplied).toBe(false);
  expect(audit.markerPlacementApproved).toBe(false);
  // NASA's Hazeltop image caption date differs from the catalog sealing date.
  expect(
    images.images.find((image) => image.sample === 'Hazeltop')?.dateAsPublished,
  ).toBe('2022-07-26');
  expect(stops.find((stop) => stop.sample === 'Hazeltop')?.dateSealed).toBe(
    '2022-07-27',
  );
});

test('each selected stop shows its own photo, credit, capture context and PDS dossier', async ({
  page,
}) => {
  await page.goto('/');
  for (const stop of stops) {
    const image = images.images.find((entry) => entry.stopId === stop.id)!;
    const position = review.entries.find(
      (entry) => entry.sample === stop.sample,
    )!;
    await page.getByRole('button', { name: new RegExp(stop.name) }).click();
    const figure = page.getByRole('figure', {
      name: `${stop.sample} surface reference`,
    });
    await expect(figure.getByRole('img', { name: image.alt })).toBeVisible();
    expect(
      await figure
        .locator('img')
        .evaluate((element: HTMLImageElement) => element.naturalWidth),
    ).toBe(image.width);
    await expect(figure).toContainText(`Image sol ${image.acquisitionSol}`);
    await expect(figure).toContainText(
      `Image date (NASA caption): ${image.dateAsPublished}`,
    );
    await expect(figure).toContainText('Credit: NASA/JPL-Caltech');
    await expect(
      figure.getByRole('link', { name: 'NASA surface image' }),
    ).toHaveAttribute('href', image.sourceImageUrl);
    await page.getByText('Review position evidence', { exact: true }).click();
    await expect(
      page.getByText(/These values are not verified drill positions/),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: `PDS ${stop.sample} dossier`,
        exact: false,
      }),
    ).toHaveAttribute('href', `${review.sourceUrl}#page=${position.pdfPage}`);
    await expect(
      page.getByRole('link', { name: 'PDS localization record' }),
    ).toHaveAttribute('href', review.localizationUrl);
    await expect(
      page.getByRole('link', { name: 'PDS arm joint record' }),
    ).toHaveAttribute('href', review.armUrl);
    await expect(
      page.getByRole('link', { name: 'PDS instrument-frame definitions' }),
    ).toHaveAttribute('href', review.instrumentFramesUrl);
  }
});

test('surface loading and failure preserve sources and retry recovers', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failing = true;
  await page.route('**/stops/skinner-ridge-navcam.png*', async (route) => {
    if (failing) {
      await gate;
      await route.abort();
    } else await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(page.getByText('Loading surface image…')).toBeVisible();
  release();
  await expect(page.getByText('Surface image unavailable.')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'NASA surface image', exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'NASA sample catalog' }),
  ).toBeVisible();
  await page.getByText('Review position evidence', { exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'PDS Swift Run dossier', exact: false }),
  ).toBeVisible();
  failing = false;
  await page.getByRole('button', { name: 'Retry surface image' }).click();
  await expect(
    page.getByRole('img', { name: images.images[0].alt }),
  ).toBeVisible();
  await expect(page.getByText('Surface image unavailable.')).toHaveCount(0);
});

test('a late image failure cannot replace the newly selected stop', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/stops/skinner-ridge-navcam.png', async (route) => {
    await gate;
    await route.abort();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Skinner Ridge/ }).click();
  await expect(page.getByText('Loading surface image…')).toBeVisible();
  await page.getByRole('button', { name: /Wildcat Ridge/ }).click();
  await expect(
    page.getByRole('img', { name: images.images[1].alt }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole('img', { name: images.images[1].alt }),
  ).toBeVisible();
  await expect(page.getByText('Surface image unavailable.')).toHaveCount(0);
});

test('surface evidence stays usable on a narrow screen without WebGL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => null,
    });
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Map unavailable' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Amalik/ }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('img', { name: images.images[2].alt }),
  ).toBeVisible();
  await page.getByText('Review position evidence', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('link', { name: 'PDS Shuyak dossier', exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
