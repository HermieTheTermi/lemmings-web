import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../js/engine/levels-data.js';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';

function getCameraForViewport(level, canvasW, canvasH) {
  const isPortrait = canvasH > canvasW;
  let zoom;
  if (isPortrait) {
    const targetPx = Math.max(26, canvasH * 0.033);
    zoom = Math.max(2.4, targetPx / 11);
  } else {
    const fitW = canvasW / level.width;
    if (canvasW <= 900) {
      zoom = Math.max(1.15, Math.min(1.45, fitW));
    } else {
      zoom = Math.max(1.35, Math.min(2.1, fitW));
    }
  }

  const viewW = canvasW / zoom;
  const viewH = canvasH / zoom;

  // Initial focus point from level or default (spawnPos.x, spawnPos.y + 65)
  const focusX = level.initialFocusPos ? level.initialFocusPos.x : level.spawnPos.x;
  const focusY = level.initialFocusPos ? level.initialFocusPos.y : level.spawnPos.y + 65;

  let camX = focusX - viewW / 2;
  let camY = focusY - viewH / 2;

  if (viewW >= level.width) {
    camX = -(viewW - level.width) / 2;
  } else {
    camX = Math.max(0, Math.min(camX, level.width - viewW));
  }

  if (viewH >= level.height) {
    camY = -(viewH - level.height) / 2;
  } else {
    camY = Math.max(0, Math.min(camY, level.height - viewH));
  }

  return { camX, camY, zoom, viewW, viewH };
}

export function computeSolidCoverage(level, canvasW, canvasH) {
  const terrain = new Terrain(level.width, level.height);
  level.setupTerrain(terrain);

  const { camX, camY, zoom } = getCameraForViewport(level, canvasW, canvasH);

  let solidCount = 0;
  const totalPixels = canvasW * canvasH;

  for (let sy = 0; sy < canvasH; sy++) {
    for (let sx = 0; sx < canvasW; sx++) {
      const wx = Math.floor(sx / zoom + camX);
      const wy = Math.floor(sy / zoom + camY);
      if (wx >= 0 && wx < level.width && wy >= 0 && wy < level.height) {
        const mat = terrain.getMaterial(wx, wy);
        if (mat === MATERIAL.EARTH || mat === MATERIAL.STEEL) {
          solidCount++;
        }
      }
    }
  }

  return (solidCount / totalPixels) * 100;
}

const VIEWPORTS = [
  { name: 'Portrait (390x844)', canvasW: 390, canvasH: 631 },
  { name: 'Landscape (844x390)', canvasW: 844, canvasH: 254 },
  { name: 'Desktop (1440x900)', canvasW: 1440, canvasH: 731 },
];

for (const vp of VIEWPORTS) {
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    test(`Coverage - Level ${lvl.id} in ${vp.name} must be >= 45.0% solid terrain`, () => {
      const pct = computeSolidCoverage(lvl, vp.canvasW, vp.canvasH);
      assert.ok(
        pct >= 45.0,
        `Level ${lvl.id} in ${vp.name} only reached ${pct.toFixed(1)}% solid terrain (target: >= 45.0%)`
      );
    });
  }
}
