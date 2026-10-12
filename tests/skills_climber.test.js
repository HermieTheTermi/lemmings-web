import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';
import { Lemming, STATE } from '../js/engine/lemming.js';

test('Climber - climbs wall to ledge, and handles ceiling bump cleanly without dying', () => {
  const terrain = new Terrain(100, 100);
  // Ground from y=50 to 100
  terrain.fillRect(0, 50, 100, 50, MATERIAL.EARTH);
  // Vertical wall at x=30 from y=30 to y=50
  terrain.fillRect(30, 30, 5, 20, MATERIAL.EARTH);

  // Lemming 1: climbs up and climbs over onto ledge
  const climber = new Lemming(28, 49, 1);
  climber.isClimber = true;
  climber.state = STATE.CLIMBER;

  for (let i = 0; i < 30 && climber.state === STATE.CLIMBER; i++) {
    climber.update(terrain);
  }
  // Should have reached ledge and transitioned to WALKER on top
  assert.equal(climber.state, STATE.WALKER);
  assert.equal(climber.isRemoved, false);

  // Lemming 2: Wall has an overhang / ceiling at y=15
  terrain.fillRect(60, 20, 5, 30, MATERIAL.EARTH); // Wall
  terrain.fillRect(55, 15, 20, 4, MATERIAL.EARTH); // Ceiling overhang

  const climber2 = new Lemming(59, 49, 1);
  climber2.isClimber = true;
  climber2.state = STATE.CLIMBER;

  for (let i = 0; i < 40 && climber2.state === STATE.CLIMBER; i++) {
    climber2.update(terrain);
  }
  // When hitting ceiling, should transition to FALLER, reversed direction, not dead
  assert.equal(climber2.state, STATE.FALLER);
  assert.equal(climber2.dir, -1);
  assert.equal(climber2.isRemoved, false);
});
