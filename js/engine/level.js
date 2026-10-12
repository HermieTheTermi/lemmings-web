import { Terrain, MATERIAL } from './terrain.js';
import { Lemming, STATE, SKILL } from './lemming.js';

export class Level {
  constructor(config) {
    this.config = config;
    this.id = config.id || 1;
    this.name = config.name || 'Level';
    this.width = config.width || 800;
    this.height = config.height || 400;

    this.totalLemmings = config.totalLemmings || 20;
    this.targetRescuePercent = config.targetRescuePercent || 50;
    this.neededToRescue = Math.ceil((this.totalLemmings * this.targetRescuePercent) / 100);

    this.spawnInterval = config.spawnInterval || 50; // ticks between spawns
    this.timeLimit = config.timeLimit || 180; // in seconds
    this.remainingSeconds = this.timeLimit;

    this.spawnPos = { x: config.spawnPos?.x ?? 50, y: config.spawnPos?.y ?? 20 };
    this.exitPos = {
      x: config.exitPos?.x ?? 700,
      y: config.exitPos?.y ?? 300,
      w: config.exitPos?.w ?? 24,
      h: config.exitPos?.h ?? 30,
    };

    this.skillsBudget = { ...(config.skills || {}) };

    this.terrain = new Terrain(this.width, this.height);
    if (typeof config.setupTerrain === 'function') {
      config.setupTerrain(this.terrain);
    }

    // Set exit trigger region in terrain mask
    this.terrain.fillRect(this.exitPos.x, this.exitPos.y, this.exitPos.w, this.exitPos.h, MATERIAL.EXIT);

    this.lemmings = [];
    this.spawnedCount = 0;
    this.rescuedCount = 0;
    this.deadCount = 0;
    this.status = 'PLAYING'; // 'PLAYING', 'VICTORY', 'DEFEAT'
    this.tickCount = 0;
    this.spawnTimer = 0;

    // Fast-forward factor (1 = normal, 2 = 2x)
    this.speed = 1;
    this.paused = false;
  }

  assignSkillToLemming(lemming, skill) {
    if (this.status !== 'PLAYING') return false;
    const remaining = this.skillsBudget[skill] || 0;
    if (remaining <= 0) return false;

    const assigned = lemming.assignSkill(skill);
    if (assigned) {
      this.skillsBudget[skill]--;
      return true;
    }
    return false;
  }

  update() {
    if (this.status !== 'PLAYING' || this.paused) return;

    this.tickCount++;

    // Timer check (50 ticks per second)
    if (this.tickCount % 50 === 0) {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        if (this.remainingSeconds <= 0) {
          this.checkGameEnd();
          return;
        }
      }
    }

    // Spawn check
    if (this.spawnedCount < this.totalLemmings) {
      if (this.spawnTimer <= 0) {
        const newLemming = new Lemming(this.spawnPos.x, this.spawnPos.y, 1);
        newLemming.state = STATE.FALLER;
        this.lemmings.push(newLemming);
        this.spawnedCount++;
        this.spawnTimer = this.spawnInterval;
      } else {
        this.spawnTimer--;
      }
    }

    // Collect blockers for collision
    const blockers = this.lemmings.filter(l => l.state === STATE.BLOCKER && !l.isRemoved);

    // Update active lemmings
    for (const lemming of this.lemmings) {
      if (lemming.isRemoved) continue;

      lemming.update(this.terrain, blockers);

      if (lemming.state === STATE.EXITED) {
        this.rescuedCount++;
      } else if (lemming.isRemoved && lemming.state !== STATE.EXITED) {
        this.deadCount++;
      }
    }

    this.checkGameEnd();
  }

  checkGameEnd() {
    // If all lemmings have been spawned and none are active anymore
    const activeLemmings = this.lemmings.filter(l => !l.isRemoved).length;
    const allSpawned = this.spawnedCount >= this.totalLemmings;

    if (this.remainingSeconds <= 0) {
      if (this.rescuedCount >= this.neededToRescue) {
        this.status = 'VICTORY';
      } else {
        this.status = 'DEFEAT';
      }
      return;
    }

    if (allSpawned && activeLemmings === 0) {
      if (this.rescuedCount >= this.neededToRescue) {
        this.status = 'VICTORY';
      } else {
        this.status = 'DEFEAT';
      }
    }
  }

  restart() {
    const config = this.config;
    this.remainingSeconds = this.timeLimit;
    this.skillsBudget = { ...(config.skills || {}) };

    this.terrain = new Terrain(this.width, this.height);
    if (typeof config.setupTerrain === 'function') {
      config.setupTerrain(this.terrain);
    }
    this.terrain.fillRect(this.exitPos.x, this.exitPos.y, this.exitPos.w, this.exitPos.h, MATERIAL.EXIT);

    this.lemmings = [];
    this.spawnedCount = 0;
    this.rescuedCount = 0;
    this.deadCount = 0;
    this.status = 'PLAYING';
    this.tickCount = 0;
    this.spawnTimer = 0;
    this.paused = false;
  }
}
