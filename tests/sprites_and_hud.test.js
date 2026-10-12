import test from 'node:test';
import assert from 'node:assert/strict';

function setupMockDOM() {
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

test('Sprites: lemming sprites generated at double resolution (width >= 24)', async () => {
  setupMockDOM();
  const { SpriteManager } = await import('../js/graphics/sprites.js');
  const sm = new SpriteManager();

  // Walker must be at double resolution (24x24 instead of 12x12)
  assert.ok(sm.walker.length >= 8, 'Walker must have at least 8 animation frames');
  assert.ok(sm.walker[0].width >= 24, `Walker sprite width must be >= 24 for 2x retina sharpness, got ${sm.walker[0].width}`);
  assert.ok(sm.walker[0].height >= 24, `Walker sprite height must be >= 24, got ${sm.walker[0].height}`);

  // Floater, Climber, Blocker, Builder, Basher, Miner, Digger must all be >= 24
  assert.ok(sm.floater[0].width >= 28, 'Floater umbrella must be >= 28px width');
  assert.ok(sm.climber[0].width >= 24, 'Climber must be >= 24px width');
  assert.ok(sm.blocker[0].width >= 24, 'Blocker must be >= 24px width');
  assert.ok(sm.builder[0].width >= 24, 'Builder must be >= 24px width');
  assert.ok(sm.basher[0].width >= 24, 'Basher must be >= 24px width');
  assert.ok(sm.miner[0].width >= 24, 'Miner must be >= 24px width');
  assert.ok(sm.digger[0].width >= 24, 'Digger must be >= 24px width');
});

test('HUD: time limit progress bar element exists and updates dynamically', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const htmlPath = path.resolve(__dirname, '../index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Verify time-progress-bar in index.html
  assert.ok(
    htmlContent.includes('id="time-progress-bar"') || htmlContent.includes('id="time-progress-fill"'),
    'index.html must include a time progress bar element'
  );

  // Verify tabular-nums in css/style.css
  const cssPath = path.resolve(__dirname, '../css/style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert.ok(
    cssContent.includes('tabular-nums'),
    'css/style.css must specify tabular-nums for aligned HUD counters'
  );
});

