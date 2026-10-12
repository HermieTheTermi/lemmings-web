import test from 'node:test';
import assert from 'node:assert/strict';

function setupMockDOM(dpr = 2) {
  globalThis.window = {
    devicePixelRatio: dpr,
  };
  globalThis.document = {
    createElement: (tag) => {
      const el = {
        width: 0,
        height: 0,
        style: {},
        getContext: () => ({
          imageSmoothingEnabled: false,
          clearRect: () => {},
          fillRect: () => {},
          save: () => {},
          restore: () => {},
          scale: () => {},
          setTransform: () => {},
          translate: () => {},
          drawImage: () => {},
          createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
          getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
          putImageData: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          quadraticCurveTo: () => {},
          bezierCurveTo: () => {},
          stroke: () => {},
          fill: () => {},
          arc: () => {},
          ellipse: () => {},
          strokeRect: () => {},
          rotate: () => {},
          fillText: () => {},
          measureText: () => ({ width: 10 }),
        }),
      };
      return el;
    },
  };
}

test('Renderer: coupling canvas backing store to devicePixelRatio capped at 2 and preserving CSS coordinates', async () => {
  setupMockDOM(2);
  const { Renderer } = await import('../js/graphics/renderer.js');
  const canvas = globalThis.document.createElement('canvas');
  const renderer = new Renderer(canvas);

  // Resize in Mobile Portrait (390 x 844) with DPR 2
  renderer.resize(390, 844);

  // Must scale backing store by min(dpr, 2) = 2
  assert.equal(renderer.dpr, 2, 'renderer.dpr must be 2');
  assert.equal(renderer.canvas.width, 780, 'canvas.width must be 390 * 2 = 780');
  assert.equal(renderer.canvas.height, 1688, 'canvas.height must be 844 * 2 = 1688');
  assert.equal(renderer.canvas.style.width, '390px', 'canvas.style.width must preserve CSS client width 390px');
  assert.equal(renderer.canvas.style.height, '844px', 'canvas.style.height must preserve CSS client height 844px');
  assert.equal(renderer.width, 390, 'renderer.width must store logical width in CSS pixels');
  assert.equal(renderer.height, 844, 'renderer.height must store logical height in CSS pixels');

  // When DPR > 2 (e.g. 3 on high-end phones), must cap at 2
  globalThis.window.devicePixelRatio = 3;
  renderer.resize(390, 844);
  assert.equal(renderer.dpr, 2, 'DPR must be capped at 2');
  assert.equal(renderer.canvas.width, 780, 'canvas.width must remain capped at 390 * 2 = 780');

  // Verify input coordinate mapping (screenToWorld) stays in CSS pixel units
  renderer.camera.x = 100;
  renderer.camera.y = 50;
  renderer.camera.zoom = 2;
  const worldPos = renderer.screenToWorld(100, 100);
  assert.equal(worldPos.x, 150, 'screenToWorld x must be screenX / zoom + camX = 100 / 2 + 100 = 150');
  assert.equal(worldPos.y, 100, 'screenToWorld y must be screenY / zoom + camY = 100 / 2 + 50 = 100');
});
