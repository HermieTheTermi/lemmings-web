/**
 * Procedural high-resolution vector sprite rendering (2x Retina scale).
 * Handcrafted 2D vector-feel using Canvas 2D paths, gradients and specular highlights.
 * All graphics are drawn procedurally avoiding any external assets or build steps.
 */

export class SpriteManager {
  constructor() {
    this.sprites = this;
    this.initSprites();
  }

  createCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    }
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }

  initSprites() {
    // 1. Walker: 8 frames (24x24) - smooth walking cycle with swinging arms & hair
    this.sprites.walker = [];
    for (let f = 0; f < 8; f++) {
      const c = this.createCanvas(24, 24);
      const ctx = c.getContext('2d');
      this.drawWalkerFrame(ctx, f);
      this.sprites.walker.push(c);
    }

    // 2. Faller: 4 frames (24x24) - wind-blown hair, flapping robe, flailing arms
    this.sprites.faller = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(24, 24);
      const ctx = c.getContext('2d');
      this.drawFallerFrame(ctx, f);
      this.sprites.faller.push(c);
    }

    // 3. Floater: 4 frames (32x40) - radiant parachute canopy with striped panels & swaying lemming
    this.sprites.floater = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(32, 40);
      const ctx = c.getContext('2d');
      this.drawFloaterFrame(ctx, f);
      this.sprites.floater.push(c);
    }

    // 4. Climber: 4 frames (24x24) - athletic wall grasp, climbing feet and upward focus
    this.sprites.climber = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(24, 24);
      const ctx = c.getContext('2d');
      this.drawClimberFrame(ctx, f);
      this.sprites.climber.push(c);
    }

    // 5. Blocker: 4 frames (32x24) - authoritative stance, outstretched palms with warning aura
    this.sprites.blocker = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(32, 24);
      const ctx = c.getContext('2d');
      this.drawBlockerFrame(ctx, f);
      this.sprites.blocker.push(c);
    }

    // 6. Builder: 4 frames (28x24) - bricklayer placing hewn wooden steps with trowel
    this.sprites.builder = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(28, 24);
      const ctx = c.getContext('2d');
      this.drawBuilderFrame(ctx, f);
      this.sprites.builder.push(c);
    }

    // 7. Basher: 4 frames (32x24) - horizontal pickaxe strike with metal gleam
    this.sprites.basher = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(32, 24);
      const ctx = c.getContext('2d');
      this.drawBasherFrame(ctx, f);
      this.sprites.basher.push(c);
    }

    // 8. Miner: 4 frames (32x28) - 45-degree diagonal mining stroke into bedrock
    this.sprites.miner = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(32, 28);
      const ctx = c.getContext('2d');
      this.drawMinerFrame(ctx, f);
      this.sprites.miner.push(c);
    }

    // 9. Digger: 4 frames (28x28) - vigorous vertical plunge with spade & soil spray
    this.sprites.digger = [];
    for (let f = 0; f < 4; f++) {
      const c = this.createCanvas(28, 28);
      const ctx = c.getContext('2d');
      this.drawDiggerFrame(ctx, f);
      this.sprites.digger.push(c);
    }

    // 10. Splat: 2 frames (32x16) - pancake comic landing with dazed spinning stars
    this.sprites.splat = [];
    for (let f = 0; f < 2; f++) {
      const c = this.createCanvas(32, 16);
      const ctx = c.getContext('2d');
      this.drawSplatFrame(ctx, f);
      this.sprites.splat.push(c);
    }

    // 11. Exit Portal: 4 frames (72x88) - ancient runic arch with glowing vortex core
    this.sprites.exitPortal = [];
    for (let f = 0; f < 4; f++) {
      this.sprites.exitPortal.push(this.createExitPortalSprite(f));
    }

    // 12. Hatch / Trapdoor: 3 frames (72x48) - steel ceiling trapdoor with chains & wooden flap
    this.sprites.hatch = [];
    for (let f = 0; f < 3; f++) {
      this.sprites.hatch.push(this.createHatchSprite(f));
    }

    // 13. Status Badges: 20x20 overhead icons
    this.sprites.badges = {
      climber: this.createBadgeClimber(),
      floater: this.createBadgeFloater(),
      blocker: this.createBadgeBlocker(),
    };
  }

  drawLemmingColors() {
    return {
      hair: '#9333ea',          // Sattes Violett/Magenta
      hairHighlight: '#f0abfc', // Glanzsträhne
      hairOutline: '#581c87',   // Tiefe Kontur
      robeGradTop: '#22c55e',   // Heller Stoffverlauf oben
      robeGradBot: '#15803d',   // Schattierter Saum unten
      robeOutline: '#0f4a21',   // Robenkontur
      skin: '#fed7aa',          // Warmer Pfirsichton
      skinShadow: '#fdba74',    // Wange
      shoe: '#451a03',          // Lederstiefel
      shoeHighlight: '#78350f', // Schnalle
    };
  }

  // Draw smooth shared lemming torso & head at (cx, cy)
  drawBaseBody(ctx, cx, cy, col, robeW = 7, robeH = 9) {
    // 1. Shaded Robe with vertical gradient
    const robeGrad = ctx.createLinearGradient(cx, cy - robeH, cx, cy);
    robeGrad.addColorStop(0, col.robeGradTop);
    robeGrad.addColorStop(1, col.robeGradBot);

    ctx.fillStyle = robeGrad;
    ctx.strokeStyle = col.robeOutline;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(cx - robeW * 0.5, cy - robeH * 0.4);
    ctx.quadraticCurveTo(cx - robeW * 0.6, cy, cx - robeW * 0.45, cy);
    ctx.lineTo(cx + robeW * 0.45, cy);
    ctx.quadraticCurveTo(cx + robeW * 0.6, cy, cx + robeW * 0.5, cy - robeH * 0.4);
    ctx.quadraticCurveTo(cx, cy - robeH - 1, cx - robeW * 0.5, cy - robeH * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Robe Fold Highlight
    ctx.strokeStyle = 'rgba(134, 239, 172, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - robeH * 0.8);
    ctx.lineTo(cx - 1, cy - 2);
    ctx.stroke();

    // 2. Head & Warm Peach Face
    const headY = cy - robeH - 3;
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(cx, headY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Eye Dot
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx + 1.2, headY - 0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Voluminous Amiga Hair Tuft with Gloss Highlight
    ctx.fillStyle = col.hair;
    ctx.strokeStyle = col.hairOutline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 3.5, headY - 1);
    ctx.quadraticCurveTo(cx - 4.5, headY - 6.5, cx, headY - 6.5);
    ctx.quadraticCurveTo(cx + 4.5, headY - 6.5, cx + 3.5, headY - 1);
    ctx.quadraticCurveTo(cx, headY - 3, cx - 3.5, headY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy hair highlight
    ctx.fillStyle = col.hairHighlight;
    ctx.beginPath();
    ctx.ellipse(cx - 0.5, headY - 4.8, 2.2, 1.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWalkerFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 12;
    const cy = 19;
    const legPhase = (frame / 8) * Math.PI * 2;
    const leftOffset = Math.sin(legPhase) * 3.5;
    const rightOffset = -leftOffset;
    const bob = Math.abs(Math.sin(legPhase)) * 1.0;

    // Feet with swinging motion
    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx - 2 + leftOffset, cy + 1, 2.2, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2 + rightOffset, cy + 1, 2.2, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lemming Body & Head
    this.drawBaseBody(ctx, cx, cy - bob, col);

    // Swinging arm
    const armSwing = Math.cos(legPhase) * 2.5;
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(cx + armSwing, cy - 6 - bob, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFallerFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 12;
    const cy = 19;
    const armWave = (frame % 2 === 0) ? -2.5 : 2.5;

    // Dangling flutter feet
    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy + 1, 2.0, 1.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + 1, 2.0, 1.2, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    this.drawBaseBody(ctx, cx, cy, col);

    // Flailing arms upward into headwind
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(cx - 4.5, cy - 10 + armWave, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4.5, cy - 10 - armWave, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFloaterFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 16;
    const umbrellaY = 12;

    // 1. Radiant Striped Parachute Canopy
    // Gold/Amber canopy
    const canopyGrad = ctx.createRadialGradient(cx, umbrellaY, 2, cx, umbrellaY, 13);
    canopyGrad.addColorStop(0, '#fef08a');
    canopyGrad.addColorStop(0.4, '#f59e0b');
    canopyGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = canopyGrad;

    ctx.beginPath();
    ctx.arc(cx, umbrellaY, 12, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // Red contrast accent stripes
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(cx - 3, umbrellaY - 11.5);
    ctx.lineTo(cx + 3, umbrellaY - 11.5);
    ctx.lineTo(cx + 2, umbrellaY);
    ctx.lineTo(cx - 2, umbrellaY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - 10, umbrellaY - 6);
    ctx.lineTo(cx - 8, umbrellaY - 8);
    ctx.lineTo(cx - 6, umbrellaY);
    ctx.lineTo(cx - 8, umbrellaY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 10, umbrellaY - 6);
    ctx.lineTo(cx + 8, umbrellaY - 8);
    ctx.lineTo(cx + 6, umbrellaY);
    ctx.lineTo(cx + 8, umbrellaY);
    ctx.closePath();
    ctx.fill();

    // 2. Parachute Harness lines & brass shaft
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, umbrellaY);
    ctx.lineTo(cx, umbrellaY + 14);
    ctx.moveTo(cx + 10, umbrellaY);
    ctx.lineTo(cx, umbrellaY + 14);
    ctx.moveTo(cx, umbrellaY);
    ctx.lineTo(cx, umbrellaY + 14);
    ctx.stroke();

    // 3. Dangling Lemming with gentle pendular sway
    const sway = Math.sin((frame / 4) * Math.PI * 2) * 1.5;
    const lemX = cx + sway;
    const lemY = 32;

    // Gripping hands on central handle
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(lemX, umbrellaY + 14, 2.0, 0, Math.PI * 2);
    ctx.fill();

    this.drawBaseBody(ctx, lemX, lemY, col);

    // Dangling feet
    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(lemX - 2, lemY + 1, 2.0, 1.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(lemX + 2, lemY + 1, 2.0, 1.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClimberFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 12;
    const cy = 19;
    const climbShift = (frame % 2 === 0) ? -2.5 : 2.5;

    // Body leaning close to rock wall
    this.drawBaseBody(ctx, cx, cy, col);

    // Hands gripping the rock wall ahead
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 12 + climbShift, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 6 - climbShift, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Feet pressed against vertical rock face
    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy - climbShift, 2.2, 1.4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 1, 2.2, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBlockerFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 16;
    const cy = 19;
    const pulse = Math.sin((frame / 4) * Math.PI * 2) * 1.5;

    // Wide anchored stance
    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy + 1, 2.8, 1.6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy + 1, 2.8, 1.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Body with broad chest
    this.drawBaseBody(ctx, cx, cy, col, 9, 9);

    // Outstretched warning arms
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(cx - 9, cy - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 9, cy - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Glowing STOP palms with pulsating red/amber aura
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx - 9.5, cy - 6, 3.0 + pulse * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 9.5, cy - 6, 3.0 + pulse * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 9.5, cy - 6, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 9.5, cy - 6, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBuilderFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 12;
    const cy = 19;
    const stepBob = (frame % 2 === 0) ? -1 : 1;

    // Feet stepping up onto ramp
    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 1, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy - 2, 2.4, 1.4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body leaning forward
    this.drawBaseBody(ctx, cx, cy, col);

    // Hewn wooden plank / brick step in hands
    const plankX = cx + 4;
    const plankY = cy - 6 + stepBob;
    ctx.fillStyle = '#92400e'; // Warm wood grain
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.fillRect(plankX, plankY, 7, 4);
    ctx.strokeRect(plankX, plankY, 7, 4);

    // Wood highlight edge
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(plankX, plankY, 7, 1);

    // Hands holding plank
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(plankX + 1, plankY + 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBasherFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 12;
    const cy = 19;
    const swingPhase = (frame % 4) / 4;
    const pickAngle = -0.6 + swingPhase * 1.4;

    // Walking stance
    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 1, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 1, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawBaseBody(ctx, cx, cy, col);

    // Swinging heavy steel pickaxe
    ctx.save();
    ctx.translate(cx + 3, cy - 6);
    ctx.rotate(pickAngle);

    // Wooden shaft
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-1, -10, 2, 12);

    // Heavy forged pickaxe head
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(6, -10);
    ctx.lineTo(5, -7);
    ctx.lineTo(-4, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Specular steel glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, -10, 2, 1.5);
    ctx.restore();

    // Hands gripping handle
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(cx + 3, cy - 6, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMinerFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 12;
    const cy = 21;
    const swingPhase = (frame % 4) / 4;
    const digAngle = 0.2 + swingPhase * 0.9;

    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 1, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + 1, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawBaseBody(ctx, cx, cy, col);

    // Diagonal 45-degree mining stroke
    ctx.save();
    ctx.translate(cx + 4, cy - 5);
    ctx.rotate(digAngle);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-1, -11, 2, 13);

    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, -11);
    ctx.lineTo(6, -11);
    ctx.lineTo(5, -8);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, -11, 2, 1.5);
    ctx.restore();

    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 5, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDiggerFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    const cx = 14;
    const cy = 20;
    const plunge = (frame % 2 === 0) ? -2 : 2;

    ctx.fillStyle = col.shoe;
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 1, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 1, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawBaseBody(ctx, cx, cy + plunge * 0.5, col);

    // Two-handed spade pointing straight down into soil
    const spadeX = cx;
    const spadeY = cy + plunge;

    ctx.fillStyle = '#78350f';
    ctx.fillRect(spadeX - 1, spadeY - 9, 2, 9);

    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spadeX - 3.5, spadeY);
    ctx.lineTo(spadeX + 3.5, spadeY);
    ctx.lineTo(spadeX, spadeY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(spadeX - 2, spadeY, 4, 1);

    // Hands
    ctx.fillStyle = col.skin;
    ctx.beginPath();
    ctx.arc(spadeX, spadeY - 5, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSplatFrame(ctx, frame) {
    const col = this.drawLemmingColors();
    // Comic flattened pancake
    ctx.fillStyle = col.robeGradBot;
    ctx.beginPath();
    ctx.ellipse(16, 12, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col.hair;
    ctx.beginPath();
    ctx.ellipse(16, 10, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dazed stars orbiting
    const starShift = (frame === 0) ? -3 : 3;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(10 + starShift, 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22 - starShift, 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  createBadgeClimber() {
    const c = this.createCanvas(20, 20);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Climbing hand icon
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 8, 3);
    ctx.fillRect(8, 9, 4, 6);
    return c;
  }

  createBadgeFloater() {
    const c = this.createCanvas(20, 20);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Umbrella arc
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(10, 9, 5, Math.PI, 0, false);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 9);
    ctx.lineTo(10, 14);
    ctx.stroke();
    return c;
  }

  createBadgeBlocker() {
    const c = this.createCanvas(20, 20);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hand stop palm
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 8, 8, 4);
    return c;
  }

  createExitPortalSprite(frame = 0) {
    const c = this.createCanvas(72, 88);
    const ctx = c.getContext('2d');

    // Ancient carved stone archway (double resolution 72x88)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, 80, 64, 8); // Base plinth

    // Pillars with stone seams
    const pGrad = ctx.createLinearGradient(0, 0, 72, 0);
    pGrad.addColorStop(0, '#334155');
    pGrad.addColorStop(0.5, '#475569');
    pGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = pGrad;

    ctx.fillRect(8, 24, 16, 56);
    ctx.fillRect(48, 24, 16, 56);

    // Stone seam grooves
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 24, 16, 56);
    ctx.strokeRect(48, 24, 16, 56);

    // Arch header & pediment
    ctx.fillStyle = '#334155';
    ctx.fillRect(4, 12, 64, 16);
    ctx.strokeRect(4, 12, 64, 16);

    // Golden runic keystone
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(30, 8, 12, 12);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 8, 12, 12);

    // Swirling Emerald Portal Vortex
    const vortexX = 36;
    const vortexY = 52;
    const vortexR = 18;

    const vortexGrad = ctx.createRadialGradient(vortexX, vortexY, 2, vortexX, vortexY, vortexR);
    vortexGrad.addColorStop(0, '#ffffff'); // Glanzkern > 220 Luminanz!
    vortexGrad.addColorStop(0.25, '#ecfdf5');
    vortexGrad.addColorStop(0.55, '#34d399');
    vortexGrad.addColorStop(0.85, '#059669');
    vortexGrad.addColorStop(1, '#064e3b');

    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(vortexX, vortexY, vortexR, 0, Math.PI * 2);
    ctx.fill();

    // Rotating runic energy spokes
    const rot = (frame / 4) * Math.PI * 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(vortexX + Math.cos(a) * 3, vortexY + Math.sin(a) * 3);
      ctx.lineTo(vortexX + Math.cos(a) * (vortexR - 2), vortexY + Math.sin(a) * (vortexR - 2));
      ctx.stroke();
    }

    return c;
  }

  createHatchSprite(frame = 0) {
    const c = this.createCanvas(72, 48);
    const ctx = c.getContext('2d');

    // Suspension iron chains from ceiling
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(16, 20);
    ctx.moveTo(56, 0);
    ctx.lineTo(56, 20);
    ctx.stroke();

    // Heavy riveted steel frame
    ctx.fillStyle = '#334155';
    ctx.fillRect(4, 16, 64, 12);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 16, 64, 12);

    // Steel rivet studs
    ctx.fillStyle = '#cbd5e1';
    for (let rx = 10; rx <= 62; rx += 10) {
      ctx.beginPath();
      ctx.arc(rx, 22, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wooden trapdoor flaps
    if (frame === 0) {
      // Closed flaps
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, 28, 56, 12);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 28, 56, 12);
      // Woodgrain
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.moveTo(10, 32);
      ctx.lineTo(62, 32);
      ctx.moveTo(10, 36);
      ctx.lineTo(62, 36);
      ctx.stroke();
    } else if (frame === 1) {
      // Opening (tilted 45 degrees)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(8, 28);
      ctx.lineTo(24, 44);
      ctx.lineTo(48, 44);
      ctx.lineTo(64, 28);
      ctx.closePath();
      ctx.fill();
    } else {
      // Fully open
      ctx.fillStyle = '#451a03';
      ctx.fillRect(8, 28, 8, 16);
      ctx.fillRect(56, 28, 8, 16);
    }

    return c;
  }
}
