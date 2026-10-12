import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE, SKILL } from '../js/engine/lemming.js';

test('Blocker - stays stationary and turns passing lemmings coming from both directions', () => {
  const terrain = new Terrain(100, 100);
  terrain.fillRect(0, 50, 100, 50, MATERIAL.EARTH);

  // Lemming 1 becomes Blocker at x=50
  const blocker = new Lemming(50, 49, 1);
  blocker.assignSkill(SKILL.BLOCKER);
  assert.equal(blocker.state, STATE.BLOCKER);

  // Lemming 2 approaches from left (x=40, dir=1)
  const lemLeft = new Lemming(40, 49, 1);

  // Lemming 3 approaches from right (x=60, dir=-1)
  const lemRight = new Lemming(60, 49, -1);

  const blockers = [blocker];

  // Update lemmings for 15 frames
  for (let i = 0; i < 15; i++) {
    blocker.update(terrain, blockers);
    lemLeft.update(terrain, blockers);
    lemRight.update(terrain, blockers);
  }

  // Blocker stayed at x=50
  assert.equal(blocker.x, 50);
  assert.equal(blocker.state, STATE.BLOCKER);

  // LemLeft turned around and is moving left (dir=-1, x < 50)
  assert.equal(lemLeft.dir, -1);
  assert.ok(lemLeft.x < 50);

  // LemRight turned around and is moving right (dir=1, x > 50)
  assert.equal(lemRight.dir, 1);
  assert.ok(lemRight.x > 50);
});
