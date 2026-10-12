import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE } from '../js/engine/lemming.js';

test('Lemming Faller - safe drop lands as walker, high drop (>60px) splats', () => {
  const terrain = new Terrain(100, 150);
  // Ground at y=30
  terrain.fillRect(0, 30, 40, 10, MATERIAL.EARTH);
  // Deep pit ground at y=120
  terrain.fillRect(40, 120, 60, 20, MATERIAL.EARTH);

  // Lemming 1: Drops 20px onto y=30 (starts at y=10)
  const safeLemming = new Lemming(10, 10, 1);
  safeLemming.state = STATE.FALLER;

  for (let i = 0; i < 30 && safeLemming.state === STATE.FALLER; i++) {
    safeLemming.update(terrain);
  }
  assert.equal(safeLemming.state, STATE.WALKER);
  assert.equal(safeLemming.y, 29);
  assert.equal(safeLemming.isRemoved, false);

  // Lemming 2: Drops from y=10 onto deep pit at y=120 (fall distance = 110px > 60px)
  const deadLemming = new Lemming(50, 10, 1);
  deadLemming.state = STATE.FALLER;

  for (let i = 0; i < 100 && !deadLemming.isRemoved; i++) {
    deadLemming.update(terrain);
  }
  assert.equal(deadLemming.state, STATE.SPLAT);
  assert.equal(deadLemming.isRemoved, true);
});
