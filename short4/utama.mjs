#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Canvas, FontLibrary } from 'skia-canvas';
import {
  buildAudioAndTimeline,
  findFfmpeg,
  FPS,
  HEIGHT,
  ROOT,
  SCENES_DATA,
  SHORT4_DIR,
  VIDEO_CONFIG,
  WIDTH,
} from './script.mjs';

let fontsLoaded = false;

export function ensureFonts() {
  if (fontsLoaded) return;
  const reg = (family, rel) => {
    const p = join(ROOT, rel);
    if (existsSync(p)) FontLibrary.use(family, [p]);
  };
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2');
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2');
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2');
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff2');
  reg('Cinzel', 'node_modules/@fontsource/cinzel/files/cinzel-latin-600-normal.woff2');
  reg('Cinzel', 'node_modules/@fontsource/cinzel/files/cinzel-latin-700-normal.woff2');
  reg('Cinzel', 'node_modules/@fontsource/cinzel/files/cinzel-latin-800-normal.woff2');
  reg('Cinzel', 'node_modules/@fontsource/cinzel/files/cinzel-latin-900-normal.woff2');
  reg('Amiri', 'node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff2');
  reg('Amiri', 'node_modules/@fontsource/amiri/files/amiri-arabic-700-normal.woff2');
  fontsLoaded = true;
}

// ============================================================================
// 1. TACTICAL BRONZE & DESERT SAND-TABLE PALETTE (DISTINCT IDENTITY FOR VIDEO 4)
// ============================================================================
export const PALETTE = {
  umberVoid: '#110E0B',
  ironDark: '#1A1510',
  slateBronze: '#241D16',
  sandLight: '#E5C896',
  sandMid: '#C8A26A',
  sandDeep: '#8A673B',
  sandstone: '#F5ECD7',
  sandMuted: '#B8A88E',
  bronzeLight: '#F3C778',
  bronze: '#C98A3A',
  bronzeDeep: '#7A4C18',
  steelLight: '#E2E8F0',
  steel: '#94A3B8',
  muslimTeal: '#2B8A8A',
  muslimTealBright: '#45B8B0',
  crimsonBright: '#E04F4F',
  crimson: '#A82626',
  crimsonDeep: '#5C1111',
  nightBlue: '#182433',
};

// ============================================================================
// 2. EASING, PHYSICS & TYPOGRAPHY PRIMITIVES
// ============================================================================
export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function easeOutCubic(t) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(t) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutBack(t, s = 1.45) {
  const x = clamp01(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
}

export function springPop(t, omega = 13, zeta = 0.68) {
  const x = Math.max(0, t);
  if (x <= 0) return 0;
  if (x > 2.2) return 1;
  const wd = omega * Math.sqrt(Math.max(0.01, 1 - zeta * zeta));
  const decay = Math.exp(-zeta * omega * x);
  return 1 - decay * (Math.cos(wd * x) + ((zeta * omega) / wd) * Math.sin(wd * x));
}

export function stagger(localSec, startSec, durSec = 0.45) {
  return clamp01((localSec - startSec) / Math.max(0.001, durSec));
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function drawText(ctx, text, x, y, opts = {}) {
  const {
    font = '700 40px PlusJakarta',
    color = PALETTE.sandstone,
    align = 'center',
    baseline = 'middle',
    alpha = 1,
    glow = null,
    glowBlur = 18,
    maxWidth = null,
  } = opts;
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = glowBlur;
  }
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawDiamondBadge(ctx, x, y, text, tone = 'bronze', alpha = 1) {
  if (alpha <= 0.01) return;
  const colors = {
    bronze: { bg: 'rgba(201,138,58,0.14)', bd: 'rgba(243,199,120,0.50)', fg: PALETTE.bronzeLight, dot: PALETTE.bronze },
    teal: { bg: 'rgba(43,138,138,0.16)', bd: 'rgba(69,184,176,0.55)', fg: '#A7F3D0', dot: PALETTE.muslimTealBright },
    crimson: { bg: 'rgba(168,38,38,0.18)', bd: 'rgba(224,79,79,0.55)', fg: '#FCA5A5', dot: PALETTE.crimsonBright },
    steel: { bg: 'rgba(148,163,184,0.12)', bd: 'rgba(226,232,240,0.40)', fg: PALETTE.steelLight, dot: PALETTE.steel },
  };
  const c = colors[tone] || colors.bronze;
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  ctx.font = '700 22px JetMono';
  const tw = ctx.measureText(text).width;
  const pw = tw + 74;
  const ph = 50;
  roundRectPath(ctx, x - pw / 2, y - ph / 2, pw, ph, 8);
  ctx.fillStyle = c.bg;
  ctx.fill();
  ctx.strokeStyle = c.bd;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tactical diamond dot
  ctx.save();
  ctx.translate(x - pw / 2 + 26, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = c.dot;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();

  ctx.fillStyle = c.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 12, y + 1);
  ctx.restore();
}

// ============================================================================
// 3. TACTICAL WAR-ROOM BACKDROP (TOPOGRAPHIC CONTOURS & COMPASS)
// ============================================================================
export function drawTacticalBackdrop(ctx, globalSec, opts = {}) {
  const {
    glowColor = 'rgba(201, 138, 58, 0.14)',
    nightTint = 0,
    crimsonTint = 0,
  } = opts;

  // Base warm forged-iron umber gradient
  const bg = ctx.createRadialGradient(WIDTH * 0.5, 920, 80, WIDTH * 0.5, 1050, 1650);
  bg.addColorStop(0, nightTint > 0.3 ? '#17202C' : '#211A13');
  bg.addColorStop(0.55, nightTint > 0.3 ? '#10151D' : PALETTE.ironDark);
  bg.addColorStop(1, PALETTE.umberVoid);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (crimsonTint > 0) {
    const cg = ctx.createRadialGradient(WIDTH * 0.5, 960, 40, WIDTH * 0.5, 960, 960);
    cg.addColorStop(0, `rgba(168, 38, 38, ${0.24 * crimsonTint})`);
    cg.addColorStop(1, 'rgba(168, 38, 38, 0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Ambient center spotlight
  const amb = ctx.createRadialGradient(WIDTH * 0.5, 880, 30, WIDTH * 0.5, 880, 820);
  amb.addColorStop(0, glowColor);
  amb.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = amb;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle cartographic topographic contour lines (distinct from Video 3 grid!)
  ctx.save();
  ctx.strokeStyle = 'rgba(201, 138, 58, 0.045)';
  ctx.lineWidth = 1.6;
  const contourOffsets = [160, 290, 430, 580, 740, 920];
  for (let i = 0; i < contourOffsets.length; i++) {
    const rx = contourOffsets[i] * 1.05;
    const ry = contourOffsets[i] * 0.72;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.14) {
      const wobble =
        1 +
        0.07 * Math.sin(a * 3 + i * 0.8 + globalSec * 0.05) +
        0.04 * Math.cos(a * 5 - i * 1.1);
      const px = WIDTH * 0.5 + Math.cos(a) * rx * wobble;
      const py = 920 + Math.sin(a) * ry * wobble;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Cartographic meridian & crosshairs
  ctx.strokeStyle = 'rgba(243, 199, 120, 0.035)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.5, 160);
  ctx.lineTo(WIDTH * 0.5, 1840);
  ctx.moveTo(80, 920);
  ctx.lineTo(WIDTH - 80, 920);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Drifting warm desert dust / embers
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const seed = i * 97.31;
    const px = ((seed * 19 + globalSec * (16 + (i % 5) * 4)) % (WIDTH + 100)) - 50;
    const py = 220 + ((seed * 23 - globalSec * (10 + (i % 3) * 5) + 2200) % 1620);
    const sz = 1.6 + (i % 3) * 1.1;
    const alpha = 0.08 + 0.12 * Math.abs(Math.sin(globalSec * 0.9 + i));
    ctx.fillStyle = i % 4 === 0 ? `rgba(224,79,79,${alpha})` : `rgba(243,199,120,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// 4. REUSABLE 2.5D TACTICAL WAR-ROOM EXPLANATORY OBJECTS
// ============================================================================

/**
 * 2.5D Forged Bronze & Desert Sand-Table Slab
 */
export function drawSandTableSlab(ctx, cx, cy, w, h, alpha = 1, opts = {}) {
  if (alpha <= 0.01) return;
  const { nightMode = false, title = "DATARAN MU'TAH · SYAM" } = opts;
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);

  const x = cx - w / 2;
  const y = cy - h / 2;

  // Heavy table shadow & 3D wooden/bronze rim thickness
  ctx.shadowColor = 'rgba(0,0,0,0.72)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 26;
  roundRectPath(ctx, x - 14, y - 10, w + 28, h + 32, 24);
  const frameG = ctx.createLinearGradient(x, y, x + w, y + h);
  frameG.addColorStop(0, '#5E3B16');
  frameG.addColorStop(0.5, '#9A6525');
  frameG.addColorStop(1, '#3B230B');
  ctx.fillStyle = frameG;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Inner recessed desert sand plateau
  roundRectPath(ctx, x, y, w, h, 18);
  const sandG = ctx.createLinearGradient(x, y, x + w, y + h);
  if (nightMode) {
    sandG.addColorStop(0, '#222A36');
    sandG.addColorStop(0.5, '#19212B');
    sandG.addColorStop(1, '#11171F');
  } else {
    sandG.addColorStop(0, '#3C2F1E');
    sandG.addColorStop(0.5, '#2E2316');
    sandG.addColorStop(1, '#211910');
  }
  ctx.fillStyle = sandG;
  ctx.fill();

  // Clip inside sand plateau for topographic ridges & wadi contour
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 18);
  ctx.clip();

  // Topographic sand plateaus
  ctx.fillStyle = nightMode ? 'rgba(69,184,176,0.06)' : 'rgba(216,184,132,0.11)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.25, y + h * 0.35, w * 0.34, h * 0.42, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = nightMode ? 'rgba(224,79,79,0.08)' : 'rgba(201,138,58,0.10)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.78, y + h * 0.62, w * 0.32, h * 0.40, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Elevation contour rings
  ctx.strokeStyle = nightMode ? 'rgba(148,163,184,0.12)' : 'rgba(229,200,150,0.14)';
  ctx.lineWidth = 1.6;
  for (let k = 1; k <= 4; k++) {
    ctx.beginPath();
    ctx.ellipse(x + w * 0.24, y + h * 0.36, w * 0.08 * k, h * 0.09 * k, 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.76, y + h * 0.62, w * 0.08 * k, h * 0.09 * k, -0.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Tactical sector grid
  ctx.strokeStyle = 'rgba(243,199,120,0.06)';
  ctx.lineWidth = 1;
  for (let gx = x + 90; gx < x + w; gx += 90) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y + 90; gy < y + h; gy += 90) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }

  ctx.restore();

  // Inner gold-bronze bezel
  roundRectPath(ctx, x, y, w, h, 18);
  ctx.strokeStyle = 'rgba(243,199,120,0.45)';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Corner brass rivets
  const rivets = [
    [x - 4, y - 2],
    [x + w + 4, y - 2],
    [x - 4, y + h + 2],
    [x + w + 4, y + h + 2],
  ];
  for (const [rx, ry] of rivets) {
    ctx.fillStyle = PALETTE.bronzeLight;
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (title) {
    drawText(ctx, title, x + 28, y + 28, {
      font: '700 18px JetMono',
      color: 'rgba(243,199,120,0.65)',
      align: 'left',
      alpha: 1,
    });
  }

  ctx.restore();
}

/**
 * 2.5D Tactical Army Battalion Token (Beveled miniature block on sand-table)
 */
export function drawTacticalUnit(ctx, x, y, w, h, side = 'muslim', label = '', alpha = 1, angle = 0) {
  if (alpha <= 0.01) return;
  const isMuslim = side === 'muslim';
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Drop shadow on sand table
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  roundRectPath(ctx, -w / 2 + 4, -h / 2 + 10, w, h, 8);
  ctx.fill();

  // 3D base edge
  ctx.fillStyle = isMuslim ? '#164E4E' : '#581212';
  roundRectPath(ctx, -w / 2, -h / 2 + 5, w, h, 8);
  ctx.fill();

  // Top metallic/enamel face
  const topG = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  if (isMuslim) {
    topG.addColorStop(0, '#3AA8A0');
    topG.addColorStop(1, '#1F6664');
  } else {
    topG.addColorStop(0, '#D94343');
    topG.addColorStop(1, '#851A1A');
  }
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fillStyle = topG;
  ctx.fill();
  ctx.strokeStyle = isMuslim ? '#A7F3D0' : '#FCA5A5';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tactical infantry/cavalry chevron inside block
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2.2;
  if (isMuslim) {
    // Crescent/chevron forward marker
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, h * 0.12);
    ctx.lineTo(0, -h * 0.16);
    ctx.lineTo(w * 0.2, h * 0.12);
    ctx.stroke();
  } else {
    // Imperial X battalion symbol
    ctx.beginPath();
    ctx.moveTo(-w * 0.18, -h * 0.18);
    ctx.lineTo(w * 0.18, h * 0.18);
    ctx.moveTo(w * 0.18, -h * 0.18);
    ctx.lineTo(-w * 0.18, h * 0.18);
    ctx.stroke();
  }

  if (label) {
    drawText(ctx, label, 0, h / 2 + 22, {
      font: '700 18px JetMono',
      color: isMuslim ? '#A7F3D0' : '#FCA5A5',
    });
  }

  ctx.restore();
}

/**
 * 2.5D Forged Bronze & Slate Tactical Plaque
 */
export function drawTacticalPlaque(ctx, cx, cy, w, h, header, main, sub, tone = 'bronze', alpha = 1) {
  if (alpha <= 0.01) return;
  const tones = {
    bronze: { bd: PALETTE.bronze, hdr: PALETTE.bronzeLight, bg1: '#1E1812', bg2: '#130F0B' },
    teal: { bd: PALETTE.muslimTealBright, hdr: '#A7F3D0', bg1: '#122223', bg2: '#0B1516' },
    crimson: { bd: PALETTE.crimsonBright, hdr: '#FCA5A5', bg1: '#261212', bg2: '#160A0A' },
  };
  const t = tones[tone] || tones.bronze;

  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;
  roundRectPath(ctx, x, y, w, h, 14);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, t.bg1);
  g.addColorStop(1, t.bg2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  roundRectPath(ctx, x, y, w, h, 14);
  ctx.strokeStyle = t.bd;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Top accent bar
  ctx.fillStyle = t.bd;
  roundRectPath(ctx, x + 22, y + 16, 44, 4, 2);
  ctx.fill();

  if (header) {
    drawText(ctx, header, x + 80, y + 19, {
      font: '700 20px JetMono',
      color: t.hdr,
      align: 'left',
      maxWidth: w - 104,
    });
  }
  if (main) {
    drawText(ctx, main, cx, cy + (sub ? -2 : 12), {
      font: '800 34px PlusJakarta',
      color: PALETTE.sandstone,
      maxWidth: w - 48,
    });
  }
  if (sub) {
    drawText(ctx, sub, cx, y + h - 30, {
      font: '600 22px JetMono',
      color: PALETTE.sandMuted,
      maxWidth: w - 48,
    });
  }
  ctx.restore();
}

/**
 * 2.5D Damascus Steel Sword with Animated Fracture & Snap
 * brokenProgress: 0 = intact, 0..1 = crack flashes and upper half snaps off!
 */
export function drawDamascusSword(ctx, cx, cy, len = 340, angle = 0, brokenProgress = 0, alpha = 1, isGold = false) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const gripLen = len * 0.22;
  const bladeLen = len * 0.78;
  const breakPt = -bladeLen * 0.48; // relative to guard at y=0 (blade goes negative Y)

  // Pommel & leather grip (y from 0 down to +gripLen)
  const guardG = ctx.createLinearGradient(-34, -8, 34, 8);
  guardG.addColorStop(0, isGold ? '#8A581B' : '#57432B');
  guardG.addColorStop(0.5, isGold ? '#FCE192' : '#D99B43');
  guardG.addColorStop(1, isGold ? '#8A581B' : '#57432B');

  // Grip
  ctx.fillStyle = '#3B2314';
  roundRectPath(ctx, -7, 6, 14, gripLen - 16, 4);
  ctx.fill();
  ctx.strokeStyle = '#7A4C18';
  ctx.lineWidth = 1.5;
  for (let gy = 14; gy < gripLen - 12; gy += 11) {
    ctx.beginPath();
    ctx.moveTo(-7, gy);
    ctx.lineTo(7, gy + 4);
    ctx.stroke();
  }

  // Pommel
  ctx.fillStyle = guardG;
  ctx.beginPath();
  ctx.arc(0, gripLen, 13, 0, Math.PI * 2);
  ctx.fill();

  // Lower blade (intact up to breakPt if broken)
  const bp = clamp01(brokenProgress);
  const lowerTopY = bp > 0.12 ? breakPt : -bladeLen + 30;

  const drawBladeSegment = (yBottom, yTop, includeTip) => {
    const bw = 13;
    ctx.beginPath();
    ctx.moveTo(-bw, yBottom);
    ctx.lineTo(-bw * 0.85, yTop);
    if (includeTip) {
      ctx.lineTo(0, yTop - 32);
      ctx.lineTo(bw * 0.85, yTop);
    } else {
      // jagged fracture edge
      ctx.lineTo(-3, yTop - 6);
      ctx.lineTo(4, yTop + 4);
      ctx.lineTo(bw * 0.85, yTop - 3);
    }
    ctx.lineTo(bw, yBottom);
    ctx.closePath();

    const bg = ctx.createLinearGradient(-bw, 0, bw, 0);
    if (isGold) {
      bg.addColorStop(0, '#9A6525');
      bg.addColorStop(0.45, '#FFF3C4');
      bg.addColorStop(0.55, '#D99B43');
      bg.addColorStop(1, '#7A4C18');
    } else {
      bg.addColorStop(0, '#64748B');
      bg.addColorStop(0.45, '#F8FAFC');
      bg.addColorStop(0.55, '#94A3B8');
      bg.addColorStop(1, '#475569');
    }
    ctx.fillStyle = bg;
    ctx.fill();

    // Central fuller line
    ctx.strokeStyle = isGold ? 'rgba(122,76,24,0.65)' : 'rgba(30,41,59,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, yBottom - 8);
    ctx.lineTo(0, yTop + 8);
    ctx.stroke();
  };

  if (bp <= 0.12) {
    drawBladeSegment(0, -bladeLen + 32, true);
  } else {
    // Lower half stays in hilt
    drawBladeSegment(0, breakPt, false);
    // Upper half snaps away with rotation & drift
    const fly = easeOutCubic((bp - 0.12) / 0.88);
    ctx.save();
    ctx.translate(fly * 38, breakPt - fly * 46);
    ctx.rotate(fly * 0.65);
    ctx.globalAlpha *= 1 - fly * 0.45;
    // draw upper fragment starting at local 0 up to remaining length
    const remLen = bladeLen - 32 + breakPt;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-9, -remLen);
    ctx.lineTo(0, -remLen - 30);
    ctx.lineTo(9, -remLen);
    ctx.lineTo(11, 0);
    ctx.lineTo(3, 5);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    const bg = ctx.createLinearGradient(-11, 0, 11, 0);
    bg.addColorStop(0, '#64748B');
    bg.addColorStop(0.48, '#F8FAFC');
    bg.addColorStop(1, '#475569');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();

    // Fracture spark burst
    if (bp > 0.1 && bp < 0.7) {
      const sparkA = 1 - Math.abs(bp - 0.3) / 0.4;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 220, 130, ${clamp01(sparkA)})`;
      ctx.lineWidth = 2.5;
      for (let s = 0; s < 6; s++) {
        const sa = (s / 6) * Math.PI * 2 + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sa) * 8, breakPt + Math.sin(sa) * 8);
        ctx.lineTo(Math.cos(sa) * (20 + fly * 24), breakPt + Math.sin(sa) * (20 + fly * 24));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Crossguard drawn on top
  ctx.fillStyle = guardG;
  roundRectPath(ctx, -36, -6, 72, 13, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Animated Tactical Maneuver Arrow
 */
export function drawTacticalArrow(ctx, x1, y1, x2, y2, progress = 1, color = PALETTE.bronzeLight, width = 6, opts = {}) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  const { curveOffset = 0, dashed = false, glow = true } = opts;
  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([14, 12]);

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + curveOffset;

  // Sample quadratic bezier up to p
  const steps = 28;
  const maxStep = Math.max(1, Math.floor(steps * p));
  let lx = x1;
  let ly = y1;
  let px = x1;
  let py = y1;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= maxStep; i++) {
    const t = (i / steps);
    const omt = 1 - t;
    px = omt * omt * x1 + 2 * omt * t * mx + t * t * x2;
    py = omt * omt * y1 + 2 * omt * t * my + t * t * y2;
    ctx.lineTo(px, py);
    if (i === maxStep - 1) {
      lx = px;
      ly = py;
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowhead at (px, py)
  if (p > 0.12) {
    const ang = Math.atan2(py - ly, px - lx);
    const headLen = 18 + width;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(ang) * 4, py + Math.sin(ang) * 4);
    ctx.lineTo(px - Math.cos(ang - 0.52) * headLen, py - Math.sin(ang - 0.52) * headLen);
    ctx.lineTo(px - Math.cos(ang + 0.52) * headLen, py - Math.sin(ang + 0.52) * headLen);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 2.5D Battle Banner / Liwa Standard
 */
export function drawBattleBanner(ctx, x, y, poleH = 220, label = '', color = PALETTE.muslimTeal, alpha = 1, wavePhase = 0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);

  // Bronze pole
  const poleG = ctx.createLinearGradient(x - 5, y, x + 5, y);
  poleG.addColorStop(0, '#6B4214');
  poleG.addColorStop(0.5, '#F3C778');
  poleG.addColorStop(1, '#57340D');
  ctx.fillStyle = poleG;
  ctx.fillRect(x - 4, y - poleH, 8, poleH);

  // Spearhead finial
  ctx.fillStyle = PALETTE.bronzeLight;
  ctx.beginPath();
  ctx.moveTo(x, y - poleH - 28);
  ctx.lineTo(x + 11, y - poleH - 2);
  ctx.lineTo(x - 11, y - poleH - 2);
  ctx.closePath();
  ctx.fill();

  // Waving banner cloth
  const bw = 156;
  const bh = 86;
  const fy = y - poleH + 14;
  ctx.beginPath();
  ctx.moveTo(x + 4, fy);
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const wy = Math.sin(u * 4.5 + wavePhase) * 7 * u;
    ctx.lineTo(x + 4 + bw * u, fy + wy);
  }
  ctx.lineTo(x + 4 + bw - 18, fy + bh * 0.5 + Math.sin(4.5 + wavePhase) * 7);
  for (let i = 12; i >= 0; i--) {
    const u = i / 12;
    const wy = Math.sin(u * 4.5 + wavePhase + 0.8) * 7 * u;
    ctx.lineTo(x + 4 + bw * u, fy + bh + wy);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = PALETTE.bronzeLight;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (label) {
    drawText(ctx, label, x + 76, fy + bh * 0.5, {
      font: '800 20px JetMono',
      color: PALETTE.sandstone,
      maxWidth: 118,
    });
  }
  ctx.restore();
}

/**
 * Cartographic Compass Rose
 */
export function drawCompassRose(ctx, cx, cy, r = 64, rot = 0, alpha = 1) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  ctx.translate(cx, cy);

  ctx.strokeStyle = 'rgba(243,199,120,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.rotate(rot);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = i === 0 ? PALETTE.bronzeLight : 'rgba(243,199,120,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, -r + 6);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(122,76,24,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -r + 6);
    ctx.lineTo(-10, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  drawText(ctx, 'U', 0, -r - 16, { font: '700 18px JetMono', color: PALETTE.bronzeLight });
  ctx.restore();
}

// ============================================================================
// 5. TACTICAL CORNER CHROME & FLOATING KINETIC CAPTIONS
// ============================================================================
export function drawTacticalChrome(ctx, scene, sceneIdx, totalScenes, globalSec, totalSec) {
  // Top cartographic header
  ctx.save();
  ctx.translate(72, 100);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = PALETTE.bronze;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();

  drawText(ctx, VIDEO_CONFIG.channelHandle, 102, 100, {
    font: '800 24px JetMono',
    color: PALETTE.sandstone,
    align: 'left',
    alpha: 0.86,
  });

  drawText(ctx, "31°03'N 35°42'E · MU'TAH 8 H", WIDTH - 64, 100, {
    font: '600 20px JetMono',
    color: PALETTE.sandMuted,
    align: 'right',
    alpha: 0.65,
  });

  // Bottom chapter & diamond tactical step indicator
  drawText(ctx, scene.chapter, 68, HEIGHT - 108, {
    font: '700 22px JetMono',
    color: PALETTE.bronzeLight,
    align: 'left',
    alpha: 0.78,
  });

  const stepSpacing = 28;
  const startX = WIDTH - 68 - (totalScenes - 1) * stepSpacing;
  for (let i = 0; i < totalScenes; i++) {
    const active = i === sceneIdx;
    const done = i < sceneIdx;
    ctx.save();
    ctx.translate(startX + i * stepSpacing, HEIGHT - 108);
    ctx.rotate(Math.PI / 4);
    const sz = active ? 8 : 5;
    ctx.fillStyle = active ? PALETTE.bronzeLight : done ? 'rgba(201,138,58,0.55)' : 'rgba(245,236,215,0.18)';
    ctx.fillRect(-sz, -sz, sz * 2, sz * 2);
    ctx.restore();
  }

  // Bottom progress track
  const pct = clamp01(globalSec / Math.max(0.1, totalSec));
  ctx.fillStyle = 'rgba(243,199,120,0.12)';
  ctx.fillRect(0, HEIGHT - 10, WIDTH, 10);
  const pg = ctx.createLinearGradient(0, 0, WIDTH * pct, 0);
  pg.addColorStop(0, PALETTE.bronzeDeep);
  pg.addColorStop(1, PALETTE.bronzeLight);
  ctx.fillStyle = pg;
  ctx.fillRect(0, HEIGHT - 10, WIDTH * pct, 10);
}

export function drawFloatingKineticCaptions(ctx, scene, localSec) {
  const words = scene.words || [];
  if (!words.length) return;

  let activeIdx = words.findIndex((w) => localSec >= w.start && localSec <= w.end);
  if (activeIdx === -1) {
    if (localSec < words[0].start) activeIdx = 0;
    else activeIdx = words.length - 1;
  }

  // Chunk into clean 4-5 word lines
  const chunks = [];
  let cur = [];
  for (let i = 0; i < words.length; i++) {
    cur.push({ ...words[i], idx: i });
    const textSoFar = cur.map((x) => x.word).join(' ');
    const hitEnd = /[.?!,]$/.test(words[i].word) && cur.length >= 3;
    if (cur.length >= 5 || textSoFar.length >= 28 || hitEnd || i === words.length - 1) {
      chunks.push(cur);
      cur = [];
    }
  }

  let chunkIdx = chunks.findIndex((ch) => activeIdx >= ch[0].idx && activeIdx <= ch[ch.length - 1].idx);
  if (chunkIdx === -1) chunkIdx = chunks.length - 1;
  const activeChunk = chunks[chunkIdx];

  // Wrap into max 2 balanced lines
  const maxLineWidth = WIDTH - 180;
  ctx.save();
  ctx.font = '800 58px PlusJakarta';
  const lines = [];
  let line = [];
  for (const tok of activeChunk) {
    const test = [...line, tok].map((t) => t.word).join(' ');
    if (ctx.measureText(test).width > maxLineWidth && line.length > 0) {
      lines.push(line);
      line = [tok];
    } else {
      line.push(tok);
    }
  }
  if (line.length) lines.push(line);

  const lineH = 74;
  const baseY = 2040 - ((lines.length - 1) * lineH) / 2;

  for (let l = 0; l < lines.length; l++) {
    const toks = lines[l];
    const spaceW = ctx.measureText(' ').width;
    const widths = toks.map((t) => ctx.measureText(t.word).width);
    const wordGap = Math.max(spaceW, 18) + 6;
    const totalW = widths.reduce((a, b) => a + b, 0) + wordGap * Math.max(0, toks.length - 1);
    let cursorX = (WIDTH - totalW) / 2;
    const ly = baseY + l * lineH;

    for (let k = 0; k < toks.length; k++) {
      const tok = toks[k];
      const wCenter = cursorX + widths[k] / 2;
      const isCurrent = tok.idx === activeIdx;
      const isPast = tok.idx < activeIdx;

      ctx.save();
      ctx.font = '800 58px PlusJakarta';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = isCurrent ? 'rgba(243,199,120,0.45)' : 'rgba(0,0,0,0.92)';
      ctx.shadowBlur = isCurrent ? 22 : 14;
      ctx.shadowOffsetY = isCurrent ? 0 : 4;

      const scale = isCurrent ? 1.04 : 1.0;
      ctx.translate(wCenter, ly);
      ctx.scale(scale, scale);

      if (isCurrent) ctx.fillStyle = PALETTE.bronzeLight;
      else if (isPast) ctx.fillStyle = PALETTE.sandstone;
      else ctx.fillStyle = 'rgba(245, 236, 215, 0.42)';

      ctx.fillText(tok.word, 0, 0);
      ctx.restore();

      cursorX += widths[k] + wordGap;
    }
  }
  ctx.restore();
}

// ============================================================================
// 6. SCENE LOADER & FRAME RENDER PIPELINE
// ============================================================================
export async function loadSceneModules() {
  const map = {};
  for (const sc of SCENES_DATA) {
    const absMod = join(SHORT4_DIR, sc.module);
    const mod = await import(`file://${absMod}`);
    map[sc.id] = mod.default || mod.renderScene;
  }
  return map;
}

export function renderFrameToCanvas(ctx, timeline, sceneRenderers, frameIdx) {
  const globalSec = frameIdx / FPS;
  let sceneIdx = timeline.scenes.findIndex((s) => frameIdx >= s.startFrame && frameIdx < s.endFrame);
  if (sceneIdx === -1) sceneIdx = timeline.scenes.length - 1;
  const scene = timeline.scenes[sceneIdx];
  const localSec = Math.max(0, globalSec - scene.startSec);
  const progress = clamp01(localSec / Math.max(0.01, scene.durationSec));

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Subtle scene-tailored backdrop tint
  const nightTint = scene.id === 'k05' ? 0.9 : scene.id === 'k06' ? Math.max(0, 0.7 - progress * 0.8) : 0;
  const crimsonTint = scene.id === 'k01' || scene.id === 'k04' ? 0.45 : 0;
  drawTacticalBackdrop(ctx, globalSec, { nightTint, crimsonTint });

  // Editorial camera dolly rig
  const camScale = 1 + 0.022 * easeInOutCubic(progress);
  const camY = Math.sin(globalSec * 0.45) * 4;
  ctx.save();
  ctx.translate(WIDTH / 2, 1020 + camY);
  ctx.scale(camScale, camScale);
  ctx.translate(-WIDTH / 2, -1020);

  const renderer = sceneRenderers[scene.id];
  if (renderer) {
    renderer(ctx, {
      scene,
      sceneIdx,
      globalSec,
      localSec,
      durationSec: scene.durationSec,
      progress,
      WIDTH,
      HEIGHT,
      PALETTE,
      clamp01,
      easeOutCubic,
      easeInOutCubic,
      easeOutBack,
      springPop,
      stagger,
      roundRectPath,
      drawText,
      drawDiamondBadge,
      drawSandTableSlab,
      drawTacticalUnit,
      drawTacticalPlaque,
      drawDamascusSword,
      drawTacticalArrow,
      drawBattleBanner,
      drawCompassRose,
    });
  }
  ctx.restore();

  // Smooth umber iris/fade transition between scenes
  if (sceneIdx > 0 && localSec < 0.16) {
    const enterFade = clamp01(1 - localSec / 0.16) * 0.55;
    ctx.save();
    ctx.fillStyle = `rgba(17, 14, 11, ${enterFade})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }
  const remSec = scene.endSec - globalSec;
  if (sceneIdx < timeline.scenes.length - 1 && remSec < 0.16) {
    const exitFade = clamp01(1 - remSec / 0.16) * 0.55;
    ctx.save();
    ctx.fillStyle = `rgba(17, 14, 11, ${exitFade})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  drawTacticalChrome(ctx, scene, sceneIdx, timeline.scenes.length, globalSec, timeline.totalDurationSec);
  drawFloatingKineticCaptions(ctx, scene, localSec);
}

// ============================================================================
// 7. CLI ENTRYPOINT: --scene=k01:0.85 PREVIEW OR FULL 2K 90FPS MP4 RENDER
// ============================================================================
async function main() {
  ensureFonts();
  const args = process.argv.slice(2);
  const sceneArg = args.find((a) => a.startsWith('--scene='));
  const rebuildAudio = args.includes('--rebuild-audio');

  let timeline;
  if (rebuildAudio || !existsSync(VIDEO_CONFIG.timelineFile)) {
    timeline = buildAudioAndTimeline();
  } else {
    timeline = JSON.parse(readFileSync(VIDEO_CONFIG.timelineFile, 'utf8'));
  }

  const sceneRenderers = await loadSceneModules();

  if (sceneArg) {
    const spec = sceneArg.replace('--scene=', '');
    const [sid, fracStr] = spec.split(':');
    const frac = fracStr !== undefined ? Number(fracStr) : 0.85;
    const sc = timeline.scenes.find((s) => s.id === sid);
    if (!sc) throw new Error(`Unknown scene id: ${sid}`);
    const targetFrame = Math.min(
      sc.endFrame - 1,
      Math.max(sc.startFrame, Math.round(sc.startFrame + sc.durationFrames * clamp01(frac))),
    );
    const canvas = new Canvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    renderFrameToCanvas(ctx, timeline, sceneRenderers, targetFrame);

    const previewDir = join(ROOT, 'out', 'short4_previews');
    mkdirSync(previewDir, { recursive: true });
    const outPng = join(previewDir, `${sid}.png`);
    await canvas.toFile(outPng, { format: 'png' });
    console.log(`Preview saved: ${outPng} (frame ${targetFrame} / ${(targetFrame / FPS).toFixed(2)}s)`);
    return;
  }

  const ffmpeg = findFfmpeg();
  mkdirSync(dirname(VIDEO_CONFIG.outputVideo), { recursive: true });

  const ffArgs = [
    '-y',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgba',
    '-s',
    `${WIDTH}x${HEIGHT}`,
    '-r',
    String(FPS),
    '-i',
    'pipe:0',
    '-i',
    VIDEO_CONFIG.masterAudioFile,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'copy',
    '-movflags',
    '+faststart',
    VIDEO_CONFIG.outputVideo,
  ];

  const ffProc = spawn(ffmpeg, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  let stdinClosed = false;
  ffProc.stdin.on('error', (err) => {
    if (err.code === 'EPIPE') {
      stdinClosed = true;
      return;
    }
    throw err;
  });

  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const totalFrames = timeline.totalFrames;
  const startWall = Date.now();

  for (let f = 0; f < totalFrames; f++) {
    if (stdinClosed) break;
    renderFrameToCanvas(ctx, timeline, sceneRenderers, f);
    const buf = Buffer.from(ctx.getImageData(0, 0, WIDTH, HEIGHT).data.buffer);
    if (!ffProc.stdin.write(buf)) {
      await new Promise((resolve) => ffProc.stdin.once('drain', resolve));
    }
    if (f % 450 === 0 || f === totalFrames - 1) {
      const pct = (((f + 1) / totalFrames) * 100).toFixed(1);
      const elapsed = ((Date.now() - startWall) / 1000).toFixed(1);
      console.log(`Render frame ${f + 1}/${totalFrames} (${pct}%) | elapsed ${elapsed}s`);
    }
  }

  ffProc.stdin.end();
  const exitCode = await new Promise((resolve) => ffProc.on('close', resolve));
  if (exitCode !== 0) throw new Error(`FFmpeg failed with exit code ${exitCode}`);

  const check = spawnSync(ffmpeg, ['-v', 'error', '-i', VIDEO_CONFIG.outputVideo, '-f', 'null', '-'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (check.status !== 0 || (check.stderr && check.stderr.trim().length > 0)) {
    throw new Error(`Decode verification failed: ${check.stderr}`);
  }
  console.log(`FULL DECODE OK -> ${VIDEO_CONFIG.outputVideo}`);
}

const isEntry = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
  (async () => {
    try {
      await main();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
