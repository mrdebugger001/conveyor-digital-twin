import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire('D:/sih 2026/conveyor-digital-twin/frontend/package.json');
const { chromium } = require('playwright-core');
const out = 'D:/sih 2026/conveyor-digital-twin/video-production/screenshots';
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', msg => { if (msg.type() === 'error') console.error(`BROWSER: ${msg.text()}`); });
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

async function shot(name) {
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`captured ${name}`);
}

await shot('01-live-twin');
await page.getByRole('button', { name: 'Start', exact: true }).click();
await page.waitForTimeout(1500);
await shot('02-running-twin');
await page.getByRole('button', { name: 'Simulator', exact: true }).click();
await page.waitForTimeout(600);
await shot('03-simulator');
await page.getByLabel('Joint damage').check();
await page.waitForTimeout(4500);
await shot('04-joint-damage');
await page.getByRole('button', { name: 'Cancel', exact: true }).click();
await page.getByRole('button', { name: 'Splice J023', exact: true }).first().click();
await page.waitForTimeout(1200);
await shot('05-asset-inspector');
await page.goto('http://127.0.0.1:3000/analytics', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await shot('06-analytics');
await page.goto('http://127.0.0.1:3000/alarms', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('07-alarms');
await page.goto('http://127.0.0.1:3000/maintenance', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('08-maintenance');
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await shot('09-closing-twin');
await browser.close();
