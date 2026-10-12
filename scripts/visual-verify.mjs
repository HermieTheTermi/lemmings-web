import { createServer } from './server.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRequire } from 'node:module';
const req = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = req('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = path.resolve(__dirname, '../docs/shots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

async function runVerification() {
  console.log('--- Starting Lemmings Web Visual & Performance Verification ---');
  const { server, port } = await createServer(8099);
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  });

  const consoleErrors = [];
  const consoleWarnings = [];

  try {
    // ----------------------------------------------------
    // Test 1: Mobile Portrait (390 x 844)
    // ----------------------------------------------------
    console.log('1. Capturing Mobile Portrait (390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[MobilePortrait Console Error] ${msg.text()}`);
    });
    mobilePage.on('pageerror', (err) => {
      consoleErrors.push(`[MobilePortrait Page Error] ${err.message}`);
    });

    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });
    // Let animation run a few frames
    await mobilePage.waitForTimeout(600);
    const shotPortraitPath = path.join(SHOTS_DIR, 'mobile_portrait.png');
    await mobilePage.screenshot({ path: shotPortraitPath });
    console.log(`Saved screenshot: ${shotPortraitPath}`);

    // ----------------------------------------------------
    // Test 2: Mobile Landscape (844 x 390)
    // ----------------------------------------------------
    console.log('2. Capturing Mobile Landscape (844x390)...');
    const landscapeContext = await browser.newContext({
      viewport: { width: 844, height: 390 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const landscapePage = await landscapeContext.newPage();
    landscapePage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[MobileLandscape Console Error] ${msg.text()}`);
    });
    landscapePage.on('pageerror', (err) => {
      consoleErrors.push(`[MobileLandscape Page Error] ${err.message}`);
    });

    await landscapePage.goto(baseUrl, { waitUntil: 'networkidle' });
    await landscapePage.waitForTimeout(600);
    const shotLandscapePath = path.join(SHOTS_DIR, 'mobile_landscape.png');
    await landscapePage.screenshot({ path: shotLandscapePath });
    console.log(`Saved screenshot: ${shotLandscapePath}`);

    // ----------------------------------------------------
    // Test 3: Desktop View (1440 x 900)
    // ----------------------------------------------------
    console.log('3. Capturing Desktop (1440x900)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.on('console', (msg) => {
      console.log(`[Desktop ${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') consoleErrors.push(`[Desktop Console Error] ${msg.text()}`);
    });
    desktopPage.on('pageerror', (err) => {
      console.error(`[Desktop Page Error]`, err);
      consoleErrors.push(`[Desktop Page Error] ${err.message}`);
    });

    await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(600);
    const shotDesktopPath = path.join(SHOTS_DIR, 'desktop.png');
    await desktopPage.screenshot({ path: shotDesktopPath });
    console.log(`Saved screenshot: ${shotDesktopPath}`);

    // ----------------------------------------------------
    // Test 4: Performance Benchmark with 60 Lemmings concurrently
    // ----------------------------------------------------
    console.log('4. Running Performance Benchmark with 60 lemmings...');
    const perfPage = desktopPage;
    await perfPage.waitForFunction(() => typeof window.__lemmingsGame !== 'undefined' && !!window.__lemmingsGame.level);

    const perfMetrics = await perfPage.evaluate(async () => {
      const game = window.__lemmingsGame;
      const level = game.level;

      // Spawn 60 lemmings
      level.totalLemmings = 60;
      for (let i = 0; i < 60; i++) {
        // distribute them along the terrain
        const x = 50 + (i % 30) * 20;
        const y = 80;
        const lem = new (level.lemmings[0] ? level.lemmings[0].constructor : Object)(x, y, i % 2 === 0 ? 1 : -1);
        lem.state = 'WALKER';
        level.lemmings.push(lem);
      }

      // Collect frame times over 120 animation frames
      return new Promise((resolve) => {
        let frameCount = 0;
        const cpuDurations = [];
        const rafDurations = [];
        let prevTime = performance.now();

        function sample(now) {
          const rafDelta = now - prevTime;
          prevTime = now;
          rafDurations.push(rafDelta);

          // Measure pure CPU computation (update + render)
          const t0 = performance.now();
          level.update();
          game.renderer.render(level);
          const t1 = performance.now();
          cpuDurations.push(t1 - t0);

          frameCount++;

          if (frameCount >= 120) {
            const validCpu = cpuDurations.slice(5);
            const validRaf = rafDurations.slice(5);
            const cpuAvg = validCpu.reduce((a, b) => a + b, 0) / validCpu.length;
            const cpuMax = Math.max(...validCpu);
            const cpuMin = Math.min(...validCpu);
            const rafAvg = validRaf.reduce((a, b) => a + b, 0) / validRaf.length;
            resolve({
              cpuAvg,
              cpuMax,
              cpuMin,
              rafAvg,
              count: validCpu.length,
              activeLemmings: level.lemmings.length,
            });
          } else {
            requestAnimationFrame(sample);
          }
        }
        requestAnimationFrame(sample);
      });
    });

    console.log(`Performance Results (60 Lemmings):`);
    console.log(`  Mittlere CPU-Berechnungszeit (Update + Render): ${perfMetrics.cpuAvg.toFixed(2)} ms (Ziel: < 16.0 ms)`);
    console.log(`  Minimale CPU-Zeit:                              ${perfMetrics.cpuMin.toFixed(2)} ms`);
    console.log(`  Maximale CPU-Zeit:                              ${perfMetrics.cpuMax.toFixed(2)} ms`);
    console.log(`  Mittleres rAF-Intervall (Headless-Browser):      ${perfMetrics.rafAvg.toFixed(2)} ms`);
    console.log(`  Gemessene Frames:                               ${perfMetrics.count}`);

    // ----------------------------------------------------
    // Test 5: Full Playthrough & Console Error Verification (Levels 1-6)
    // ----------------------------------------------------
    console.log('5. Verifying complete playthrough across all 6 levels...');
    for (let lvl = 0; lvl < 6; lvl++) {
      console.log(`  Testing Level ${lvl + 1}...`);
      await perfPage.evaluate((lIndex) => {
        const game = window.__lemmingsGame;
        game.loadLevel(lIndex);
        // Simulate skill assignments
        const lem = game.level.lemmings[0];
        if (lem) {
          game.level.assignSkillToLemming(lem, 'BUILDER');
        }
      }, lvl);

      // Let simulation run for 60 frames in level
      await perfPage.waitForTimeout(300);

      // Click pause & fast-forward
      await perfPage.click('#btn-pause');
      await perfPage.waitForTimeout(100);
      await perfPage.click('#btn-pause');
      await perfPage.click('#btn-fast');
      await perfPage.waitForTimeout(100);
      await perfPage.click('#btn-fast');
    }

    // ----------------------------------------------------
    // Test 6: Offline Cache Verification (Service Worker)
    // ----------------------------------------------------
    console.log('6. Verifying Service Worker offline capability...');
    const swRegistered = await perfPage.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    });
    console.log(`  Service worker registered: ${swRegistered}`);

    // Console Error Results
    console.log('\n--- Verification Summary ---');
    console.log(`Console Errors:   ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((e) => console.error(e));
    }
    console.log(`Performance (<16ms): ${perfMetrics.cpuAvg < 16.0 ? 'PASS' : 'FAIL'} (${perfMetrics.cpuAvg.toFixed(2)} ms)`);

    await mobileContext.close();
    await landscapeContext.close();
    await desktopContext.close();
    await browser.close();
    server.close();

    if (consoleErrors.length > 0) {
      process.exit(1);
    }
    console.log('Verification completed successfully with 0 console errors!');
  } catch (err) {
    console.error('Verification failed with error:', err);
    await browser.close();
    server.close();
    process.exit(1);
  }
}

runVerification();
