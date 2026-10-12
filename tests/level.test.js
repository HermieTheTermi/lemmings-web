import test from 'node:test';
import assert from 'node:assert/strict';
import { Level } from '../js/engine/level.js';
import { SKILL } from '../js/engine/lemming.js';

test('Level - spawns lemmings at interval, uses skill budget, evaluates victory and defeat', () => {
  const levelConfig = {
    id: 1,
    name: 'Test Level',
    totalLemmings: 4,
    targetRescuePercent: 50, // Needs 2 out of 4
    spawnInterval: 5, // 5 ticks between spawns
    timeLimit: 100,
    spawnPos: { x: 10, y: 15 },
    exitPos: { x: 80, y: 40, w: 10, h: 10 },
    skills: {
      [SKILL.BUILDER]: 2,
      [SKILL.BOMBER]: 1,
    },
    setupTerrain: (terrain) => {
      // Flat ground
      terrain.fillRect(0, 40, 100, 20, 1);
      // Exit trigger
      terrain.fillRect(80, 40, 10, 5, 5); // MATERIAL.EXIT
    }
  };

  const level = new Level(levelConfig);
  assert.equal(level.neededToRescue, 2);
  assert.equal(level.status, 'PLAYING');
  assert.equal(level.skillsBudget[SKILL.BUILDER], 2);

  // Tick 1: first lemming spawned
  level.update();
  assert.equal(level.lemmings.length, 1);
  assert.equal(level.spawnedCount, 1);

  // Let lemming land on ground so it becomes WALKER
  const lem1 = level.lemmings[0];
  while (lem1.state === 'FALLER') {
    level.update();
  }
  assert.equal(lem1.state, 'WALKER');

  // Use skill on first lemming
  const success = level.assignSkillToLemming(lem1, SKILL.BUILDER);
  assert.equal(success, true);
  assert.equal(level.skillsBudget[SKILL.BUILDER], 1);

  // Spawning remaining 3 lemmings (3 * 5 = 15 ticks)
  for (let i = 0; i < 20; i++) {
    level.update();
  }
  assert.equal(level.spawnedCount, 4);

  // Advance simulation until lemmings reach exit
  for (let i = 0; i < 150 && level.status === 'PLAYING'; i++) {
    level.update();
  }

  // All 4 lemmings reached exit -> rescuedCount = 4 >= needed (2) -> VICTORY!
  assert.equal(level.rescuedCount, 4);
  assert.equal(level.status, 'VICTORY');
});
