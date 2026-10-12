/**
 * Web Audio API Sound Synthesizer.
 * Generates all sound effects mathematically without any external audio files.
 */

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensureContext() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'square', gainLevel = 0.1) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay restrictions or context error
    }
  }

  playNoise(duration, gainLevel = 0.15) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Audio error
    }
  }

  playSelect() {
    this.playTone(660, 0.06, 'triangle', 0.12);
  }

  playAssign() {
    this.playTone(523.25, 0.08, 'square', 0.1);
    setTimeout(() => this.playTone(659.25, 0.08, 'square', 0.1), 80);
  }

  playDig() {
    this.playNoise(0.08, 0.1);
  }

  playBuild() {
    this.playTone(330, 0.06, 'sine', 0.15);
  }

  playChime() {
    this.playTone(880, 0.15, 'triangle', 0.15);
  }

  playExplode() {
    this.playNoise(0.4, 0.3);
    this.playTone(110, 0.35, 'sawtooth', 0.2);
  }

  playSplat() {
    this.playTone(180, 0.1, 'sawtooth', 0.15);
    this.playNoise(0.12, 0.15);
  }

  playYippee() {
    // Joyful ascending chirp
    this.playTone(523, 0.06, 'square', 0.1);
    setTimeout(() => this.playTone(659, 0.06, 'square', 0.1), 60);
    setTimeout(() => this.playTone(784, 0.1, 'square', 0.12), 120);
  }

  playWin() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.18, 'triangle', 0.2), idx * 120);
    });
  }

  playLose() {
    const notes = [440, 392, 349, 311];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sawtooth', 0.15), idx * 150);
    });
  }
}
