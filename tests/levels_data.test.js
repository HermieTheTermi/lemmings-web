import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../js/engine/levels-data.js';
import { Level } from '../js/engine/level.js';

test('Levels Data - all 6 levels load cleanly and initialize terrain', () => {
  assert.equal(LEVELS.length, 6);

  for (const config of LEVELS) {
    assert.ok(config.id >= 1 && config.id <= 6);
    assert.ok(config.name.length > 0);
    assert.ok(config.totalLemmings >= 10);
    assert.ok(config.targetRescuePercent >= 50);
    assert.ok(config.timeLimit >= 60);

    const level = new Level(config);
    assert.equal(level.status, 'PLAYING');
    assert.ok(level.neededToRescue > 0);
    assert.ok(level.neededToRescue <= config.totalLemmings);

    // Verify exit zone is marked in terrain
    assert.equal(level.terrain.getMaterial(config.exitPos.x + 2, config.exitPos.y + 2), 5);
  }
});
