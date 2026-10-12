import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Renderer } from '../js/graphics/renderer.js';

class MockContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.globalCompositeOperation = 'source-over';
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '12px sans-serif';
    this.textAlign = 'left';
    this.textBaseline = 'top';
    this.calls = [];
  }
  save() { this.calls.push('save'); }
  restore() { this.calls.push('restore'); }
  beginPath() { this.calls.push('beginPath'); }
  closePath() { this.calls.push('closePath'); }
  moveTo(x, y) { this.calls.push(`moveTo(${x},${y})`); }
  lineTo(x, y) { this.calls.push(`lineTo(${x},${y})`); }
  quadraticCurveTo() {}
  bezierCurveTo() {}
  arc(x, y, r, sa, ea) { this.calls.push(`arc(${x},${y},${r})`); }
  ellipse() {}
  fill() { this.calls.push('fill'); }
  stroke() {}
  strokeRect() {}
  fillRect(x, y, w, h) { this.calls.push(`fillRect(${x},${y},${w},${h})`); }
  clearRect() {}
  setTransform() {}
  scale() {}
  translate() {}
  rotate() {}
  drawImage() {}
  createImageData(w, h) {
    return { data: new Uint8ClampedArray(w * h * 4) };
  }
  getImageData(x, y, w, h) {
    return { data: new Uint8ClampedArray(w * h * 4) };
  }
  putImageData(imgData, x, y) {
    this.lastPutImageData = imgData;
  }
  createLinearGradient() {
    return { addColorStop: () => {} };
  }
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    const stops = [];
    return {
      x0, y0, r0, x1, y1, r1,
      addColorStop: (offset, color) => { stops.push({ offset, color }); },
      stops
    };
  }
}

class MockCanvas {
  constructor(w = 800, h = 400) {
    this.width = w;
    this.height = h;
    this.style = {};
    this._ctx = new MockContext(this);
  }
  getContext(type) {
    return this._ctx;
  }
}

function setupMockDOM() {
  globalThis.window = { devicePixelRatio: 2 };
  globalThis.document = {
    createElement: (tag) => new MockCanvas(32, 32),
  };
}

setupMockDOM();

test('Round 3 Visual Refinement: Earth texture has organic tones without harsh white noise speckles', () => {
  const canvas = new MockCanvas(100, 100);
  const renderer = new Renderer(canvas, { MockCanvas });
  const terrain = new Terrain(100, 100);
  // Fill deep earth (no top surface)
  terrain.fillRect(0, 0, 100, 100, MATERIAL.EARTH);

  renderer.renderFullTerrain({ terrain });
  const putData = renderer.terrainCtx.lastPutImageData.data;

  let harshWhitePixels = 0;
  for (let i = 0; i < putData.length; i += 4) {
    const r = putData[i];
    const g = putData[i + 1];
    const b = putData[i + 2];
    // A harsh white speckle has high luminance in all three channels (R>220, G>220, B>220)
    if (r > 220 && g > 220 && b > 220) {
      harshWhitePixels++;
    }
  }

  // In Round 3, deep earth should have organic earthy tones, no harsh white noise confetti
  assert.equal(harshWhitePixels, 0, `Expected 0 harsh white noise pixels in deep earth, found ${harshWhitePixels}`);
});

test('Round 3 Visual Refinement: Molten lava surface has glowing incandescent crust', () => {
  const canvas = new MockCanvas(100, 100);
  const renderer = new Renderer(canvas, { MockCanvas });
  const terrain = new Terrain(100, 100);
  // Air above, lava below starting at y=20
  terrain.fillRect(0, 20, 100, 80, MATERIAL.LAVA);

  renderer.renderFullTerrain({ terrain });
  const putData = renderer.terrainCtx.lastPutImageData.data;

  // Check row y=20 (surface of lava): should have hot incandescent crust (high red + yellow)
  let hotCrustPixels = 0;
  for (let x = 0; x < 100; x++) {
    const idx = (20 * 100 + x) * 4;
    const r = putData[idx];
    const g = putData[idx + 1];
    // Molten top crust has high red and strong yellow (R > 230, G > 140)
    if (r >= 230 && g >= 140) {
      hotCrustPixels++;
    }
  }

  assert.ok(hotCrustPixels >= 80, `Expected at least 80% hot crust pixels on lava surface, got ${hotCrustPixels}`);
});

test('Round 3 Visual Refinement: Lava light does not generate a hard circular white pinpoint core', () => {
  const canvas = new MockCanvas(800, 400);
  const renderer = new Renderer(canvas, { MockCanvas });
  const mockLevel = {
    config: {
      lights: [
        { x: 350, y: 280, radius: 110, color: '#f97316', coreColor: '#ffffff', type: 'lava' }
      ]
    }
  };

  renderer.renderLights(mockLevel);

  // Check that for lava type, createRadialGradient is used for diffuse convective heat,
  // but no tight pinpoint specular core with r <= 8 is rendered with white disk
  const arcs = renderer.ctx.calls.filter(c => c.startsWith('arc'));
  // Crystal or lantern might use arc for glint, but lava should use diffuse convective bloom
  const tightArcs = arcs.filter(c => {
    const match = c.match(/arc\(\d+,\d+,(\d+)\)/);
    return match && Number(match[1]) <= 8;
  });
  assert.equal(tightArcs.length, 0, 'Lava light should not draw tight specular pinpoint arcs');
});
