import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE, SKILL } from '../js/engine/lemming.js';

test('Basher - tunnels horizontally through earth wall and resumes walking upon air breakthrough', () => {
  const terrain = new Terrain(100, 50);
  // Ground from y=30 to 50
  terrain.fillRect(0, 30, 100, 20, MATERIAL.EARTH);
  // Earth pillar / wall from x=30 to x=40, y=10 to y=30
  terrain.fillRect(30, 10, 10, 20, MATERIAL.EARTH);

  const lem = new Lemming(29, 29, 1);
  // Assign basher skill
  lem.assignSkill(SKILL.BASHER);
  assert.equal(lem.state, STATE.BASHER);

  // Basher carves through the wall and walks out on the other side
  for (let i = 0; i < 30; i++) {
    lem.update(terrain);
  }

  // Should have tunneled through and resumed walking
  assert.equal(lem.state, STATE.WALKER);
  assert.ok(lem.x >= 40);
  // The tunnel through the wall must now be air
  assert.equal(terrain.isSolid(35, 25), false);
});

test('Basher - stops when hitting indestructible steel', () => {
  const terrain = new Terrain(100, 50);
  terrain.fillRect(0, 30, 100, 20, MATERIAL.EARTH);
  // Steel wall at x=30
  terrain.fillRect(30, 10, 10, 20, MATERIAL.STEEL);

  const lem = new Lemming(25, 29, 1);
  lem.assignSkill(SKILL.BASHER);

  for (let i = 0; i < 15 && lem.state === STATE.BASHER; i++) {
    lem.update(terrain);
  }

  // Steel remains intact and solid
  assert.equal(terrain.isSolid(32, 25), true);
  assert.equal(terrain.getMaterial(32, 25), MATERIAL.STEEL);
  // Lemming stopped bashing
  assert.equal(lem.state, STATE.WALKER);
});
