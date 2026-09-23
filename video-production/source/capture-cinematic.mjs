import { createRequire } from 'node:module';
const require = createRequire('D:/sih 2026/conveyor-digital-twin/frontend/package.json');
const { chromium } = require('playwright');
import fs from 'node:fs';
import path from 'node:path';

const RAW_DIR = path.resolve('D:/sih 2026/conveyor-digital-twin/video-production/raw');
if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

async function recordTake(name, durationMs, actionFn) {
  console.log(`\n========================================`);
  console.log(`[RECORDING TAKE] ${name} (Target: ${durationMs / 1000}s)`);
  console.log(`========================================`);

  const takeDir = path.join(RAW_DIR, name);
  if (!fs.existsSync(takeDir)) {
    fs.mkdirSync(takeDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--enable-accelerated-2d-canvas',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      '--hide-scrollbars',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: takeDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // Allow WebSocket connection and 3D canvas mount

  // Ensure normal initial state
  await page.evaluate(async () => {
    if (window.__APP_CONTROL__) {
      window.__APP_CONTROL__.setTheme('dark');
      await window.__APP_CONTROL__.resetFaults();
      await window.__APP_CONTROL__.startConveyor();
    }
  });
  await page.waitForTimeout(800);

  // Execute scenario specific actions
  await actionFn(page);

  // Keep recording for the remainder of duration
  await page.waitForTimeout(durationMs);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const originalVideoPath = await video.path();
  const targetVideoPath = path.join(RAW_DIR, `${name}.webm`);
  fs.copyFileSync(originalVideoPath, targetVideoPath);
  console.log(`[SAVED] ${targetVideoPath} (${fs.statSync(targetVideoPath).size} bytes)`);
  return targetVideoPath;
}

async function runAllTakes() {
  console.log('Starting Autonomous Playwright Cinematic Capture Suite...');

  // Take 1: Nominal Running & Isometric Hero Orbit (5.5s)
  await recordTake('take1_hero_orbit', 5500, async (page) => {
    await page.evaluate(() => {
      window.__CAMERA_RIG__.setMode('orbit');
      window.__APP_CONTROL__.setViewMode('realistic');
    });
  });

  // Take 2: Low-Angle Dynamic Belt Tracking (6.5s)
  await recordTake('take2_low_tracking', 6500, async (page) => {
    await page.evaluate(() => {
      window.__CAMERA_RIG__.setMode('low-angle');
      setTimeout(() => {
        if (window.__CAMERA_RIG__) window.__CAMERA_RIG__.setMode('tracking');
      }, 2500);
    });
  });

  // Take 3: Joint J023 Splice Defect & Stress Heatmap (6.5s)
  await recordTake('take3_joint_j023', 6500, async (page) => {
    await page.evaluate(async () => {
      window.__CAMERA_RIG__.setMode('macro-j023');
      await window.__APP_CONTROL__.setFault('joint_damage_enabled', true, { joint_damage_id: 'joint-J023' });
      setTimeout(() => {
        if (window.__APP_CONTROL__) window.__APP_CONTROL__.setViewMode('heatmap');
      }, 2800);
    });
  });

  // Take 4: Drive Train Motor Overheat & Thermal Surge (6.5s)
  await recordTake('take4_motor_thermal', 6500, async (page) => {
    await page.evaluate(async () => {
      window.__CAMERA_RIG__.setMode('macro-motor');
      window.__APP_CONTROL__.setViewMode('realistic');
      await window.__APP_CONTROL__.setFault('motor_overheat', true);
    });
  });

  // Take 5: Belt Misalignment & Alarm Cascade (6.5s)
  await recordTake('take5_misalignment', 6500, async (page) => {
    await page.evaluate(async () => {
      window.__CAMERA_RIG__.setPreset('side');
      window.__APP_CONTROL__.setViewMode('realistic');
      await window.__APP_CONTROL__.setFault('misalignment', true);
    });
  });

  // Take 6: Operator Stop & Alarm Acknowledgment (5.5s)
  await recordTake('take6_operator_stop', 5500, async (page) => {
    await page.evaluate(async () => {
      window.__CAMERA_RIG__.setPreset('iso');
      // After 1.2s trigger stop
      setTimeout(async () => {
        if (window.__APP_CONTROL__) {
          await window.__APP_CONTROL__.stopConveyor();
          await window.__APP_CONTROL__.acknowledgeAlarm('alm-1', 'Operator Control');
        }
      }, 1200);
    });
  });

  // Take 7: Predictive Analytics & 24-Joint Matrix (5.0s)
  await recordTake('take7_analytics', 5000, async (page) => {
    await page.goto('http://localhost:3000/analytics', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  console.log('\n[SUCCESS] All 7 live takes recorded with WebGL/DOM fidelity!');
}

runAllTakes().catch((err) => {
  console.error('Recording failed:', err);
  process.exit(1);
});
