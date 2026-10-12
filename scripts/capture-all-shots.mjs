import { createServer } from './server.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const req = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = req('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function captureRound(roundName) {
  const outDir = path.resolve(__dirname, `../docs/shots/${roundName}`);
  fs.mkdirSync(outDir, { recursive: true });

  const { server, port } = await createServer(8100 + (roundName === 'round1' ? 1 : 2));
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'portrait', width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: 'landscape', width: 844, height: 390, isMobile: true, hasTouch: true },
    { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  ];

  console.log(`=== Capturing screenshots for ${roundName} ===`);

  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });
    const page = await ctx.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    for (let lvl = 0; lvl < 6; lvl++) {
      const lvlId = lvl + 1;
      await page.evaluate((lIndex) => {
        window.__lemmingsGame.loadLevel(lIndex);
      }, lvl);

      // Advance 80 ticks to have terrain, lemmings falling/walking, trapdoor active
      await page.evaluate(() => {
        const g = window.__lemmingsGame;
        for (let i = 0; i < 80; i++) {
          g.level.update();
        }
        g.renderer.render(g.level);
        g.hud.update(g.level);
      });

      await page.waitForTimeout(200);

      const filePath = path.join(outDir, `lvl${lvlId}_${vp.name}.png`);
      await page.screenshot({ path: filePath });
      console.log(`Saved: ${filePath}`);
    }

    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(`=== Done capturing ${roundName} ===`);
}

const targetRound = process.argv[2] || 'round1';
captureRound(targetRound).catch((err) => {
  console.error(err);
  process.exit(1);
});
