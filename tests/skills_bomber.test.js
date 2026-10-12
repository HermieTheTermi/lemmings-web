import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE, SKILL } from '../js/engine/lemming.js';

test('Bomber - counts down 5s, detonates, punches hole in terrain, dies', () => {
  const terrain = new Terrain(100, 100);
  terrain.fillRect(0, 50, 100, 50, MATERIAL.EARTH); // ground
  terrain.fillRect(0, 20, 5, 30, MATERIAL.EARTH);   // left wall
  terrain.fillRect(95, 20, 5, 30, MATERIAL.EARTH);  // right wall

  const lem = new Lemming(50, 49, 1);
  assert.equal(lem.isSolidBelow(terrain), true);

  lem.assignSkill(SKILL.BOMBER);
  assert.equal(lem.hasBombTimer, true);
  assert.equal(lem.countdownSeconds, 5);

  // Advance timer by ticking updates
  // Fast forward until 1 tick before explosion
  while (lem.bombTicks > 1) {
    lem.update(terrain);
    assert.equal(lem.state, STATE.WALKER);
    assert.equal(lem.isRemoved, false);
  }

  // Next update detonates
  lem.update(terrain);
  assert.equal(lem.state, STATE.DEAD);
  assert.equal(lem.isRemoved, true);

  // Terrain at detonation point should now be a crater (AIR)
  assert.equal(terrain.isSolid(50, 49), false);
  assert.equal(terrain.getMaterial(50, 49), MATERIAL.AIR);
});
