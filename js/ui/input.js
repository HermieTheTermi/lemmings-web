import { SKILL } from '../engine/lemming.js';

export class InputController {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;

    // Gesture tracking state
    this.pointers = new Map();
    this.touchStartPos = { x: 0, y: 0 };
    this.touchStartTime = 0;
    this.isDragging = false;
    this.initialPinchDist = 0;
    this.initialPinchZoom = 1;

    this.initPointerEvents();
    this.initKeyboardEvents();
  }

  initPointerEvents() {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
  }

  onPointerDown(e) {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1) {
      this.touchStartPos = { x: e.clientX, y: e.clientY };
      this.touchStartTime = performance.now();
      this.isDragging = false;
    } else if (this.pointers.size === 2) {
      // Start pinch
      const pts = Array.from(this.pointers.values());
      this.initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.initialPinchZoom = this.game.renderer.camera.zoom;
    }
  }

  onPointerMove(e) {
    if (!this.pointers.has(e.pointerId)) {
      // Hover detection on mouse
      this.handleHover(e.clientX, e.clientY);
      return;
    }

    const prev = this.pointers.get(e.pointerId);
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1) {
      const distFromStart = Math.hypot(e.clientX - this.touchStartPos.x, e.clientY - this.touchStartPos.y);
      if (distFromStart > 8) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        const cam = this.game.renderer.camera;
        cam.x -= dx / cam.zoom;
        cam.y -= dy / cam.zoom;
        this.game.renderer.clampCamera(this.game.level);
      }
    } else if (this.pointers.size === 2) {
      const pts = Array.from(this.pointers.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.initialPinchDist > 0) {
        const factor = currentDist / this.initialPinchDist;
        const newZoom = Math.min(3.0, Math.max(0.8, this.initialPinchZoom * factor));
        this.game.renderer.camera.zoom = newZoom;
        this.game.renderer.clampCamera(this.game.level);
      }
    }
  }

  onPointerUp(e) {
    if (this.pointers.has(e.pointerId)) {
      this.pointers.delete(e.pointerId);
    }

    // Single tap detection
    if (this.pointers.size === 0) {
      const duration = performance.now() - this.touchStartTime;
      const dist = Math.hypot(e.clientX - this.touchStartPos.x, e.clientY - this.touchStartPos.y);

      if (!this.isDragging && dist < 12 && duration < 400) {
        this.handleTap(e.clientX, e.clientY);
      }
      if (this.isDragging) {
        this.game.renderer.isUserPanning = false;
        this.game.renderer.userPanCooldown = 90;
      }
      this.isDragging = false;
    }
  }

  onWheel(e) {
    e.preventDefault();
    const cam = this.game.renderer.camera;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(3.5, Math.max(1.0, cam.zoom * zoomFactor));
    cam.zoom = newZoom;
    this.game.renderer.clampCamera(this.game.level);
  }

  handleHover(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const world = this.game.renderer.screenToWorld(screenX, screenY);

    const lem = this.findLemmingAt(world.x, world.y, 16);
    this.game.renderer.highlightedLemming = lem;
  }

  handleTap(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const world = this.game.renderer.screenToWorld(screenX, screenY);

    // Touch hit radius: 24px (generous thumb targeting)
    const hitLemming = this.findLemmingAt(world.x, world.y, 24);

    if (hitLemming) {
      this.game.renderer.addTapFeedback(screenX, screenY, 'hit');
      const selectedSkill = this.game.hud.selectedSkill;
      if (selectedSkill) {
        const assigned = this.game.level.assignSkillToLemming(hitLemming, selectedSkill);
        if (assigned) {
          this.game.sound.playAssign();
          this.game.hud.update(this.game.level);
        }
      }
    } else {
      // Missed tap feedback: pulse ring at tap position
      this.game.renderer.addTapFeedback(screenX, screenY, 'miss');
    }
  }

  findLemmingAt(worldX, worldY, maxDist = 20) {
    let closest = null;
    let closestDist = maxDist * maxDist;

    for (const lem of this.game.level.lemmings) {
      if (lem.isRemoved) continue;
      const dx = lem.x - worldX;
      const dy = (lem.y - 5) - worldY; // center of lemming body
      const d2 = dx * dx + dy * dy;
      if (d2 < closestDist) {
        closestDist = d2;
        closest = lem;
      }
    }
    return closest;
  }

  initKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // Skill keys: 1 - 8
      const skillMap = {
        '1': SKILL.CLIMBER,
        '2': SKILL.FLOATER,
        '3': SKILL.BOMBER,
        '4': SKILL.BLOCKER,
        '5': SKILL.BUILDER,
        '6': SKILL.BASHER,
        '7': SKILL.MINER,
        '8': SKILL.DIGGER,
      };

      if (skillMap[e.key]) {
        this.game.hud.selectSkill(skillMap[e.key]);
        this.game.sound.playSelect();
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyP':
          this.game.togglePause();
          this.game.hud.updateControls();
          break;
        case 'KeyF':
          this.game.toggleFastForward();
          this.game.hud.updateControls();
          break;
        case 'KeyR':
          this.game.restartLevel();
          break;
        case 'KeyM':
          this.game.sound.muted = !this.game.sound.muted;
          this.game.hud.btnMute.classList.toggle('active', this.game.sound.muted);
          this.game.hud.btnMute.textContent = this.game.sound.muted ? 'Stumm' : 'Ton';
          break;
        case 'Escape':
          this.game.hud.showLevelSelect();
          break;
        case 'Equal':
        case 'NumpadAdd':
          this.game.renderer.camera.zoom = Math.min(3.0, this.game.renderer.camera.zoom * 1.2);
          this.game.renderer.clampCamera(this.game.level);
          break;
        case 'Minus':
        case 'NumpadSubtract':
          this.game.renderer.camera.zoom = Math.max(0.8, this.game.renderer.camera.zoom / 1.2);
          this.game.renderer.clampCamera(this.game.level);
          break;
      }
    });
  }
}
