import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire('D:/sih 2026/conveyor-digital-twin/frontend/package.json');
const { chromium } = require('playwright-core');
const recordings = 'D:/sih 2026/conveyor-digital-twin/video-production/recordings';
await mkdir(recordings, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: recordings, size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// Establish the baseline through the actual UI, then capture a single uninterrupted
// run: motion and changing KPIs -> an injected J023 fault -> a live alarm state.
await page.getByRole('button', { name: 'Simulator', exact: true }).click();
await page.waitForTimeout(250);
await page.getByRole('button', { name: 'Reset simulation', exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Cancel', exact: true }).click();
const start = page.getByRole('button', { name: 'Start', exact: true });
if (await start.isEnabled()) await start.click();
await page.waitForTimeout(5500);

await page.getByRole('button', { name: 'Simulator', exact: true }).click();
await page.waitForTimeout(300);
await page.getByLabel('Joint damage').check();
await page.waitForTimeout(4500);
await page.getByRole('button', { name: 'Cancel', exact: true }).click();
await page.waitForTimeout(2000);
await page.getByRole('button', { name: 'Splice J023', exact: true }).first().click();
await page.waitForTimeout(3000);

const video = page.video();
await page.close();
await context.close();
await browser.close();
console.log(await video.path());
