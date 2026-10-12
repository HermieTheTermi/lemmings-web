import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE } from '../js/engine/lemming.js';

test('Lemming Walker - moves forward, steps up small slope, turns on tall wall', () => {
  const terrain = new Terrain(100, 50);
  // Create flat ground from y=30 to y=50
  terrain.fillRect(0, 30, 100, 20, MATERIAL.EARTH);

  // Lemming standing on ground at x=10, y=29 (feet on y=29, ground at y=30)
  const lem = new Lemming(10, 29, 1);
  assert.equal(lem.state, STATE.WALKER);

  // Update 5 frames: moves right by 5px
  for (let i = 0; i < 5; i++) {
    lem.update(terrain);
  }
  assert.equal(lem.x, 15);
  assert.equal(lem.y, 29);
  assert.equal(lem.dir, 1);

  // Add small 2px step at x=20 (from y=28 to 30)
  terrain.fillRect(20, 28, 5, 2, MATERIAL.EARTH);
  // Walk 5 frames to cross the step
  for (let i = 0; i < 5; i++) {
    lem.update(terrain);
  }
  // Lemming should have stepped up to y=27
  assert.equal(lem.x, 20);
  assert.equal(lem.y, 27);

  // Place a 10px tall wall at x=25 (from y=17 to y=30)
  terrain.fillRect(25, 17, 5, 13, MATERIAL.EARTH);
  // Walk until hitting wall
  for (let i = 0; i < 5; i++) {
    lem.update(terrain);
  }
  // Lemming hits wall and turns around (dir becomes -1)
  assert.equal(lem.dir, -1);
});
