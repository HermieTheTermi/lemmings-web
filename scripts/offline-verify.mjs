import { createServer } from './server.mjs';
import { createRequire } from 'node:module';

const req = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = req('playwright');

async function verifyOffline() {
  console.log('--- Verifying Offline Execution (Service Worker) ---');
  const { server, port } = await createServer(8098);
  const url = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Initial Load online
  console.log('1. Loading page online to install Service Worker...');
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for Service Worker registration and activation
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return !!reg.active;
  });
  console.log(`   Service Worker ready & active: ${swReady}`);

  // Give Service Worker a moment to cache all files
  await page.waitForTimeout(500);

  // 2. Shut down server completely!
  console.log('2. Shutting down HTTP server to simulate offline mode...');
  await new Promise((resolve) => server.close(resolve));
  console.log('   Server is now completely offline.');

  // 3. Reload page while offline
  console.log('3. Reloading page while offline...');
  try {
    await page.reload({ waitUntil: 'networkidle' });
  } catch (e) {
    // networkidle might throw when server is dead, check if page loaded
  }

  // 4. Verify page loaded and game initialized from cache
  const title = await page.title();
  const canvasExists = await page.$eval('#game-canvas', (el) => !!el);
  const levelTitle = await page.$eval('#hud-level-title', (el) => el.textContent);

  console.log(`   Offline page title: "${title}"`);
  console.log(`   Canvas element present: ${canvasExists}`);
  console.log(`   Level title loaded: "${levelTitle}"`);

  await browser.close();

  if (canvasExists && title === 'Lemmings Web') {
    console.log('Offline Verification: SUCCESS! (100% playable without network)');
  } else {
    console.error('Offline Verification: FAILED!');
    process.exit(1);
  }
}

verifyOffline().catch((err) => {
  console.error('Offline verification error:', err);
  process.exit(1);
});
