import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE, SKILL } from '../js/engine/lemming.js';

test('Builder - builds up to 12 steps across a gap, stops when ceiling hit', () => {
  const terrain = new Terrain(100, 100);
  // Ground ends at x=20
  terrain.fillRect(0, 50, 20, 50, MATERIAL.EARTH);

  // Lemming 1: Free build
  const lem1 = new Lemming(18, 49, 1);
  const assigned = lem1.assignSkill(SKILL.BUILDER);
  assert.equal(assigned, true);
  assert.equal(lem1.state, STATE.BUILDER);

  for (let i = 0; i < 20 && lem1.state === STATE.BUILDER; i++) {
    lem1.update(terrain);
  }

  // Finished 12 steps, returns to WALKER
  assert.equal(lem1.builderSteps, 12);
  assert.equal(lem1.state, STATE.WALKER);
  // Placed steps should be solid in terrain
  assert.equal(terrain.isSolid(25, 43), true);

  // Lemming 2: Ceiling overhead at y=35
  terrain.fillRect(40, 35, 30, 4, MATERIAL.EARTH); // Low ceiling
  const lem2 = new Lemming(42, 45, 1);
  lem2.assignSkill(SKILL.BUILDER);

  for (let i = 0; i < 20 && lem2.state === STATE.BUILDER; i++) {
    lem2.update(terrain);
  }
  // Lemming hit ceiling before completing 12 steps, stopped and reversed
  assert.ok(lem2.builderSteps < 12);
  assert.equal(lem2.state, STATE.WALKER);
  assert.equal(lem2.dir, -1);
});
