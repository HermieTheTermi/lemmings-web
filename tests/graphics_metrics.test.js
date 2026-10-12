import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../scripts/server.mjs';
import { createRequire } from 'node:module';

const req = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = req('playwright');

test('Graphics Modernization: Section 2 measurable metrics (Saturation, Hue buckets, Bright lights, Aerial perspective)', async () => {
  const { server, port } = await createServer(8144);
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const metrics = await page.evaluate(() => {
      const g = window.__lemmingsGame;
      const r = g.renderer;
      g.loadLevel(0); // Level 1
      // Advance a few ticks and render
      for (let i = 0; i < 40; i++) {
        g.level.update();
      }
      r.render(g.level);

      const w = r.canvas.width;
      const h = r.canvas.height;
      const img = r.ctx.getImageData(0, 0, w, h).data;
      const totalPixels = w * h;

      let sumSat = 0;
      const hueBuckets = new Set();
      let brightLightPixels = 0;

      for (let i = 0; i < img.length; i += 4) {
        const red = img[i];
        const grn = img[i + 1];
        const blu = img[i + 2];

        const rNorm = red / 255;
        const gNorm = grn / 255;
        const bNorm = blu / 255;

        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        const delta = max - min;

        // Saturation (HSV)
        const sat = max === 0 ? 0 : delta / max;
        sumSat += sat;

        // Hue calculation (15° buckets)
        if (delta > 0.05 && sat > 0.12 && max > 0.12) {
          let hue = 0;
          if (max === rNorm) {
            hue = ((gNorm - bNorm) / delta) % 6;
          } else if (max === gNorm) {
            hue = (bNorm - rNorm) / delta + 2;
          } else {
            hue = (rNorm - gNorm) / delta + 4;
          }
          hue = Math.round(hue * 60);
          if (hue < 0) hue += 360;
          const bucket = Math.floor(hue / 15);
          hueBuckets.add(bucket);
        }

        // Luminance (ITU-R BT.601)
        const lum = 0.299 * red + 0.587 * grn + 0.114 * blu;
        if (lum > 220) {
          brightLightPixels++;
        }
      }

      const meanSat = sumSat / totalPixels;
      const brightPercent = (brightLightPixels / totalPixels) * 100;

      return {
        meanSat,
        hueBucketCount: hueBuckets.size,
        brightPercent,
        brightPixels: brightLightPixels,
        totalPixels,
      };
    });

    console.log('[Test Metrics Level 1]', {
      meanSat: metrics.meanSat.toFixed(3),
      hueBucketCount: metrics.hueBucketCount,
      brightPercent: metrics.brightPercent.toFixed(3) + '%',
      brightPixels: metrics.brightPixels,
    });

    // 1. Mean Saturation >= 0.30
    assert.ok(
      metrics.meanSat >= 0.30,
      `Mean saturation must be >= 0.30, got ${metrics.meanSat.toFixed(3)}`
    );

    // 2. Distinct Hue Buckets (15°) >= 12
    assert.ok(
      metrics.hueBucketCount >= 12,
      `Distinct hue buckets (15 deg) must be >= 12, got ${metrics.hueBucketCount}`
    );

    // 3. Bright Light Pixels (Luminance > 220) >= 0.10%
    assert.ok(
      metrics.brightPercent >= 0.10,
      `Bright light pixels (luminance > 220) must be >= 0.10%, got ${metrics.brightPercent.toFixed(3)}% (${metrics.brightPixels} px)`
    );

    // 4. Aerial Perspective: measure background luminance of farthest plane vs nearest plane
    const aerialMetrics = await page.evaluate(() => {
      const g = window.__lemmingsGame;
      const r = g.renderer;
      // In renderer, query the colors used for Ebene 1 (far) and Ebene 3 (near)
      // or sample canvas at sky/vault area (y = 20) vs near silhouette area
      const farColor = r.getFarPlaneColor ? r.getFarPlaneColor() : null;
      const nearColor = r.getNearPlaneColor ? r.getNearPlaneColor() : null;
      return { farColor, nearColor };
    });

    assert.ok(
      aerialMetrics.farColor && aerialMetrics.nearColor,
      'Renderer must expose aerial perspective plane colors for validation'
    );
    const lumFar = 0.299 * aerialMetrics.farColor.r + 0.587 * aerialMetrics.farColor.g + 0.114 * aerialMetrics.farColor.b;
    const lumNear = 0.299 * aerialMetrics.nearColor.r + 0.587 * aerialMetrics.nearColor.g + 0.114 * aerialMetrics.nearColor.b;
    const lumDiff = lumFar - lumNear;

    console.log('[Aerial Perspective]', { lumFar: lumFar.toFixed(1), lumNear: lumNear.toFixed(1), lumDiff: lumDiff.toFixed(1) });
    assert.ok(
      lumDiff >= 20,
      `Aerial perspective luminance difference (far - near) must be >= 20 levels, got ${lumDiff.toFixed(1)}`
    );

  } finally {
    await browser.close();
    server.close();
  }
});
