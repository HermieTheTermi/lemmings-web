import { createServer } from './server.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LEVEL_SOLUTIONS } from '../js/engine/solutions-data.js';

const req = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = req('playwright');

async function runSolveRunner() {
  console.log('=== Lemmings Web: Browser Touch Solution Runner ===');
  console.log('Emulating Mobile Portrait: 390x844 with real Touch Events');

  // Mit SOLVE_BASE_URL=https://... gegen eine bereits veroeffentlichte Instanz laufen
  const externalUrl = process.env.SOLVE_BASE_URL;
  const { server, port } = externalUrl ? { server: null, port: null } : await createServer(8091);
  const baseUrl = externalUrl
    ? new URL('index.html', externalUrl.endsWith('/') ? externalUrl : `${externalUrl}/`).href
    : `http://127.0.0.1:${port}/index.html`;
  if (externalUrl) console.log(`Ziel: ${baseUrl} (kein lokaler Server)`);


  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[Console Error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`[Page Error] ${err.message}`);
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const results = [];

  for (let lvlIdx = 0; lvlIdx < 6; lvlIdx++) {
    const lvlId = lvlIdx + 1;
    const actions = LEVEL_SOLUTIONS[lvlId] || [];

    console.log(`\n--- Playing Level ${lvlId} (${actions.length} touch actions scheduled) ---`);

    // Load level in game and pause rAF tick loop for deterministic touch evaluation
    await page.evaluate((idx) => {
      window.__lemmingsGame.loadLevel(idx);
      window.__lemmingsGame.level.paused = true;
    }, lvlIdx);

    await page.waitForTimeout(100);

    let currentTick = 0;
    let nextActIdx = 0;
    const maxTicks = 4500;

    while (currentTick < maxTicks) {
      // Check status
      const state = await page.evaluate(() => {
        const g = window.__lemmingsGame;
        const l = g.level;
        return {
          tick: l.tickCount,
          status: l.status,
          rescued: l.rescuedCount,
          needed: l.neededToRescue,
          total: l.totalLemmings,
        };
      });

      if (state.status !== 'PLAYING') {
        const pass = state.status === 'VICTORY' && state.rescued >= state.needed;
        console.log(`  Result Level ${lvlId}: ${state.status} | Rescued: ${state.rescued}/${state.total} (Needed: ${state.needed}) | ${pass ? 'PASS' : 'FAIL'}`);
        results.push({
          level: lvlId,
          status: state.status,
          rescued: state.rescued,
          needed: state.needed,
          total: state.total,
          percent: Math.round((state.rescued / state.total) * 100),
          pass,
        });
        break;
      }

      // Determine how many ticks to advance
      let targetTick = currentTick + 25;
      if (nextActIdx < actions.length && actions[nextActIdx].tick > currentTick) {
        targetTick = Math.min(targetTick, actions[nextActIdx].tick);
      }

      const ticksToAdvance = targetTick - currentTick;
      if (ticksToAdvance > 0) {
        await page.evaluate((count) => {
          const g = window.__lemmingsGame;
          g.level.paused = false;
          for (let i = 0; i < count; i++) {
            if (g.level.status === 'PLAYING') {
              g.level.update();
            }
          }
          g.level.paused = true;
          g.renderer.render(g.level);
          g.hud.update(g.level);
        }, ticksToAdvance);
        currentTick = targetTick;
      }

      // Check if next action is due at currentTick
      while (nextActIdx < actions.length && currentTick >= actions[nextActIdx].tick) {
        const act = actions[nextActIdx];

        // 1. Select skill in HUD via real button click (only if not already selected)
        const isAlreadySelected = await page.evaluate((s) => {
          return window.__lemmingsGame.hud.selectedSkill === s;
        }, act.skill);
        if (!isAlreadySelected) {
          const btnSelector = `#btn-${act.skill.toLowerCase()}`;
          await page.click(btnSelector);
        }

        // 2. Query target lemming screen position and focus camera
        const targetPos = await page.evaluate(({ lemmingIndex, zielX }) => {
          const g = window.__lemmingsGame;
          const l = g.level;
          let lem = null;
          if (lemmingIndex !== undefined) {
            lem = l.lemmings[lemmingIndex];
          } else if (zielX !== undefined) {
            lem = l.lemmings.find((item) => !item.isRemoved && Math.abs(item.x - zielX) < 25);
          }
          if (!lem) return null;
          g.renderer.focusWorldPos(lem.x, lem.y, l);
          g.renderer.render(l);
          const rect = g.canvas.getBoundingClientRect();
          const cam = g.renderer.camera;
          return {
            x: rect.left + (lem.x - cam.x) * cam.zoom,
            y: rect.top + (lem.y - 5 - cam.y) * cam.zoom,
            lemX: lem.x,
            lemY: lem.y,
            lemState: lem.state,
          };
        }, { lemmingIndex: act.lemmingIndex, zielX: act.zielX });

        if (targetPos) {
          // Perform real touchscreen tap on target coordinates
          await page.touchscreen.tap(targetPos.x, targetPos.y);
          // Re-render and update HUD after tap
          const postState = await page.evaluate(({ act }) => {
            const g = window.__lemmingsGame;
            const l = g.level;
            g.renderer.render(l);
            g.hud.update(l);
            const lem = l.lemmings[act.lemmingIndex];
            return {
              lemState: lem ? lem.state : 'none',
              budget: l.skillsBudget[act.skill],
            };
          }, { act });
          console.log(`    [Tick ${currentTick}] Tap ${act.skill} -> Lemming state: ${postState.lemState}, remaining budget: ${postState.budget}`);
        } else {
          console.warn(`    [Tick ${currentTick}] Target lemming not found for ${act.skill}`);
        }
        nextActIdx++;
      }
    }

    // If loop reached maxTicks without finishing
    if (results.length < lvlId) {
      const finalState = await page.evaluate(() => ({
        status: window.__lemmingsGame.level.status,
        rescued: window.__lemmingsGame.level.rescuedCount,
        needed: window.__lemmingsGame.level.neededToRescue,
        total: window.__lemmingsGame.level.totalLemmings,
      }));
      const pass = finalState.status === 'VICTORY' && finalState.rescued >= finalState.needed;
      console.log(`  Result Level ${lvlId} (Timeout): ${finalState.status} | Rescued: ${finalState.rescued}/${finalState.total} | ${pass ? 'PASS' : 'FAIL'}`);
      results.push({
        level: lvlId,
        status: finalState.status,
        rescued: finalState.rescued,
        needed: finalState.needed,
        total: finalState.total,
        percent: Math.round((finalState.rescued / finalState.total) * 100),
        pass,
      });
    }
  }

  await browser.close();
  if (server) server.close();

  console.log('\n================ BROWSER TOUCH RUNNER SUMMARY ================');
  console.log('Level | Status  | Gerettet | Quote | Ergebnis');
  console.log('------+---------+----------+-------+---------');
  let allPassed = true;
  for (const r of results) {
    const pad = (s, n) => s.toString().padEnd(n);
    console.log(`  ${pad(r.level, 3)} | ${pad(r.status, 7)} | ${pad(r.rescued + '/' + r.total, 8)} | ${pad(r.percent + '%', 5)} | ${r.pass ? 'PASS' : 'FAIL'}`);
    if (!r.pass) allPassed = false;
  }
  console.log('--------------------------------------------------------------');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error(consoleErrors);
  }

  if (!allPassed || consoleErrors.length > 0) {
    process.exit(1);
  } else {
    console.log('All 6 levels successfully proven solvable in browser touch runner!\n');
    process.exit(0);
  }
}

runSolveRunner().catch((err) => {
  console.error('Runner failed:', err);
  process.exit(1);
});
