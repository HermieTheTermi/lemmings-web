import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, MATERIAL } from '../js/engine/terrain.js';

test('Terrain - initialisation, solid checks, and carving', () => {
  const terrain = new Terrain(100, 100);
  
  // Default is empty/air
  assert.equal(terrain.getMaterial(10, 10), MATERIAL.AIR);
  assert.equal(terrain.isSolid(10, 10), false);

  // Fill a rectangular region with EARTH
  terrain.fillRect(20, 20, 40, 40, MATERIAL.EARTH);
  assert.equal(terrain.getMaterial(25, 25), MATERIAL.EARTH);
  assert.equal(terrain.isSolid(25, 25), true);
  assert.equal(terrain.isSolid(10, 10), false);

  // Carve circle (Bomber crater) at (30, 30) with radius 5
  terrain.carveCircle(30, 30, 5);
  assert.equal(terrain.isSolid(30, 30), false);
  assert.equal(terrain.getMaterial(30, 30), MATERIAL.AIR);
  // Outside crater should still be solid
  assert.equal(terrain.isSolid(45, 45), true);

  // Steel cannot be carved
  terrain.fillRect(60, 60, 10, 10, MATERIAL.STEEL);
  assert.equal(terrain.isSolid(65, 65), true);
  assert.equal(terrain.isDestructible(65, 65), false);
  terrain.carveCircle(65, 65, 5);
  // Still steel and solid!
  assert.equal(terrain.isSolid(65, 65), true);
  assert.equal(terrain.getMaterial(65, 65), MATERIAL.STEEL);
});
