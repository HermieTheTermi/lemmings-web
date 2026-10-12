import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../js/engine/levels-data.js';
import { Level } from '../js/engine/level.js';
import { SKILL } from '../js/engine/lemming.js';
import { LEVEL_SOLUTIONS } from '../js/engine/solutions-data.js';

function runHeadlessSimulation(levelConfig, actions, maxTicks = 6000) {
  const level = new Level(levelConfig);
  let actionIdx = 0;

  for (let tick = 0; tick < maxTicks; tick++) {
    while (actionIdx < actions.length && actions[actionIdx].tick === tick) {
      const act = actions[actionIdx];
      let target = null;
      if (act.lemmingIndex !== undefined) {
        target = level.lemmings[act.lemmingIndex];
      } else if (act.zielX !== undefined) {
        target = level.lemmings.find((l) => !l.isRemoved && Math.abs(l.x - act.zielX) < 20);
      }
      if (target) {
        level.assignSkillToLemming(target, act.skill);
      }
      actionIdx++;
    }

    level.update();
    if (level.status === 'VICTORY' || level.status === 'DEFEAT') {
      return level;
    }
  }
  return level;
}

for (let i = 0; i < LEVELS.length; i++) {
  const lvlId = i + 1;
  const lvlConfig = LEVELS[i];
  const solution = LEVEL_SOLUTIONS[lvlId] || [];

  test(`Solution Level ${lvlId} - ${lvlConfig.name}: depth, hold moment, victory, and minimality`, () => {
    // 1. Solution must use at least 3 distinct skills
    const uniqueSkills = new Set(solution.map((a) => a.skill));
    assert.ok(
      uniqueSkills.size >= 3,
      `Level ${lvlId} solution must use at least 3 distinct skills, but only used ${uniqueSkills.size} (${[...uniqueSkills].join(', ')})`
    );

    // 2. Solution must contain a horde hold or redirect moment (e.g. BLOCKER)
    const hasHold = solution.some((a) => a.skill === SKILL.BLOCKER);
    assert.ok(hasHold, `Level ${lvlId} solution must contain a horde hold/redirect moment (BLOCKER)`);

    // 3. Complete solution must achieve victory with full rescue quota
    const fullRun = runHeadlessSimulation(lvlConfig, solution);
    assert.equal(
      fullRun.status,
      'VICTORY',
      `Level ${lvlId} ended with status ${fullRun.status}. Rescued: ${fullRun.rescuedCount}/${fullRun.neededToRescue}`
    );
    assert.ok(
      fullRun.rescuedCount >= fullRun.neededToRescue,
      `Level ${lvlId} rescued ${fullRun.rescuedCount}, needed ${fullRun.neededToRescue}`
    );

    // 4. Minimality: omitting the last action must cause failure
    assert.ok(solution.length >= 2, `Level ${lvlId} must have at least 2 actions to test minimality`);
    const truncatedSolution = solution.slice(0, -1);
    const incompleteRun = runHeadlessSimulation(lvlConfig, truncatedSolution);
    const failed = incompleteRun.status !== 'VICTORY' || incompleteRun.rescuedCount < incompleteRun.neededToRescue;
    assert.ok(
      failed,
      `Level ${lvlId} minimality test failed: level still succeeded even after omitting the last action (${solution[solution.length - 1].skill})!`
    );
  });
}
