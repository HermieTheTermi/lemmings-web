import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE } from '../js/engine/lemming.js';

test('Hazards & Exit - Water drowns, Lava burns, Exit saves', () => {
  const terrain = new Terrain(100, 50);
  // Ground
  terrain.fillRect(0, 30, 100, 20, MATERIAL.EARTH);

  // Water hazard at x=20..25, y=30
  terrain.fillRect(20, 29, 6, 2, MATERIAL.WATER);
  // Lava hazard at x=50..55, y=30
  terrain.fillRect(50, 29, 6, 2, MATERIAL.LAVA);
  // Exit portal at x=80..85, y=28..30
  terrain.fillRect(80, 28, 6, 3, MATERIAL.EXIT);

  // Lemming 1: steps into water
  const lemWater = new Lemming(18, 29, 1);
  for (let i = 0; i < 5; i++) lemWater.update(terrain);
  assert.equal(lemWater.state, STATE.DROWN);
  assert.equal(lemWater.isRemoved, true);

  // Lemming 2: steps into lava
  const lemLava = new Lemming(48, 29, 1);
  for (let i = 0; i < 5; i++) lemLava.update(terrain);
  assert.equal(lemLava.state, STATE.BURN);
  assert.equal(lemLava.isRemoved, true);

  // Lemming 3: steps into exit portal
  const lemExit = new Lemming(78, 29, 1);
  for (let i = 0; i < 5; i++) lemExit.update(terrain);
  assert.equal(lemExit.state, STATE.EXITED);
  assert.equal(lemExit.isRemoved, true);
});
