import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { sourceRecords } from '../src/data/sources';

const tile = fileURLToPath(new URL('./fixtures/imagery.png', import.meta.url));

test('source registry retains unknowns and separates observations from derived products', () => {
  expect(sourceRecords).toHaveLength(14);
  expect(new Set(sourceRecords.map((source) => source.id)).size).toBe(14);
  expect(new Set(sourceRecords.map((source) => source.kind))).toEqual(
    new Set([
      'Orbital image',
      'Rover image',
      'Derived elevation',
      'Derived slope',
      'Geological interpretation',
      'Feature catalogue',
      'Shaded relief',
    ]),
  );
  expect(sourceRecords.every((source) => !source.analysisEligible)).toBe(true);
  const moc = sourceRecords.find((source) => source.id === 'global')!;
  expect(moc.version).toBeNull();
  expect(moc.observationDate).toBeNull();
  expect(moc.publicationDate).toBeNull();
  expect(moc.resolution).toContain('not established');
  for (const source of sourceRecords.filter((s) => s.kind === 'Rover image')) {
    expect(source.bounds).toBeNull();
    expect(source.observationDate).toMatch(/^2022-\d\d-\d\d$/);
  }
  expect(
    sourceRecords.find((source) => source.id === 'elevation')?.verticalDatum,
  ).toContain('areoid');
});

for (const mobileFallback of [false, true]) {
  test(`source review works ${mobileFallback ? 'on mobile without WebGL' : 'with the map on desktop'}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (mobileFallback) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(() => {
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
          value: () => null,
        });
      });
    }
    await page.route('https://trek.nasa.gov/tiles/**', (route) =>
      route.fulfill({ path: tile, contentType: 'image/png' }),
    );
    await page.goto('/');
    const summary = page.getByText('Review sources and limitations (14)', {
      exact: true,
    });
    await summary.focus();
    await page.keyboard.press('Enter');
    const records = page.locator('.source-records');
    await expect(records.getByRole('article')).toHaveCount(14);
    for (const source of sourceRecords) {
      const article = records.getByRole('article').filter({
        has: page.getByRole('link', {
          name: `${source.title} ↗`,
          exact: true,
        }),
      });
      await expect(
        article.getByText(source.kind, { exact: true }),
      ).toBeVisible();
      await expect(article.getByRole('link')).toHaveAttribute(
        'href',
        source.sourceUrl,
      );
      await expect(article).toContainText('Analysis eligibility: unverified');
    }
    await expect(
      records.getByRole('article').filter({ hasText: 'Global MOC imagery' }),
    ).toContainText('Source versionNot established');
    await expect(
      records
        .getByRole('article')
        .filter({ hasText: 'Jezero regional geology' }),
    ).toContainText('100–200 m');
    const firstRecord = records.getByRole('article').first();
    const checksums = firstRecord.getByText('Checksum records (SHA-256)', {
      exact: true,
    });
    await checksums.click();
    await expect(
      firstRecord.getByText(sourceRecords[0].checksums[0].sha256, {
        exact: true,
      }),
    ).toBeVisible();
    await checksums.click();
    await expect(
      page.getByRole('button', { name: 'Compare stops' }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await summary.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/sources-${mobileFallback ? 'mobile' : 'desktop'}.png`,
      fullPage: false,
    });
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(records).toBeHidden();
    expect(errors).toEqual([]);
  });
}
