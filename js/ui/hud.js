import { SKILL } from '../engine/lemming.js';
import { LEVELS } from '../engine/levels-data.js';

export class HUD {
  constructor(game) {
    this.game = game;
    this.selectedSkill = null;

    // DOM Elements
    this.levelTitle = document.getElementById('hud-level-title');
    this.levelSub = document.getElementById('hud-level-sub');
    this.savedEl = document.getElementById('hud-saved');
    this.timeEl = document.getElementById('hud-time');
    this.activeEl = document.getElementById('hud-active');
    this.timeProgressFill = document.getElementById('time-progress-fill');

    this.btnPause = document.getElementById('btn-pause');
    this.btnFast = document.getElementById('btn-fast');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnMenu = document.getElementById('btn-menu');
    this.btnMute = document.getElementById('btn-mute');

    this.skillsBar = document.getElementById('skills-bar');
    this.skillButtons = {};

    // Modals
    this.modalVictory = document.getElementById('modal-victory');
    this.modalDefeat = document.getElementById('modal-defeat');
    this.modalLevels = document.getElementById('modal-levels');

    this.initSkillButtons();
    this.initControlButtons();
    this.initModals();
  }

  initSkillButtons() {
    const skills = [
      SKILL.CLIMBER,
      SKILL.FLOATER,
      SKILL.BOMBER,
      SKILL.BLOCKER,
      SKILL.BUILDER,
      SKILL.BASHER,
      SKILL.MINER,
      SKILL.DIGGER,
    ];

    skills.forEach((skill) => {
      const btn = document.getElementById(`btn-${skill.toLowerCase()}`);
      const countEl = document.getElementById(`count-${skill.toLowerCase()}`);
      if (btn) {
        this.skillButtons[skill] = { btn, countEl };
        btn.addEventListener('click', () => {
          this.selectSkill(skill);
          this.game.sound.playSelect();
        });
      }
    });
  }

  initControlButtons() {
    this.btnPause.addEventListener('click', () => {
      this.game.togglePause();
      this.updateControls();
    });

    this.btnFast.addEventListener('click', () => {
      this.game.toggleFastForward();
      this.updateControls();
    });

    this.btnRestart.addEventListener('click', () => {
      this.game.restartLevel();
    });

    this.btnMenu.addEventListener('click', () => {
      this.showLevelSelect();
    });

    this.btnMute.addEventListener('click', () => {
      this.game.sound.muted = !this.game.sound.muted;
      this.btnMute.classList.toggle('active', this.game.sound.muted);
      this.btnMute.textContent = this.game.sound.muted ? 'Stumm' : 'Ton';
    });
  }

  initModals() {
    // Victory modal
    document.getElementById('btn-victory-replay').addEventListener('click', () => {
      this.modalVictory.classList.add('hidden');
      this.game.restartLevel();
    });
    document.getElementById('btn-victory-next').addEventListener('click', () => {
      this.modalVictory.classList.add('hidden');
      this.game.nextLevel();
    });

    // Defeat modal
    document.getElementById('btn-defeat-retry').addEventListener('click', () => {
      this.modalDefeat.classList.add('hidden');
      this.game.restartLevel();
    });
    document.getElementById('btn-defeat-menu').addEventListener('click', () => {
      this.modalDefeat.classList.add('hidden');
      this.showLevelSelect();
    });

    // Level select modal
    document.getElementById('btn-levels-close').addEventListener('click', () => {
      this.modalLevels.classList.add('hidden');
    });
  }

  hideModals() {
    if (this.modalVictory) this.modalVictory.classList.add('hidden');
    if (this.modalDefeat) this.modalDefeat.classList.add('hidden');
    if (this.modalLevels) this.modalLevels.classList.add('hidden');
  }

  selectSkill(skill) {
    if (this.selectedSkill === skill) {
      // Toggle off if already selected
      this.selectedSkill = null;
    } else {
      this.selectedSkill = skill;
    }
    this.updateSkillSelection();
  }

  updateSkillSelection() {
    for (const [skill, entry] of Object.entries(this.skillButtons)) {
      if (skill === this.selectedSkill) {
        entry.btn.classList.add('selected');
      } else {
        entry.btn.classList.remove('selected');
      }
    }
  }

  updateControls() {
    this.btnPause.classList.toggle('active', this.game.level.paused);
    this.btnPause.textContent = this.game.level.paused ? 'Weiter' : 'Pause';
    this.btnFast.classList.toggle('active', this.game.speedMultiplier > 1);
  }

  update(level) {
    // 1. Update Header Info
    this.levelTitle.textContent = `${level.config.name}`;
    this.levelSub.textContent = level.config.subtitle || '';

    // Saved count
    this.savedEl.textContent = `${level.rescuedCount} / ${level.neededToRescue}`;

    // Time remaining (mm:ss)
    const mins = Math.floor(level.remainingSeconds / 60);
    const secs = level.remainingSeconds % 60;
    this.timeEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // Update Time Progress Bar
    if (this.timeProgressFill && level.config && level.config.timeLimit) {
      const frac = Math.max(0, Math.min(1, level.remainingSeconds / level.config.timeLimit));
      this.timeProgressFill.style.width = `${(frac * 100).toFixed(1)}%`;
      if (frac > 0.45) {
        this.timeProgressFill.style.backgroundColor = '#10b981'; // Green
      } else if (frac > 0.20) {
        this.timeProgressFill.style.backgroundColor = '#f59e0b'; // Amber
      } else {
        this.timeProgressFill.style.backgroundColor = '#ef4444'; // Red alert
      }
    }

    // Active lemmings count
    const active = level.lemmings.filter(l => !l.isRemoved).length;
    this.activeEl.textContent = `${active} / ${level.totalLemmings}`;

    // 2. Update Skill Buttons
    for (const [skill, entry] of Object.entries(this.skillButtons)) {
      const budget = level.skillsBudget[skill] || 0;
      entry.countEl.textContent = budget.toString();

      if (budget <= 0) {
        entry.btn.classList.add('disabled');
        if (this.selectedSkill === skill) {
          this.selectedSkill = null;
          this.updateSkillSelection();
        }
      } else {
        entry.btn.classList.remove('disabled');
      }
    }

    // 3. Handle Game Status Modals
    if (level.status === 'VICTORY' && this.modalVictory.classList.contains('hidden')) {
      this.showVictory(level);
    } else if (level.status === 'DEFEAT' && this.modalDefeat.classList.contains('hidden')) {
      this.showDefeat(level);
    }
  }

  showVictory(level) {
    const textEl = document.getElementById('modal-victory-text');
    const percent = Math.round((level.rescuedCount / level.totalLemmings) * 100);
    textEl.textContent = `${level.rescuedCount} von ${level.totalLemmings} Lemmings gerettet (${percent}%). Benötigt waren ${level.neededToRescue}. Hervorragende Rettung!`;
    this.modalVictory.classList.remove('hidden');
    this.game.sound.playWin();

    // Unlock next level in localStorage
    const currentUnlocked = parseInt(localStorage.getItem('lemmings_unlocked') || '1', 10);
    if (level.id >= currentUnlocked && level.id < 6) {
      localStorage.setItem('lemmings_unlocked', (level.id + 1).toString());
    }
  }

  showDefeat(level) {
    const textEl = document.getElementById('modal-defeat-text');
    textEl.textContent = `Nur ${level.rescuedCount} von ${level.neededToRescue} benötigten Lemmings haben das Ziel erreicht. Versuch es noch einmal!`;
    this.modalDefeat.classList.remove('hidden');
    this.game.sound.playLose();
  }

  showLevelSelect() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';

    const unlocked = parseInt(localStorage.getItem('lemmings_unlocked') || '1', 10);

    LEVELS.forEach((lvl) => {
      const isLocked = lvl.id > unlocked;
      const card = document.createElement('button');
      card.className = `level-card-btn ${isLocked ? 'locked' : ''}`;
      card.innerHTML = `
        <span class="level-card-num">${lvl.id}. Level ${isLocked ? '🔒' : ''}</span>
        <span class="level-card-name">${lvl.name}</span>
      `;
      if (!isLocked) {
        card.addEventListener('click', () => {
          this.modalLevels.classList.add('hidden');
          this.game.loadLevel(lvl.id - 1);
        });
      }
      grid.appendChild(card);
    });

    this.modalLevels.classList.remove('hidden');
  }
}
