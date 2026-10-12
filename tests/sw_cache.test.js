import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swPath = path.resolve(__dirname, '../sw.js');

test('Service Worker: CACHE_NAME must be updated beyond v1 and tied to version', () => {
  const content = fs.readFileSync(swPath, 'utf8');
  assert.ok(!content.includes("CACHE_NAME = 'lemmings-web-v1'"), 'Stale CACHE_NAME lemmings-web-v1 must not be used');
  assert.ok(content.includes('SW_VERSION'), 'sw.js must define an explicit SW_VERSION constant');
});

test('Service Worker: Fetch handler must use network-first for HTML, JS and CSS app code', () => {
  const content = fs.readFileSync(swPath, 'utf8');
  assert.ok(content.includes('fetch(event.request)'), 'sw.js must fetch from network');
  // Cache-first was checking caches.match first before fetch for all requests.
  // Network-first must invoke fetch first for app code requests.
  const hasNetworkFirst = content.includes('network-first') || content.includes('isAppCode') || content.includes('navigate');
  assert.ok(hasNetworkFirst, 'sw.js must implement network-first strategy for app code');
});
