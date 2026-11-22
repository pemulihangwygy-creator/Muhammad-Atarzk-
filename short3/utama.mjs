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
  SHORT3_DIR,
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
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2');
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2');
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2');
  reg('PlusJakarta', 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2');
  reg('JetMono', 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff2');
  reg('Playfair', 'node_modules/@fontsource/playfair-display/files/playfair-display-latin-600-italic.woff2');
  reg('Playfair', 'node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2');
  reg('Amiri', 'node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff2');
  reg('Amiri', 'node_modules/@fontsource/amiri/files/amiri-arabic-700-normal.woff2');
  fontsLoaded = true;
}

// ============================================================================
// 1. PRO EDITORIAL PALETTE, PHYSICS & MOTION EASING
// ============================================================================
export const PALETTE = {
  bgObsidian: '#08090C',
  bgDeep: '#0D0F14',
  bgSlate: '#151821',
  cream: '#F4EFE6',
  parchment: '#F4EEDC',
  parchmentDark: '#DFD4B8',
  inkDark: '#171614',
  inkMuted: '#6D685F',
  goldLight: '#FDE68A',
  gold: '#F59E0B',
  goldDeep: '#B45309',
  brass: '#D97706',
  crimson: '#E84C3D',
  crimsonDeep: '#991B1B',
  emerald: '#10B981',
  emeraldDeep: '#064E3B',
  teal: '#2DD4BF',
  sky: '#38BDF8',
};

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeOutCubic(t) {
  const x = clamp01(t);
  return 1 - (1 - x) ** 3;
}

export function easeOutQuart(t) {
  const x = clamp01(t);
  return 1 - (1 - x) ** 4;
}

export function easeOutExpo(t) {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - 2 ** (-10 * x);
}

export function easeOutBack(t) {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

export function easeInOutCubic(t) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function springPop(t) {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  return 1 - Math.exp(-7 * x) * Math.cos(14 * x);
}

export function beat(localSec, start, dur, ease = easeOutCubic) {
  return ease(clamp01((localSec - start) / Math.max(0.001, dur)));
}

export function roundRectPath(ctx, x, y, w, h, r = 18) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
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

export function drawWrappedText(ctx, text, x, y, maxW, lineHeight, opts = {}) {
  const { align = 'center', maxLines = 8 } = opts;
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, x, y + idx * lineHeight);
  });
  ctx.restore();
  return lines.length * lineHeight;
}

/**
 * Draw 8-pointed Islamic Khatam Star Geometry (for subtle scholarly background motifs).
 */
export function drawIslamicStar(ctx, cx, cy, r, opts = {}) {
  const { stroke = 'rgba(245, 158, 11, 0.14)', lineWidth = 2, rotation = 0, fill = null } = opts;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  for (let sq = 0; sq < 2; sq++) {
    ctx.save();
    ctx.rotate((sq * Math.PI) / 4);
    ctx.beginPath();
    ctx.rect(-r, -r, r * 2, r * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawMicroPill(ctx, cx, cy, label, opts = {}) {
  const {
    dotColor = PALETTE.gold,
    bg = 'rgba(14, 16, 22, 0.92)',
    stroke = 'rgba(255, 255, 255, 0.14)',
    textColor = PALETTE.cream,
    font = '700 22px JetMono',
    padX = 24,
    height = 50,
    reveal = 1,
    align = 'center',
    checkIcon = false,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return null;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.font = font;
  const tw = ctx.measureText(label).width;
  const iconSpace = (dotColor || checkIcon) ? 24 : 0;
  const w = tw + padX * 2 + iconSpace;
  const x = align === 'left' ? cx : align === 'right' ? cx - w : cx - w / 2;
  const y = cy - height / 2 + (1 - p) * 12;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.50)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  roundRectPath(ctx, x, y, w, height, 12);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  let textStart = x + padX;
  if (checkIcon) {
    ctx.strokeStyle = dotColor;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + padX - 2, y + height / 2);
    ctx.lineTo(x + padX + 4, y + height / 2 + 6);
    ctx.lineTo(x + padX + 13, y + height / 2 - 5);
    ctx.stroke();
    textStart += iconSpace;
  } else if (dotColor) {
    ctx.fillStyle = dotColor;
    ctx.shadowColor = dotColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x + padX + 5, y + height / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    textStart += iconSpace;
  }

  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, textStart, y + height / 2 + 1);
  ctx.restore();
  return { x, y, w, h: height };
}

export function drawWaxOrInkSeal(ctx, cx, cy, label, opts = {}) {
  const {
    color = PALETTE.crimson,
    angle = -0.11,
    reveal = 1,
    font = '800 32px PlusJakarta',
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;
  const scale = 1.55 - 0.55 * springPop(p);

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  ctx.font = font;
  const tw = ctx.measureText(label).width;
  const w = tw + 44;
  const h = 64;

  // Impact dust burst when landing
  if (p > 0.1 && p < 0.75) {
    const burst = clamp01((p - 0.1) / 0.65);
    ctx.strokeStyle = `rgba(232, 76, 61, ${0.45 * (1 - burst)})`;
    ctx.lineWidth = 3;
    roundRectPath(ctx, -w / 2 - burst * 28, -h / 2 - burst * 18, w + burst * 56, h + burst * 36, 12);
    ctx.stroke();
  }

  roundRectPath(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fillStyle = 'rgba(232, 76, 61, 0.12)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4.5;
  ctx.stroke();

  roundRectPath(ctx, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 5);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 1);
  ctx.restore();
}

// ============================================================================
// 2. CONTEXT-AUTHENTIC ATMOSPHERIC ENVIRONMENTS (ISLAMIC SCHOLARLY WORLDS)
// ============================================================================

/**
 * Midnight Islamic Library & Mihrab Arches with Geometric Lattice & Floating Gold Motes (i01).
 */
export function drawIslamicArchiveBackdrop(ctx, localSec = 0, opts = {}) {
  const { warmth = 1 } = opts;
  ctx.save();

  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#07080B');
  bg.addColorStop(0.42, '#131117');
  bg.addColorStop(0.75, '#0B0B0F');
  bg.addColorStop(1, '#070709');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle architectural pointed Mihrab arch silhouettes in background
  ctx.strokeStyle = `rgba(245, 158, 11, ${0.07 * warmth})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const aw = 560 + i * 260;
    const topY = 380 - i * 95;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 - aw / 2, 1680);
    ctx.lineTo(WIDTH / 2 - aw / 2, topY + 340);
    ctx.quadraticCurveTo(WIDTH / 2 - aw / 2, topY + 90, WIDTH / 2, topY);
    ctx.quadraticCurveTo(WIDTH / 2 + aw / 2, topY + 90, WIDTH / 2 + aw / 2, topY + 340);
    ctx.lineTo(WIDTH / 2 + aw / 2, 1680);
    ctx.stroke();
  }

  // Slowly rotating subtle Khatam stars behind hero
  drawIslamicStar(ctx, WIDTH / 2, 920, 440, {
    stroke: `rgba(245, 158, 11, ${0.045 * warmth})`,
    lineWidth: 2,
    rotation: localSec * 0.03,
  });

  // Warm ambient center glow
  const rg = ctx.createRadialGradient(WIDTH / 2, 860, 40, WIDTH / 2, 860, 760);
  rg.addColorStop(0, `rgba(245, 158, 11, ${0.15 * warmth})`);
  rg.addColorStop(0.6, 'rgba(180, 83, 9, 0.05)');
  rg.addColorStop(1, 'rgba(8, 9, 12, 0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Golden ink motes drifting softly upward
  for (let i = 0; i < 34; i++) {
    const mx = ((i * 227 + Math.sin(localSec * 0.45 + i) * 38) % WIDTH + WIDTH) % WIDTH;
    const my = ((i * 179 - localSec * (16 + (i % 5) * 6)) % 1800 + 1800) % 1800;
    ctx.fillStyle = `rgba(253, 224, 71, ${0.12 + (i % 4) * 0.05})`;
    ctx.beginPath();
    ctx.arc(mx, my, 1.6 + (i % 3) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Caption floor fade
  const floor = ctx.createLinearGradient(0, 1540, 0, HEIGHT);
  floor.addColorStop(0, 'rgba(7, 8, 11, 0)');
  floor.addColorStop(0.45, 'rgba(7, 8, 11, 0.90)');
  floor.addColorStop(1, '#07080B');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 1540, WIDTH, HEIGHT - 1540);
  ctx.restore();
}

/**
 * Scholarly Astrolabe / Blueprint Grid Backdrop (i02, i07, i08).
 */
export function drawScholarlyGridBackdrop(ctx, localSec = 0, opts = {}) {
  const { glowColor = 'rgba(245, 158, 11, 0.14)', accent = PALETTE.gold } = opts;
  ctx.save();
  ctx.fillStyle = '#08090C';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Fine technical blueprint grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1.5;
  const step = 72;
  for (let x = 0; x <= WIDTH; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }

  // Subtle concentric astrolabe arcs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1.5;
  [360, 560, 780].forEach((r) => {
    ctx.beginPath();
    ctx.arc(WIDTH / 2, 860, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  const rg = ctx.createRadialGradient(WIDTH / 2, 860, 20, WIDTH / 2, 860, 740);
  rg.addColorStop(0, glowColor);
  rg.addColorStop(1, 'rgba(8, 9, 12, 0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 24; i++) {
    const mx = ((i * 241 + Math.sin(localSec * 0.4 + i) * 28) % WIDTH + WIDTH) % WIDTH;
    const my = ((i * 197 - localSec * (14 + (i % 4) * 5)) % HEIGHT + HEIGHT) % HEIGHT;
    ctx.fillStyle = accent === PALETTE.crimson
      ? `rgba(252, 165, 165, ${0.14 + (i % 3) * 0.04})`
      : `rgba(253, 230, 138, ${0.10 + (i % 3) * 0.04})`;
    ctx.beginPath();
    ctx.arc(mx, my, 1.8 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Dramatic Overhead Spotlight Stage on Dark Walnut Desk / Velvet Archive (i04, i06, i09).
 */
export function drawArchiveSpotlightStage(ctx, localSec = 0, opts = {}) {
  const { beamColor = 'rgba(245, 196, 130, 0.14)', floorY = 1580, emeraldTint = false } = opts;
  ctx.save();
  ctx.fillStyle = '#09090B';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle vertical wood/velvet paneling lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 2;
  for (let x = 72; x < WIDTH; x += 96) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, floorY); ctx.stroke();
  }

  // Conical overhead volumetric spotlight
  const cone = ctx.createLinearGradient(WIDTH / 2, 0, WIDTH / 2, floorY);
  cone.addColorStop(0, emeraldTint ? 'rgba(167, 243, 208, 0.18)' : 'rgba(254, 243, 199, 0.18)');
  cone.addColorStop(0.5, beamColor);
  cone.addColorStop(1, 'rgba(9, 9, 11, 0.02)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 200, 0);
  ctx.lineTo(WIDTH / 2 + 200, 0);
  ctx.lineTo(WIDTH / 2 + 660, floorY);
  ctx.lineTo(WIDTH / 2 - 660, floorY);
  ctx.closePath();
  ctx.fill();

  // Stage surface horizon & elliptical bounce light pool
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(WIDTH, floorY); ctx.stroke();

  const pool = ctx.createRadialGradient(WIDTH / 2, floorY + 18, 20, WIDTH / 2, floorY + 18, 560);
  pool.addColorStop(0, emeraldTint ? 'rgba(52, 211, 153, 0.16)' : 'rgba(245, 196, 130, 0.16)');
  pool.addColorStop(1, 'rgba(9, 9, 11, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(WIDTH / 2, floorY + 18, 560, 100, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 24; i++) {
    const t = (localSec * 0.22 + i * 0.15) % 1;
    const dx = WIDTH / 2 + Math.sin(i * 7 + localSec * 0.55) * (130 + t * 290);
    const dy = 110 + t * (floorY - 170);
    ctx.fillStyle = `rgba(253, 230, 138, ${0.18 * Math.sin(t * Math.PI)})`;
    ctx.beginPath();
    ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// 3. PRO MOTION-GRAPHICS 2.5D OBJECTS & EXPLANATORY PROPS
// ============================================================================

/**
 * 2.5D Aged Classical Manuscript Slip with Deckled Border, Ribbon Tag & Wax/Ink Seal (i01, i05, i06).
 */
export function drawManuscriptSlip(ctx, cx, cy, w, h, opts = {}) {
  const {
    indexTag = '01',
    eyebrow = 'KALIMAT VIRAL',
    arabic = '',
    headline = '',
    struckClaim = '',
    verdict = '',
    sealText = '',
    sealReveal = 0,
    tilt = 0,
    reveal = 1,
    accent = PALETTE.crimson,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy + (1 - p) * 32);
  ctx.rotate(tilt);

  // Soft 3D contact shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.60)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 16;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 18);
  const paper = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  paper.addColorStop(0, '#F7F2E4');
  paper.addColorStop(0.6, '#EFE7D2');
  paper.addColorStop(1, '#E0D5BA');
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Inner fine classical manuscript border rule
  roundRectPath(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 12);
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Left vertical index bookmark tab (`01`, `02`, `03`)
  roundRectPath(ctx, -w / 2 + 24, -h / 2 + 24, 68, h - 48, 12);
  ctx.fillStyle = '#1C1917';
  ctx.fill();
  ctx.font = '800 32px JetMono';
  ctx.fillStyle = PALETTE.gold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(indexTag, -w / 2 + 58, 0);

  const leftX = -w / 2 + 116;
  const contentW = w - 150;

  ctx.font = '700 20px JetMono';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(eyebrow, leftX, -h / 2 + 28);

  if (arabic) {
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 40px Amiri';
    ctx.fillStyle = '#78350F';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(arabic, w / 2 - 32, -h / 2 + 20);
    ctx.restore();
  }

  ctx.font = '800 35px PlusJakarta';
  ctx.fillStyle = PALETTE.inkDark;
  drawWrappedText(ctx, headline, leftX, -h / 2 + 66, contentW - 40, 44, { align: 'left', maxLines: 2 });

  if (struckClaim) {
    ctx.font = '700 22px JetMono';
    ctx.fillStyle = '#7C7467';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    const sy = h / 2 - 58;
    ctx.fillText(struckClaim, leftX, sy);
    const sw = ctx.measureText(struckClaim).width;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(leftX - 4, sy - 11);
    ctx.lineTo(leftX + sw + 4, sy - 11);
    ctx.stroke();
  }

  if (verdict) {
    ctx.font = '800 28px PlusJakarta';
    ctx.fillStyle = accent === PALETTE.crimson ? PALETTE.crimsonDeep : PALETTE.emeraldDeep;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(verdict, leftX, h / 2 - 22);
  }

  if (sealText && sealReveal > 0.02) {
    drawWaxOrInkSeal(ctx, w / 2 - 205, 36, sealText, {
      color: accent,
      reveal: sealReveal,
      angle: -0.10,
      font: '800 28px PlusJakarta',
    });
  }

  ctx.restore();
}

/**
 * 2.5D Brass & Mahogany Stamp Head Impacting from Above (i01 climax prop!).
 */
export function drawDescendingTakhrijStamp(ctx, cx, targetY, opts = {}) {
  const { impactProg = 0, localSec = 0 } = opts;
  const p = clamp01(impactProg);
  if (p <= 0.01 || p >= 0.99) return;

  // Descends fast, slams, rebounds smoothly upward
  const down = p < 0.45 ? easeOutQuart(p / 0.45) : 1 - easeInOutCubic((p - 0.45) / 0.55);
  const y = lerp(targetY - 420, targetY, down);

  ctx.save();
  const fadeEdge = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1;
  ctx.globalAlpha = clamp01(fadeEdge);
  ctx.translate(cx, y);

  // Turned mahogany handle
  const wood = ctx.createLinearGradient(-34, -220, 34, -220);
  wood.addColorStop(0, '#451A03');
  wood.addColorStop(0.45, '#92400E');
  wood.addColorStop(1, '#270E02');
  ctx.fillStyle = wood;
  roundRectPath(ctx, -32, -210, 64, 150, 28);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -210, 44, 0, Math.PI * 2);
  ctx.fill();

  // Polished Brass Collar + Rectangular Stamp Base
  const brass = ctx.createLinearGradient(-150, 0, 150, 0);
  brass.addColorStop(0, '#92400E');
  brass.addColorStop(0.35, '#FDE047');
  brass.addColorStop(0.65, '#D97706');
  brass.addColorStop(1, '#78350F');
  ctx.fillStyle = brass;
  roundRectPath(ctx, -46, -65, 92, 34, 8);
  ctx.fill();
  roundRectPath(ctx, -160, -34, 320, 48, 10);
  ctx.fill();

  // Crimson Rubber Die Pad underneath
  ctx.fillStyle = PALETTE.crimsonDeep;
  roundRectPath(ctx, -152, 12, 304, 14, 4);
  ctx.fill();
  ctx.restore();
}

/**
 * Animated 5-Link Golden Sanad Chain + Precision Astrolabe Dial (i02).
 */
export function drawAstrolabeAndSanadChain(ctx, cx, cy, opts = {}) {
  const {
    dialReveal = 1,
    chainProgress = 0,
    compareReveal = 0,
    localSec = 0,
  } = opts;
  const dp = clamp01(dialReveal);
  if (dp <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= dp;

  // Rotating Brass Astrolabe Dial
  ctx.save();
  ctx.translate(cx, cy - 120);
  ctx.rotate(localSec * 0.14);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.24)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, 285, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.beginPath(); ctx.arc(0, 0, 232, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const maj = i % 5 === 0;
    ctx.strokeStyle = maj ? 'rgba(251, 191, 36, 0.75)' : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = maj ? 2.5 : 1.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (maj ? 250 : 262), Math.sin(a) * (maj ? 250 : 262));
    ctx.lineTo(Math.cos(a) * 280, Math.sin(a) * 280);
    ctx.stroke();
  }
  ctx.restore();

  // Huge Vertical-Gradient Display Title (`SANAD`)
  ctx.save();
  const tg = ctx.createLinearGradient(0, cy - 220, 0, cy - 40);
  tg.addColorStop(0, '#FFFDF9');
  tg.addColorStop(0.55, '#FDE68A');
  tg.addColorStop(1, '#D97706');
  ctx.shadowColor = 'rgba(245, 158, 11, 0.34)';
  ctx.shadowBlur = 38;
  ctx.font = '800 165px PlusJakarta';
  ctx.fillStyle = tg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SANAD', cx, cy - 140);
  ctx.restore();

  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 220, cy - 55);
  ctx.lineTo(cx + 220, cy - 55);
  ctx.stroke();

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('SYARAT MUTLAK KEABSAHAN HADITS', cx, cy - 38);

  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = '700 42px Amiri';
  ctx.fillStyle = PALETTE.goldLight;
  ctx.fillText('الإِسْنَادُ مِنَ الدِّينِ', cx, cy + 20);
  ctx.restore();

  // Sequential 5-Node Interlocking Golden Chain Arc (Rasulullah -> Sahabat -> Tabi'in -> Jujur -> Sah)
  const nodes = [
    { x: cx - 480, label: 'RASULULLAH', sub: 'SUMBER WAHYU' },
    { x: cx - 240, label: 'SAHABAT', sub: 'ADIL & TEPERCAYA' },
    { x: cx, label: 'TABI\'IN', sub: 'BERSAMBUNG' },
    { x: cx + 240, label: 'PERAWI', sub: 'JUJUR & KUAT' },
    { x: cx + 480, label: 'KITAB SAH', sub: 'DIKUKUHKAN' },
  ];
  const chainY = cy + 255;

  nodes.forEach((nd, i) => {
    const np = clamp01(chainProgress * 5 - i * 0.78);
    if (np <= 0.02) return;

    // Interlocking brass/gold links connecting to previous node
    if (i > 0) {
      const prevX = nodes[i - 1].x;
      const linkP = clamp01(np * 1.4);
      const midEnd = lerp(prevX + 44, nd.x - 44, linkP);
      for (let lx = prevX + 62; lx <= midEnd; lx += 36) {
        ctx.save();
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 10;
        roundRectPath(ctx, lx - 14, chainY - 8, 28, 16, 8);
        ctx.stroke();
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 3.2;
        roundRectPath(ctx, lx - 11, chainY - 5, 22, 10, 5);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Node medallion
    ctx.save();
    ctx.globalAlpha *= np;
    ctx.translate(nd.x, chainY);
    const sc = springPop(np);
    ctx.scale(sc, sc);

    const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 58);
    g.addColorStop(0, 'rgba(251, 191, 36, 0.36)');
    g.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = i === 0 ? '#064E3B' : '#181A22';
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.font = '800 22px JetMono';
    ctx.fillStyle = PALETTE.goldLight;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`0${i + 1}`, 0, 1);

    ctx.font = '800 20px JetMono';
    ctx.fillStyle = PALETTE.cream;
    ctx.textBaseline = 'top';
    ctx.fillText(nd.label, 0, 56);
    ctx.font = '600 17px JetMono';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.55)';
    ctx.fillText(nd.sub, 0, 84);
    ctx.restore();
  });

  // Bottom Contrast Box: Sanad Utuh vs Tanpa Sanad ("Kata Mutiara")
  const cp = clamp01(compareReveal);
  if (cp > 0.02) {
    const bw = (WIDTH - 240) / 2 - 18;
    const bh = 185;
    const by = cy + 440 + (1 - cp) * 24;

    // Left: Valid Sanad
    ctx.save();
    ctx.globalAlpha *= cp;
    roundRectPath(ctx, 120, by, bw, bh, 18);
    ctx.fillStyle = 'rgba(6, 40, 32, 0.85)';
    ctx.fill();
    ctx.strokeStyle = PALETTE.teal;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.teal;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('✓ PUNYA SANAD UTUH', 152, by + 28);
    ctx.font = '800 34px PlusJakarta';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText('SAH SABDA NABI', 152, by + 72);
    ctx.font = '500 21px PlusJakarta';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
    ctx.fillText('Boleh diriwayatkan sebagai hadits', 152, by + 124);
    ctx.restore();

    // Right: Loose Pearl ("Hanyalah Kata Mutiara")
    const rx = WIDTH / 2 + 18;
    ctx.save();
    ctx.globalAlpha *= cp;
    roundRectPath(ctx, rx, by, bw, bh, 18);
    ctx.fillStyle = 'rgba(28, 18, 18, 0.88)';
    ctx.fill();
    ctx.strokeStyle = PALETTE.crimson;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.crimson;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('✕ TANPA SANAD (0 PERAWI)', rx + 32, by + 28);
    ctx.font = '800 34px PlusJakarta';
    ctx.fillStyle = PALETTE.goldLight;
    ctx.fillText('KATA MUTIARA', rx + 32, by + 72);
    ctx.font = '500 21px PlusJakarta';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
    ctx.fillText('Haram diklaim sabda Nabi SAW', rx + 32, by + 124);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 2.5D Brass & Glass Magnifying Loupe + Snapping Golden Chain Artifact (i04).
 */
export function drawBrassLoupeOverSanad(ctx, cx, cy, opts = {}) {
  const {
    chainReveal = 1,
    loupeSweep = 0,
    sealReveal = 0,
    snapProg = 0,
    localSec = 0,
  } = opts;
  const cp = clamp01(chainReveal);
  if (cp <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= cp;

  const sp = clamp01(snapProg);
  const recoil = sp * 28;

  // Chain Nodes: Rasulullah SAW -> Anas RA -> [ABU 'ATIKAH (CRACK)] -> Kitab Tarikh
  const nodes = [
    { x: cx - 390 - recoil * 0.4, label: 'RASULULLAH SAW', sub: 'SUMBER', status: 'ok' },
    { x: cx - 150 - recoil * 0.3, label: 'ANAS BIN MALIK', sub: 'SAHABAT RA', status: 'ok' },
    { x: cx + 115, label: 'ABU ‘ATIKAH', sub: 'TARIF BIN SULAIMAN', status: 'broken' },
    { x: cx + 390 + recoil * 0.5, label: 'KITAB TARIKH', sub: 'RIWAYAT TERTOLAK', status: 'dead' },
  ];

  // Intact gold links (Rasulullah -> Anas)
  for (let lx = nodes[0].x + 56; lx <= nodes[1].x - 56; lx += 34) {
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 9;
    roundRectPath(ctx, lx - 14, cy - 8, 28, 16, 8);
    ctx.stroke();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3;
    roundRectPath(ctx, lx - 10, cy - 5, 20, 10, 5);
    ctx.stroke();
  }

  // Fracture gap between Anas and Abu 'Atikah with glowing sparks
  const gx = (nodes[1].x + nodes[2].x) / 2;
  ctx.strokeStyle = PALETTE.crimson;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(gx - 22, cy - 28 * (0.3 + sp));
  ctx.lineTo(gx - 5, cy - 6);
  ctx.moveTo(gx + 22, cy + 28 * (0.3 + sp));
  ctx.lineTo(gx + 5, cy + 6);
  ctx.stroke();

  if (sp > 0.1) {
    for (let s = 0; s < 6; s++) {
      const ang = (s / 6) * Math.PI * 2 + localSec * 3;
      const dist = 16 + sp * 46;
      ctx.fillStyle = s % 2 === 0 ? '#FDE047' : PALETTE.crimson;
      ctx.beginPath();
      ctx.arc(gx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 3.5 * (1 - sp * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Corroded severed links (Abu 'Atikah -> Kitab)
  for (let lx = nodes[2].x + 68; lx <= nodes[3].x - 56; lx += 34) {
    ctx.strokeStyle = 'rgba(232, 76, 61, 0.45)';
    ctx.lineWidth = 7;
    roundRectPath(ctx, lx - 14, cy - 8, 28, 16, 8);
    ctx.stroke();
  }

  // Render Medallions
  nodes.forEach((nd) => {
    const isBroken = nd.status === 'broken';
    const isOk = nd.status === 'ok';
    const rad = isBroken ? 56 : 46;

    ctx.save();
    ctx.translate(nd.x, cy);
    if (isBroken) {
      const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 115);
      g.addColorStop(0, `rgba(232, 76, 61, ${0.42 + Math.sin(localSec * 5) * 0.12})`);
      g.addColorStop(1, 'rgba(232, 76, 61, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 115, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = isOk ? '#064E3B' : isBroken ? '#7F1D1D' : '#1F2937';
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = isOk ? PALETTE.teal : isBroken ? PALETTE.crimson : '#6B7280';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Turbaned scholar icon
    ctx.fillStyle = isBroken ? '#FECACA' : '#FEF3C7';
    ctx.beginPath(); ctx.arc(0, rad * 0.42, rad * 0.36, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 2, rad * 0.21, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(0, -rad * 0.20, rad * 0.28, rad * 0.16, -0.06, 0, Math.PI * 2); ctx.fill();

    if (isBroken && sp > 0.1) {
      ctx.strokeStyle = PALETTE.crimson;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-30, -30); ctx.lineTo(30, 30);
      ctx.moveTo(30, -30); ctx.lineTo(-30, 30);
      ctx.stroke();
    }

    ctx.font = '800 18px JetMono';
    ctx.fillStyle = isOk ? PALETTE.teal : isBroken ? '#FCA5A5' : '#9CA3AF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(nd.label, 0, rad + 42);
    ctx.font = '600 15px JetMono';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.55)';
    ctx.fillText(nd.sub, 0, rad + 68);
    ctx.restore();
  });

  // Detailed 2.5D Brass Magnifying Loupe Sweeping Onto Abu 'Atikah
  const loupeX = lerp(cx - 260, nodes[2].x, clamp01(loupeSweep));
  const loupeY = cy - 6 + Math.sin(localSec * 2) * 6;
  ctx.save();
  ctx.translate(loupeX, loupeY);

  // Handle (mahogany + brass ferrule)
  ctx.save();
  ctx.rotate(0.72);
  ctx.fillStyle = '#451A03';
  roundRectPath(ctx, 96, -12, 130, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#D97706';
  roundRectPath(ctx, 84, -15, 22, 30, 6);
  ctx.fill();
  ctx.restore();

  // Glass tint + chromatic reflection
  ctx.fillStyle = 'rgba(232, 76, 61, 0.12)';
  ctx.beginPath(); ctx.arc(0, 0, 86, 0, Math.PI * 2); ctx.fill();

  const rim = ctx.createLinearGradient(-86, -86, 86, 86);
  rim.addColorStop(0, '#FDE047');
  rim.addColorStop(0.5, '#D97706');
  rim.addColorStop(1, '#78350F');
  ctx.strokeStyle = rim;
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(0, 0, 86, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 68, Math.PI * 1.12, Math.PI * 1.48);
  ctx.stroke();
  ctx.restore();

  // Floating twin seals ("AL-BUKHARI: MATRUK" & "AN-NASA'I: MATRUK")
  const sr = clamp01(sealReveal);
  if (sr > 0.02) {
    drawMicroPill(ctx, cx - 255, cy - 220, 'IMAM AL-BUKHARI: MATRUK / TERTOLAK', {
      dotColor: PALETTE.crimson,
      bg: 'rgba(26, 12, 12, 0.94)',
      stroke: 'rgba(232, 76, 61, 0.48)',
      reveal: sr,
    });
    drawMicroPill(ctx, cx + 255, cy - 220, 'IMAM AN-NASA’I: TIDAK TEPERCAYA', {
      dotColor: PALETTE.crimson,
      bg: 'rgba(26, 12, 12, 0.94)',
      stroke: 'rgba(232, 76, 61, 0.48)',
      reveal: clamp01(sr * 1.4 - 0.35),
    });
  }

  ctx.restore();
}

/**
 * 2.5D Brass Scholar's Balance Scale (Mizan) for Fiqh vs Akidah & BUKAN HADITS (i06).
 */
export function drawBrassBalanceScale(ctx, cx, cy, opts = {}) {
  const { reveal = 1, tiltPhase = 0 } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy + (1 - p) * 24);

  // Heavy Brass Base & Pillar
  const brass = ctx.createLinearGradient(-40, 0, 40, 0);
  brass.addColorStop(0, '#78350F');
  brass.addColorStop(0.45, '#FDE047');
  brass.addColorStop(1, '#92400E');
  ctx.fillStyle = brass;

  roundRectPath(ctx, -110, 145, 220, 26, 12);
  ctx.fill();
  roundRectPath(ctx, -64, 122, 128, 26, 8);
  ctx.fill();
  ctx.fillRect(-10, -145, 20, 272);

  // Finial ornament on top
  ctx.beginPath(); ctx.arc(0, -158, 18, 0, Math.PI * 2); ctx.fill();

  // Tilting Balance Beam
  const tilt = Math.sin(tiltPhase * 1.6) * 0.055;
  ctx.save();
  ctx.translate(0, -120);
  ctx.rotate(tilt);

  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-250, 0);
  ctx.quadraticCurveTo(0, -18, 250, 0);
  ctx.stroke();

  // Left & Right Hanging Pans (kept horizontal against beam rotation)
  const pans = [
    { x: -245, label: 'FIKIH', sub: 'BOLEH BEDA', color: PALETTE.goldLight },
    { x: 245, label: 'AKIDAH', sub: 'WAJIB SATU', color: PALETTE.teal },
  ];
  pans.forEach((pn) => {
    ctx.save();
    ctx.translate(pn.x, 0);
    ctx.rotate(-tilt);

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-64, 130);
    ctx.moveTo(0, 0); ctx.lineTo(64, 130);
    ctx.stroke();

    // Brass Dish Pan
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(-74, 130);
    ctx.quadraticCurveTo(0, 165, 74, 130);
    ctx.closePath();
    ctx.fill();

    // Glowing Concept Pill above dish
    drawMicroPill(ctx, 0, 96, `${pn.label} · ${pn.sub}`, {
      dotColor: pn.color,
      bg: 'rgba(14, 16, 22, 0.94)',
      stroke: 'rgba(255, 255, 255, 0.16)',
      font: '700 18px JetMono',
      height: 40,
      padX: 16,
    });
    ctx.restore();
  });

  ctx.restore();
  ctx.restore();
}

/**
 * 2.5D Open Hardcover Sahih Book + Physical Explanatory Object (i08: Book/Quill & Crystal Ibrik).
 */
export function drawSahihVolumeCard(ctx, cx, cy, w, h, opts = {}) {
  const {
    badge = 'PENGGANTI SHAHIH #01',
    bookTitle = 'SUNAN IBNU MAJAH NO. 224',
    arabic = '',
    meaning = '',
    accent = PALETTE.gold,
    iconType = 'book', // 'book' | 'ibrik'
    localSec = 0,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy + (1 - p) * 28);

  // Dark Glass Slab with 3D Accent Left Spine
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 14;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 24);
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  bg.addColorStop(0, 'rgba(18, 22, 28, 0.96)');
  bg.addColorStop(1, 'rgba(11, 13, 18, 0.96)');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Left Physical 2.5D Explanatory Object Zone
  const objCx = -w / 2 + 165;
  const objCy = 10;
  ctx.save();
  ctx.translate(objCx, objCy);

  if (iconType === 'book') {
    // Open Glowing Hadith Volume + Brass Quill
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 130);
    g.addColorStop(0, 'rgba(245, 158, 11, 0.30)');
    g.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 130, 0, Math.PI * 2); ctx.fill();

    // Leather Cover Base
    roundRectPath(ctx, -105, -52, 210, 136, 12);
    ctx.fillStyle = '#78350F';
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Open Curved Cream Pages
    ctx.fillStyle = '#FAF5E8';
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.quadraticCurveTo(-48, -60, -92, -42);
    ctx.lineTo(-92, 68);
    ctx.quadraticCurveTo(-48, 52, 0, 72);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.quadraticCurveTo(48, -60, 92, -42);
    ctx.lineTo(92, 68);
    ctx.quadraticCurveTo(48, 52, 0, 72);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(28, 25, 23, 0.28)';
    ctx.lineWidth = 2.5;
    for (let r = -22; r <= 44; r += 16) {
      ctx.beginPath(); ctx.moveTo(-76, r); ctx.lineTo(-14, r + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, r + 4); ctx.lineTo(76, r); ctx.stroke();
    }

    // Floating Golden Quill Pen gently writing
    const qx = 32 + Math.sin(localSec * 3.2) * 14;
    const qy = -24 + Math.cos(localSec * 3.2) * 6;
    ctx.save();
    ctx.translate(qx, qy);
    ctx.rotate(-0.55);
    ctx.fillStyle = PALETTE.goldLight;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(22, -48, 6, -98);
    ctx.quadraticCurveTo(-16, -48, 0, 0);
    ctx.fill();
    ctx.restore();
  } else {
    // Detailed 2.5D Crystal Ibrik Pouring Sparkling Water into Concentric Ripples
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 130);
    g.addColorStop(0, 'rgba(45, 212, 191, 0.26)');
    g.addColorStop(1, 'rgba(45, 212, 191, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 130, 0, Math.PI * 2); ctx.fill();

    for (let r = 0; r < 3; r++) {
      const rp = (localSec * 0.75 + r * 0.33) % 1;
      ctx.strokeStyle = `rgba(45, 212, 191, ${0.65 * (1 - rp)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(26, 86, 26 + rp * 64, 8 + rp * 16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(-32, -22);
    ctx.rotate(0.45);
    const bodyG = ctx.createLinearGradient(-34, -44, 34, 44);
    bodyG.addColorStop(0, '#99F6E4');
    bodyG.addColorStop(0.5, '#2DD4BF');
    bodyG.addColorStop(1, '#0F766E');
    ctx.fillStyle = bodyG;
    ctx.beginPath(); ctx.ellipse(0, 12, 34, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-12, -52, 24, 30);
    ctx.beginPath(); ctx.ellipse(0, -52, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5EEAD4';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(22, -4); ctx.quadraticCurveTo(50, -18, 66, -34); ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(-30, -8, 22, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#CCFBF1';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, -24);
    ctx.quadraticCurveTo(42, 26, 26, 82);
    ctx.stroke();
  }
  ctx.restore();

  // Right Text Zone (Badge + Arabic + Meaning)
  const textCx = 135;
  ctx.font = '700 19px JetMono';
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${badge} · ${bookTitle}`, textCx, -h / 2 + 34);

  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = '700 50px Amiri';
  ctx.fillStyle = PALETTE.cream;
  ctx.textBaseline = 'middle';
  ctx.fillText(arabic, textCx, -8);
  ctx.restore();

  ctx.font = '700 28px PlusJakarta';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.85)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(meaning, textCx, h / 2 - 34);

  ctx.restore();
}

// ============================================================================
// 4. MINIMAL EDITORIAL CHROME & FLOATING KINETIC WORD CAPTIONS
// ============================================================================

export function drawMinimalCornerChrome(ctx, scene, sceneIdx, totalScenes, globalSec, totalDurSec) {
  ctx.save();

  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(68, 86, 12, 12);

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(VIDEO_CONFIG.channelHandle, 94, 93);

  ctx.font = '600 20px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.42)';
  ctx.textAlign = 'right';
  ctx.fillText(VIDEO_CONFIG.categoryLabel, WIDTH - 68, 93);

  ctx.font = '600 21px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.48)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(scene.chapter, 68, 2454);

  const dashW = 24;
  const dashGap = 12;
  const totalDashW = totalScenes * dashW + (totalScenes - 1) * dashGap;
  const startX = WIDTH - 68 - totalDashW;
  for (let i = 0; i < totalScenes; i++) {
    const dx = startX + i * (dashW + dashGap);
    ctx.fillStyle = i === sceneIdx ? PALETTE.gold : 'rgba(244, 239, 230, 0.22)';
    roundRectPath(ctx, dx, 2451, dashW, 5, 2.5);
    ctx.fill();
  }

  const pct = clamp01(globalSec / Math.max(0.1, totalDurSec));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, HEIGHT - 7, WIDTH, 7);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, HEIGHT - 7, WIDTH * pct, 7);

  ctx.restore();
}

function displayCaptionWord(raw) {
  return raw
    .replace(/\bshalallahu\b/gi, 'shallallahu')
    .replace(/\bsalam([.,?!]*)$/i, 'sallam$1');
}

export function drawFloatingKineticCaptions(ctx, scene, localSec) {
  const words = (scene.words || []).map((w) => ({
    ...w,
    word: displayCaptionWord(w.word),
  }));
  if (words.length === 0) return;

  const chunks = [];
  let current = [];
  for (const w of words) {
    current.push(w);
    const endsSentence = /[.?!]$/.test(w.word);
    if (current.length >= 10 || (endsSentence && current.length >= 3)) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length > 0) chunks.push(current);

  let activeChunk = chunks[chunks.length - 1];
  for (const ch of chunks) {
    if (localSec <= ch[ch.length - 1].end + 0.14) {
      activeChunk = ch;
      break;
    }
  }

  ctx.save();
  ctx.font = '800 62px PlusJakarta';
  const maxLineW = WIDTH - 200;
  const spaceW = ctx.measureText(' ').width * 1.08;

  const lines = [];
  let curLine = [];
  let curW = 0;
  for (const item of activeChunk) {
    const ww = ctx.measureText(item.word).width;
    if (curW + ww > maxLineW && curLine.length > 0) {
      lines.push(curLine);
      curLine = [item];
      curW = ww + spaceW;
    } else {
      curLine.push(item);
      curW += ww + spaceW;
    }
  }
  if (curLine.length > 0) lines.push(curLine);

  const lineHeight = 80;
  const blockH = lines.length * lineHeight;
  const startY = 2075 - blockH / 2;

  lines.forEach((ln, lineIdx) => {
    const totalLineW = ln.reduce((acc, it, idx) => acc + ctx.measureText(it.word).width + (idx > 0 ? spaceW : 0), 0);
    let drawX = WIDTH / 2 - totalLineW / 2;
    const drawY = startY + lineIdx * lineHeight;

    ln.forEach((it) => {
      const ww = ctx.measureText(it.word).width;
      const isActive = localSec >= it.start && localSec <= it.end + 0.05;
      const isSpoken = localSec > it.end + 0.05;

      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (isActive) {
        ctx.shadowColor = 'rgba(245, 158, 11, 0.55)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = PALETTE.goldLight;
        ctx.translate(drawX + ww / 2, drawY);
        ctx.scale(1.045, 1.045);
        ctx.fillText(it.word, -ww / 2, 0);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.70)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = isSpoken ? PALETTE.cream : 'rgba(244, 239, 230, 0.36)';
        ctx.fillText(it.word, drawX, drawY);
      }
      ctx.restore();
      drawX += ww + spaceW;
    });
  });

  ctx.restore();
}

// ============================================================================
// 5. SCENE LOADER, CAMERA RIG & CINEMATIC SCENE TRANSITIONS
// ============================================================================
async function loadSceneModules() {
  const map = new Map();
  for (const sc of SCENES_DATA) {
    const mod = await import(join(SHORT3_DIR, sc.module));
    map.set(sc.id, mod.renderScene);
  }
  return map;
}

function renderFrameToCanvas(ctx, timeline, sceneRenderers, frameIdx) {
  const globalSec = frameIdx / FPS;
  let sceneIdx = timeline.scenes.length - 1;
  for (let i = 0; i < timeline.scenes.length; i++) {
    if (frameIdx < timeline.scenes[i].endFrame) {
      sceneIdx = i;
      break;
    }
  }

  const scene = timeline.scenes[sceneIdx];
  const localSec = Math.max(0, globalSec - scene.startSec);
  const progress = clamp01(localSec / Math.max(0.1, scene.durationSec));

  // Subtle pro editor camera dolly-in micro motion across scene (1.00 -> 1.022)
  const camZoom = 1 + 0.022 * easeInOutCubic(progress);
  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT * 0.44);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-WIDTH / 2, -HEIGHT * 0.44);

  const renderer = sceneRenderers.get(scene.id);
  if (renderer) {
    renderer(ctx, scene, localSec, {
      WIDTH,
      HEIGHT,
      FPS,
      PALETTE,
      clamp01,
      lerp,
      easeOutCubic,
      easeOutQuart,
      easeOutExpo,
      easeOutBack,
      easeInOutCubic,
      springPop,
      beat,
      roundRectPath,
      drawWrappedText,
      drawIslamicStar,
      drawMicroPill,
      drawWaxOrInkSeal,
      drawIslamicArchiveBackdrop,
      drawScholarlyGridBackdrop,
      drawArchiveSpotlightStage,
      drawManuscriptSlip,
      drawDescendingTakhrijStamp,
      drawAstrolabeAndSanadChain,
      drawBrassLoupeOverSanad,
      drawBrassBalanceScale,
      drawSahihVolumeCard,
    });
  }
  ctx.restore();

  // Crisp editorial iris/fade entrance & exit transitions
  if (sceneIdx > 0 && localSec < 0.18) {
    const enterFade = clamp01(1 - localSec / 0.18) * 0.55;
    ctx.save();
    ctx.fillStyle = `rgba(8, 9, 12, ${enterFade})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }
  const remSec = scene.endSec - globalSec;
  if (sceneIdx < timeline.scenes.length - 1 && remSec < 0.18) {
    const exitFade = clamp01(1 - remSec / 0.18) * 0.55;
    ctx.save();
    ctx.fillStyle = `rgba(8, 9, 12, ${exitFade})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  drawMinimalCornerChrome(ctx, scene, sceneIdx, timeline.scenes.length, globalSec, timeline.totalDurationSec);
  drawFloatingKineticCaptions(ctx, scene, localSec);
}

// ============================================================================
// 6. CLI ENTRYPOINT: --scene=i01:0.85 PREVIEW OR FULL 2K 90FPS MP4 RENDER
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

    const previewDir = join(ROOT, 'out', 'short3_previews');
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
