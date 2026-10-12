import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE } from '../js/engine/lemming.js';

test('Floater - opens parachute and survives any fall height safely', () => {
  const terrain = new Terrain(100, 150);
  // Ground at y=120
  terrain.fillRect(0, 120, 100, 30, MATERIAL.EARTH);

  // Lemming with floater skill dropped from y=10 (110px drop)
  const floater = new Lemming(50, 10, 1);
  floater.isFloater = true;
  floater.state = STATE.FALLER;

  for (let i = 0; i < 200 && floater.state !== STATE.WALKER && !floater.isRemoved; i++) {
    floater.update(terrain);
  }

  // Must land safely as WALKER
  assert.equal(floater.state, STATE.WALKER);
  assert.equal(floater.y, 119);
  assert.equal(floater.isRemoved, false);
});
