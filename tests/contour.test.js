import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../js/engine/levels-data.js';
import { Terrain } from '../js/engine/terrain.js';

/**
 * Analyzes the surface contours of a level.
 * Extracts continuous walkable/top surfaces where terrain transitions from air to solid.
 * Evaluates:
 * 1. Max consecutive flat stretch (identical y-values in a row). Requirement: <= 40 world pixels.
 * 2. Max window with exact same height. Requirement: <= 60 world pixels.
 */
export function analyzeLevelContours(level) {
  const terrain = new Terrain(level.width, level.height);
  level.setupTerrain(terrain);

  // Group top-surface points by x: where terrain is solid and pixel above is air
  const surfacePointsByX = [];
  for (let x = 0; x < terrain.width; x++) {
    const ys = [];
    for (let y = 1; y < terrain.height; y++) {
      if (terrain.isSolid(x, y) && !terrain.isSolid(x, y - 1)) {
        ys.push(y);
      }
    }
    surfacePointsByX[x] = ys;
  }

  // Trace continuous surface segments across x
  // Two adjacent points (x, y) and (x+1, y') connect if |y' - y| <= 3 (walkable step limit)
  let maxFlatRun = 0;
  let maxIdenticalInWindow = 0;
  const flatViolations = [];
  const windowViolations = [];

  let activeSegments = [];

  for (let x = 0; x < terrain.width; x++) {
    const ys = surfacePointsByX[x];
    const newSegments = [];
    const usedYs = new Set();

    for (const seg of activeSegments) {
      // Find matching y in current x
      let matchedY = null;
      let minDy = 999;
      for (const y of ys) {
        if (!usedYs.has(y) && Math.abs(y - seg.lastY) <= 3) {
          if (Math.abs(y - seg.lastY) < minDy) {
            minDy = Math.abs(y - seg.lastY);
            matchedY = y;
          }
        }
      }

      if (matchedY !== null) {
        usedYs.add(matchedY);
        const isFlat = (matchedY === seg.lastY);
        const flatRun = isFlat ? seg.flatRun + 1 : 1;
        const pts = [...seg.pts, { x, y: matchedY }];

        if (flatRun > maxFlatRun) maxFlatRun = flatRun;
        if (flatRun > 40) {
          flatViolations.push({
            x0: x - flatRun,
            x1: x,
            y: matchedY,
            len: flatRun,
          });
        }

        // Check 60px window rule: within any 61-point window along this contour,
        // it cannot be completely identical
        if (pts.length >= 61) {
          const win = pts.slice(-61);
          const allSame = win.every((p) => p.y === win[0].y);
          if (allSame) {
            windowViolations.push({
              x0: win[0].x,
              x1: win[60].x,
              y: win[0].y,
            });
          }
        }

        newSegments.push({ lastY: matchedY, flatRun, pts });
      }
    }

    // Unmatched ys start new segments
    for (const y of ys) {
      if (!usedYs.has(y)) {
        newSegments.push({ lastY: y, flatRun: 1, pts: [{ x, y }] });
      }
    }
    activeSegments = newSegments;
  }

  return {
    maxFlatRun,
    flatViolations,
    windowViolations,
  };
}

for (const level of LEVELS) {
  test(`Contour - Level ${level.id} (${level.name}): keine flache Kante > 40px und keine identische Hoehe ueber 60px`, () => {
    const result = analyzeLevelContours(level);

    assert.ok(
      result.maxFlatRun <= 40,
      `Level ${level.id} enthaelt flache Kanten mit Laenge ${result.maxFlatRun}px (> 40px Grenzwert). ` +
      `Gefundene Verstoesse: ${result.flatViolations.length}`
    );

    assert.equal(
      result.windowViolations.length,
      0,
      `Level ${level.id} hat ${result.windowViolations.length} Bereiche mit exakt demselben Hoehenwert ueber mehr als 60 Welt-Pixel.`
    );
  });
}
