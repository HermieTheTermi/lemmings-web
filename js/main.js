import { Level } from './engine/level.js';
import { LEVELS } from './engine/levels-data.js';
import { Renderer } from './graphics/renderer.js';
import { SoundSystem } from './audio/sound.js';
import { HUD } from './ui/hud.js';
import { InputController } from './ui/input.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('viewport-container');

    this.sound = new SoundSystem();
    this.renderer = new Renderer(this.canvas);
    this.hud = new HUD(this);
    this.input = new InputController(this);

    this.currentLevelIndex = 0;
    this.level = null;

    this.speedMultiplier = 1;
    this.lastTime = 0;
    this.accumulator = 0;
    this.tickRate = 1000 / 50; // 50 ticks per second (20ms)

    // Performance tracking
    this.frameTimes = [];
    this.maxFrameSamples = 120;

    this.initResize();
    this.loadLevel(0);
    this.registerServiceWorker();

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initResize() {
    const handleResize = () => {
      const rect = this.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.renderer.resize(Math.floor(rect.width), Math.floor(rect.height));
      if (this.level) {
        this.renderer.clampCamera(this.level);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });
    handleResize();
  }

  loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    this.currentLevelIndex = index;
    const config = LEVELS[index];

    this.level = new Level(config);
    this.speedMultiplier = 1;

    this.renderer.initTerrainCanvas(this.level);
    this.hud.hideModals();
    this.hud.selectedSkill = null;
    this.hud.updateSkillSelection();
    this.hud.updateControls();
    this.hud.update(this.level);
  }

  restartLevel() {
    this.loadLevel(this.currentLevelIndex);
  }

  nextLevel() {
    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.loadLevel(this.currentLevelIndex + 1);
    } else {
      // Loop back or open level select
      this.hud.showLevelSelect();
    }
  }

  togglePause() {
    if (!this.level) return;
    this.level.paused = !this.level.paused;
    this.hud.updateControls();
  }

  toggleFastForward() {
    this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
    this.hud.updateControls();
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const frameDuration = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Track frame render times for performance benchmarking
    if (this.frameTimes.length >= this.maxFrameSamples) {
      this.frameTimes.shift();
    }
    this.frameTimes.push(frameDuration);

    // Fixed timestep physics update
    const delta = Math.min(frameDuration, 100); // cap max lag spike
    this.accumulator += delta;

    const effectiveTickRate = this.tickRate / this.speedMultiplier;

    while (this.accumulator >= effectiveTickRate) {
      if (this.level && !this.level.paused) {
        this.level.update();
      }
      this.accumulator -= effectiveTickRate;
    }

    // Render frame
    if (this.level) {
      this.renderer.render(this.level);
      this.hud.update(this.level);
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('SW registration info:', err.message);
      });
    }
  }

  // Performance benchmark helper
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
}

// Instantiate game reliably regardless of document readyState
function initGame() {
  if (!window.__lemmingsGame) {
    const game = new Game();
    window.__lemmingsGame = game;
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
