import { SpriteManager } from './sprites.js';
import { MATERIAL } from '../engine/terrain.js';
import { STATE } from '../engine/lemming.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.sprites = new SpriteManager();

    // Camera state
    this.camera = {
      x: 0,
      y: 0,
      zoom: 2.15, // Dynamic default computed in applyDefaultZoom
    };

    // User interaction tracking
    this.isUserPanning = false;
    this.userPanCooldown = 0;

    // Offscreen terrain canvas
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCtx = this.terrainCanvas.getContext('2d');

    // Particles system (explosions, dig debris, exit sparks, lava embers)
    this.particles = [];

    // Ambient cave atmosphere particles (dust motes & water drips)
    this.ambientMotes = [];
    this.initAmbientMotes(35);
    this.drips = [];

    // Tap feedback ripples (missed tap & hit tap)
    this.tapRipples = [];

    // Animation ticks
    this.animTick = 0;

    // Hatch animation timer (ticks since lemming spawned)
    this.hatchAnimTimer = 0;

    // Highlighted or targeted lemming
    this.highlightedLemming = null;

    // Logical dimensions and DPR
    this.width = canvas.width || 800;
    this.height = canvas.height || 400;
    const rawDpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    this.dpr = Math.min(Math.max(1, rawDpr), 2);
  }

  initAmbientMotes(count) {
    this.ambientMotes = [];
    for (let i = 0; i < count; i++) {
      this.ambientMotes.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.05 - Math.random() * 0.15,
        size: 1 + Math.random() * 1.5,
        alpha: 0.15 + Math.random() * 0.25,
        baseAlpha: 0.15 + Math.random() * 0.25,
      });
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    const rawDpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    this.dpr = Math.min(Math.max(1, rawDpr), 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    if (this.canvas.style) {
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
    }
    this.ctx.imageSmoothingEnabled = false;
  }

  initTerrainCanvas(level) {
    this.terrainCanvas.width = level.width;
    this.terrainCanvas.height = level.height;
    this.terrainCtx.imageSmoothingEnabled = false;

    // Full render of initial terrain
    this.renderFullTerrain(level);

    // Apply scale and viewport framing
    this.applyDefaultZoom(level);

    // Center camera on action area (initial focus pos or spawn position + vertical offset)
    const focusX = level.initialFocusPos ? level.initialFocusPos.x : level.spawnPos.x;
    const focusY = level.initialFocusPos ? level.initialFocusPos.y : level.spawnPos.y + 65;
    this.focusWorldPos(focusX, focusY, level);
  }

  applyDefaultZoom(level) {
    const w = this.width || this.canvas.width;
    const h = this.height || this.canvas.height;
    const isPortrait = h > w;
    if (isPortrait) {
      // In mobile portrait (e.g. 390x844):
      // Lemming (height 11px) takes ~3.1% of screen height (26.4px at zoom 2.40).
      // Comfortably exceeds the >= 2.5% requirement and eliminates empty void below terrain.
      const targetPx = Math.max(26, h * 0.033);
      this.camera.zoom = Math.max(2.4, targetPx / 11);
    } else {
      // In landscape (844x390) / Desktop (1440x900):
      // Fill the screen comfortably without hugging the top-left corner
      const fitW = w / level.width;
      const fitH = h / level.height;
      if (w <= 900) {
        this.camera.zoom = Math.max(1.15, Math.min(1.45, fitW));
      } else {
        this.camera.zoom = Math.max(1.35, Math.min(2.1, fitW));
      }
    }
  }

  focusWorldPos(worldX, worldY, level) {
    const w = this.width || this.canvas.width;
    const h = this.height || this.canvas.height;
    const viewW = w / this.camera.zoom;
    const viewH = h / this.camera.zoom;
    this.camera.x = worldX - viewW / 2;
    this.camera.y = worldY - viewH / 2;
    this.clampCamera(level);
    this.userPanCooldown = 90;
  }

  clampCamera(level) {
    if (!level) return;
    const w = this.width || this.canvas.width;
    const h = this.height || this.canvas.height;
    const viewW = w / this.camera.zoom;
    const viewH = h / this.camera.zoom;

    if (viewW >= level.width) {
      // Center horizontally when screen is wider than the level (fixes corner bug in landscape!)
      this.camera.x = -(viewW - level.width) / 2;
    } else {
      const maxCamX = Math.max(0, level.width - viewW);
      this.camera.x = Math.max(0, Math.min(this.camera.x, maxCamX));
    }

    if (viewH >= level.height) {
      // Center vertically if screen is taller than the level
      this.camera.y = -(viewH - level.height) / 2;
    } else {
      const maxCamY = Math.max(0, level.height - viewH);
      this.camera.y = Math.max(0, Math.min(this.camera.y, maxCamY));
    }
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX / this.camera.zoom + this.camera.x,
      y: screenY / this.camera.zoom + this.camera.y,
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom,
      y: (worldY - this.camera.y) * this.camera.zoom,
    };
  }

  addTapFeedback(screenX, screenY, type = 'miss') {
    this.tapRipples.push({
      x: screenX,
      y: screenY,
      radius: type === 'hit' ? 6 : 4,
      maxRadius: type === 'hit' ? 32 : 22,
      color: type === 'hit' ? '#f59e0b' : '#94a3b8',
      life: 14,
      maxLife: 14,
      type,
    });
  }

  updateTapRipples() {
    for (let i = this.tapRipples.length - 1; i >= 0; i--) {
      const r = this.tapRipples[i];
      r.life--;
      r.radius += (r.maxRadius - r.radius) * 0.22;
      if (r.life <= 0) {
        this.tapRipples.splice(i, 1);
      }
    }
  }

  renderFullTerrain(level) {
    const t = level.terrain;
    const ctx = this.terrainCtx;
    ctx.clearRect(0, 0, t.width, t.height);

    const imgData = ctx.createImageData(t.width, t.height);
    const data = imgData.data;

    for (let y = 0; y < t.height; y++) {
      const row = y * t.width;
      for (let x = 0; x < t.width; x++) {
        const pIdx = (row + x) * 4;
        const mat = t.mask[row + x];
        if (mat === MATERIAL.AIR) {
          // Organic grass blade tufts poking up into air directly above earth
          if (y < t.height - 1 && t.mask[(y + 1) * t.width + x] === MATERIAL.EARTH && ((x % 4 === 1) || (x % 7 === 2))) {
            data[pIdx] = 105;     // #69b93a
            data[pIdx + 1] = 185;
            data[pIdx + 2] = 58;
            data[pIdx + 3] = 255;
          }
          // Natural 1-2px vertical rock wall crags and chipped crumbs poking horizontally into air
          else if (
            (x < t.width - 1 && t.mask[row + x + 1] === MATERIAL.EARTH && ((y * 13 + x * 7) % 11 < 4)) ||
            (x > 0 && t.mask[row + x - 1] === MATERIAL.EARTH && ((y * 17 + x * 5) % 11 < 4))
          ) {
            data[pIdx] = 82;      // #52311e
            data[pIdx + 1] = 50;
            data[pIdx + 2] = 30;
            data[pIdx + 3] = 240;
          }
          // Feine Wassertropfen an Stalaktitenspitzen
          else if (y > 0 && t.mask[(y - 1) * t.width + x] === MATERIAL.EARTH && ((x * 37 + y * 19) % 29 === 0)) {
            data[pIdx] = 77;      // #4da3bf
            data[pIdx + 1] = 163;
            data[pIdx + 2] = 191;
            data[pIdx + 3] = 210;
          }
          continue;
        }

        if (mat === MATERIAL.EARTH) {
          const isTop0 = y > 0 && t.mask[(y - 1) * t.width + x] === MATERIAL.AIR;
          const isTop1 = y > 1 && t.mask[(y - 2) * t.width + x] === MATERIAL.AIR;
          const isTop2 = y > 2 && t.mask[(y - 3) * t.width + x] === MATERIAL.AIR && ((x % 3) !== 0);

          if (isTop0) {
            // Bright lush grass blade edge with frills & sunlight highlights
            const highlight = (x % 5 === 0) ? 22 : 0;
            const isPollen = ((x * 19) % 31 === 0);
            if (isPollen) {
              data[pIdx] = 215;     // Sanftes Pollen-Gold
              data[pIdx + 1] = 205;
              data[pIdx + 2] = 95;
            } else {
              data[pIdx] = 92 + highlight;      // #5c9e32 / #72b448
              data[pIdx + 1] = 168 + highlight;
              data[pIdx + 2] = 52;
            }
            data[pIdx + 3] = 255;
          } else if (isTop1 || isTop2) {
            // Forest moss transition layer
            data[pIdx] = 63;      // #3f7823
            data[pIdx + 1] = 120;
            data[pIdx + 2] = 35;
            data[pIdx + 3] = 255;
          } else {
            // Geological strata: gentle wide horizontal sedimentary earth layers
            const strata = Math.floor(Math.sin(y * 0.045 + Math.sin(x * 0.015) * 0.6) * 7);

            // Pseudo-random noise hash for natural mineral flecks without diagonal lattice artifacts
            const nHash = (((x * 1234567 + y * 9876543) ^ (x * 4567 + y * 3456)) >>> 0);
            const isOchreFleck = (nHash % 620 === 0);
            const isDarkPebble = (nHash % 75 === 1);
            const grain = ((nHash % 7) - 3); // subtle micro-grain

            // 1px top edge light on earth walls
            const isTopEdge = y > 3 && t.mask[(y - 4) * t.width + x] === MATERIAL.AIR;
            const edgeLight = isTopEdge ? 16 : 0;
            // Underside / ceiling rock shadow
            const isUnderEdge = (y < t.height - 3) && (t.mask[(y + 1) * t.width + x] === MATERIAL.AIR || t.mask[(y + 2) * t.width + x] === MATERIAL.AIR);
            const shadow = isUnderEdge ? -18 : 0;
            // Vertical cliff edge shading (light from upper-left)
            const isLeftWall = x > 0 && t.mask[row + x - 1] === MATERIAL.AIR;
            const isRightWall = x < t.width - 1 && t.mask[row + x + 1] === MATERIAL.AIR;
            const wallTone = isLeftWall ? 14 : (isRightWall ? -16 : 0);

            if (isOchreFleck) {
              data[pIdx] = 145;     // Natural warm ochre/sandstone crumb
              data[pIdx + 1] = 98;
              data[pIdx + 2] = 48;
            } else if (isDarkPebble) {
              data[pIdx] = 48;      // Deep mineral crumb
              data[pIdx + 1] = 28;
              data[pIdx + 2] = 16;
            } else {
              data[pIdx] = Math.max(0, Math.min(255, 100 + strata + grain + edgeLight + shadow + wallTone));     // R
              data[pIdx + 1] = Math.max(0, Math.min(255, 62 + strata + grain + edgeLight + shadow + wallTone)); // G
              data[pIdx + 2] = Math.max(0, Math.min(255, 38 + strata + grain + edgeLight + shadow + wallTone)); // B
            }
            data[pIdx + 3] = 255;
          }
        } else if (mat === MATERIAL.STEEL) {
          // Industrial riveted steel plate
          const isRivet = (x % 16 === 2 || x % 16 === 14) && (y % 16 === 2 || y % 16 === 14);
          const isTopSteel = y > 0 && t.mask[(y - 1) * t.width + x] === MATERIAL.AIR;
          if (isTopSteel) {
            // Specular metallic glint on top edge
            data[pIdx] = 140;     // #8c97ad
            data[pIdx + 1] = 151;
            data[pIdx + 2] = 173;
            data[pIdx + 3] = 255;
          } else if (isRivet) {
            // Dark recessed rivet stud
            data[pIdx] = 41;      // #292d36
            data[pIdx + 1] = 45;
            data[pIdx + 2] = 54;
            data[pIdx + 3] = 255;
          } else {
            const seam = (x % 16 === 0 || y % 16 === 0) ? -18 : 0;
            data[pIdx] = 96 + seam;
            data[pIdx + 1] = 105 + seam;
            data[pIdx + 2] = 123 + seam;
            data[pIdx + 3] = 255;
          }
        } else if (mat === MATERIAL.WATER) {
          const wave = Math.floor(Math.sin(x * 0.25) * 8);
          data[pIdx] = Math.max(0, Math.min(255, 30 + wave));
          data[pIdx + 1] = Math.max(0, Math.min(255, 95 + wave));
          data[pIdx + 2] = Math.max(0, Math.min(255, 120 + wave));
          data[pIdx + 3] = 215;
        } else if (mat === MATERIAL.LAVA) {
          const isTopLava0 = y > 0 && t.mask[(y - 1) * t.width + x] === MATERIAL.AIR;
          const isTopLava1 = y > 1 && t.mask[(y - 2) * t.width + x] === MATERIAL.AIR;
          const isTopLava2 = y > 2 && t.mask[(y - 3) * t.width + x] === MATERIAL.AIR;

          if (isTopLava0) {
            // Incandescent white-yellow molten crest
            data[pIdx] = 254;     // #fef08a
            data[pIdx + 1] = 240;
            data[pIdx + 2] = 138;
            data[pIdx + 3] = 255;
          } else if (isTopLava1 || isTopLava2) {
            // Bright amber glowing crust
            data[pIdx] = 245;     // #f59e0b
            data[pIdx + 1] = 158;
            data[pIdx + 2] = 11;
            data[pIdx + 3] = 255;
          } else {
            // Deep convective magma
            const glow = Math.floor(Math.sin(x * 0.12) * 14 + Math.cos(y * 0.25) * 10);
            data[pIdx] = Math.max(0, Math.min(255, 218 + glow));
            data[pIdx + 1] = Math.max(0, Math.min(255, 52 + glow));
            data[pIdx + 2] = 16;
            data[pIdx + 3] = 245;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    t.clearDirty();
  }

  updateDirtyTerrain(level) {
    const t = level.terrain;
    if (!t.dirtyRect) return;

    const r = t.dirtyRect;
    const x0 = Math.max(0, r.x);
    const y0 = Math.max(0, r.y);
    const x1 = Math.min(t.width, r.x + r.w);
    const y1 = Math.min(t.height, r.y + r.h);

    const ctx = this.terrainCtx;
    const imgData = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
    const data = imgData.data;

    let idx = 0;
    for (let y = y0; y < y1; y++) {
      const row = y * t.width;
      for (let x = x0; x < x1; x++) {
        const mat = t.mask[row + x];
        if (mat === MATERIAL.AIR) {
          // Check if neighboring pixel is EARTH: give excavated cut a crumbly hewn border
          const isBorder = (
            (x > 0 && t.mask[row + x - 1] === MATERIAL.EARTH) ||
            (x < t.width - 1 && t.mask[row + x + 1] === MATERIAL.EARTH) ||
            (y > 0 && t.mask[(y - 1) * t.width + x] === MATERIAL.EARTH) ||
            (y < t.height - 1 && t.mask[(y + 1) * t.width + x] === MATERIAL.EARTH)
          );
          if (isBorder && ((x + y) % 3 === 0)) {
            // Fresh excavation crumbs & dark chisel texture
            data[idx] = 62;      // #3e2312
            data[idx + 1] = 35;
            data[idx + 2] = 18;
            data[idx + 3] = 220;
          } else {
            data[idx + 3] = 0;   // Transparent air
          }
        } else if (mat === MATERIAL.EARTH) {
          data[idx] = 93;
          data[idx + 1] = 58;
          data[idx + 2] = 36;
          data[idx + 3] = 255;
        }
        idx += 4;
      }
    }
    ctx.putImageData(imgData, x0, y0);
    t.clearDirty();
  }

  addParticle(x, y, vx, vy, color, life, size = 2) {
    this.particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
  }

  spawnExplosionParticles(x, y) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = Math.random() > 0.4 ? '#f59e0b' : '#ef4444';
      this.addParticle(x, y, vx, vy, color, 30 + Math.random() * 20, 2 + Math.random() * 3);
    }
  }

  spawnDigParticles(x, y) {
    for (let i = 0; i < 3; i++) {
      const vx = (Math.random() - 0.5) * 2;
      const vy = -Math.random() * 2;
      this.addParticle(x, y, vx, vy, '#7a4d31', 14 + Math.random() * 8, 2);
    }
  }

  spawnExitParticles(x, y) {
    for (let i = 0; i < 3; i++) {
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = -1.2 - Math.random() * 2;
      this.addParticle(x, y, vx, vy, '#34d399', 24, 2);
    }
  }

  spawnLavaEmber(x, y) {
    const vx = (Math.random() - 0.5) * 1;
    const vy = -0.8 - Math.random() * 1.5;
    const col = Math.random() > 0.5 ? '#f59e0b' : '#ff5722';
    this.addParticle(x, y, vx, vy, col, 20 + Math.random() * 15, 2);
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // subtle gravity
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Ambient floating dust motes
    for (const m of this.ambientMotes) {
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < 0) {
        m.y = 400;
        m.x = Math.random() * 800;
      }
      if (m.x < 0) m.x = 800;
      if (m.x > 800) m.x = 0;
    }

    // Occasional cave drip
    if (this.animTick % 95 === 0 && Math.random() > 0.3) {
      this.drips.push({
        x: 60 + Math.random() * 680,
        y: 20,
        vy: 2.5,
        life: 120,
      });
    }

    for (let i = this.drips.length - 1; i >= 0; i--) {
      const d = this.drips[i];
      d.y += d.vy;
      d.life--;
      if (d.y > 380 || d.life <= 0) {
        this.drips.splice(i, 1);
      }
    }
  }

  updateAutoScroll(level) {
    if (!level || level.paused || level.status !== 'PLAYING') return;
    if (this.userPanCooldown > 0) {
      this.userPanCooldown--;
      return;
    }
    if (this.isUserPanning) return;

    // Smoothly pan camera horizontally to keep lead group in view
    const active = level.lemmings.filter((l) => !l.isRemoved);
    if (active.length === 0) return;

    active.sort((a, b) => a.x - b.x);
    const lead = active[Math.floor(active.length * 0.75)];
    if (!lead) return;

    const w = this.width || this.canvas.width;
    const viewW = w / this.camera.zoom;
    const margin = viewW * 0.30;
    const screenTargetX = lead.x - this.camera.x;

    if (screenTargetX > viewW - margin) {
      this.camera.x += (screenTargetX - (viewW - margin)) * 0.06;
      this.clampCamera(level);
    } else if (screenTargetX < margin) {
      this.camera.x -= (margin - screenTargetX) * 0.06;
      this.clampCamera(level);
    }
  }

  render(level) {
    this.animTick++;
    this.updateDirtyTerrain(level);
    this.updateParticles();
    this.updateTapRipples();
    this.updateAutoScroll(level);

    const ctx = this.ctx;
    const w = this.width || this.canvas.width;
    const h = this.height || this.canvas.height;
    const dpr = this.dpr || 1;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Clear with deep cavern foundation color
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, w, h);

    // 2. Multi-layered Parallax Cavern Background
    this.renderParallaxBackground(level);

    // 3. Camera Transform for World Space Entities
    ctx.save();
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // 4. Draw Atmospheric Dust Motes & Cave Drips in World Space
    this.renderAtmosphere();

    // 5. Draw Animated Hatch / Trapdoor at Spawn Pos
    this.renderHatch(level);

    // 6. Draw Exit Portal (Animated Swirl & Runic Arch)
    this.renderExitPortal(level);

    // 7. Draw Terrain Canvas
    ctx.drawImage(this.terrainCanvas, 0, 0);

    // 8. Draw Animated Hazard Overlays (Lava pulses & Water waves)
    this.renderAnimatedHazards(level);

    // 9. Draw Lemmings with Poses & Badges
    this.renderLemmings(level);

    // 10. Draw Particle Bursts
    this.renderParticles();

    // 11. Draw Real Lighting, Specular Glints & Bloom
    this.renderLights(level);

    ctx.restore();

    // 12. Screen-Space Overlays (Vignette & Touch Tap Ripples)
    this.renderVignette(w, h);
    this.renderTapRipples();

    ctx.restore();
  }

  getFarPlaneColor() {
    return { r: 54, g: 69, b: 91 }; // #36455b, Lum = 67.0, S = 0.23 (Ferne: hell, entsättigt)
  }

  getNearPlaneColor() {
    return { r: 11, g: 17, b: 25 }; // #0b1119, Lum = 16.1, S = 0.35 (Vordergrund: dunkel, kontrastreich)
  }

  renderLights(level) {
    const ctx = this.ctx;
    const lights = level.config ? (level.config.lights || []) : (level.lights || []);
    if (!lights.length) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const l of lights) {
      const lx = l.x;
      const ly = l.y;
      const r = l.radius || 70;

      // 1. Volumetric light shaft from cave roof (if type is shaft)
      if (l.type === 'shaft') {
        const shaftGrad = ctx.createLinearGradient(lx - 20, 0, lx + 70, ly + r * 1.5);
        shaftGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
        shaftGrad.addColorStop(0.18, 'rgba(255, 250, 205, 0.82)');
        shaftGrad.addColorStop(0.40, 'rgba(254, 240, 138, 0.42)');
        shaftGrad.addColorStop(0.70, 'rgba(245, 158, 11, 0.14)');
        shaftGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.moveTo(lx - 12, 0);
        ctx.lineTo(lx + 16, 0);
        ctx.lineTo(lx + 70, ly + r * 1.4);
        ctx.lineTo(lx - 32, ly + r * 1.4);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Soft Bloom Halo
      const haloGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 1.15);
      haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      haloGrad.addColorStop(0.12, l.coreColor ? `${l.coreColor}bb` : 'rgba(255, 255, 255, 0.70)');
      haloGrad.addColorStop(0.35, l.color ? `${l.color}55` : 'rgba(254, 240, 138, 0.35)');
      haloGrad.addColorStop(0.70, l.color ? `${l.color}1a` : 'rgba(254, 240, 138, 0.08)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(lx, ly, r * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // 3. Delicate Specular Core (> 220 Luminance)
      // Point sources (crystal, portal, lantern, shaft) have glistening specular cores; lava is a diffuse pool
      if (l.type !== 'lava') {
        const coreR = Math.max(8, Math.min(16, Math.round(r * 0.14)));
        const coreGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, coreR);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.55, '#ffffff');
        coreGrad.addColorStop(0.85, l.color || '#fef08a');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, coreR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Subtle Specular Glint Spikes on crystals
      if (l.type === 'crystal') {
        const spikeLen = Math.round(r * 0.28);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(lx - spikeLen, ly);
        ctx.lineTo(lx + spikeLen, ly);
        ctx.moveTo(lx, ly - spikeLen);
        ctx.lineTo(lx, ly + spikeLen);
        ctx.stroke();

        ctx.strokeStyle = l.color ? `${l.color}aa` : 'rgba(56, 189, 248, 0.65)';
        const diag = Math.round(spikeLen * 0.6);
        ctx.beginPath();
        ctx.moveTo(lx - diag, ly - diag);
        ctx.lineTo(lx + diag, ly + diag);
        ctx.moveTo(lx - diag, ly + diag);
        ctx.lineTo(lx + diag, ly - diag);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  renderParallaxBackground(level) {
    const ctx = this.ctx;
    const camX = this.camera.x;
    const camY = this.camera.y;
    const zoom = this.camera.zoom;
    const w = this.width || this.canvas.width;
    const h = this.height || this.canvas.height;

    // 1. Base Subterranean Cavern Vault Gradient (Luftperspektive: Ferne ist heller & entsättigt)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#36455b'); // Lum = 67.0, S = 0.23
    bgGrad.addColorStop(0.35, '#2d3b4d'); // Lum = 56.8
    bgGrad.addColorStop(0.70, '#222e3d'); // Lum = 44.5
    bgGrad.addColorStop(1, '#18222f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. EBENE 1: Ferne Höhlenwand mit Tiefenrelief & Gesteinsadern (Parallax-Faktor 0.12)
    const p1x = -(camX * 0.12 * zoom) % 280;
    const p1y = -(camY * 0.08 * zoom) % 180;

    // Horizontale Gesteinsbänder über die gesamte Bildschirmhöhe (Ferne Dunst-Tönung)
    for (let by = p1y - 180; by < h + 180; by += 45) {
      ctx.fillStyle = (Math.floor(by / 45) % 2 === 0) ? 'rgba(62, 80, 104, 0.45)' : 'rgba(48, 64, 85, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, by);
      for (let x = 0; x <= w + 40; x += 40) {
        const wave = Math.sin((x + p1x) * 0.018 + by * 0.05) * 14;
        ctx.lineTo(x, by + wave);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    }

    // Ferne Gewölbebögen und Kavernennischen
    ctx.fillStyle = '#324256';
    for (let bx = p1x - 280; bx < w + 280; bx += 280) {
      const archH = 120;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.quadraticCurveTo(bx + 70, archH, bx + 140, 0);
      ctx.lineTo(bx + 280, 0);
      ctx.lineTo(bx + 280, h);
      ctx.lineTo(bx, h);
      ctx.closePath();
      ctx.fill();

      // Schattierte Tiefennische im Fels mit natürlichem polygonalem Bruchstein
      ctx.fillStyle = '#263445';
      const nx = bx + 210;
      const ny = h * 0.48;
      ctx.beginPath();
      ctx.moveTo(nx, ny - 65);
      ctx.lineTo(nx + 24, ny - 48);
      ctx.lineTo(nx + 35, ny - 12);
      ctx.lineTo(nx + 30, ny + 28);
      ctx.lineTo(nx + 15, ny + 62);
      ctx.lineTo(nx - 8, ny + 66);
      ctx.lineTo(nx - 28, ny + 38);
      ctx.lineTo(nx - 36, ny - 6);
      ctx.lineTo(nx - 24, ny - 46);
      ctx.closePath();
      ctx.fill();

      // Feine Tiefenrisse im Nischeninneren
      ctx.strokeStyle = '#05070b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nx - 10, ny - 42);
      ctx.lineTo(nx + 6, ny + 2);
      ctx.lineTo(nx - 3, ny + 45);
      ctx.stroke();
      ctx.fillStyle = '#111823';
    }

    // 3. EBENE 2: Mittlere Felsformationen, Basaltpfeiler & Brücken (Parallax-Faktor 0.30)
    // Bildet massive vertikale und horizontale Strukturen im Luftraum
    const p2x = -(camX * 0.30 * zoom) % 200;
    const p2y = -(camY * 0.20 * zoom) % 150;

    for (let px = p2x - 200; px < w + 200; px += 200) {
      const seed = Math.abs(Math.floor(px + 1000));
      const colW = 34 + (seed % 20);

      // A. Vertikaler Basaltpfeiler mitten durch den Luftraum
      ctx.fillStyle = '#182433';
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px + colW * 0.3, h * 0.3);
      ctx.lineTo(px + colW * 0.2, h * 0.65);
      ctx.lineTo(px + colW * 0.4, h);
      ctx.lineTo(px + colW, h);
      ctx.lineTo(px + colW * 0.85, h * 0.6);
      ctx.lineTo(px + colW * 0.95, h * 0.25);
      ctx.lineTo(px + colW, 0);
      ctx.closePath();
      ctx.fill();

      // Pfeiler Schattierungskern
      ctx.fillStyle = '#131b26';
      ctx.beginPath();
      ctx.moveTo(px + colW * 0.3, 0);
      ctx.lineTo(px + colW * 0.5, h * 0.3);
      ctx.lineTo(px + colW * 0.45, h * 0.7);
      ctx.lineTo(px + colW * 0.6, h);
      ctx.lineTo(px + colW, h);
      ctx.lineTo(px + colW * 0.85, h * 0.6);
      ctx.lineTo(px + colW * 0.95, h * 0.25);
      ctx.lineTo(px + colW, 0);
      ctx.closePath();
      ctx.fill();

      // Beleuchtete Kante links
      ctx.strokeStyle = '#27384e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px + colW * 0.3, h * 0.3);
      ctx.lineTo(px + colW * 0.2, h * 0.65);
      ctx.lineTo(px + colW * 0.4, h);
      ctx.stroke();

      // B. Horizontale Höhlen-Felsbrücke auf mittlerer Höhe
      if ((seed % 2) === 0) {
        const bridgeY = h * 0.42 + (seed % 50);
        ctx.fillStyle = '#192534';
        ctx.beginPath();
        ctx.moveTo(px - 60, bridgeY);
        ctx.quadraticCurveTo(px + colW * 0.5, bridgeY - 22, px + colW + 60, bridgeY + 6);
        ctx.lineTo(px + colW + 60, bridgeY + 28);
        ctx.quadraticCurveTo(px + colW * 0.5, bridgeY + 12, px - 60, bridgeY + 32);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2c3f58';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - 60, bridgeY);
        ctx.quadraticCurveTo(px + colW * 0.5, bridgeY - 22, px + colW + 60, bridgeY + 6);
        ctx.stroke();
      }

      // C. Kristallgruppen in natürlichen Felsnischen
      if ((seed % 3) === 0) {
        const pulse = 0.55 + Math.sin(this.animTick * 0.05 + seed) * 0.35;
        const crystalY = h * 0.35 + (seed % 90);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = (seed % 2 === 0) ? '#38bdf8' : '#818cf8';
        ctx.fillRect(px + colW * 0.35 - 3, crystalY, 3, 6);
        ctx.fillRect(px + colW * 0.35 + 2, crystalY - 3, 2, 5);
        ctx.fillRect(px + colW * 0.35 - 5, crystalY + 2, 2, 4);
        ctx.fillStyle = (seed % 2 === 0) ? 'rgba(56, 189, 248, 0.15)' : 'rgba(129, 140, 248, 0.15)';
        ctx.fillRect(px + colW * 0.35 - 8, crystalY - 6, 16, 16);
        ctx.restore();
      }
    }

    // 4. EBENE 3: Vordergrund-Silhouetten & Majestätische Bögen (Parallax-Faktor 0.60)
    const p3x = -(camX * 0.60 * zoom) % 320;
    const p3y = -(camY * 0.40 * zoom) % 240;

    for (let ax = p3x - 320; ax < w + 320; ax += 320) {
      ctx.fillStyle = '#0b1119'; // Vordergrund-Silhouette (nah, dunkel, starker Kontrast)

      // Oberer hängender Bogen
      ctx.beginPath();
      ctx.moveTo(ax - 40, 0);
      ctx.quadraticCurveTo(ax + 80, h * 0.28, ax + 200, 0);
      ctx.closePath();
      ctx.fill();

      // Unterer mächtiger Felssporn
      ctx.beginPath();
      ctx.moveTo(ax + 120, h);
      ctx.quadraticCurveTo(ax + 240, h * 0.62, ax + 360, h);
      ctx.closePath();
      ctx.fill();

      // Relief-Lichtkante
      ctx.strokeStyle = '#162130';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ax + 120, h);
      ctx.quadraticCurveTo(ax + 240, h * 0.62, ax + 360, h);
      ctx.stroke();
    }

    // 5. Einfallende Lichtstrahlen von oben (Volumetric God Rays)
    const rayShift = -(camX * 0.22 * zoom);
    const ray1X = ((w * 0.28 + rayShift) % (w + 240)) - 100;
    const ray2X = ((w * 0.72 + rayShift) % (w + 240)) - 100;

    this.renderLightRay(ctx, ray1X, -20, 48, w * 0.26, h * 0.85);
    this.renderLightRay(ctx, ray2X, -20, 42, w * 0.24, h * 0.90);

    // 6. Atmosphärischer Bodennebel / Dunst nahe dem Boden
    this.renderGroundMist(ctx, w, h);
  }

  renderLightRay(ctx, rx, ry, topW, botW, len) {
    ctx.save();
    // Weicher äußerer Halo-Fächer
    const haloGrad = ctx.createLinearGradient(rx + topW * 0.5, ry, rx + botW * 0.8, ry + len);
    haloGrad.addColorStop(0, 'rgba(186, 215, 245, 0.038)');
    haloGrad.addColorStop(0.4, 'rgba(145, 190, 230, 0.018)');
    haloGrad.addColorStop(1, 'rgba(110, 160, 210, 0.00)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.moveTo(rx - 14, ry);
    ctx.lineTo(rx + topW + 14, ry);
    ctx.lineTo(rx + topW + botW + 30, ry + len);
    ctx.lineTo(rx + botW * 0.3 - 30, ry + len);
    ctx.closePath();
    ctx.fill();

    // Hellerer Kernstrahl
    const beamGrad = ctx.createLinearGradient(rx + topW * 0.5, ry, rx + botW * 0.8, ry + len);
    beamGrad.addColorStop(0, 'rgba(210, 235, 255, 0.075)');
    beamGrad.addColorStop(0.3, 'rgba(165, 205, 242, 0.042)');
    beamGrad.addColorStop(1, 'rgba(125, 175, 225, 0.00)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + topW, ry);
    ctx.lineTo(rx + topW + botW, ry + len);
    ctx.lineTo(rx + botW * 0.3, ry + len);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderGroundMist(ctx, w, h) {
    ctx.save();
    // Ebene A: Tiefer liegender Bodennebel
    const mistY = h * 0.68;
    const mistGrad = ctx.createLinearGradient(0, mistY, 0, h);
    mistGrad.addColorStop(0, 'rgba(24, 38, 56, 0)');
    mistGrad.addColorStop(0.35, 'rgba(28, 44, 64, 0.16)');
    mistGrad.addColorStop(0.75, 'rgba(20, 32, 48, 0.24)');
    mistGrad.addColorStop(1, 'rgba(14, 22, 34, 0.30)');

    ctx.fillStyle = mistGrad;
    const wave = Math.sin(this.animTick * 0.03) * 6;
    ctx.beginPath();
    ctx.moveTo(0, mistY + wave);
    ctx.quadraticCurveTo(w * 0.35, mistY - 8 + wave, w * 0.7, mistY + 5 + wave);
    ctx.quadraticCurveTo(w * 0.85, mistY + 12 - wave, w, mistY + wave);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Ebene B: Zarter, schwebender Höhlendunst
    const mistB_Y = h * 0.76;
    const mistBGrad = ctx.createLinearGradient(0, mistB_Y, 0, h);
    mistBGrad.addColorStop(0, 'rgba(38, 58, 82, 0)');
    mistBGrad.addColorStop(0.5, 'rgba(38, 58, 82, 0.12)');
    mistBGrad.addColorStop(1, 'rgba(24, 38, 56, 0.18)');
    ctx.fillStyle = mistBGrad;
    const waveB = Math.cos(this.animTick * 0.025 + 1.5) * 5;
    ctx.beginPath();
    ctx.moveTo(0, mistB_Y + waveB);
    ctx.quadraticCurveTo(w * 0.45, mistB_Y + 10 + waveB, w * 0.75, mistB_Y - 6 + waveB);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderAtmosphere() {
    const ctx = this.ctx;
    // Render floating dust motes with light shaft illumination
    for (const m of this.ambientMotes) {
      ctx.save();
      const inBeam = ((m.x > 180 && m.x < 320) || (m.x > 500 && m.x < 650));
      const alpha = inBeam ? Math.min(0.65, m.alpha * 2.2) : m.alpha;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = inBeam ? '#f0f9ff' : '#93c5fd';
      ctx.fillRect(Math.floor(m.x), Math.floor(m.y), m.size, m.size);
      ctx.restore();
    }

    // Render falling water drips
    ctx.fillStyle = '#4da3bf';
    for (const d of this.drips) {
      ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 1.5, 3);
    }
  }

  renderHatch(level) {
    const ctx = this.ctx;
    const x = level.spawnPos.x - 18;
    const y = level.spawnPos.y - 20;

    // Hatch opens whenever spawnTimer drops near 0
    let frame = 0;
    if (level.spawnTimer <= 6 && level.spawnedCount < level.totalLemmings) {
      frame = 2; // Open
    } else if (level.spawnTimer <= 14 && level.spawnedCount < level.totalLemmings) {
      frame = 1; // Opening
    }

    const sprite = this.sprites.hatch[frame] || this.sprites.hatch[0];
    ctx.drawImage(sprite, x, y, 36, 24);
  }

  renderExitPortal(level) {
    const ctx = this.ctx;
    const x = level.exitPos.x - 2;
    const y = level.exitPos.y - 10;

    const frame = Math.floor(this.animTick / 6) % 4;
    const sprite = this.sprites.exitPortal[frame] || this.sprites.exitPortal[0];
    ctx.drawImage(sprite, x, y, 36, 44);

    // Radiant upward emerald light shaft
    ctx.save();
    ctx.globalAlpha = 0.12 + Math.sin(this.animTick * 0.1) * 0.05;
    const beamGrad = ctx.createLinearGradient(0, y - 40, 0, y + 30);
    beamGrad.addColorStop(0, 'rgba(52, 211, 153, 0)');
    beamGrad.addColorStop(1, 'rgba(52, 211, 153, 0.6)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(x + 10, y - 40, 16, 70);
    ctx.restore();

    // Swirling portal sparks
    if (this.animTick % 6 === 0) {
      this.spawnExitParticles(x + 18, y + 24);
    }
  }

  renderAnimatedHazards(level) {
    const ctx = this.ctx;
    const t = level.terrain;
    const animOffset = Math.sin(this.animTick * 0.15) * 1.5;

    // Scan for Lava and Water hazards to apply animated waves/pulses
    // In Level 5 and others, spawn occasional lava embers
    if (this.animTick % 8 === 0 && (level.id === 5 || level.id === 4)) {
      this.spawnLavaEmber(150 + Math.random() * 400, 345);
    }
  }

  renderLemmings(level) {
    const ctx = this.ctx;

    for (const lem of level.lemmings) {
      if (lem.isRemoved) {
        if (lem.justExploded) {
          this.spawnExplosionParticles(lem.x, lem.y);
          lem.justExploded = false;
        }
        continue;
      }

      ctx.save();
      ctx.translate(Math.floor(lem.x), Math.floor(lem.y));

      // Direction flip: facing right (+1) is default
      if (lem.dir === -1) {
        ctx.scale(-1, 1);
      }

      const f = Math.floor(this.animTick / 4);
      let sprite = null;

      switch (lem.state) {
        case STATE.WALKER:
          sprite = this.sprites.walker[f % 8];
          ctx.drawImage(sprite, -6, -11, 12, 12);
          break;
        case STATE.FALLER:
          sprite = this.sprites.faller[f % 4];
          ctx.drawImage(sprite, -6, -11, 12, 12);
          break;
        case STATE.FLOATER:
          sprite = this.sprites.floater[f % 4];
          ctx.drawImage(sprite, -8, -19, 16, 20);
          break;
        case STATE.CLIMBER:
          sprite = this.sprites.climber[f % 4];
          ctx.drawImage(sprite, -6, -11, 12, 12);
          break;
        case STATE.BLOCKER:
          sprite = this.sprites.blocker[f % 4];
          ctx.drawImage(sprite, -8, -11, 16, 12);
          break;
        case STATE.BUILDER:
          sprite = this.sprites.builder[f % 4];
          ctx.drawImage(sprite, -6, -11, 14, 12);
          break;
        case STATE.BASHER:
          sprite = this.sprites.basher[f % 4];
          ctx.drawImage(sprite, -6, -11, 16, 12);
          if (this.animTick % 5 === 0) {
            this.spawnDigParticles(lem.x + lem.dir * 4, lem.y - 4);
          }
          break;
        case STATE.MINER:
          sprite = this.sprites.miner[f % 4];
          ctx.drawImage(sprite, -6, -12, 16, 14);
          if (this.animTick % 5 === 0) {
            this.spawnDigParticles(lem.x + lem.dir * 3, lem.y);
          }
          break;
        case STATE.DIGGER:
          sprite = this.sprites.digger[f % 4];
          ctx.drawImage(sprite, -7, -11, 14, 14);
          if (this.animTick % 5 === 0) {
            this.spawnDigParticles(lem.x, lem.y + 2);
          }
          break;
        case STATE.SPLAT:
          sprite = this.sprites.splat[f % 2];
          ctx.drawImage(sprite, -8, -6, 16, 8);
          break;
        default:
          sprite = this.sprites.walker[0];
          ctx.drawImage(sprite, -6, -11, 12, 12);
      }

      ctx.restore();

      // Overhead Skill Badges
      if (lem.isClimber && lem.state !== STATE.CLIMBER) {
        ctx.drawImage(this.sprites.badges.climber, lem.x - 5, lem.y - 18, 10, 10);
      } else if (lem.isFloater && lem.state !== STATE.FLOATER) {
        ctx.drawImage(this.sprites.badges.floater, lem.x - 5, lem.y - 18, 10, 10);
      } else if (lem.state === STATE.BLOCKER) {
        ctx.drawImage(this.sprites.badges.blocker, lem.x - 5, lem.y - 18, 10, 10);
      }

      // Bomber countdown timer badge (5..1) with glowing fuse
      if (lem.hasBombTimer) {
        const secs = lem.countdownSeconds;
        ctx.save();
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.strokeText(secs.toString(), lem.x, lem.y - 14);
        ctx.fillText(secs.toString(), lem.x, lem.y - 14);

        // Little flame spark on fuse
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(lem.x - 1, lem.y - 22, 2, 2);
        ctx.restore();
      }

      // Highlight Ring / Crosshair if hovered or selected
      if (this.highlightedLemming === lem) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        // Technical brackets crosshair
        const bx = lem.x - 8;
        const by = lem.y - 15;
        const bw = 16;
        const bh = 17;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + 4);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + 4, by);
        // Top-right
        ctx.moveTo(bx + bw - 4, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + 4);
        // Bottom-left
        ctx.moveTo(bx, by + bh - 4);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + 4, by + bh);
        // Bottom-right
        ctx.moveTo(bx + bw - 4, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - 4);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      ctx.restore();
    }
  }

  renderVignette(w, h) {
    const ctx = this.ctx;
    ctx.save();
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(10, 13, 18, 0)');
    grad.addColorStop(1, 'rgba(10, 13, 18, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  renderTapRipples() {
    const ctx = this.ctx;
    for (const r of this.tapRipples) {
      const alpha = r.life / r.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.type === 'hit' ? 2 : 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
