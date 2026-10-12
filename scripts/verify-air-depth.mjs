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

export async function measureAirSpaceDepth(options = {}) {
  const { server, port } = await createServer(8133);
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  });

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // Measure air space stats across all 6 levels
  const levelMetrics = await page.evaluate(() => {
    const game = window.__lemmingsGame;
    const r = game.renderer;
    const results = [];

    for (let lvl = 0; lvl < 6; lvl++) {
      game.loadLevel(lvl);
      // Wait a tick and render
      r.render(game.level);

      const w = r.canvas.width;
      const h = r.canvas.height;
      const img = r.ctx.getImageData(0, 0, w, h).data;
      const t = game.level.terrain;

      let airCount = 0;
      let sumL = 0;
      let sumL2 = 0;
      const colorBins = new Set();

      for (let sy = 0; sy < h; sy += 2) {
        for (let sx = 0; sx < w; sx += 2) {
          const world = r.screenToWorld(sx, sy);
          const wx = Math.floor(world.x);
          const wy = Math.floor(world.y);

          // Must be inside level bounds and pure AIR in terrain mask
          if (wx >= 0 && wx < t.width && wy >= 0 && wy < t.height) {
            if (t.getMaterial(wx, wy) === 0) { // MATERIAL.AIR
              const idx = (sy * w + sx) * 4;
              const red = img[idx];
              const grn = img[idx + 1];
              const blu = img[idx + 2];

              // ITU-R BT.601 luminance
              const lum = 0.299 * red + 0.587 * grn + 0.114 * blu;
              sumL += lum;
              sumL2 += lum * lum;
              airCount++;

              // Distinct color tone quantized in 16-level RGB bins
              const rBin = Math.floor(red / 16);
              const gBin = Math.floor(grn / 16);
              const bBin = Math.floor(blu / 16);
              colorBins.add(`${rBin},${gBin},${bBin}`);
            }
          }
        }
      }

      const mean = sumL / (airCount || 1);
      const variance = (sumL2 / (airCount || 1)) - (mean * mean);
      const stdDev = Math.sqrt(Math.max(0, variance));

      results.push({
        level: lvl + 1,
        name: game.level.name,
        airPixels: airCount,
        stdDev: parseFloat(stdDev.toFixed(2)),
        colorTones: colorBins.size,
      });
    }

    return results;
  });

  // Now measure parallax shift at camX = 0 vs camX = 150
  await page.evaluate(() => {
    const game = window.__lemmingsGame;
    game.loadLevel(0);
    game.renderer.camera.x = 0;
    game.renderer.camera.y = 0;
    game.renderer.render(game.level);
  });
  const shotCam0 = path.join(SHOTS_DIR, 'parallax_cam0.png');
  await page.screenshot({ path: shotCam0 });

  await page.evaluate(() => {
    const game = window.__lemmingsGame;
    game.renderer.camera.x = 150;
    game.renderer.camera.y = 0;
    game.renderer.render(game.level);
  });
  const shotCam150 = path.join(SHOTS_DIR, 'parallax_cam150.png');
  await page.screenshot({ path: shotCam150 });

  await browser.close();
  server.close();

  return {
    levelMetrics,
    shotCam0,
    shotCam150,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('=== Messung Luftraum-Tiefe (Helligkeits-Streuung & Farbtöne) ===');
  const res = await measureAirSpaceDepth();
  console.table(res.levelMetrics);
  console.log(`Parallax-Screenshots gespeichert:`);
  console.log(`  CamX = 0:   ${res.shotCam0}`);
  console.log(`  CamX = 150: ${res.shotCam150}`);

  const allPass = res.levelMetrics.every((m) => m.stdDev >= 6.0 && m.colorTones >= 8);
  console.log(`\nZielwerte: Helligkeits-StdDev >= 6.0, Farbtoene >= 8: ${allPass ? 'BESTANDEN (PASS)' : 'NICHT BESTANDEN (FAIL)'}`);
  if (!allPass) {
    process.exit(1);
  }
}
