import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import console from 'node:console';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';

const root = resolve('artifacts/marsway-video');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: `${root}/raw`, size: { width: 1920, height: 1080 } },
});
const anchor = performance.now();
const page = await context.newPage();
const scenes = [];
const pause = (ms) => page.waitForTimeout(ms);
const scroll = async (locator) => {
  await locator.scrollIntoViewIfNeeded();
  await pause(700);
};
async function scene(name, action) {
  const start = (performance.now() - anchor) / 1000;
  await page.screenshot({ path: `${root}/raw/${name}.png` });
  await action();
  const end = (performance.now() - anchor) / 1000;
  scenes.push({ name, start, duration: end - start });
  await writeFile(
    `${root}/raw/scenes.json`,
    `${JSON.stringify(scenes, null, 2)}\n`,
  );
  console.log(name, start, end);
}
try {
  await page.goto('https://zaplexes.github.io/Marsway/', {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Skip tutorial' }).click();
  await pause(2500);
  await scroll(page.locator('#exploration-map'));
  await scene('01-globe', async () => {
    const canvas = page.locator('.map-host canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.43, box.y + box.height * 0.5, {
      steps: 70,
    });
    await page.mouse.up();
    await pause(3000);
  });
  await page.getByRole('button', { name: /Jezero view/ }).click();
  await pause(8000);
  await scene('02-imagery', async () => {
    await pause(1500);
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await pause(3500);
  });
  await page.getByText('Enter coordinates instead', { exact: true }).click();
  await page.getByLabel('Base latitude').fill('18.4446');
  await page.getByLabel('Base longitude').fill('77.4509');
  await page.getByRole('button', { name: 'Set base coordinates' }).click();
  await page.getByRole('link', { name: /Compare destinations/ }).click();
  const calc = page.locator('#destination-calculator');
  await calc.getByLabel('Search radius').fill('1000');
  await page.locator('.destination-results > li').first().waitFor();
  await calc
    .locator('.destination-results > li')
    .first()
    .evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await pause(800);
  await scene('03-compare', async () => {
    await pause(1400);
    await calc
      .locator('.destination-results > li')
      .first()
      .getByText('Why this score?', { exact: true })
      .click();
    await pause(3200);
  });
  await calc.getByText('Scoring rules & preferences', { exact: true }).click();
  await calc
    .getByText('Study interest by feature type', { exact: true })
    .click();
  const interest = calc.getByLabel('Crater, craters study interest (%)', {
    exact: true,
  });
  await scroll(interest);
  await scene('04-interests', async () => {
    await pause(900);
    await interest.fill('80');
    await pause(1800);
  });
  await calc.getByText('Scoring rules & preferences', { exact: true }).click();
  await calc
    .locator('.destination-results > li')
    .first()
    .getByRole('button')
    .click();
  await pause(4500);
  await page.getByRole('link', { name: /Inspect this destination/ }).click();
  await pause(1000);
  await scene('05-evidence', async () => {
    await pause(1800);
    await page.mouse.wheel(0, 300);
    await pause(2800);
  });
  await page
    .getByRole('button', { name: 'Add selected destination to trip' })
    .click();
  const trip = page.getByRole('region', { name: 'Round-trip planner' });
  await scroll(trip.locator('header'));
  await scene('06-trip', async () => {
    await pause(1800);
    await page.mouse.wheel(0, 190);
    await pause(3000);
  });
  await writeFile(
    `${root}/raw/page-text.txt`,
    await page.locator('body').innerText(),
  );
} finally {
  const video = page.video();
  await context.close();
  await video.saveAs(`${root}/raw/browser.webm`);
  await browser.close();
}
