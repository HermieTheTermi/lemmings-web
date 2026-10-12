import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE, SKILL } from '../js/engine/lemming.js';

test('Miner - digs diagonally downward through earth, stops at breakthrough', () => {
  const terrain = new Terrain(100, 100);
  // Earth block from y=30 to y=80
  terrain.fillRect(0, 30, 100, 50, MATERIAL.EARTH);

  const lem = new Lemming(30, 29, 1);
  lem.assignSkill(SKILL.MINER);
  assert.equal(lem.state, STATE.MINER);

  const startX = lem.x;
  const startY = lem.y;

  for (let i = 0; i < 15; i++) {
    lem.update(terrain);
  }

  // Moved both horizontally and vertically
  assert.ok(lem.x > startX);
  assert.ok(lem.y > startY);
  // Slope should be roughly 1:1 (~45 degrees)
  const dx = lem.x - startX;
  const dy = lem.y - startY;
  assert.ok(Math.abs(dx - dy) <= 3);

  // The carved diagonal path should now be AIR
  assert.equal(terrain.isSolid(startX + 5, startY + 5), false);
});

test('Miner - stops when hitting indestructible steel', () => {
  const terrain = new Terrain(100, 100);
  terrain.fillRect(0, 30, 100, 50, MATERIAL.EARTH);
  // Steel block diagonally in path
  terrain.fillRect(40, 35, 10, 10, MATERIAL.STEEL);

  const lem = new Lemming(30, 29, 1);
  lem.assignSkill(SKILL.MINER);

  for (let i = 0; i < 20; i++) {
    lem.update(terrain);
  }

  // Steel is undamaged
  assert.equal(terrain.getMaterial(42, 37), MATERIAL.STEEL);
  // Lemming stopped mining
  assert.notEqual(lem.state, STATE.MINER);
});
