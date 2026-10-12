import { createServer } from './server.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const req = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = req('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '../index.html');

async function testServiceWorkerLiveUpdate() {
  console.log('=== Service Worker Live Update & Cache Proof ===');
  const { server, port } = await createServer(8120);
  const url = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const originalContent = fs.readFileSync(indexPath, 'utf8');

  try {
    // 1. Initial page load with marker A
    const markerA = '<!-- SW_PROOF_MARKER_V3_INITIAL -->';
    const contentWithMarkerA = originalContent.replace('</head>', `  ${markerA}\n</head>`);
    fs.writeFileSync(indexPath, contentWithMarkerA, 'utf8');

    console.log('1. Loading page to install and activate Service Worker...');
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for SW to be activated
    const swActive = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      return !!reg.active;
    });
    console.log(`   Service Worker registered & active: ${swActive}`);

    // Read content received by browser
    const contentBefore = await page.content();
    const hasMarkerABefore = contentBefore.includes('SW_PROOF_MARKER_V3_INITIAL');
    const hasMarkerBBefore = contentBefore.includes('SW_PROOF_MARKER_V3_UPDATED');
    console.log(`   Browser content before update has Marker A: ${hasMarkerABefore}`);
    console.log(`   Browser content before update has Marker B: ${hasMarkerBBefore}`);

    // 2. Now change marker on server to Marker B WHILE Service Worker is running and active
    console.log('\n2. Modifying file on server to Marker B (simulating app code deployment)...');
    const markerB = '<!-- SW_PROOF_MARKER_V3_UPDATED -->';
    const contentWithMarkerB = originalContent.replace('</head>', `  ${markerB}\n</head>`);
    fs.writeFileSync(indexPath, contentWithMarkerB, 'utf8');

    // 3. Reload page in the browser WITHOUT unregistering SW or clearing cache
    console.log('3. Reloading page in browser with active Service Worker (no cache clearing)...');
    await page.reload({ waitUntil: 'networkidle' });

    const contentAfter = await page.content();
    const hasMarkerAAfter = contentAfter.includes('SW_PROOF_MARKER_V3_INITIAL');
    const hasMarkerBAfter = contentAfter.includes('SW_PROOF_MARKER_V3_UPDATED');
    console.log(`   Browser content after reload has Marker A: ${hasMarkerAAfter}`);
    console.log(`   Browser content after reload has Marker B: ${hasMarkerBAfter}`);

    console.log('\n--- Live Update Verification Result ---');
    if (!hasMarkerAAfter && hasMarkerBAfter) {
      console.log('SUCCESS: Browser received updated code immediately through Network-First strategy!');
      console.log('Old cached version was NOT stuck forever.');
    } else {
      console.error('FAILURE: Browser still returned stale cached content!');
      process.exit(1);
    }
  } finally {
    fs.writeFileSync(indexPath, originalContent, 'utf8');
    await browser.close();
    server.close();
  }
}

testServiceWorkerLiveUpdate().catch((err) => {
  console.error('SW Test error:', err);
  process.exit(1);
});
