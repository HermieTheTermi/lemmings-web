import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../js/engine/levels-data.js';

test('Level Data: every level must configure at least two explicit light sources', () => {
  for (const lvl of LEVELS) {
    assert.ok(Array.isArray(lvl.lights), `Level ${lvl.id} (${lvl.name}) must have a lights array`);
    assert.ok(lvl.lights.length >= 2, `Level ${lvl.id} must have at least 2 light sources, got ${lvl.lights ? lvl.lights.length : 0}`);
    for (const light of lvl.lights) {
      assert.ok(typeof light.x === 'number' && typeof light.y === 'number', `Light must have numeric x and y in level ${lvl.id}`);
      assert.ok(light.radius >= 20, `Light radius must be >= 20 in level ${lvl.id}`);
      assert.ok(light.color, `Light must define a color in level ${lvl.id}`);
    }
  }
});
