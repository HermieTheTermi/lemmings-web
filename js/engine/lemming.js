/**
 * Lemming entity: state machine, movement, physics, and skill handling.
 */

export const STATE = {
  FALLER: 'FALLER',
  WALKER: 'WALKER',
  CLIMBER: 'CLIMBER',
  FLOATER: 'FLOATER',
  BOMBER: 'BOMBER',
  BLOCKER: 'BLOCKER',
  BUILDER: 'BUILDER',
  BASHER: 'BASHER',
  MINER: 'MINER',
  DIGGER: 'DIGGER',
  SPLAT: 'SPLAT',
  DROWN: 'DROWN',
  BURN: 'BURN',
  EXITED: 'EXITED',
  DEAD: 'DEAD',
};

export const SKILL = {
  CLIMBER: 'CLIMBER',
  FLOATER: 'FLOATER',
  BOMBER: 'BOMBER',
  BLOCKER: 'BLOCKER',
  BUILDER: 'BUILDER',
  BASHER: 'BASHER',
  MINER: 'MINER',
  DIGGER: 'DIGGER',
};

export class Lemming {
  constructor(x, y, dir = 1) {
    this.x = x;
    this.y = y;
    this.dir = dir; // 1 = right, -1 = left
    this.state = STATE.WALKER;
    this.previousState = STATE.WALKER;
    this.fallDistance = 0;
    this.maxSafeFall = 60;
    this.isClimber = false;
    this.isFloater = false;
    this.bombTicks = null; // Countdown in ticks (50 ticks/sec * 5s = 250)
    this.builderSteps = 0;
    this.digCounter = 0;
    this.frame = 0;
    this.isRemoved = false;
    this.height = 10;
    this.width = 6;
    this.justExploded = false;
  }

  get hasBombTimer() {
    return this.bombTicks !== null && this.bombTicks > 0;
  }

  get countdownSeconds() {
    if (this.bombTicks === null) return 0;
    return Math.ceil(this.bombTicks / 50);
  }

  isSolidBelow(terrain) {
    return terrain.isSolid(this.x, this.y + 1);
  }

  assignSkill(skill) {
    if (this.isRemoved || this.state === STATE.DEAD || this.state === STATE.EXITED) {
      return false;
    }

    switch (skill) {
      case SKILL.CLIMBER:
        this.isClimber = true;
        return true;
      case SKILL.FLOATER:
        this.isFloater = true;
        return true;
      case SKILL.BOMBER:
        if (this.bombTicks === null) {
          this.bombTicks = 250; // 5 seconds at 50fps
          return true;
        }
        return false;
      case SKILL.BLOCKER:
        if (this.state === STATE.WALKER) {
          this.state = STATE.BLOCKER;
          return true;
        }
        return false;
      case SKILL.BUILDER:
        if (this.state === STATE.WALKER) {
          this.state = STATE.BUILDER;
          this.builderSteps = 0;
          return true;
        }
        return false;
      case SKILL.BASHER:
        if (this.state === STATE.WALKER) {
          this.state = STATE.BASHER;
          return true;
        }
        return false;
      case SKILL.MINER:
        if (this.state === STATE.WALKER) {
          this.state = STATE.MINER;
          return true;
        }
        return false;
      case SKILL.DIGGER:
        if (this.state === STATE.WALKER) {
          this.state = STATE.DIGGER;
          return true;
        }
        return false;
    }
    return false;
  }

  update(terrain, blockers = []) {
    if (this.isRemoved || this.state === STATE.DEAD || this.state === STATE.EXITED) {
      return;
    }

    this.frame++;

    // Hazard checks (water, lava, exit)
    if (terrain.isExit(this.x, this.y)) {
      this.state = STATE.EXITED;
      this.isRemoved = true;
      return;
    }
    const matAtFeet = terrain.getMaterial(this.x, this.y);
    if (matAtFeet === 3) { // Water
      this.state = STATE.DROWN;
      this.isRemoved = true;
      return;
    }
    if (matAtFeet === 4) { // Lava
      this.state = STATE.BURN;
      this.isRemoved = true;
      return;
    }

    // Bomb countdown check
    if (this.bombTicks !== null) {
      this.bombTicks--;
      if (this.bombTicks <= 0) {
        this.state = STATE.DEAD;
        this.isRemoved = true;
        this.justExploded = true;
        terrain.carveCircle(this.x, this.y - 4, 16);
        return;
      }
    }

    // Check blockers
    if (this.state === STATE.WALKER) {
      for (const blocker of blockers) {
        if (blocker !== this && blocker.state === STATE.BLOCKER) {
          const dx = this.x - blocker.x;
          // Blocker boundary: ~8px
          if (this.dir === 1 && dx > -8 && dx < 0 && Math.abs(this.y - blocker.y) <= 4) {
            this.dir = -1;
            break;
          } else if (this.dir === -1 && dx < 8 && dx > 0 && Math.abs(this.y - blocker.y) <= 4) {
            this.dir = 1;
            break;
          }
        }
      }
    }

    switch (this.state) {
      case STATE.WALKER:
        this.updateWalker(terrain);
        break;
      case STATE.FALLER:
        this.updateFaller(terrain);
        break;
      case STATE.FLOATER:
        this.updateFloater(terrain);
        break;
      case STATE.CLIMBER:
        this.updateClimber(terrain);
        break;
      case STATE.BUILDER:
        this.updateBuilder(terrain);
        break;
      case STATE.BASHER:
        this.updateBasher(terrain);
        break;
      case STATE.MINER:
        this.updateMiner(terrain);
        break;
      case STATE.DIGGER:
        this.updateDigger(terrain);
        break;
      case STATE.BLOCKER:
        // Blocker does not move
        break;
      case STATE.SPLAT:
      case STATE.DEAD:
        this.isRemoved = true;
        break;
    }
  }

  updateWalker(terrain) {
    // Check if there is ground underneath
    if (!terrain.isSolid(this.x, this.y + 1)) {
      this.state = STATE.FALLER;
      this.fallDistance = 0;
      return;
    }

    const nextX = this.x + this.dir;

    // Check obstacles at nextX
    // A slope can be stepped up if height is <= 3px
    let stepUp = 0;
    while (stepUp <= 3 && terrain.isSolid(nextX, this.y - stepUp)) {
      stepUp++;
    }

    if (stepUp <= 3) {
      // Check head clearance at new position
      let headClear = true;
      for (let h = 1; h < this.height; h++) {
        if (terrain.isSolid(nextX, this.y - stepUp - h)) {
          headClear = false;
          break;
        }
      }

      if (headClear) {
        this.x = nextX;
        this.y = this.y - stepUp;

        // Check if ground slopes downward gently (1-2px)
        if (!terrain.isSolid(this.x, this.y + 1)) {
          if (terrain.isSolid(this.x, this.y + 2)) {
            this.y += 1;
          } else if (terrain.isSolid(this.x, this.y + 3)) {
            this.y += 2;
          }
        }
        return;
      }
    }

    // Hit a wall!
    if (this.isClimber) {
      this.state = STATE.CLIMBER;
    } else {
      this.dir = -this.dir;
    }
  }

  updateFaller(terrain) {
    const fallSpeed = 2; // normal fall speed
    for (let s = 0; s < fallSpeed; s++) {
      if (terrain.isSolid(this.x, this.y + 1)) {
        // Landed!
        if (this.fallDistance > this.maxSafeFall) {
          this.state = STATE.SPLAT;
          this.isRemoved = true;
        } else {
          this.state = STATE.WALKER;
          this.fallDistance = 0;
        }
        return;
      }
      this.y += 1;
      this.fallDistance += 1;

      // If floater and fallen a few pixels, switch to floater
      if (this.isFloater && this.fallDistance >= 12) {
        this.state = STATE.FLOATER;
        return;
      }
    }
  }

  updateFloater(terrain) {
    // Slow descent (1 pixel per 2 frames or 1px per frame)
    if (terrain.isSolid(this.x, this.y + 1)) {
      this.state = STATE.WALKER;
      this.fallDistance = 0;
      return;
    }
    this.y += 1;
  }

  updateClimber(terrain) {
    // Climbs straight up the wall
    const wallX = this.x + this.dir;
    // Check ceiling right above head
    if (terrain.isSolid(this.x, this.y - this.height)) {
      // Bonked ceiling! Fall back safely
      this.dir = -this.dir;
      this.state = STATE.FALLER;
      this.fallDistance = 0;
      return;
    }

    // Climb up 1px
    this.y -= 1;

    // Check if we reached the top of the wall (air at wallX at waist height)
    if (!terrain.isSolid(wallX, this.y)) {
      // Hoist onto ledge
      this.x = wallX;
      this.state = STATE.WALKER;
    }
  }

  updateBuilder(terrain) {
    // Builds up to 12 steps
    if (this.builderSteps >= 12) {
      this.state = STATE.WALKER;
      return;
    }

    const nextX = this.x + this.dir;
    const nextY = this.y - 1;

    // Check if hitting wall or ceiling
    if (terrain.isSolid(nextX, nextY) || terrain.isSolid(this.x, this.y - this.height)) {
      // Stopped by obstacle, turn around
      this.dir = -this.dir;
      this.state = STATE.WALKER;
      return;
    }

    // Place step
    terrain.addStep(nextX, this.y, 2, 1);
    this.x = nextX;
    this.y = nextY;
    this.builderSteps++;
  }

  updateBasher(terrain) {
    const carveX = this.dir > 0 ? this.x : this.x - 8;
    const carved = terrain.carveRect(carveX, this.y - 10, 8, 11);

    // Advance 1 pixel forward
    this.x += this.dir;

    // Check if there is still solid terrain ahead in the bash zone
    const checkX = this.x + this.dir * 3;
    let solidAhead = false;
    let steelAhead = false;
    for (let dy = 0; dy <= 10; dy++) {
      const mat = terrain.getMaterial(checkX, this.y - dy);
      if (mat === 2) { // STEEL
        steelAhead = true;
      } else if (mat === 1) { // EARTH
        solidAhead = true;
      }
    }

    if (steelAhead) {
      // Cannot penetrate steel
      this.state = STATE.WALKER;
      return;
    }

    // If completely broke through (no solid ahead and ground is beneath), resume walking
    if (!solidAhead && carved === 0) {
      this.state = STATE.WALKER;
    }
  }

  updateMiner(terrain) {
    const nextX = this.x + this.dir;
    const nextY = this.y + 1;

    // Check if hitting indestructible steel
    for (let dy = 0; dy <= 8; dy++) {
      if (terrain.getMaterial(nextX + this.dir * 2, nextY - dy) === 2) { // STEEL
        this.state = STATE.WALKER;
        return;
      }
    }

    // Dig diagonally down-forward (45 deg)
    const carved = terrain.carveRect(this.dir > 0 ? this.x : this.x - 6, this.y - 6, 8, 10);
    this.x = nextX;
    this.y = nextY;
    if (carved === 0 && !terrain.isSolid(this.x, this.y + 1)) {
      this.state = STATE.FALLER;
    }
  }

  updateDigger(terrain) {
    // Check steel below
    if (terrain.getMaterial(this.x, this.y + 1) === 2 || terrain.getMaterial(this.x, this.y + 2) === 2) {
      this.state = STATE.WALKER;
      return;
    }

    // Carve 6px wide, 2px high slice below feet
    const carved = terrain.carveRect(this.x - 3, this.y + 1, 6, 2);
    this.y += 1;

    // Check if broken through into open air below
    let solidBelow = false;
    for (let dy = 1; dy <= 4; dy++) {
      if (terrain.isSolid(this.x, this.y + dy)) {
        solidBelow = true;
        break;
      }
    }

    if (!solidBelow && carved === 0) {
      this.state = STATE.FALLER;
    }
  }
}
