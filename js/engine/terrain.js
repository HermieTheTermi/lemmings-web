/**
 * Terrain system: stores collision mask in a 1D Uint8Array for O(1) physics lookups
 * and supports destructible/constructive terrain operations.
 */

export const MATERIAL = {
  AIR: 0,
  EARTH: 1,
  STEEL: 2,
  WATER: 3,
  LAVA: 4,
  EXIT: 5,
};

export class Terrain {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.mask = new Uint8Array(width * height);
    this.dirtyRect = null; // for canvas redraw optimization
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getIndex(x, y) {
    return (y | 0) * this.width + (x | 0);
  }

  getMaterial(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) {
      return MATERIAL.AIR;
    }
    return this.mask[iy * this.width + ix];
  }

  setMaterial(x, y, material) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return;
    this.mask[iy * this.width + ix] = material;
    this.markDirty(ix, iy, 1, 1);
  }

  isSolid(x, y) {
    const mat = this.getMaterial(x, y);
    return mat === MATERIAL.EARTH || mat === MATERIAL.STEEL;
  }

  isDestructible(x, y) {
    const mat = this.getMaterial(x, y);
    return mat === MATERIAL.EARTH;
  }

  isHazard(x, y) {
    const mat = this.getMaterial(x, y);
    return mat === MATERIAL.WATER || mat === MATERIAL.LAVA;
  }

  isExit(x, y) {
    return this.getMaterial(x, y) === MATERIAL.EXIT;
  }

  markDirty(x, y, w, h) {
    if (!this.dirtyRect) {
      this.dirtyRect = { x, y, w, h };
    } else {
      const minX = Math.min(this.dirtyRect.x, x);
      const minY = Math.min(this.dirtyRect.y, y);
      const maxX = Math.max(this.dirtyRect.x + this.dirtyRect.w, x + w);
      const maxY = Math.max(this.dirtyRect.y + this.dirtyRect.h, y + h);
      this.dirtyRect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
  }

  clearDirty() {
    this.dirtyRect = null;
  }

  fillRect(rx, ry, rw, rh, material) {
    const x0 = Math.max(0, Math.floor(rx));
    const y0 = Math.max(0, Math.floor(ry));
    const x1 = Math.min(this.width, Math.floor(rx + rw));
    const y1 = Math.min(this.height, Math.floor(ry + rh));

    for (let y = y0; y < y1; y++) {
      const rowOffset = y * this.width;
      for (let x = x0; x < x1; x++) {
        this.mask[rowOffset + x] = material;
      }
    }
    this.markDirty(x0, y0, x1 - x0, y1 - y0);
  }

  carveCircle(cx, cy, radius) {
    const r2 = radius * radius;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const x1 = Math.min(this.width, Math.ceil(cx + radius));
    const y1 = Math.min(this.height, Math.ceil(cy + radius));

    let modified = 0;
    for (let y = y0; y < y1; y++) {
      const dy = y - cy;
      const rowOffset = y * this.width;
      for (let x = x0; x < x1; x++) {
        const dx = x - cx;
        if (dx * dx + dy * dy <= r2) {
          const idx = rowOffset + x;
          if (this.mask[idx] === MATERIAL.EARTH) {
            this.mask[idx] = MATERIAL.AIR;
            modified++;
          }
        }
      }
    }
    if (modified > 0) {
      this.markDirty(x0, y0, x1 - x0, y1 - y0);
    }
    return modified;
  }

  carveRect(rx, ry, rw, rh) {
    const x0 = Math.max(0, Math.floor(rx));
    const y0 = Math.max(0, Math.floor(ry));
    const x1 = Math.min(this.width, Math.floor(rx + rw));
    const y1 = Math.min(this.height, Math.floor(ry + rh));

    let modified = 0;
    for (let y = y0; y < y1; y++) {
      const rowOffset = y * this.width;
      for (let x = x0; x < x1; x++) {
        const idx = rowOffset + x;
        if (this.mask[idx] === MATERIAL.EARTH) {
          this.mask[idx] = MATERIAL.AIR;
          modified++;
        }
      }
    }
    if (modified > 0) {
      this.markDirty(x0, y0, x1 - x0, y1 - y0);
    }
    return modified;
  }

  addStep(sx, sy, sw, sh, material = MATERIAL.EARTH) {
    const x0 = Math.max(0, Math.floor(sx));
    const y0 = Math.max(0, Math.floor(sy));
    const x1 = Math.min(this.width, Math.floor(sx + sw));
    const y1 = Math.min(this.height, Math.floor(sy + sh));

    let added = 0;
    for (let y = y0; y < y1; y++) {
      const rowOffset = y * this.width;
      for (let x = x0; x < x1; x++) {
        const idx = rowOffset + x;
        if (this.mask[idx] === MATERIAL.AIR) {
          this.mask[idx] = material;
          added++;
        }
      }
    }
    if (added > 0) {
      this.markDirty(x0, y0, x1 - x0, y1 - y0);
    }
    return added;
  }

  /**
   * Transforms raw rectangular block terrain into organic cavern geology.
   * - Undulates top walkable surfaces with micro-hills (±1-2px) so no flat run exceeds 40px
   *   and no contour stays at identical height over 60px.
   * - Protects critical headroom and puzzle zones (exit door, spawn drop line).
   * - Adds natural hanging stalactites to cave ceilings.
   */
  applyOrganicContours(level) {
    const w = this.width;
    const h = this.height;
    const levelId = level.id || 1;

    // 1. Organic plateau & floor undulation
    for (let x = 0; x < w; x++) {
      // Keep exact base beneath exit door stable for portal framing
      const isExitBase = (x >= level.exitPos.x + 4 && x <= level.exitPos.x + level.exitPos.w - 4);
      // High-frequency natural undulation wave (wavelength 14-18px, amplitude ~1.5px)
      const w1 = Math.sin((x + levelId * 17) * 0.42) * 1.05;
      const w2 = Math.sin((x * 0.19 + levelId * 11) + 0.8) * 0.8;
      const rawDelta = isExitBase ? 0 : Math.round(w1 + w2);

      for (let y = 2; y < h - 2; y++) {
        if (this.isSolid(x, y) && !this.isSolid(x, y - 1)) {
          const mat = this.getMaterial(x, y);
          if (mat === MATERIAL.EARTH) {
            // Measure headroom above this surface to ensure tight shafts (e.g. digger shafts) don't get blocked
            let headroom = 0;
            while (headroom < 16 && y - 1 - headroom >= 0 && !this.isSolid(x, y - 1 - headroom)) {
              headroom++;
            }
            let delta = rawDelta;
            if (headroom < 14 && delta < 0) {
              delta = 0; // Don't raise floor into tight ceiling clearance
            }

            if (delta > 0) {
              for (let d = 0; d < Math.min(2, delta); d++) {
                if (this.isSolid(x, y + d + 4)) {
                  this.mask[(y + d) * w + x] = MATERIAL.AIR;
                }
              }
            } else if (delta < 0) {
              for (let d = 1; d <= Math.min(2, -delta); d++) {
                if (this.getMaterial(x, y - d) === MATERIAL.AIR) {
                  this.mask[(y - d) * w + x] = MATERIAL.EARTH;
                }
              }
            }
          }
          y += 5; // Advance past platform depth
        }
      }
    }

    // 2. Ceiling stalactites in upper cavern vault (y < 65)
    for (let x = 10; x < w - 10; x++) {
      const nearHatch = Math.abs(x - level.spawnPos.x) < 26;
      if (nearHatch) continue;

      const hash = (x * 37 + levelId * 101) % 97;
      if (hash < 12) {
        for (let y = 10; y < 65; y++) {
          if (this.getMaterial(x, y) === MATERIAL.EARTH && this.getMaterial(x, y + 1) === MATERIAL.AIR) {
            const len = 4 + (hash % 8);
            const baseW = 1 + (hash % 3);
            for (let dy = 1; dy <= len; dy++) {
              const curW = Math.max(0, Math.floor(baseW * (1 - dy / len)));
              for (let dx = -curW; dx <= curW; dx++) {
                const sx = x + dx;
                const sy = y + dy;
                if (sx >= 0 && sx < w && sy < h && this.getMaterial(sx, sy) === MATERIAL.AIR) {
                  this.mask[sy * w + sx] = MATERIAL.EARTH;
                }
              }
            }
            break;
          }
        }
      }
    }

    this.markDirty(0, 0, w, h);
  }
}
