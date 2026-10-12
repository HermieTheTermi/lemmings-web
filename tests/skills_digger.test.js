import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE, SKILL } from '../js/engine/lemming.js';

test('Digger - digs vertically straight down, stops when breaking through into air', () => {
  const terrain = new Terrain(100, 100);
  // Earth layer from y=20 to y=40, air below (cavern)
  terrain.fillRect(0, 20, 100, 20, MATERIAL.EARTH);

  const lem = new Lemming(50, 19, 1);
  lem.assignSkill(SKILL.DIGGER);
  assert.equal(lem.state, STATE.DIGGER);

  const startX = lem.x;
  const startY = lem.y;

  // Dig until breaking through the 20px earth layer
  for (let i = 0; i < 25 && lem.state === STATE.DIGGER; i++) {
    lem.update(terrain);
  }

  // x stays constant, y has moved down past the earth layer
  assert.equal(lem.x, startX);
  assert.ok(lem.y >= 39);
  // When breaking into air, transitions to FALLER
  assert.equal(lem.state, STATE.FALLER);

  // Shaft through the layer should be air
  assert.equal(terrain.isSolid(50, 25), false);
});

test('Digger - stops digging when hitting indestructible steel', () => {
  const terrain = new Terrain(100, 100);
  // Earth layer with steel plate underneath at y=30
  terrain.fillRect(0, 20, 100, 10, MATERIAL.EARTH);
  terrain.fillRect(0, 30, 100, 10, MATERIAL.STEEL);

  const lem = new Lemming(50, 19, 1);
  lem.assignSkill(SKILL.DIGGER);

  for (let i = 0; i < 20 && lem.state === STATE.DIGGER; i++) {
    lem.update(terrain);
  }

  // Steel remains intact
  assert.equal(terrain.getMaterial(50, 32), MATERIAL.STEEL);
  // Lemming stopped digging upon hitting steel
  assert.notEqual(lem.state, STATE.DIGGER);
});
