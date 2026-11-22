#!/usr/bin/env node
/**
 * Engine Visual 2K 90FPS — Pro Editorial Motion Graphics Edition
 * Topik: "Kenapa Satu Kebaikan Dibalas 700 Kali Lipat dalam Islam?"
 * Arsitektur: Multi-theme editorial stages (Obsidian, Archival Paper, Sapphire, Cartographic Parchment)
 *             + Multi-beat VO-synced vector motion graphics + Multi-worker FFmpeg compositor
 */
import { Canvas, FontLibrary } from 'skia-canvas';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import {
  ROOT,
  WIDTH,
  HEIGHT,
  FPS,
  VIDEO_CONFIG,
  SCENES_DATA,
  findFfmpeg,
  buildAudioAndTimeline,
} from './script.mjs';

// ============================================================================
// 1. MULTI-WORLD EDITORIAL COLOR SYSTEM
// ============================================================================

export const THEME = {
  bgObsidian: '#060E0C',
  bgEmeraldDeep: '#081814',
  bgEmeraldMid: '#0D2620',
  bgEmeraldCard: '#0B1F1B',
  bgSapphireDeep: '#050C17',
  bgSapphireMid: '#0B192E',
  bgBronzeDeep: '#130F09',
  bgBronzeMid: '#211A10',

  paperCream: '#F4EFE3',
  paperWarm: '#EDE5D3',
  paperCard: '#FAF7F0',
  paperInk: '#131D19',
  paperInkMuted: '#4A5953',
  paperBorder: '#D2C8B3',

  parchmentBase: '#EAE0CA',
  parchmentMid: '#DFD2B5',
  parchmentCard: '#F4ECDA',
  parchmentInk: '#281F12',
  parchmentMuted: '#63533B',

  goldBright: '#FFE48C',
  goldMedina: '#D4A838',
  goldInk: '#9E7011',
  goldHighlight: '#F4CF58',

  turqBright: '#3CE5C6',
  turqMid: '#159F87',
  turqInk: '#0B6E57',

  crimsonBright: '#FF6B6B',
  crimsonInk: '#B82929',
  crimsonDeep: '#5C1B1B',

  ivory: '#F7F5EE',
  ivoryMuted: '#B4C0BB',
  slateText: '#7D8E87',
};

export const STAGE_WORLDS = {
  obsidian: {
    mode: 'dark',
    bgTop: '#061310',
    bgMid: '#0B231D',
    bgBot: '#040A09',
    grid: 'rgba(60, 229, 198, 0.055)',
    majorGrid: 'rgba(212, 168, 56, 0.09)',
    ink: '#F7F5EE',
    inkMuted: '#B4C0BB',
    accent: '#D4A838',
    accentBright: '#FFE48C',
    secondary: '#3CE5C6',
    cardBg: 'rgba(9, 24, 20, 0.94)',
    cardBorder: 'rgba(212, 168, 56, 0.34)',
    captionBg: 'rgba(6, 16, 14, 0.92)',
    captionBorder: 'rgba(212, 168, 56, 0.28)',
    hlBg: '#FFE48C',
    hlInk: '#060E0C',
  },
  paper: {
    mode: 'light',
    bgTop: '#F7F3EA',
    bgMid: '#F2ECE0',
    bgBot: '#E8E0CE',
    grid: 'rgba(19, 29, 25, 0.055)',
    majorGrid: 'rgba(11, 110, 87, 0.09)',
    ink: '#131D19',
    inkMuted: '#4A5953',
    accent: '#9E7011',
    accentBright: '#B88316',
    secondary: '#0B6E57',
    cardBg: 'rgba(252, 249, 243, 0.96)',
    cardBorder: 'rgba(19, 29, 25, 0.18)',
    captionBg: 'rgba(18, 28, 24, 0.94)',
    captionBorder: 'rgba(212, 168, 56, 0.4)',
    hlBg: '#F4CF58',
    hlInk: '#131D19',
  },
  justice: {
    mode: 'dark',
    bgTop: '#0A1312',
    bgMid: '#101F1D',
    bgBot: '#050A09',
    grid: 'rgba(255, 255, 255, 0.04)',
    majorGrid: 'rgba(212, 168, 56, 0.08)',
    ink: '#F7F5EE',
    inkMuted: '#BAC4BF',
    accent: '#D4A838',
    accentBright: '#FFE48C',
    secondary: '#3CE5C6',
    cardBg: 'rgba(12, 24, 22, 0.94)',
    cardBorder: 'rgba(212, 168, 56, 0.32)',
    captionBg: 'rgba(8, 16, 15, 0.93)',
    captionBorder: 'rgba(212, 168, 56, 0.28)',
    hlBg: '#FFE48C',
    hlInk: '#060E0C',
  },
  sapphire: {
    mode: 'dark',
    bgTop: '#050B16',
    bgMid: '#0A182D',
    bgBot: '#03070F',
    grid: 'rgba(60, 229, 198, 0.05)',
    majorGrid: 'rgba(115, 175, 255, 0.09)',
    ink: '#F4F7FC',
    inkMuted: '#A8B9CE',
    accent: '#3CE5C6',
    accentBright: '#8CF7E4',
    secondary: '#FFE48C',
    cardBg: 'rgba(8, 20, 38, 0.94)',
    cardBorder: 'rgba(60, 229, 198, 0.32)',
    captionBg: 'rgba(5, 13, 26, 0.93)',
    captionBorder: 'rgba(60, 229, 198, 0.3)',
    hlBg: '#FFE48C',
    hlInk: '#050C17',
  },
  parchment: {
    mode: 'light',
    bgTop: '#EFE6D2',
    bgMid: '#E6DAC0',
    bgBot: '#DACAA8',
    grid: 'rgba(40, 31, 18, 0.06)',
    majorGrid: 'rgba(158, 112, 17, 0.11)',
    ink: '#281F12',
    inkMuted: '#5D4E38',
    accent: '#9E7011',
    accentBright: '#B87E14',
    secondary: '#0B6E57',
    cardBg: 'rgba(247, 240, 225, 0.96)',
    cardBorder: 'rgba(93, 78, 56, 0.25)',
    captionBg: 'rgba(30, 23, 14, 0.94)',
    captionBorder: 'rgba(212, 168, 56, 0.42)',
    hlBg: '#E6BD48',
    hlInk: '#281F12',
  },
  bronze: {
    mode: 'dark',
    bgTop: '#130F09',
    bgMid: '#21190E',
    bgBot: '#0A0704',
    grid: 'rgba(232, 184, 75, 0.055)',
    majorGrid: 'rgba(232, 184, 75, 0.1)',
    ink: '#FAF6EB',
    inkMuted: '#C7BDA8',
    accent: '#E8B84B',
    accentBright: '#FFE48C',
    secondary: '#3CE5C6',
    cardBg: 'rgba(24, 18, 10, 0.94)',
    cardBorder: 'rgba(232, 184, 75, 0.34)',
    captionBg: 'rgba(15, 11, 6, 0.94)',
    captionBorder: 'rgba(232, 184, 75, 0.34)',
    hlBg: '#FFE48C',
    hlInk: '#130F09',
  },
};

export const SCENE_WORLD_MAP = {
  x01: 'obsidian',
  x02: 'paper',
  x03: 'justice',
  x04: 'obsidian',
  x05: 'justice',
  x06: 'obsidian',
  x07: 'paper',
  x08: 'paper',
  x09: 'sapphire',
  x10: 'sapphire',
  x11: 'parchment',
  x12: 'bronze',
  x13: 'paper',
  x14: 'obsidian',
};

// ============================================================================
// 2. FONT REGISTRATION
// ============================================================================

let fontsReady = false;

export function initFonts() {
  if (fontsReady) return;
  const fsDir = join(ROOT, 'node_modules', '@fontsource');
  FontLibrary.use('Amiri', [
    join(fsDir, 'amiri', 'files', 'amiri-arabic-400-normal.woff2'),
    join(fsDir, 'amiri', 'files', 'amiri-arabic-700-normal.woff2'),
  ]);
  FontLibrary.use('Cinzel', [
    join(fsDir, 'cinzel', 'files', 'cinzel-latin-700-normal.woff2'),
    join(fsDir, 'cinzel', 'files', 'cinzel-latin-900-normal.woff2'),
  ]);
  FontLibrary.use('Jakarta', [
    join(fsDir, 'plus-jakarta-sans', 'files', 'plus-jakarta-sans-latin-500-normal.woff2'),
    join(fsDir, 'plus-jakarta-sans', 'files', 'plus-jakarta-sans-latin-700-normal.woff2'),
    join(fsDir, 'plus-jakarta-sans', 'files', 'plus-jakarta-sans-latin-800-normal.woff2'),
  ]);
  FontLibrary.use('Playfair', [
    join(fsDir, 'playfair-display', 'files', 'playfair-display-latin-600-italic.woff2'),
    join(fsDir, 'playfair-display', 'files', 'playfair-display-latin-700-normal.woff2'),
  ]);
  FontLibrary.use('JetBrains', [
    join(fsDir, 'jetbrains-mono', 'files', 'jetbrains-mono-latin-600-normal.woff2'),
    join(fsDir, 'jetbrains-mono', 'files', 'jetbrains-mono-latin-700-normal.woff2'),
  ]);
  fontsReady = true;
}

// ============================================================================
// 3. MOTION CURVES, SPRING DYNAMICS & COLOR UTILITIES
// ============================================================================

export const TAU = Math.PI * 2;
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const clamp01 = (v) => clamp(v, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : clamp01((v - a) / (b - a)));
export const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeOutQuart = (t) => 1 - Math.pow(1 - clamp01(t), 4);
export const easeInOutQuart = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};
export const easeOutExpo = (t) => {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
export const easeOutBack = (t, s = 1.45) => {
  const x = clamp01(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
export const easeOutElastic = (t) => {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};

export function springVal(t, stiffness = 190, damping = 18) {
  if (t <= 0) return 0;
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * omega);
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return clamp(
      1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t)),
      0,
      1.12,
    );
  }
  return clamp01(1 - Math.exp(-omega * t) * (1 + omega * t));
}

export function stagger(localT, index, step = 0.14, dur = 0.5) {
  return clamp01((localT - index * step) / dur);
}

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha).toFixed(4)})`;
}

export function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const u = clamp01(t);
  const r = Math.round(lerp(a.r, b.r, u));
  const g = Math.round(lerp(a.g, b.g, u));
  const bl = Math.round(lerp(a.b, b.b, u));
  return `rgb(${r}, ${g}, ${bl})`;
}

// ============================================================================
// 4. CAMERA RIG (MULTI-BEAT PAN, ZOOM & IMPACT SHAKE)
// ============================================================================

export function createCameraState(localT, durationSec, opts = {}) {
  const z0 = opts.zoomStart ?? 1.018;
  const z1 = opts.zoomEnd ?? 1.0;
  const drift = easeInOutQuart(clamp01(localT / Math.max(1, durationSec)));
  let zoom = lerp(z0, z1, drift);
  let panX = opts.panX ?? 0;
  let panY = opts.panY ?? 0;

  if (opts.impactAt !== undefined) {
    const dt = localT - opts.impactAt;
    if (dt >= 0 && dt < 0.35) {
      const env = Math.exp(-dt * 12);
      panX += Math.sin(dt * 95) * 9 * env;
      panY += Math.cos(dt * 80) * 7 * env;
      zoom += 0.012 * env;
    }
  }
  return { zoom, panX, panY };
}

export function applyCamera(ctx, cam) {
  ctx.translate(WIDTH / 2 + cam.panX, HEIGHT / 2 + cam.panY);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);
}

// ============================================================================
// 5. VECTOR PRIMITIVES & EDITORIAL MOTION GRAPHICS BUILDING BLOCKS
// ============================================================================

export function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function drawStrokeLine(ctx, x1, y1, x2, y2, color, width = 2, dash = null) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawRegistrationMark(ctx, x, y, size = 14, color = 'rgba(212,168,56,0.35)') {
  drawStrokeLine(ctx, x - size, y, x + size, y, color, 1.5);
  drawStrokeLine(ctx, x, y - size, x, y + size, color, 1.5);
}

export function drawRubElHizbBadge(ctx, cx, cy, r, rot = 0, stroke = THEME.goldBright, lineW = 2, fill = null) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const s = r * 1.38;
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath();
    ctx.rect(-s / 2, -s / 2, s, s);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawEditorialPanel(ctx, x, y, w, h, worldKey = 'obsidian', opts = {}) {
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const r = opts.radius ?? 22;
  const accent = opts.accent || world.accent;
  const isLight = world.mode === 'light';

  ctx.save();
  ctx.shadowColor = isLight ? 'rgba(19, 29, 25, 0.12)' : 'rgba(0, 0, 0, 0.52)';
  ctx.shadowBlur = isLight ? 28 : 34;
  ctx.shadowOffsetY = isLight ? 12 : 16;
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = opts.fill || world.cardBg;
  ctx.fill();
  ctx.restore();

  roundRectPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = opts.border || (isLight ? rgba(accent, 0.38) : rgba(accent, 0.42));
  ctx.lineWidth = opts.borderWidth ?? 2;
  ctx.stroke();

  if (opts.headerLabel) {
    ctx.save();
    roundRectPath(ctx, x, y, w, 46, r);
    ctx.clip();
    ctx.fillStyle = isLight ? rgba(accent, 0.12) : rgba(accent, 0.14);
    ctx.fillRect(x, y, w, 46);
    drawStrokeLine(ctx, x, y + 46, x + w, y + 46, rgba(accent, 0.25), 1.5);
    ctx.font = '700 19px JetBrains';
    ctx.fillStyle = opts.headerInk || accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.headerLabel, x + w / 2, y + 24);
    ctx.restore();
  }
}

export function drawAnimatedArrow(ctx, x1, y1, x2, y2, progress, color, width = 4, headSize = 14) {
  const p = easeOutCubic(clamp01(progress));
  if (p <= 0.02) return;
  const cx = lerp(x1, x2, p);
  const cy = lerp(y1, y2, p);
  drawStrokeLine(ctx, x1, y1, cx, cy, color, width);

  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-headSize, -headSize * 0.58);
  ctx.lineTo(-headSize, headSize * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHighlighterStroke(ctx, x, y, w, h, progress, color = 'rgba(244, 207, 88, 0.45)') {
  const p = easeOutCubic(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  roundRectPath(ctx, x, y, w * p, h, 8);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawStampSeal(ctx, cx, cy, label, color, progress, angle = -0.15) {
  if (progress <= 0.01) return;
  const p = clamp01(progress);
  const sc = lerp(2.0, 1.0, easeOutBack(p, 1.8));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(sc, sc);
  ctx.globalAlpha = clamp01(p * 3);

  ctx.font = '900 40px JetBrains';
  const tw = ctx.measureText(label).width;
  const bw = tw + 66;
  const bh = 74;

  roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 12);
  ctx.fillStyle = 'rgba(20, 8, 8, 0.92)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4.5;
  ctx.stroke();

  roundRectPath(ctx, -bw / 2 + 7, -bh / 2 + 7, bw - 14, bh - 14, 8);
  ctx.strokeStyle = rgba(color, 0.55);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(label, 0, 2);
  ctx.restore();
}

export function drawCalloutTag(ctx, ax, ay, tx, ty, label, sublabel, worldKey, progress, align = 'right') {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.02) return;
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const color = world.mode === 'light' ? THEME.turqInk : THEME.turqBright;

  ctx.save();
  ctx.globalAlpha = p;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ax, ay, 7, 0, TAU);
  ctx.fill();

  const elbowX = align === 'right' ? Math.min(ax + 40, tx) : Math.max(ax - 40, tx);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(lerp(ax, elbowX, p), lerp(ay, ty, p));
  ctx.lineTo(lerp(elbowX, tx, p), ty);
  ctx.stroke();

  ctx.font = '800 21px JetBrains';
  const tw = Math.max(ctx.measureText(label).width, sublabel ? ctx.measureText(sublabel).width * 0.92 : 0);
  const pw = tw + 34;
  const ph = sublabel ? 64 : 42;
  const bx = align === 'right' ? tx : tx - pw;

  roundRectPath(ctx, bx, ty - ph / 2, pw, ph, 11);
  ctx.fillStyle = world.mode === 'light' ? '#FFFFFF' : '#091A16';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(label, bx + pw / 2, sublabel ? ty - 11 : ty + 1);
  if (sublabel) {
    ctx.font = '600 17px Jakarta';
    ctx.fillStyle = world.inkMuted;
    ctx.fillText(sublabel, bx + pw / 2, ty + 15);
  }
  ctx.restore();
}

export function drawBeatIndicatorBar(ctx, cx, y, totalBeats, activeBeat, worldKey = 'obsidian') {
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const gap = 14;
  const segW = 72;
  const totalW = totalBeats * segW + (totalBeats - 1) * gap;
  const sx = cx - totalW / 2;

  for (let i = 0; i < totalBeats; i++) {
    const bx = sx + i * (segW + gap);
    const active = i <= activeBeat;
    roundRectPath(ctx, bx, y, segW, 6, 3);
    ctx.fillStyle = active ? world.accent : rgba(world.inkMuted, 0.22);
    ctx.fill();
  }
}

// ============================================================================
// 6. CACHED MULTI-WORLD EDITORIAL STAGE BACKGROUNDS (ZERO PARTICLES)
// ============================================================================

const stageCache = new Map();

function buildEditorialStage(worldKey) {
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const c = new Canvas(WIDTH, HEIGHT);
  const g = c.getContext('2d');

  // Crisp studio radial + vertical depth
  const bg = g.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, world.bgTop);
  bg.addColorStop(0.5, world.bgMid);
  bg.addColorStop(1, world.bgBot);
  g.fillStyle = bg;
  g.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle architectural / museum paper studio spot lighting (non-distracting)
  const spot = g.createRadialGradient(WIDTH / 2, HEIGHT * 0.42, 60, WIDTH / 2, HEIGHT * 0.42, 960);
  if (world.mode === 'light') {
    spot.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    spot.addColorStop(1, 'rgba(220, 208, 182, 0.25)');
  } else {
    spot.addColorStop(0, rgba(world.secondary, 0.08));
    spot.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  }
  g.fillStyle = spot;
  g.fillRect(0, 0, WIDTH, HEIGHT);

  // Technical drafting / museum blueprint grid
  const step = 90;
  for (let x = 90; x < WIDTH; x += step) {
    const major = x % 360 === 0;
    drawStrokeLine(g, x, 0, x, HEIGHT, major ? world.majorGrid : world.grid, major ? 1.5 : 1);
  }
  for (let y = 90; y < HEIGHT; y += step) {
    const major = y % 360 === 0;
    drawStrokeLine(g, 0, y, WIDTH, y, major ? world.majorGrid : world.grid, major ? 1.5 : 1);
  }

  // Cartographic topographic rings for parchment world
  if (worldKey === 'parchment') {
    g.strokeStyle = 'rgba(158, 112, 17, 0.09)';
    g.lineWidth = 1.6;
    for (let r = 240; r <= 1200; r += 160) {
      g.beginPath();
      g.ellipse(WIDTH * 0.22, HEIGHT * 0.45, r, r * 0.62, 0.25, 0, TAU);
      g.stroke();
    }
  }

  // Clean architectural framing rails
  const frameCol = world.mode === 'light' ? 'rgba(19, 29, 25, 0.14)' : rgba(world.accent, 0.22);
  drawStrokeLine(g, 48, 44, WIDTH - 48, 44, frameCol, 1.5);
  drawStrokeLine(g, 48, HEIGHT - 44, WIDTH - 48, HEIGHT - 44, frameCol, 1.5);
  drawRegistrationMark(g, 66, 220, 12, rgba(world.accent, 0.42));
  drawRegistrationMark(g, WIDTH - 66, 220, 12, rgba(world.accent, 0.42));
  drawRegistrationMark(g, 66, 2020, 12, rgba(world.accent, 0.42));
  drawRegistrationMark(g, WIDTH - 66, 2020, 12, rgba(world.accent, 0.42));

  return c;
}

export function drawEditorialStage(ctx, worldKey = 'obsidian', totalT = 0) {
  if (!stageCache.has(worldKey)) {
    stageCache.set(worldKey, buildEditorialStage(worldKey));
  }
  ctx.drawImage(stageCache.get(worldKey), 0, 0);

  // Subtle single horizon accent line breathing gently
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const pulse = 0.22 + 0.08 * Math.sin(totalT * 1.4);
  drawStrokeLine(ctx, 90, 424, WIDTH - 90, 424, rgba(world.accent, pulse), 1.5);
}

// ============================================================================
// 7. ADAPTIVE EDITORIAL CHROME (TOP HUD, KINETIC HEADLINE, CAPTIONS, FOOTER)
// ============================================================================

export function drawTopHUD(ctx, scene, localT, worldKey = 'obsidian') {
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const isLight = world.mode === 'light';
  const enter = easeOutCubic(clamp01(localT / 0.35));

  ctx.save();
  ctx.globalAlpha = enter;

  // Channel Mark Top Left
  drawRubElHizbBadge(
    ctx,
    104,
    92,
    15,
    0,
    world.accent,
    2.2,
    isLight ? 'rgba(255,255,255,0.85)' : 'rgba(6, 16, 14, 0.9)',
  );
  ctx.font = '800 25px Jakarta';
  ctx.fillStyle = world.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(VIDEO_CONFIG.channelHandle, 134, 93);

  // Chapter + Topic Pill Top Right
  const pillText = `${scene.chapter}  ·  ${scene.badge}`;
  ctx.font = '700 20px JetBrains';
  const pw = ctx.measureText(pillText).width + 44;
  roundRectPath(ctx, WIDTH - 84 - pw, 69, pw, 46, 23);
  ctx.fillStyle = isLight ? 'rgba(11, 110, 87, 0.11)' : rgba(world.secondary, 0.13);
  ctx.fill();
  ctx.strokeStyle = isLight ? 'rgba(11, 110, 87, 0.45)' : rgba(world.secondary, 0.48);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = world.secondary;
  ctx.textAlign = 'center';
  ctx.fillText(pillText, WIDTH - 84 - pw / 2, 93);

  ctx.restore();
}

export function drawKineticHeadline(ctx, scene, localT, worldKey = 'obsidian') {
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const words = scene.headline.split(/\s+/);
  const hlSet = new Set(
    (scene.highlightWords || []).flatMap((ph) => ph.toUpperCase().split(/\s+/)),
  );

  ctx.save();
  ctx.font = '800 54px Jakarta';
  const lines = [];
  let cur = [];
  let curW = 0;
  const maxW = 1220;

  for (const w of words) {
    const ww = ctx.measureText(w + ' ').width;
    if (cur.length > 0 && curW + ww > maxW) {
      lines.push(cur);
      cur = [w];
      curW = ww;
    } else {
      cur.push(w);
      curW += ww;
    }
  }
  if (cur.length) lines.push(cur);

  const startY = lines.length === 1 ? 265 : 235;
  const lineH = 74;

  let wordIdx = 0;
  lines.forEach((lineWords, li) => {
    const widths = lineWords.map((w) => ctx.measureText(w).width);
    const spaceW = 18;
    const totalW = widths.reduce((a, b) => a + b, 0) + spaceW * (lineWords.length - 1);
    let x = WIDTH / 2 - totalW / 2;
    const y = startY + li * lineH;

    lineWords.forEach((word, wi) => {
      const sp = springVal(localT - wordIdx * 0.045, 220, 20);
      const ww = widths[wi];
      const isHl = hlSet.has(word.replace(/[^A-Z0-9×\-]/gi, '').toUpperCase());

      ctx.save();
      ctx.globalAlpha = clamp01(sp);
      ctx.translate(x + ww / 2, y + (1 - sp) * 18);

      if (isHl) {
        const pillP = easeOutExpo(clamp01((localT - 0.14 - wordIdx * 0.04) / 0.35));
        roundRectPath(ctx, -ww / 2 - 12, -31, (ww + 24) * pillP, 60, 12);
        ctx.fillStyle = world.hlBg;
        ctx.fill();
      }

      ctx.font = '800 54px Jakarta';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isHl ? world.hlInk : world.ink;
      ctx.fillText(word, 0, 0);
      ctx.restore();

      x += ww + spaceW;
      wordIdx++;
    });
  });

  ctx.restore();
}

export function drawArabicRibbon(ctx, scene, cx, cy, width, localT, worldKey = 'obsidian', opts = {}) {
  const delay = opts.delay ?? 0.5;
  const p = easeOutExpo(clamp01((localT - delay) / 0.65));
  if (p <= 0.02) return;

  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const isLight = world.mode === 'light';
  const arSize = opts.arabicSize ?? 46;
  const h = opts.showTrans !== false ? 156 : 108;

  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 20;

  drawEditorialPanel(ctx, cx - width / 2, cy - h / 2 + dy, width, h, worldKey, {
    radius: 20,
    accent: world.accent,
  });

  // Side accent bar
  roundRectPath(ctx, cx - width / 2 + 18, cy - h / 2 + 22 + dy, 6, h - 44, 3);
  ctx.fillStyle = world.accent;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${arSize}px Amiri`;
  ctx.fillStyle = isLight ? world.ink : THEME.goldBright;
  ctx.fillText(scene.arabic, cx, (opts.showTrans !== false ? cy - 22 : cy) + dy);

  if (opts.showTrans !== false && scene.arabicTrans) {
    ctx.font = 'italic 600 24px Playfair';
    ctx.fillStyle = world.inkMuted;
    ctx.fillText(`"${scene.arabicTrans}"`, cx, cy + 36 + dy);
  }

  ctx.restore();
}

export function drawBroadcastCaptions(ctx, scene, localT, worldKey = 'obsidian') {
  const words = scene.words || [];
  if (!words.length) return;
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;

  let activeIdx = 0;
  for (let i = 0; i < words.length; i++) {
    if (localT >= words[i].start) activeIdx = i;
  }

  const chunkSize = 5;
  const chunkIdx = Math.floor(activeIdx / chunkSize);
  const chunk = words.slice(chunkIdx * chunkSize, (chunkIdx + 1) * chunkSize);
  if (!chunk.length) return;

  const y = 2165;
  ctx.save();
  ctx.font = '800 38px Jakarta';
  const gap = 14;
  const widths = chunk.map((w) => ctx.measureText(w.word).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (chunk.length - 1);
  const boxW = Math.min(1260, totalW + 76);

  roundRectPath(ctx, WIDTH / 2 - boxW / 2, y - 44, boxW, 88, 22);
  ctx.fillStyle = world.captionBg;
  ctx.fill();
  ctx.strokeStyle = world.captionBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  let x = WIDTH / 2 - totalW / 2;
  chunk.forEach((wObj, i) => {
    const ww = widths[i];
    const isNow = localT >= wObj.start && localT <= wObj.end + 0.14;
    const isPast = localT > wObj.end + 0.14;

    if (isNow) {
      roundRectPath(ctx, x - 10, y - 28, ww + 20, 56, 12);
      ctx.fillStyle = 'rgba(244, 207, 88, 0.24)';
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isNow ? THEME.goldBright : isPast ? '#FFFFFF' : '#A9B8B2';
    ctx.fillText(wObj.word, x + ww / 2, y + 1);
    x += ww + gap;
  });

  ctx.restore();
}

export function drawSourceFooter(ctx, sourceText, localT, worldKey = 'obsidian') {
  const world = STAGE_WORLDS[worldKey] || STAGE_WORLDS.obsidian;
  const isLight = world.mode === 'light';
  const p = easeOutCubic(clamp01((localT - 0.15) / 0.45));
  ctx.save();
  ctx.globalAlpha = p;
  ctx.font = '700 21px JetBrains';
  const label = `SUMBER: ${sourceText}`;
  const tw = ctx.measureText(label).width + 44;

  roundRectPath(ctx, WIDTH / 2 - tw / 2, 2362, tw, 44, 12);
  ctx.fillStyle = isLight ? 'rgba(19, 29, 25, 0.08)' : 'rgba(255, 255, 255, 0.06)';
  ctx.fill();
  ctx.strokeStyle = isLight ? 'rgba(19, 29, 25, 0.2)' : 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = world.inkMuted;
  ctx.fillText(label, WIDTH / 2, 2385);
  ctx.restore();
}

// ============================================================================
// 8. SCENE-SPECIFIC PRO MOTION GRAPHICS MODULES (MULTI-BEAT, ZERO PARTICLES)
// ============================================================================

/**
 * X01: 3-Beat Opening Formula
 * Beat 1 (0.0-4.8s): Kinetic flip-tiles "1 + 1 = 2" (Human Math)
 * Beat 2 (4.8-10.4s): Left column slides/shrinks, Vertical Multiplier Escalator explodes 1 -> 10x -> 100x -> 700x -> ∞
 * Beat 3 (10.4-14.67s): 3-Pillar Documentary Roadmap + QS Al-Baqarah 2:261
 */
export function renderScene01(ctx, scene, localT, totalT) {
  const cx = WIDTH / 2;

  // Beat indicator
  const beat = localT < 4.8 ? 0 : localT < 10.4 ? 1 : 2;
  drawBeatIndicatorBar(ctx, cx, 456, 3, beat, 'obsidian');

  // Phase 1->2 morph progress
  const morphP = easeInOutQuart(clamp01((localT - 4.7) / 0.9));
  const roadP = easeOutExpo(clamp01((localT - 10.4) / 0.75));

  // TOP SECTION: Human Arithmetic ("1 + 1 = 2")
  const topY = lerp(820, 625, morphP);
  const topScale = lerp(1.06, 0.84, morphP);
  ctx.save();
  ctx.translate(cx, topY);
  ctx.scale(topScale, topScale);
  ctx.globalAlpha = lerp(1.0, 0.72, morphP);

  drawEditorialPanel(ctx, -470, -145, 940, 290, 'obsidian', {
    radius: 26,
    accent: THEME.crimsonBright,
    headerLabel: 'HITUNGAN MATEMATIKA MANUSIA · LINEAR',
  });

  const tokens = ['1', '+', '1', '=', '2'];
  const xs = [-310, -155, 0, 155, 310];
  tokens.forEach((tk, i) => {
    const sp = springVal(localT - 0.5 - i * 0.26, 210, 19);
    const isNum = i % 2 === 0;
    ctx.save();
    ctx.translate(xs[i], 24);
    ctx.scale(sp, sp);
    if (isNum) {
      roundRectPath(ctx, -64, -64, 128, 128, 20);
      ctx.fillStyle = i === 4 ? 'rgba(217, 72, 72, 0.16)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = i === 4 ? THEME.crimsonBright : 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.font = isNum ? '900 72px JetBrains' : '800 54px Jakarta';
    ctx.fillStyle = i === 4 ? THEME.crimsonBright : THEME.ivory;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tk, 0, 4);
    ctx.restore();
  });
  ctx.restore();

  // BEAT 2: Islamic Multiplication Escalator (slides in at 4.8s)
  if (morphP > 0.01) {
    const escY = lerp(1360, 1140, morphP);
    ctx.save();
    ctx.globalAlpha = morphP;

    drawEditorialPanel(ctx, cx - 560, escY - 295, 1120, 590, 'obsidian', {
      radius: 28,
      accent: THEME.goldMedina,
      headerLabel: 'MATEMATIKA LANGIT · RUMUS PELIPATGANDAAN ISLAM',
    });

    // 4 Climbing Architectural Columns: 1x -> 10x -> 700x -> ∞
    const cols = [
      { label: '1', sub: 'NIAT', h: 110, x: cx - 390, col: THEME.turqBright, t: 5.4 },
      { label: '10×', sub: 'MINIMAL', h: 195, x: cx - 130, col: THEME.turqBright, t: 6.4 },
      { label: '700×', sub: 'AL-BAQARAH', h: 315, x: cx + 130, col: THEME.goldBright, t: 8.2 },
      { label: '∞', sub: 'TANPA BATAS', h: 395, x: cx + 390, col: '#FFFFFF', t: 10.1 },
    ];
    const baseY = escY + 210;

    // Datum baseline
    drawStrokeLine(ctx, cx - 500, baseY, cx + 500, baseY, rgba(THEME.ivoryMuted, 0.35), 2);

    cols.forEach((c, idx) => {
      const cp = easeOutExpo(clamp01((localT - c.t) / 0.7));
      if (cp <= 0.01) return;
      const curH = c.h * cp;

      if (idx > 0) {
        const prev = cols[idx - 1];
        const ap = clamp01((localT - c.t + 0.25) / 0.4);
        drawAnimatedArrow(ctx, prev.x + 86, baseY - prev.h * 0.55, c.x - 86, baseY - curH * 0.55, ap, rgba(c.col, 0.7), 3, 10);
      }

      roundRectPath(ctx, c.x - 74, baseY - curH, 148, curH, 16);
      const grad = ctx.createLinearGradient(0, baseY - curH, 0, baseY);
      grad.addColorStop(0, rgba(c.col, 0.32));
      grad.addColorStop(1, rgba(c.col, 0.06));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = c.col;
      ctx.lineWidth = idx === 2 ? 3.5 : 2.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = c.label === '∞' ? '900 58px Jakarta' : '900 44px Cinzel';
      ctx.fillStyle = c.col;
      ctx.fillText(c.label, c.x, baseY - curH - 36);

      ctx.font = '700 18px JetBrains';
      ctx.fillStyle = THEME.ivoryMuted;
      ctx.fillText(c.sub, c.x, baseY + 28);
    });
    ctx.restore();
  }

  // BEAT 3 (10.4s+): 3-Pillar Roadmap Strip + Arabic Verse
  if (roadP > 0.02) {
    ctx.save();
    ctx.globalAlpha = roadP;
    const pillars = [
      { k: '01', t: 'ATURAN 10×', s: 'Al-An\'am 160', c: THEME.turqBright },
      { k: '02', t: 'POHON 700×', s: 'Al-Baqarah 261', c: THEME.goldBright },
      { k: '03', t: 'TANPA BATAS', s: 'Puasa & Sabar', c: '#FFFFFF' },
    ];
    pillars.forEach((pl, i) => {
      const px = cx - 540 + i * 370;
      const py = 1520 + (1 - roadP) * 24;
      drawEditorialPanel(ctx, px, py, 340, 122, 'obsidian', { radius: 18, accent: pl.c });
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '800 22px JetBrains';
      ctx.fillStyle = pl.c;
      ctx.fillText(pl.k, px + 24, py + 36);
      ctx.font = '800 26px Jakarta';
      ctx.fillStyle = THEME.ivory;
      ctx.fillText(pl.t, px + 72, py + 36);
      ctx.font = '500 21px Jakarta';
      ctx.fillStyle = THEME.ivoryMuted;
      ctx.fillText(pl.s, px + 24, py + 84);
    });
    ctx.restore();
  }

  drawArabicRibbon(ctx, scene, cx, 1835, 1100, localT, 'obsidian', {
    delay: 1.6,
    arabicSize: 48,
  });
}

/**
 * X02: Bright Archival Ivory Paper — Verse Anatomy Highlighter + Kinetic 1 -> 10 Unfolding Pillars
 * Beat 1 (0.0-5.4s): Quranic Manuscript with live highlighter pens marking Arabic clauses
 * Beat 2 (5.4-10.27s): 1 unit physically unfolds into 10 calibrated pillars above a >= 10x floor line
 */
export function renderScene02(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 5.4 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'paper');

  // BEAT 1: Archival Quranic Manuscript Card (Hero Arabic Anatomy — no duplicate bottom plaque!)
  const cardP = easeOutExpo(clamp01(localT / 0.7));
  ctx.save();
  ctx.globalAlpha = cardP;

  drawEditorialPanel(ctx, cx - 560, 520, 1120, 440, 'paper', {
    radius: 26,
    accent: THEME.turqInk,
    headerLabel: 'ANATOMI WAHYU · QS. AL-AN\'AM (6): 160',
  });

  // Live Marker Highlighter Sweeps behind Arabic phrases
  const hl1 = clamp01((localT - 2.4) / 0.85); // "مَن جَاءَ بِالْحَسَنَةِ" (right half)
  const hl2 = clamp01((localT - 6.8) / 0.85); // "فَلَهُ عَشْرُ أَمْثَالِهَا" (left half)

  drawHighlighterStroke(ctx, cx + 65, 650, 415, 76, hl1, 'rgba(11, 110, 87, 0.22)');
  drawHighlighterStroke(ctx, cx - 475, 650, 495, 76, hl2, 'rgba(244, 207, 88, 0.55)');

  // Main Arabic Calligraphy
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 66px Amiri';
  ctx.fillStyle = THEME.paperInk;
  ctx.fillText(scene.arabic, cx, 686);

  // Direct Callout Brackets under each Arabic half
  if (hl1 > 0.05) {
    ctx.save();
    ctx.globalAlpha = hl1;
    drawStrokeLine(ctx, cx + 272, 742, cx + 272, 782, THEME.turqInk, 3);
    roundRectPath(ctx, cx + 100, 782, 344, 52, 12);
    ctx.fillStyle = THEME.turqInk;
    ctx.fill();
    ctx.font = '800 22px JetBrains';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('1 KEBAIKAN SAJA', cx + 272, 809);
    ctx.restore();
  }

  if (hl2 > 0.05) {
    ctx.save();
    ctx.globalAlpha = hl2;
    drawStrokeLine(ctx, cx - 228, 742, cx - 228, 782, THEME.goldInk, 3);
    roundRectPath(ctx, cx - 440, 782, 424, 52, 12);
    ctx.fillStyle = '#F4CF58';
    ctx.fill();
    ctx.strokeStyle = THEME.goldInk;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '800 22px JetBrains';
    ctx.fillStyle = THEME.paperInk;
    ctx.fillText('MINIMAL 10× LIPATNYA', cx - 228, 809);
    ctx.restore();
  }

  ctx.font = 'italic 600 27px Playfair';
  ctx.fillStyle = THEME.paperInkMuted;
  ctx.fillText(`"${scene.arabicTrans}"`, cx, 902);
  ctx.restore();

  // BEAT 2: Kinetic Accordion Multiplication (1 Unit -> 10 Calibrated Architectural Pillars)
  const gridP = easeOutExpo(clamp01((localT - 1.5) / 0.7));
  ctx.save();
  ctx.globalAlpha = gridP;

  drawEditorialPanel(ctx, cx - 560, 1020, 1120, 920, 'paper', {
    radius: 26,
    accent: THEME.goldInk,
    headerLabel: 'MULTIPLIKASI DASAR · 1 KEBAIKAN MENJADI 10 PAHALA',
  });

  // Left: Input Block (1x)
  const srcX = cx - 415;
  const srcY = 1230;
  roundRectPath(ctx, srcX - 88, srcY - 88, 176, 176, 24);
  ctx.fillStyle = THEME.turqInk;
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 62px Cinzel';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('1×', srcX, srcY - 12);
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = '#D9FFF4';
  ctx.fillText('AMAL BAIK', srcX, srcY + 46);

  // Arrow from 1x into 10-pillar grid
  const arrP = clamp01((localT - 5.4) / 0.65);
  drawAnimatedArrow(ctx, srcX + 108, srcY, cx - 185, srcY, arrP, THEME.goldInk, 5, 16);

  // Right: 10 Kinetic Pillars unfolding 2 rows x 5 cols, plus bar height meter below
  const startGridX = cx - 140;
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const bx = startGridX + col * 132;
    const by = 1135 + row * 124;
    const sp = springVal(localT - 5.8 - i * 0.14, 240, 19);

    ctx.save();
    ctx.translate(bx + 54, by + 48);
    ctx.scale(sp, sp);
    roundRectPath(ctx, -54, -48, 108, 96, 16);
    ctx.fillStyle = i === 9 ? '#F4CF58' : '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = i === 9 ? THEME.goldInk : THEME.turqInk;
    ctx.lineWidth = i === 9 ? 3.5 : 2.5;
    ctx.stroke();

    ctx.font = '800 32px JetBrains';
    ctx.fillStyle = THEME.paperInk;
    ctx.fillText(`${i + 1}×`, 0, 2);
    ctx.restore();
  }

  // Bottom Floor Datum Ruler inside Panel: "BATAS MINIMAL: ≥ 10 KALI LIPAT"
  const barBaseY = 1790;
  drawStrokeLine(ctx, cx - 490, barBaseY, cx + 490, barBaseY, THEME.paperBorder, 3);
  // Minimum floor dashed line
  drawStrokeLine(ctx, cx - 490, barBaseY - 210, cx + 490, barBaseY - 210, THEME.crimsonInk, 2.5, [10, 8]);
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = THEME.crimsonInk;
  ctx.textAlign = 'left';
  ctx.fillText('STANDAR MINIMUM (10×)', cx - 485, barBaseY - 234);

  for (let i = 0; i < 10; i++) {
    const bx = cx - 455 + i * 94;
    const bp = easeOutExpo(clamp01((localT - 6.5 - i * 0.12) / 0.5));
    const bh = 210 * bp;
    roundRectPath(ctx, bx, barBaseY - bh, 64, bh, 10);
    ctx.fillStyle = i < 9 ? THEME.turqInk : '#D4A838';
    ctx.fill();
    ctx.font = '700 18px JetBrains';
    ctx.fillStyle = THEME.paperInkMuted;
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, bx + 32, barBaseY + 26);
  }

  ctx.font = '700 24px Jakarta';
  ctx.fillStyle = THEME.turqInk;
  ctx.textAlign = 'center';
  ctx.fillText('Tidak ada kebaikan yang dibalas di bawah 10× lipat', cx, 1882);

  ctx.restore();
}

/**
 * X03: Split-Screen Judicial Scale + Imam Al-Qurthubi Scholar Insight
 * Beat 1 (0.0-4.0s): 1:1 Mirror Block (1 Dosa = 1 Balasan Setimpal)
 * Beat 2 (4.0-13.7s): Mizan Balance + Imam Al-Qurthubi Scholar Callout (Rahmat vs Keadilan)
 */
export function renderScene03(ctx, scene, localT, totalT) {
  const cx = WIDTH / 2;
  const beat = localT < 4.0 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'justice');

  // Subtle vertical split backdrop accent (Left Crimson Justice | Right Emerald Mercy)
  ctx.save();
  const leftSplit = ctx.createLinearGradient(0, 480, cx, 480);
  leftSplit.addColorStop(0, 'rgba(217, 72, 72, 0.08)');
  leftSplit.addColorStop(1, 'rgba(217, 72, 72, 0.0)');
  ctx.fillStyle = leftSplit;
  ctx.fillRect(0, 480, cx, 1220);

  const rightSplit = ctx.createLinearGradient(cx, 480, WIDTH, 480);
  rightSplit.addColorStop(0, 'rgba(60, 229, 198, 0.0)');
  rightSplit.addColorStop(1, 'rgba(60, 229, 198, 0.08)');
  ctx.fillStyle = rightSplit;
  ctx.fillRect(cx, 480, cx, 1220);
  drawStrokeLine(ctx, cx, 500, cx, 1680, 'rgba(255, 255, 255, 0.08)', 2, [8, 8]);
  ctx.restore();

  // TOP: Precision Mizan Balance
  const pivY = 670;
  const beamP = easeOutElastic(clamp01((localT - 0.5) / 1.4));
  const sway = Math.sin(totalT * 1.4) * 0.014;
  const tilt = lerp(0, 0.21, beamP) + sway;

  drawStrokeLine(ctx, cx, pivY, cx, 985, THEME.goldMedina, 14);
  roundRectPath(ctx, cx - 190, 975, 380, 30, 12);
  ctx.fillStyle = THEME.goldMedina;
  ctx.fill();

  // Protractor dial
  ctx.strokeStyle = rgba(THEME.goldBright, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, pivY, 130, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();

  const arm = 370;
  const lx = cx - Math.cos(tilt) * arm;
  const ly = pivY - Math.sin(tilt) * arm;
  const rx = cx + Math.cos(tilt) * arm;
  const ry = pivY + Math.sin(tilt) * arm;

  drawStrokeLine(ctx, lx, ly, rx, ry, THEME.goldBright, 11);
  ctx.fillStyle = THEME.goldBright;
  ctx.beginPath();
  ctx.arc(cx, pivY, 18, 0, TAU);
  ctx.fill();

  // Left Pan: 1 Dosa (Light, exact 1:1)
  const lPanY = ly + 175;
  drawStrokeLine(ctx, lx, ly, lx - 90, lPanY, rgba(THEME.crimsonBright, 0.65), 3);
  drawStrokeLine(ctx, lx, ly, lx + 90, lPanY, rgba(THEME.crimsonBright, 0.65), 3);
  roundRectPath(ctx, lx - 105, lPanY, 210, 14, 7);
  ctx.fillStyle = THEME.crimsonBright;
  ctx.fill();

  roundRectPath(ctx, lx - 48, lPanY - 94, 96, 94, 18);
  ctx.fillStyle = THEME.crimsonMid;
  ctx.fill();
  ctx.strokeStyle = '#FFC2C2';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 40px Cinzel';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('1×', lx, lPanY - 46);

  // Right Pan: 10x-700x Kebaikan (Heavy Gold Stack)
  const rPanY = ry + 175;
  drawStrokeLine(ctx, rx, ry, rx - 95, rPanY, rgba(THEME.goldBright, 0.75), 3);
  drawStrokeLine(ctx, rx, ry, rx + 95, rPanY, rgba(THEME.goldBright, 0.75), 3);
  roundRectPath(ctx, rx - 115, rPanY, 230, 14, 7);
  ctx.fillStyle = THEME.goldBright;
  ctx.fill();

  const stacks = Math.round(lerp(1, 7, clamp01((localT - 0.8) / 1.2)));
  for (let i = 0; i < stacks; i++) {
    const sy = rPanY - 22 - i * 19;
    roundRectPath(ctx, rx - 78, sy, 156, 15, 5);
    ctx.fillStyle = i % 2 === 0 ? THEME.goldBright : THEME.goldMedina;
    ctx.fill();
  }
  ctx.font = '800 26px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('10× — 700×', rx, rPanY + 42);

  // Side Cards: Keadilan vs Rahmat (lighting up right when spoken at 7.5s & 9.8s!)
  const rahmatActive = clamp01((localT - 7.3) / 0.5);
  const adilActive = clamp01((localT - 9.7) / 0.5);

  drawEditorialPanel(ctx, cx - 565, 1085, 540, 215, 'justice', {
    radius: 22,
    accent: THEME.crimsonBright,
    border: adilActive > 0.2 ? THEME.crimsonBright : rgba(THEME.crimsonBright, 0.4),
    borderWidth: adilActive > 0.2 ? 3.5 : 2,
    headerLabel: 'KEADILAN ALLAH',
  });
  ctx.textAlign = 'center';
  ctx.font = '900 40px Cinzel';
  ctx.fillStyle = THEME.crimsonBright;
  ctx.fillText('1 DOSA = 1×', cx - 295, 1185);
  ctx.font = '500 23px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('Tidak pernah dilebihkan seberat pun', cx - 295, 1245);

  drawEditorialPanel(ctx, cx + 25, 1085, 540, 215, 'justice', {
    radius: 22,
    accent: THEME.turqBright,
    border: rahmatActive > 0.2 ? THEME.turqBright : rgba(THEME.turqBright, 0.4),
    borderWidth: rahmatActive > 0.2 ? 3.5 : 2,
    headerLabel: 'RAHMAT ALLAH',
  });
  ctx.font = '900 40px Cinzel';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('1 AMAL = 10×–700×', cx + 295, 1185);
  ctx.font = '500 23px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('Dilipatgandakan atas kemurahan-Nya', cx + 295, 1245);

  // BEAT 2 (4.1s+): Scholar Annotation Card — Imam Al-Qurthubi
  const qurtP = easeOutExpo(clamp01((localT - 4.1) / 0.65));
  if (qurtP > 0.02) {
    ctx.save();
    ctx.globalAlpha = qurtP;
    const dy = (1 - qurtP) * 24;
    drawEditorialPanel(ctx, cx - 565, 1345 + dy, 1130, 175, 'justice', {
      radius: 22,
      accent: THEME.goldBright,
    });
    roundRectPath(ctx, cx - 535, 1372 + dy, 190, 40, 10);
    ctx.fillStyle = THEME.goldBright;
    ctx.fill();
    ctx.font = '800 18px JetBrains';
    ctx.fillStyle = THEME.bgObsidian;
    ctx.textAlign = 'center';
    ctx.fillText('IMAM AL-QURTHUBI', cx - 440, 1393 + dy);

    ctx.textAlign = 'left';
    ctx.font = '700 27px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('Kebaikan digandakan karena Rahmat, keburukan tetap 1× karena Keadilan.', cx - 535, 1455 + dy);
    ctx.restore();
  }

  drawArabicRibbon(ctx, scene, cx, 1775, 1130, localT, 'justice', {
    delay: 1.1,
    arabicSize: 44,
  });
}

/**
 * X04: State-Machine Circuit & Angel Register Stamp
 * Beat 1 (0.0-5.2s): Heart Niat Node ignites -> signal travels rightward
 * Beat 2 (5.2-9.0s): Uzur/Obstacle gate blocks physical action -> divine bypass route triggers
 * Beat 3 (9.0-11.51s): Angel Register stamps "+1 HASANATAN KAMILAH"
 */
export function renderScene04(ctx, scene, localT, totalT) {
  const cx = WIDTH / 2;
  const beat = localT < 5.0 ? 0 : localT < 9.0 ? 1 : 2;
  drawBeatIndicatorBar(ctx, cx, 456, 3, beat, 'obsidian');

  drawEditorialPanel(ctx, cx - 565, 515, 1130, 990, 'obsidian', {
    radius: 28,
    accent: THEME.turqBright,
    headerLabel: 'MEKANISME PENCATATAN NIAT · BUKHARI 6491 & MUSLIM 131',
  });

  // Node 1: NIAT DI HATI (Top Left)
  const n1x = cx - 335;
  const n1y = 785;
  const n1p = springVal(localT - 0.5, 210, 18);
  ctx.save();
  ctx.translate(n1x, n1y);
  ctx.scale(n1p, n1p);
  roundRectPath(ctx, -170, -145, 340, 290, 24);
  ctx.fillStyle = 'rgba(60, 229, 198, 0.1)';
  ctx.fill();
  ctx.strokeStyle = THEME.turqBright;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Heart vector
  const beatS = 1 + 0.05 * Math.sin(totalT * 5);
  ctx.save();
  ctx.scale(beatS, beatS);
  ctx.fillStyle = THEME.turqBright;
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.bezierCurveTo(-56, -24, -64, -78, -22, -78);
  ctx.bezierCurveTo(-6, -78, 0, -60, 0, -52);
  ctx.bezierCurveTo(0, -60, 6, -78, 22, -78);
  ctx.bezierCurveTo(64, -78, 56, -24, 0, 22);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = '800 26px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('NIAT KEBAIKAN', 0, 74);
  ctx.font = '600 20px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('TERBENTUK DI HATI', 0, 108);
  ctx.restore();

  // Path to Obstacle Gate ("AMAL TERHALANG UZUR")
  const p1 = clamp01((localT - 5.2) / 1.0);
  drawAnimatedArrow(ctx, n1x + 170, n1y, cx + 115, n1y, p1, THEME.ivoryMuted, 4, 14);

  // Node 2: UZUR / BELUM SEMPAT (Top Right)
  const n2x = cx + 315;
  const uzP = easeOutExpo(clamp01((localT - 6.4) / 0.6));
  ctx.save();
  ctx.globalAlpha = Math.max(0.25, uzP);
  roundRectPath(ctx, n2x - 190, n1y - 115, 380, 230, 22);
  ctx.fillStyle = 'rgba(217, 72, 72, 0.1)';
  ctx.fill();
  ctx.strokeStyle = uzP > 0.5 ? THEME.crimsonBright : 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '800 24px JetBrains';
  ctx.fillStyle = THEME.crimsonBright;
  ctx.fillText('TERHALANG UZUR', n2x, n1y - 24);
  ctx.font = '500 22px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('Belum sempat terlaksana', n2x, n1y + 22);
  ctx.restore();

  // Bypass Circuit Path dropping down from Niat -> Catatan Malaikat
  const bypP = easeOutCubic(clamp01((localT - 7.3) / 1.1));
  if (bypP > 0.01) {
    ctx.save();
    ctx.strokeStyle = THEME.goldBright;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(n1x, n1y + 145);
    const kneeY = 1045;
    const seg1 = clamp01(bypP * 2.5);
    ctx.lineTo(n1x, lerp(n1y + 145, kneeY, seg1));
    if (bypP > 0.4) {
      const seg2 = clamp01((bypP - 0.4) / 0.35);
      ctx.lineTo(lerp(n1x, cx, seg2), kneeY);
    }
    if (bypP > 0.75) {
      const seg3 = clamp01((bypP - 0.75) / 0.25);
      ctx.lineTo(cx, lerp(kneeY, 1115, seg3));
    }
    ctx.stroke();

    roundRectPath(ctx, cx - 220, 1020, 440, 46, 12);
    ctx.fillStyle = '#081814';
    ctx.fill();
    ctx.strokeStyle = THEME.goldBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '700 20px JetBrains';
    ctx.fillStyle = THEME.goldBright;
    ctx.textAlign = 'center';
    ctx.fillText('JALUR RAHMAT · TETAP DICATAT', cx, 1044);
    ctx.restore();
  }

  // Node 3: CATATAN MALAIKAT + STAMP SEAL (Bottom Half)
  const regP = easeOutExpo(clamp01((localT - 1.2) / 0.7));
  ctx.save();
  ctx.globalAlpha = regP;
  drawEditorialPanel(ctx, cx - 480, 1125, 960, 320, 'obsidian', {
    radius: 24,
    accent: THEME.goldBright,
    headerLabel: 'KITAB CATATAN MALAIKAT',
  });

  ctx.textAlign = 'left';
  ctx.font = '700 22px JetBrains';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('STATUS NIAT :', cx - 430, 1235);
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('TERCATAT OTOMATIS', cx - 210, 1235);

  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('NILAI PAHALA:', cx - 430, 1295);
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('1 KEBAIKAN SEMPURNA', cx - 210, 1295);

  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('SYARAT      :', cx - 430, 1355);
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('Niat tulus meski belum terwujud', cx - 210, 1355);
  ctx.restore();

  // Animated Stamp at 9.2s ("dicatat satu kebaikan penuh")
  drawStampSeal(ctx, cx + 265, 1300, '+1 PENUH', THEME.goldBright, clamp01((localT - 9.2) / 0.4), -0.12);

  drawArabicRibbon(ctx, scene, cx, 1775, 1130, localT, 'obsidian', {
    delay: 1.5,
    arabicSize: 40,
  });
}

/**
 * X05: Trajectory Intercept & Vector Refraction
 * Beat 1 (0.0-4.7s): Red impulse ("NIAT BURUK") moves toward Dosa box
 * Beat 2 (4.7-7.1s): Shield ("TAKUT KEPADA ALLAH") drops and blocks vector
 * Beat 3 (7.1-10.79s): Deflected vector ascends to "+1 PAHALA SEMPURNA" + Hadith highlight
 */
export function renderScene05(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 4.7 ? 0 : localT < 7.1 ? 1 : 2;
  drawBeatIndicatorBar(ctx, cx, 456, 3, beat, 'justice');

  drawEditorialPanel(ctx, cx - 565, 515, 1130, 770, 'justice', {
    radius: 28,
    accent: THEME.goldMedina,
    headerLabel: 'INTERSEPSI NIAT BURUK KARENA TAKUT KEPADA ALLAH',
  });

  const stageCy = 900;
  const srcX = cx - 375;

  // Left: Dorongan Niat Buruk
  roundRectPath(ctx, srcX - 140, stageCy - 85, 280, 170, 20);
  ctx.fillStyle = 'rgba(217, 72, 72, 0.16)';
  ctx.fill();
  ctx.strokeStyle = THEME.crimsonBright;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = '#FFADAD';
  ctx.fillText('DORONGAN HATI', srcX, stageCy - 26);
  ctx.font = '800 32px Jakarta';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('NIAT BURUK', srcX, stageCy + 22);

  // Incoming Vector Line
  const vecP = clamp01((localT - 1.6) / 1.4);
  drawStrokeLine(ctx, srcX + 140, stageCy, lerp(srcX + 140, cx - 72, vecP), stageCy, THEME.crimsonBright, 6);

  // Center: Descending Shield ("TAKUT ALLAH") at 4.7s
  const shP = springVal(localT - 4.5, 240, 18);
  const shY = lerp(650, stageCy, clamp01(shP));
  ctx.save();
  ctx.translate(cx, shY);
  ctx.scale(Math.max(0.2, shP), Math.max(0.2, shP));
  ctx.beginPath();
  ctx.moveTo(0, -108);
  ctx.lineTo(94, -68);
  ctx.lineTo(78, 48);
  ctx.lineTo(0, 112);
  ctx.lineTo(-78, 48);
  ctx.lineTo(-94, -68);
  ctx.closePath();
  const sGrad = ctx.createLinearGradient(0, -108, 0, 112);
  sGrad.addColorStop(0, THEME.turqBright);
  sGrad.addColorStop(1, '#0A4E43');
  ctx.fillStyle = sGrad;
  ctx.fill();
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = '900 26px Jakarta';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('TAKUT', 0, -14);
  ctx.fillText('ALLAH', 0, 22);
  ctx.restore();

  // Upper Right: Deflected Path -> +1 PAHALA SEMPURNA (7.1s+)
  const reflP = clamp01((localT - 7.0) / 0.9);
  drawAnimatedArrow(ctx, cx + 82, stageCy - 30, cx + 195, stageCy - 140, reflP, THEME.goldBright, 5, 14);

  ctx.save();
  ctx.globalAlpha = Math.max(0.25, reflP);
  roundRectPath(ctx, cx + 195, stageCy - 230, 320, 180, 22);
  ctx.fillStyle = reflP > 0.5 ? 'rgba(255, 228, 140, 0.14)' : 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = reflP > 0.5 ? THEME.goldBright : 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('CATATAN MALAIKAT', cx + 355, stageCy - 178);
  ctx.font = '900 40px Cinzel';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('+1 PAHALA', cx + 355, stageCy - 122);
  ctx.font = '600 20px Jakarta';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('Kebaikan Sempurna', cx + 355, stageCy - 80);
  ctx.restore();

  // Lower Right: Cancelled Sin Path (0 DOSA)
  drawStrokeLine(ctx, cx + 82, stageCy + 34, cx + 195, stageCy + 135, 'rgba(217,72,72,0.38)', 3, [8, 8]);
  ctx.save();
  ctx.globalAlpha = 0.55;
  roundRectPath(ctx, cx + 195, stageCy + 65, 320, 145, 20);
  ctx.fillStyle = 'rgba(40, 15, 15, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,72,72,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = '#E08E8E';
  ctx.fillText('CATATAN DOSA', cx + 355, stageCy + 112);
  ctx.font = '800 34px Cinzel';
  ctx.fillStyle = '#B87676';
  ctx.fillText('0 (BATAL)', cx + 355, stageCy + 160);
  ctx.restore();

  // Hero Hadith Qudsi Card below diagram (with live yellow marker highlight!)
  const hadP = easeOutExpo(clamp01((localT - 5.2) / 0.7));
  ctx.save();
  ctx.globalAlpha = hadP;
  drawEditorialPanel(ctx, cx - 565, 1345, 1130, 325, 'justice', {
    radius: 26,
    accent: THEME.goldBright,
    headerLabel: 'FIRMAN ALLAH DALAM HADIS QUDSI · BUKHARI & MUSLIM',
  });
  drawHighlighterStroke(ctx, cx - 320, 1445, 640, 74, clamp01((localT - 6.0) / 0.8), 'rgba(255, 228, 140, 0.2)');
  ctx.font = '700 60px Amiri';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText(scene.arabic, cx, 1482);
  ctx.font = 'italic 600 28px Playfair';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText(`"${scene.arabicTrans}"`, cx, 1575);
  ctx.font = '600 23px Jakarta';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('Meninggalkan maksiat demi Allah langsung bernilai 1 kebaikan utuh', cx, 1628);
  ctx.restore();
}

/**
 * X06: Dynamic Camera-Tracked Exponential J-Curve
 * Milestones fire in exact sync with VO: 1x -> 10x (5.0s) -> 100x (5.8s) -> 700x (6.6s) -> ∞ (8.4s)
 */
export function renderScene06(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 4.7 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'obsidian');

  drawEditorialPanel(ctx, cx - 565, 515, 1130, 1085, 'obsidian', {
    radius: 28,
    accent: THEME.goldMedina,
    headerLabel: 'KURVA ESKALASI PAHALA SAAT NIAT DIAMALKAN',
  });

  const px = cx - 415;
  const py = 655;
  const pw = 875;
  const ph = 795;

  const yLevels = [
    { r: 0.08, lbl: '1×' },
    { r: 0.18, lbl: '10×' },
    { r: 0.36, lbl: '100×' },
    { r: 0.66, lbl: '700×' },
    { r: 0.94, lbl: '∞' },
  ];
  yLevels.forEach((lv) => {
    const ly = py + ph * (1 - lv.r);
    drawStrokeLine(ctx, px, ly, px + pw, ly, 'rgba(60, 229, 198, 0.13)', 1.5);
    ctx.font = '700 25px JetBrains';
    ctx.fillStyle = lv.lbl === '700×' || lv.lbl === '∞' ? THEME.goldBright : THEME.slateText;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(lv.lbl, px - 22, ly);
  });

  drawStrokeLine(ctx, px, py, px, py + ph, 'rgba(255,255,255,0.35)', 2.5);
  drawStrokeLine(ctx, px, py + ph, px + pw, py + ph, 'rgba(255,255,255,0.35)', 2.5);

  const pts = [
    { x: px + pw * 0.08, y: py + ph * (1 - 0.08), val: '1×', tag: 'NIAT', col: THEME.turqBright, t: 0.7 },
    { x: px + pw * 0.30, y: py + ph * (1 - 0.18), val: '10×', tag: 'MINIMAL', col: THEME.turqBright, t: 4.8 },
    { x: px + pw * 0.53, y: py + ph * (1 - 0.36), val: '100×', tag: 'BERTUMBUH', col: THEME.goldMedina, t: 5.7 },
    { x: px + pw * 0.76, y: py + ph * (1 - 0.66), val: '700×', tag: 'AL-BAQARAH', col: THEME.goldBright, t: 6.5 },
    { x: px + pw * 0.94, y: py + ph * (1 - 0.94), val: '∞', tag: 'TAK TERHINGGA', col: '#FFFFFF', t: 8.2 },
  ];

  // Smooth curve progress anchored to VO timestamps
  let segT = 0;
  if (localT >= 0.7 && localT < 4.8) segT = lerp(0, 1, clamp01((localT - 0.7) / 4.1));
  else if (localT >= 4.8 && localT < 6.5) segT = lerp(1, 3, clamp01((localT - 4.8) / 1.7));
  else if (localT >= 6.5) segT = lerp(3, 4, clamp01((localT - 6.5) / 2.2));

  // Sample curve points
  const samples = [];
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * segT;
    const idx = Math.min(3, Math.floor(u));
    const f = u - idx;
    const p0 = pts[idx];
    const p1 = pts[idx + 1];
    samples.push({ x: lerp(p0.x, p1.x, f), y: lerp(p0.y, p1.y, Math.pow(f, 1.35)) });
  }

  if (samples.length > 1) {
    // Shaded area
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(samples[0].x, py + ph);
    samples.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(samples[samples.length - 1].x, py + ph);
    ctx.closePath();
    const aGrad = ctx.createLinearGradient(0, py, 0, py + ph);
    aGrad.addColorStop(0, 'rgba(255, 228, 140, 0.34)');
    aGrad.addColorStop(1, 'rgba(60, 229, 198, 0.03)');
    ctx.fillStyle = aGrad;
    ctx.fill();

    // Main curve stroke
    ctx.beginPath();
    samples.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    const lGrad = ctx.createLinearGradient(px, py + ph, px + pw, py);
    lGrad.addColorStop(0, THEME.turqBright);
    lGrad.addColorStop(0.65, THEME.goldBright);
    lGrad.addColorStop(1, '#FFFFFF');
    ctx.strokeStyle = lGrad;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  pts.forEach((pt, idx) => {
    const active = segT >= idx - 0.05;
    const pop = active ? springVal(localT - pt.t, 220, 18) : 0;
    if (pop <= 0.01) return;

    drawStrokeLine(ctx, pt.x, pt.y, pt.x, py + ph, rgba(pt.col, 0.25), 2, [5, 5]);
    ctx.fillStyle = THEME.bgObsidian;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 13 * pop, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = pt.col;
    ctx.lineWidth = 4.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(pt.x, pt.y - 54);
    ctx.scale(pop, pop);
    roundRectPath(ctx, -64, -24, 128, 48, 12);
    ctx.fillStyle = idx >= 3 ? THEME.goldBright : '#0A221D';
    ctx.fill();
    ctx.strokeStyle = pt.col;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.font = pt.val === '∞' ? '900 32px Jakarta' : '800 24px JetBrains';
    ctx.fillStyle = idx >= 3 ? THEME.bgObsidian : pt.col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pt.val, 0, 1);
    ctx.restore();

    ctx.font = '700 18px JetBrains';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.textAlign = 'center';
    ctx.fillText(pt.tag, pt.x, py + ph + 32);
  });

  drawArabicRibbon(ctx, scene, cx, 1785, 1130, localT, 'obsidian', {
    delay: 1.5,
    arabicSize: 48,
  });
}

/**
 * X07: Bright Botanical Field-Journal Plate — 1 Seed -> Root Network -> 7 Fanning Wheat Stalks
 * Beat 1 (0.0-5.8s): Archival Specimen Plate & Soil Strata cross-section
 * Beat 2 (5.8-9.88s): Seed sprouts roots & 7 botanical stalks fan out with numbered dissection tags
 */
export function renderScene07(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 5.8 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'paper');

  drawEditorialPanel(ctx, cx - 565, 515, 1130, 1065, 'paper', {
    radius: 28,
    accent: THEME.turqInk,
    headerLabel: 'ILUSTRASI BOTANI AL-QUR\'AN · QS. AL-BAQARAH (2): 261',
  });

  // Top Specimen Measurement Ruler
  drawStrokeLine(ctx, cx - 495, 620, cx + 495, 620, 'rgba(19, 29, 25, 0.2)', 2);
  for (let i = 0; i <= 10; i++) {
    const rx = cx - 495 + i * 99;
    drawStrokeLine(ctx, rx, 610, rx, 628, 'rgba(19, 29, 25, 0.35)', 2);
  }
  ctx.font = '700 19px JetBrains';
  ctx.fillStyle = THEME.paperInkMuted;
  ctx.textAlign = 'left';
  ctx.fillText('SPESIMEN 01 · HABBATIN (1 BENIH)', cx - 495, 594);
  ctx.textAlign = 'right';
  ctx.fillText('HASIL: 7 SANABIL (TANGKAI)', cx + 495, 594);

  // Soil Cross-Section Strata
  const soilY = 1320;
  roundRectPath(ctx, cx - 525, soilY, 1050, 225, 18);
  const sGrad = ctx.createLinearGradient(0, soilY, 0, soilY + 225);
  sGrad.addColorStop(0, '#3C2B1A');
  sGrad.addColorStop(1, '#1F150B');
  ctx.fillStyle = sGrad;
  ctx.fill();
  drawStrokeLine(ctx, cx - 525, soilY, cx + 525, soilY, THEME.turqInk, 4);

  // Root system (grows at 3.5s)
  const rootP = easeOutCubic(clamp01((localT - 3.0) / 1.4));
  const seedY = soilY + 48;
  for (let r = 0; r < 9; r++) {
    const ang = lerp(0.28 * Math.PI, 0.72 * Math.PI, r / 8);
    const rLen = (75 + (r % 3) * 28) * rootP;
    drawStrokeLine(ctx, cx, seedY + 12, cx + Math.cos(ang) * rLen, seedY + 12 + Math.sin(ang) * rLen, '#D4A838', 2.5);
  }

  // 1 Butir Benih Seed
  const seedScale = springVal(localT - 0.6, 200, 18);
  ctx.save();
  ctx.translate(cx, seedY);
  ctx.scale(seedScale, seedScale);
  ctx.fillStyle = '#F4CF58';
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 17, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#7A540D';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.font = '700 22px JetBrains';
  ctx.fillStyle = '#FFE48C';
  ctx.textAlign = 'left';
  ctx.fillText('1 BUTIR BENIH DITANAM', cx - 495, soilY + 46);

  // 7 Botanical Wheat Stalks fanning out cleanly (blooms smoothly 4.8s -> 7.6s)
  const stalkCount = 7;
  for (let i = 0; i < stalkCount; i++) {
    const norm = i - 3;
    const sp = easeOutCubic(clamp01((localT - 4.7 - Math.abs(norm) * 0.22) / 1.35));
    if (sp <= 0.01) continue;

    const tipX = cx + norm * 140;
    const tipY = 740 + Math.abs(norm) * 32;
    const ctrlX = cx + norm * 42;
    const ctrlY = 1040;

    const curX = lerp(cx, tipX, sp);
    const curY = lerp(soilY, tipY, sp);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, soilY);
    ctx.quadraticCurveTo(lerp(cx, ctrlX, sp), lerp(soilY, ctrlY, sp), curX, curY);
    ctx.strokeStyle = THEME.turqInk;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // Botanical Leaves
    if (sp > 0.45) {
      const lp = clamp01((sp - 0.45) / 0.35);
      const lx = lerp(cx, tipX, 0.48);
      const ly = lerp(soilY, tipY, 0.48);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(norm * 0.25);
      ctx.fillStyle = THEME.turqInk;
      ctx.beginPath();
      ctx.ellipse(norm >= 0 ? 22 : -22, 0, 26 * lp, 8 * lp, norm >= 0 ? 0.35 : -0.35, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Golden Wheat Spike aligned to stalk tangent + Numbered Dissection Tag
    if (sp > 0.7) {
      const ep = clamp01((sp - 0.7) / 0.3);
      const tangent = Math.atan2(curY - ctrlY, curX - ctrlX) + Math.PI / 2;
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(tangent);
      for (let g = 0; g < 6; g++) {
        const gy = g * 15;
        ctx.fillStyle = '#D4A838';
        ctx.beginPath();
        ctx.ellipse(-9, gy, 7.5 * ep, 12 * ep, -0.38, 0, TAU);
        ctx.ellipse(9, gy, 7.5 * ep, 12 * ep, 0.38, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#7A540D';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();

      const tagY = curY - 48;
      roundRectPath(ctx, curX - 24, tagY - 19, 48, 38, 10);
      ctx.fillStyle = THEME.paperInk;
      ctx.fill();
      ctx.font = '800 20px JetBrains';
      ctx.fillStyle = '#F4CF58';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), curX, tagY + 1);
    }
  }

  drawArabicRibbon(ctx, scene, cx, 1785, 1130, localT, 'paper', {
    delay: 1.0,
    arabicSize: 48,
  });
}

/**
 * X08: Botanical Macro Zoom + 7 x 100 = 700 Multiplier + Closing Promise
 * Beat 1 (0.0-4.2s): Zoom Loupe onto 1 Wheat Ear -> 10x10 = 100 Grains
 * Beat 2 (4.2-8.2s): 7 x 100 Equation Snap -> 700x
 * Beat 3 (8.2-14.01s): Closing Promise Highlight (Tafsir Ibnu Katsir)
 */
export function renderScene08(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 4.2 ? 0 : localT < 8.2 ? 1 : 2;
  drawBeatIndicatorBar(ctx, cx, 456, 3, beat, 'paper');

  drawEditorialPanel(ctx, cx - 565, 515, 1130, 1065, 'paper', {
    radius: 28,
    accent: THEME.goldInk,
    headerLabel: 'DIAGNOSTIK PERKALIAN · 7 TANGKAI × 100 BIJI = 700×',
  });

  // Left: Detailed Sunbulah Ear
  const wx = cx - 375;
  const wy = 835;
  drawStrokeLine(ctx, wx, wy + 190, wx, wy - 190, THEME.goldInk, 7);
  for (let row = 0; row < 9; row++) {
    const ry = wy + 130 - row * 37;
    const ws = 1 - Math.abs(row - 4) * 0.07;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(wx + side * 24, ry);
      ctx.rotate(side * 0.42);
      ctx.fillStyle = row % 2 === 0 ? '#F4CF58' : '#D4A838';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * ws, 28 * ws, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#7A540D';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Horizontal Magnifier Connector (clean separation!)
  const loupeX = cx + 260;
  const loupeY = 820;
  drawStrokeLine(ctx, wx + 65, loupeY, loupeX - 205, loupeY, THEME.turqInk, 3.5);
  roundRectPath(ctx, cx - 260, loupeY - 26, 286, 52, 13);
  ctx.fillStyle = THEME.turqInk;
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 21px JetBrains';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('1 TANGKAI = 100 BIJI', cx - 117, loupeY + 1);

  // Optical Loupe Ring with 10x10 = 100 Grains
  ctx.save();
  ctx.translate(loupeX, loupeY);
  ctx.fillStyle = '#10241E';
  ctx.beginPath();
  ctx.arc(0, 0, 198, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#D4A838';
  ctx.lineWidth = 8;
  ctx.stroke();

  const matP = easeOutCubic(clamp01((localT - 0.6) / 2.0));
  const lit = Math.round(matP * 100);
  const startG = -117;
  const cell = 26;
  let k = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const gx = startG + c * cell;
      const gy = startG + r * cell;
      const on = k < lit;
      ctx.fillStyle = on ? THEME.goldBright : 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(gx, gy, 7, 10, 0, 0, TAU);
      ctx.fill();
      k++;
    }
  }
  ctx.restore();

  // BEAT 2 (3.3s+): 7 Mini-Blocks x 100 -> 700x Equation
  const eqP = easeOutExpo(clamp01((localT - 3.3) / 0.8));
  if (eqP > 0.02) {
    ctx.save();
    ctx.globalAlpha = eqP;
    for (let i = 0; i < 7; i++) {
      const bx = cx - 490 + i * 144;
      const by = 1110;
      const sp = springVal(localT - 3.4 - i * 0.1, 240, 20);
      ctx.save();
      ctx.translate(bx + 60, by + 44);
      ctx.scale(sp, sp);
      roundRectPath(ctx, -60, -44, 120, 88, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = THEME.turqInk;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.font = '800 28px JetBrains';
      ctx.fillStyle = THEME.paperInk;
      ctx.fillText('100', 0, -6);
      ctx.font = '700 15px JetBrains';
      ctx.fillStyle = THEME.turqInk;
      ctx.fillText(`TANGKAI ${i + 1}`, 0, 24);
      ctx.restore();
    }

    // Equation Total Banner
    const sumP = easeOutExpo(clamp01((localT - 5.2) / 0.6));
    ctx.globalAlpha = sumP;
    roundRectPath(ctx, cx - 490, 1245, 980, 118, 22);
    ctx.fillStyle = THEME.paperInk;
    ctx.fill();
    ctx.strokeStyle = '#D4A838';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '800 38px Cinzel';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('7 TANGKAI  ×  100 BIJI  =', cx - 105, 1306);
    ctx.font = '900 58px Cinzel';
    ctx.fillStyle = THEME.goldBright;
    ctx.fillText('700×', cx + 310, 1306);
    ctx.restore();
  }

  // BEAT 3 (7.2s+): Tafsir Ibnu Katsir Promise Callout inside Panel
  const p3 = easeOutExpo(clamp01((localT - 7.3) / 0.7));
  if (p3 > 0.02) {
    ctx.save();
    ctx.globalAlpha = p3;
    roundRectPath(ctx, cx - 490, 1405, 980, 128, 18);
    ctx.fillStyle = 'rgba(11, 110, 87, 0.1)';
    ctx.fill();
    ctx.strokeStyle = THEME.turqInk;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '700 20px JetBrains';
    ctx.fillStyle = THEME.turqInk;
    ctx.fillText('JANJI PENUTUP AYAT · TAFSIR IBNU KATSIR', cx, 1445);
    ctx.font = '700 27px Jakarta';
    ctx.fillStyle = THEME.paperInk;
    ctx.fillText('700× bukanlah batas akhir — Allah melipatgandakan lebih bagi yang ikhlas', cx, 1492);
    ctx.restore();
  }

  drawArabicRibbon(ctx, scene, cx, 1785, 1130, localT, 'paper', {
    delay: 1.0,
    arabicSize: 48,
  });
}

/**
 * X09: Midnight Sapphire — Deeds Capped at 700x, Then PUASA Blasts Through Ceiling
 * Beat 1 (0.0-10.5s): Standard deeds (Shalat, Sedekah, Dzikir) capped at 700x barrier
 * Beat 2 (10.5-13.87s): PUASA column surges upward, breaks the 700x ceiling, reveals Hilal + Direct Reward
 */
export function renderScene09(ctx, scene, localT, totalT) {
  const cx = WIDTH / 2;
  const beat = localT < 10.5 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'sapphire');

  drawEditorialPanel(ctx, cx - 565, 515, 1130, 1085, 'sapphire', {
    radius: 28,
    accent: THEME.turqBright,
    headerLabel: 'PENGECUALIAN KHUSUS · PUASA MENEMBUS BATAS 700×',
  });

  const baseY = 1480;
  const ceilingY = 930;

  // Ceiling Barrier Line at 700x (fractures/lifts when Puasa hits 11.4s!)
  const breachP = easeOutExpo(clamp01((localT - 11.3) / 0.8));
  drawStrokeLine(ctx, cx - 495, ceilingY, cx + 120, ceilingY, THEME.crimsonBright, 4, [12, 8]);
  drawStrokeLine(ctx, cx + 165, ceilingY - breachP * 115, cx + 495, ceilingY - breachP * 115, THEME.crimsonBright, 4);

  roundRectPath(ctx, cx - 495, ceilingY - 38, 250, 38, 10);
  ctx.fillStyle = 'rgba(217, 72, 72, 0.2)';
  ctx.fill();
  ctx.font = '700 19px JetBrains';
  ctx.fillStyle = '#FF9A9A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(breachP > 0.3 ? 'BATAS 700× DITEMBUS' : 'BATAS STANDAR 700×', cx - 370, ceilingY - 19);

  // Baseline
  drawStrokeLine(ctx, cx - 495, baseY, cx + 495, baseY, 'rgba(255,255,255,0.35)', 2.5);

  // 3 Standard Deeds (capped cleanly below 700x ceiling)
  const deeds = [
    { lbl: 'SHALAT', val: '10×–700×', h: 390, x: cx - 360, t: 1.5 },
    { lbl: 'DZIKIR', val: '10×–700×', h: 355, x: cx - 140, t: 2.3 },
    { lbl: 'SEDEKAH', val: '700×', h: 485, x: cx + 80, t: 3.2 },
  ];
  deeds.forEach((d) => {
    const p = easeOutExpo(clamp01((localT - d.t) / 1.0));
    const ch = d.h * p;
    roundRectPath(ctx, d.x - 65, baseY - ch, 130, ch, 14);
    ctx.fillStyle = 'rgba(60, 229, 198, 0.16)';
    ctx.fill();
    ctx.strokeStyle = THEME.turqBright;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '700 18px JetBrains';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(d.lbl, d.x, baseY + 34);
    if (p > 0.4) {
      ctx.fillStyle = THEME.turqBright;
      ctx.fillText(d.val, d.x, baseY - ch - 24);
    }
  });

  // 4th Column: PUASA — surges up, pauses briefly at 700x, then blasts upward cleanly inside panel!
  const pPre = easeOutCubic(clamp01((localT - 5.5) / 2.5)) * 485;
  const pBlast = easeOutExpo(clamp01((localT - 11.2) / 1.1)) * 240;
  const puasaH = pPre + pBlast;
  const px = cx + 315;

  roundRectPath(ctx, px - 80, baseY - puasaH, 160, puasaH, 18);
  const pGrad = ctx.createLinearGradient(0, baseY - puasaH, 0, baseY);
  pGrad.addColorStop(0, THEME.goldBright);
  pGrad.addColorStop(0.5, THEME.turqBright);
  pGrad.addColorStop(1, 'rgba(11, 77, 67, 0.4)');
  ctx.fillStyle = pGrad;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '800 22px JetBrains';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('PUASA', px, baseY + 34);

  // Hilal Crescent + "> 700x" badge above Puasa column (safely below header bar)
  if (breachP > 0.05) {
    ctx.save();
    ctx.globalAlpha = breachP;
    const hY = baseY - puasaH - 58;
    ctx.fillStyle = THEME.goldBright;
    ctx.beginPath();
    ctx.arc(px - 22, hY, 30, 0.35 * Math.PI, 1.65 * Math.PI, false);
    ctx.arc(px - 8, hY - 5, 25, 1.55 * Math.PI, 0.45 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    drawRubElHizbBadge(ctx, px + 34, hY - 5, 11, totalT * 0.4, THEME.turqBright, 2, THEME.turqBright);

    ctx.font = '900 26px Cinzel';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('> 700× TANPA BATAS', px - 18, hY - 58);
    ctx.restore();
  }

  drawArabicRibbon(ctx, scene, cx, 1785, 1130, localT, 'sapphire', {
    delay: 1.5,
    arabicSize: 44,
  });
}

/**
 * X10: Midnight Sapphire — Overflowed Counter + Verse Anatomy (بِغَيْرِ حِسَابٍ) + Infinity Conduit
 */
export function renderScene10(ctx, scene, localT, totalT) {
  const cx = WIDTH / 2;
  const beat = localT < 4.5 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'sapphire');

  // TOP: Limited Counter Overflow vs Unbounded
  drawEditorialPanel(ctx, cx - 565, 515, 1130, 620, 'sapphire', {
    radius: 28,
    accent: THEME.goldBright,
    headerLabel: 'BIGHAIRI HISAB · PAHALA MELAMPAUI ALAT HITUNG',
  });

  // Left: Overflowed Counter
  roundRectPath(ctx, cx - 500, 600, 465, 145, 18);
  ctx.fillStyle = 'rgba(217, 72, 72, 0.12)';
  ctx.fill();
  ctx.strokeStyle = THEME.crimsonBright;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 18px JetBrains';
  ctx.fillStyle = '#FF9E9E';
  ctx.fillText('KALKULATOR TERBATAS', cx - 267, 636);
  ctx.font = '800 40px JetBrains';
  ctx.fillStyle = '#FFD0D0';
  ctx.fillText('999.999...', cx - 267, 692);
  drawStrokeLine(ctx, cx - 445, 692, cx - 90, 692, THEME.crimsonBright, 4);

  // Right: Unbounded Badge
  roundRectPath(ctx, cx + 35, 600, 465, 145, 18);
  ctx.fillStyle = 'rgba(60, 229, 198, 0.14)';
  ctx.fill();
  ctx.strokeStyle = THEME.turqBright;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '700 18px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('BALASAN ALLAH AZZA WA JALLA', cx + 267, 636);
  ctx.font = '900 36px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('TANPA HISAB', cx + 267, 692);

  // Twin Pillars (PUASA + SABAR) bridged by Infinity Loop
  const sabarOn = clamp01((localT - 4.5) / 0.7);
  roundRectPath(ctx, cx - 465, 775, 360, 320, 22);
  ctx.fillStyle = 'rgba(60, 229, 198, 0.08)';
  ctx.fill();
  ctx.strokeStyle = THEME.turqBright;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '800 32px Cinzel';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('PUASA', cx - 285, 816);

  ctx.save();
  ctx.globalAlpha = Math.max(0.25, sabarOn);
  roundRectPath(ctx, cx + 105, 775, 360, 320, 22);
  ctx.fillStyle = 'rgba(255, 228, 140, 0.09)';
  ctx.fill();
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '800 32px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('SABAR', cx + 285, 816);
  ctx.restore();

  // Continuous Infinity Lemniscate
  const drawP = easeInOutQuart(clamp01((localT - 0.8) / 1.4));
  const A = 365;
  const maxStep = Math.floor(140 * drawP);
  ctx.save();
  ctx.translate(cx, 976);
  ctx.beginPath();
  for (let i = 0; i <= maxStep; i++) {
    const t = (i / 140) * TAU;
    const denom = 1 + Math.sin(t) * Math.sin(t);
    const ix = (A * Math.cos(t)) / denom;
    const iy = (A * Math.sin(t) * Math.cos(t)) / denom;
    if (i === 0) ctx.moveTo(ix, iy);
    else ctx.lineTo(ix, iy);
  }
  const infGrad = ctx.createLinearGradient(-A, 0, A, 0);
  infGrad.addColorStop(0, THEME.turqBright);
  infGrad.addColorStop(0.5, THEME.goldBright);
  infGrad.addColorStop(1, THEME.turqBright);
  ctx.strokeStyle = infGrad;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  if (drawP > 0.9) {
    const pt = (totalT * 2.1) % TAU;
    const d2 = 1 + Math.sin(pt) * Math.sin(pt);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc((A * Math.cos(pt)) / d2, (A * Math.sin(pt) * Math.cos(pt)) / d2, 8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // BOTTOM: Az-Zumar 39:10 Verse Anatomy Card (Highlighting بِغَيْرِ حِسَابٍ at 9.2s!)
  const vP = easeOutExpo(clamp01((localT - 5.5) / 0.7));
  ctx.save();
  ctx.globalAlpha = vP;
  drawEditorialPanel(ctx, cx - 565, 1185, 1130, 470, 'sapphire', {
    radius: 28,
    accent: THEME.goldBright,
    headerLabel: 'BEDAH AYAT · QS. AZ-ZUMAR (39): 10',
  });

  const hlP = clamp01((localT - 9.0) / 0.8);
  ctx.font = '700 54px Amiri';
  const fullArW = ctx.measureText(scene.arabic).width;
  const partArW = ctx.measureText('بِغَيْرِ حِسَابٍ').width;
  const hlLeft = cx - fullArW / 2 - 14;
  const hlW = partArW + 28;
  const hlCenter = hlLeft + hlW / 2;

  drawHighlighterStroke(ctx, hlLeft, 1315, hlW, 74, hlP, 'rgba(60, 229, 198, 0.25)');
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText(scene.arabic, cx, 1352);

  if (hlP > 0.05) {
    ctx.save();
    ctx.globalAlpha = hlP;
    drawStrokeLine(ctx, hlCenter, 1405, hlCenter, 1445, THEME.turqBright, 3);
    roundRectPath(ctx, hlCenter - 165, 1445, 330, 48, 12);
    ctx.fillStyle = THEME.turqBright;
    ctx.fill();
    ctx.font = '800 20px JetBrains';
    ctx.fillStyle = THEME.bgSapphireDeep;
    ctx.fillText('TANPA BATAS HITUNGAN', hlCenter, 1470);
    ctx.restore();
  }

  ctx.font = 'italic 600 27px Playfair';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText(`"${scene.arabicTrans}"`, cx, 1575);
  ctx.restore();
}

/**
 * X11: Warm Cartographic Desert Map — Syam -> Madinah 1,000-Camel Caravan
 * Beat 1 (0.0-8.5s): Historical Context & Route Trace (Abu Bakar RA Era, Madinah Famine)
 * Beat 2 (8.5-13.09s): 0 -> 1,000 Camel Odometer & Marching Caravan arriving in Madinah
 */
export function renderScene11(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 8.5 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'parchment');

  // Top Odometer Counter
  const cntP = easeOutExpo(clamp01((localT - 8.8) / 2.2));
  const camels = Math.round(lerp(0, 1000, cntP));
  const formatted = camels === 1000 ? '1.000' : String(camels);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 108px Cinzel';
  ctx.fillStyle = THEME.parchmentInk;
  ctx.fillText(formatted, cx, 570);
  ctx.font = '800 23px JetBrains';
  ctx.fillStyle = THEME.turqInk;
  ctx.fillText('UNTA KAFILAH DAGANG UTSMAN BIN AFFAN RA · GANDUM & MINYAK ZAITUN', cx, 650);
  ctx.restore();

  // Cartographic Map Panel
  drawEditorialPanel(ctx, cx - 565, 700, 1130, 740, 'parchment', {
    radius: 28,
    accent: THEME.goldInk,
    headerLabel: 'PETA JALUR KAFILAH · SYAM MENUJU MADINAH AL-MUNAWWARAH',
  });

  // Compass Rose Top Right
  ctx.save();
  ctx.translate(cx + 435, 845);
  ctx.strokeStyle = rgba(THEME.goldInk, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, TAU);
  ctx.stroke();
  drawStrokeLine(ctx, 0, -56, 0, 56, rgba(THEME.goldInk, 0.7), 2);
  drawStrokeLine(ctx, -56, 0, 56, 0, rgba(THEME.goldInk, 0.7), 2);
  ctx.font = '800 18px JetBrains';
  ctx.fillStyle = THEME.goldInk;
  ctx.fillText('U', 0, -68);
  ctx.restore();

  const sx = cx - 365;
  const sy = 875;
  const mx = cx + 345;
  const my = 1235;
  const routeP = easeInOutQuart(clamp01((localT - 1.2) / 3.2));

  // Route Dashed Base + Active Emerald Trace
  ctx.save();
  ctx.strokeStyle = rgba(THEME.parchmentMuted, 0.3);
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(cx - 80, sy - 10, cx + 60, my + 20, mx, my);
  ctx.stroke();
  ctx.restore();

  const steps = 60;
  const endStep = Math.floor(steps * routeP);
  if (endStep > 1) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= endStep; i++) {
      const t = i / steps;
      const it = 1 - t;
      const px = it * it * it * sx + 3 * it * it * t * (cx - 80) + 3 * it * t * t * (cx + 60) + t * t * t * mx;
      const py = it * it * it * sy + 3 * it * it * t * (sy - 10) + 3 * it * t * t * (my + 20) + t * t * t * my;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = THEME.turqInk;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // City Nodes
  const drawPin = (x, y, name, sub, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    roundRectPath(ctx, x - 135, y + 26, 270, 72, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = '800 24px Cinzel';
    ctx.fillStyle = col;
    ctx.fillText(name, x, y + 51);
    ctx.font = '600 18px Jakarta';
    ctx.fillStyle = THEME.parchmentMuted;
    ctx.fillText(sub, x, y + 79);
  };
  drawPin(sx, sy, 'SYAM', 'Titik Muat Kafilah', THEME.goldInk);
  drawPin(mx, my, 'MADINAH', 'Dilanda Paceklik', THEME.crimsonInk);

  // Caravan Silhouette Strip marching cleanly along bottom of map
  const marchOffset = (localT * 60) % 160;
  for (let i = 0; i < 6; i++) {
    const cxPos = cx - 420 + i * 160 + marchOffset * 0.4;
    if (cxPos > cx + 440) continue;
    const cyPos = 1385;
    ctx.save();
    ctx.translate(cxPos, cyPos);
    ctx.fillStyle = THEME.parchmentInk;
    ctx.beginPath();
    ctx.ellipse(0, -14, 24, 15, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = THEME.turqInk;
    ctx.beginPath();
    ctx.ellipse(0, -24, 15, 9, 0, Math.PI, TAU);
    ctx.fill();
    drawStrokeLine(ctx, 18, -16, 30, -34, THEME.parchmentInk, 5);
    ctx.beginPath();
    ctx.arc(33, -36, 6.5, 0, TAU);
    ctx.fillStyle = THEME.parchmentInk;
    ctx.fill();
    drawStrokeLine(ctx, -14, -4, -18, 22, THEME.parchmentInk, 4);
    drawStrokeLine(ctx, 12, -4, 16, 22, THEME.parchmentInk, 4);
    ctx.restore();
  }

  // Historical Context Cards (Abu Bakar RA & Utsman RA)
  const cardP = easeOutExpo(clamp01((localT - 3.2) / 0.7));
  ctx.save();
  ctx.globalAlpha = cardP;
  drawEditorialPanel(ctx, cx - 565, 1485, 545, 150, 'parchment', { radius: 20, accent: THEME.turqInk });
  drawEditorialPanel(ctx, cx + 20, 1485, 545, 150, 'parchment', { radius: 20, accent: THEME.goldInk });

  ctx.textAlign = 'center';
  ctx.font = '900 32px Cinzel';
  ctx.fillStyle = THEME.turqInk;
  ctx.fillText('UTSMAN BIN AFFAN RA', cx - 292, 1540);
  ctx.font = '600 22px Jakarta';
  ctx.fillStyle = THEME.parchmentMuted;
  ctx.fillText('Pemilik 1.000 Unta Muatan Gandum', cx - 292, 1590);

  ctx.font = '900 32px Cinzel';
  ctx.fillStyle = THEME.goldInk;
  ctx.fillText('ABU BAKAR RA', cx + 292, 1540);
  ctx.font = '600 22px Jakarta';
  ctx.fillStyle = THEME.parchmentMuted;
  ctx.fillText('Khalifah · Saat Madinah Paceklik', cx + 292, 1590);
  ctx.restore();

  drawArabicRibbon(ctx, scene, cx, 1805, 1130, localT, 'parchment', {
    delay: 1.5,
    arabicSize: 48,
  });
}

/**
 * X12: Bronze Ledger — Auction Escalation (2x->5x) -> DITOLAK Stamp -> Allah's 10x-700x + Free Distribution
 */
export function renderScene12(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 4.3 ? 0 : localT < 11.4 ? 1 : 2;
  drawBeatIndicatorBar(ctx, cx, 456, 3, beat, 'bronze');

  // LEFT LEDGER: Merchant Offers stepping up 2x -> 5x
  drawEditorialPanel(ctx, cx - 565, 520, 540, 635, 'bronze', {
    radius: 26,
    accent: THEME.crimsonBright,
    headerLabel: 'TAWARAN PARA PEDAGANG',
  });

  const offers = [
    { lbl: 'UNTUNG 2× LIPAT', t: 0.7, w: 0.45 },
    { lbl: 'UNTUNG 3× LIPAT', t: 1.5, w: 0.65 },
    { lbl: 'UNTUNG 5× LIPAT', t: 2.3, w: 0.95 },
  ];
  offers.forEach((of, i) => {
    const op = easeOutExpo(clamp01((localT - of.t) / 0.45));
    const oy = 620 + i * 155;
    ctx.save();
    ctx.globalAlpha = op;
    roundRectPath(ctx, cx - 525, oy, 460, 120, 18);
    ctx.fillStyle = 'rgba(217, 72, 72, 0.1)';
    ctx.fill();
    ctx.strokeStyle = rgba(THEME.crimsonBright, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Animated profit meter bar inside each bid
    roundRectPath(ctx, cx - 505, oy + 76, 420 * of.w * op, 16, 8);
    ctx.fillStyle = THEME.crimsonBright;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = '800 30px Jakarta';
    ctx.fillStyle = '#FFD0D0';
    ctx.fillText(of.lbl, cx - 295, oy + 42);
    ctx.restore();
  });

  // DITOLAK Stamp slams at 4.4s ("Tapi Utsman menolak...")
  drawStampSeal(ctx, cx - 295, 855, 'DITOLAK', THEME.crimsonBright, clamp01((localT - 4.4) / 0.45), -0.18);

  // RIGHT LEDGER: Tawaran Allah Azza wa Jalla (10x - 700x)
  const rightP = easeOutExpo(clamp01((localT - 6.8) / 0.7));
  ctx.save();
  ctx.globalAlpha = Math.max(0.28, rightP);
  drawEditorialPanel(ctx, cx + 25, 520, 540, 635, 'bronze', {
    radius: 26,
    accent: THEME.goldBright,
    headerLabel: 'TAWARAN ALLAH AZZA WA JALLA',
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 94px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('10×–700×', cx + 295, 735);
  ctx.font = '700 26px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('Balasan berlipat tanpa rugi', cx + 295, 840);
  ctx.font = '600 23px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('Setiap 1 dirham dibalas minimal 10×', cx + 295, 888);

  if (rightP > 0.4) {
    roundRectPath(ctx, cx + 95, 980, 400, 74, 18);
    ctx.fillStyle = THEME.turqBright;
    ctx.fill();
    ctx.font = '900 25px JetBrains';
    ctx.fillStyle = THEME.bgBronzeDeep;
    ctx.fillText('DIPILIH UTSMAN RA', cx + 295, 1018);
  }
  ctx.restore();

  // BEAT 3 (11.5s+): 1,000 Cargo Distribution Grid ("Seluruhnya pun disedekahkan gratis")
  const distP = easeOutExpo(clamp01((localT - 10.6) / 0.8));
  ctx.save();
  ctx.globalAlpha = Math.max(0.35, distP);
  drawEditorialPanel(ctx, cx - 565, 1200, 1130, 345, 'bronze', {
    radius: 26,
    accent: THEME.turqBright,
    headerLabel: 'AKSI NYATA DI MADINAH · 1.000 UNTA MUATAN GANDUM',
  });

  const freeRatio = clamp01((localT - 11.6) / 1.1);
  const cols = 20;
  const rows = 5;
  const totalBoxes = cols * rows;
  const litBoxes = Math.round(freeRatio * totalBoxes);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const bx = cx - 495 + c * 50;
      const by = 1275 + r * 32;
      roundRectPath(ctx, bx, by, 40, 22, 5);
      ctx.fillStyle = idx < litBoxes ? THEME.turqBright : rgba(THEME.goldBright, 0.3);
      ctx.fill();
    }
  }
  ctx.textAlign = 'center';
  ctx.font = '800 32px Jakarta';
  ctx.fillStyle = freeRatio > 0.5 ? THEME.turqBright : THEME.goldBright;
  ctx.fillText(
    freeRatio > 0.5 ? '100% SEDEKAH GRATIS UNTUK PENDUDUK MADINAH' : 'MUATAN KAFILAH SIAP DIDISTRIBUSIKAN...',
    cx,
    1486,
  );
  ctx.restore();

  drawArabicRibbon(ctx, scene, cx, 1785, 1130, localT, 'bronze', {
    delay: 1.5,
    arabicSize: 48,
  });
}

/**
 * X13: Warm Ivory Paper — Lifespan Compensation Chart + Weight of Sincerity Fulcrum
 */
export function renderScene13(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 6.6 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'paper');

  // TOP PANEL: Proportional Lifespan Ratio (950 yrs vs 60-70 yrs)
  drawEditorialPanel(ctx, cx - 565, 515, 1130, 495, 'paper', {
    radius: 26,
    accent: THEME.turqInk,
    headerLabel: 'FAKTOR USIA · MENGAPA PAHALA UMAT INI DILIPATGANDAKAN',
  });

  const barX = cx - 495;
  const barW = 990;
  const p1 = easeOutCubic(clamp01((localT - 0.8) / 1.0));
  const p2 = easeOutCubic(clamp01((localT - 3.2) / 1.0));

  ctx.textAlign = 'left';
  ctx.font = '800 23px JetBrains';
  ctx.fillStyle = THEME.paperInk;
  ctx.fillText('UMAT TERDAHULU (NABI NUH AS)', barX, 610);
  ctx.textAlign = 'right';
  ctx.fillStyle = THEME.turqInk;
  ctx.fillText('± 950 TAHUN', barX + barW, 610);
  roundRectPath(ctx, barX, 635, barW * p1, 44, 12);
  ctx.fillStyle = THEME.turqInk;
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = THEME.paperInk;
  ctx.fillText('UMAT NABI MUHAMMAD SAW', barX, 745);
  ctx.textAlign = 'right';
  ctx.fillStyle = THEME.goldInk;
  ctx.fillText('60 – 70 TAHUN', barX + barW, 745);
  roundRectPath(ctx, barX, 770, barW * 0.11 * p2, 44, 12);
  ctx.fillStyle = '#E6B83A';
  ctx.fill();
  ctx.strokeStyle = THEME.goldInk;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Compensation Bridge
  const brP = easeOutExpo(clamp01((localT - 4.9) / 0.8));
  if (brP > 0.02) {
    ctx.save();
    ctx.globalAlpha = brP;
    const bx1 = barX + barW * 0.12;
    const bx2 = lerp(bx1, barX + barW * 0.98, brP);
    drawStrokeLine(ctx, bx1, 862, bx2, 862, THEME.goldInk, 4);
    drawStrokeLine(ctx, bx1, 848, bx1, 876, THEME.goldInk, 4);
    drawStrokeLine(ctx, bx2, 848, bx2, 876, THEME.goldInk, 4);

    roundRectPath(ctx, cx - 385, 898, 900, 62, 14);
    ctx.fillStyle = THEME.paperInk;
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = '800 22px JetBrains';
    ctx.fillStyle = THEME.goldBright;
    ctx.fillText('DIKEJAR DENGAN PELIPATGANDAAN 700× & LAILATUL QADAR', cx + 65, 930);
    ctx.restore();
  }

  // BOTTOM PANEL: Weight of Sincerity Fulcrum (1 Gold Dirham > 100.000 Silver Dirham)
  drawEditorialPanel(ctx, cx - 565, 1055, 1130, 540, 'paper', {
    radius: 26,
    accent: THEME.goldInk,
    headerLabel: 'BERAT KEIKHLASAN · HR. AN-NASA\'I NO. 2527',
  });

  const tiltP = easeOutElastic(clamp01((localT - 7.0) / 1.4));
  const tilt = lerp(0.08, -0.17, tiltP);
  const pivY = 1480;

  ctx.fillStyle = THEME.goldInk;
  ctx.beginPath();
  ctx.moveTo(cx, pivY);
  ctx.lineTo(cx - 38, pivY + 52);
  ctx.lineTo(cx + 38, pivY + 52);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(cx, pivY);
  ctx.rotate(tilt);

  roundRectPath(ctx, -430, -12, 860, 24, 10);
  ctx.fillStyle = THEME.paperInk;
  ctx.fill();

  // Left: 1 Gold Dirham (50% of all wealth)
  ctx.fillStyle = '#F4CF58';
  ctx.beginPath();
  ctx.arc(-280, -72, 58, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = THEME.goldInk;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 36px Cinzel';
  ctx.fillStyle = THEME.paperInk;
  ctx.fillText('1', -280, -72);

  ctx.font = '800 25px Jakarta';
  ctx.fillStyle = THEME.paperInk;
  ctx.fillText('1 DIRHAM', -280, -172);
  ctx.font = '700 19px JetBrains';
  ctx.fillStyle = THEME.turqInk;
  ctx.fillText('IKHLAS PENUH (50% HARTA)', -280, -142);

  // Right: 100.000 Silver Dirham Stack
  for (let i = 0; i < 9; i++) {
    roundRectPath(ctx, 210, -24 - i * 14, 140, 11, 4);
    ctx.fillStyle = i % 2 === 0 ? '#9AA8AE' : '#6F7D83';
    ctx.fill();
  }
  ctx.font = '800 25px Jakarta';
  ctx.fillStyle = THEME.paperInk;
  ctx.fillText('100.000 DIRHAM', 280, -192);
  ctx.font = '600 19px JetBrains';
  ctx.fillStyle = THEME.paperInkMuted;
  ctx.fillText('SISA HARTA BERLEBIH', 280, -162);
  ctx.restore();

  drawArabicRibbon(ctx, scene, cx, 1795, 1130, localT, 'paper', {
    delay: 1.6,
    arabicSize: 48,
  });
}

/**
 * X14: Finale — 4-Stage Expanding Ripple + Interactive Comment CTA
 */
export function renderScene14(ctx, scene, localT) {
  const cx = WIDTH / 2;
  const beat = localT < 4.2 ? 0 : 1;
  drawBeatIndicatorBar(ctx, cx, 456, 2, beat, 'obsidian');

  drawEditorialPanel(ctx, cx - 565, 520, 1130, 560, 'obsidian', {
    radius: 28,
    accent: THEME.goldBright,
    headerLabel: 'EFEK DOMINO KEBAIKAN · DARI TINDAKAN SEDERHANA',
  });

  const nodes = [
    { val: '1', lbl: 'NIAT / SENYUM', r: 58, col: THEME.turqBright, x: cx - 390 },
    { val: '10×', lbl: 'MINIMAL', r: 74, col: THEME.turqBright, x: cx - 135 },
    { val: '700×', lbl: 'SEDEKAH', r: 92, col: THEME.goldBright, x: cx + 145 },
    { val: '∞', lbl: 'SABAR & IKHLAS', r: 108, col: '#FFFFFF', x: cx + 415 },
  ];

  for (let i = 0; i < nodes.length - 1; i++) {
    const ap = clamp01((localT - 0.6 - i * 0.45) / 0.5);
    drawAnimatedArrow(ctx, nodes[i].x + nodes[i].r + 8, 795, nodes[i + 1].x - nodes[i + 1].r - 8, 795, ap, THEME.goldMedina, 4, 12);
  }

  nodes.forEach((nd, idx) => {
    const sp = springVal(localT - 0.35 - idx * 0.4, 210, 18);
    if (sp <= 0.01) return;
    ctx.save();
    ctx.translate(nd.x, 795);
    ctx.scale(sp, sp);

    ctx.fillStyle = rgba(nd.col, 0.14);
    ctx.beginPath();
    ctx.arc(0, 0, nd.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = nd.col;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = nd.val === '∞' ? '900 72px Jakarta' : '900 44px Cinzel';
    ctx.fillStyle = nd.col;
    ctx.fillText(nd.val, 0, 2);

    ctx.font = '700 20px JetBrains';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(nd.lbl, 0, nd.r + 42);
    ctx.restore();
  });

  // Interactive Comment CTA Card (pops right when narrator says "Tulis di komentar..." at 4.2s)
  const ctaP = easeOutExpo(clamp01((localT - 4.1) / 0.7));
  ctx.save();
  ctx.globalAlpha = Math.max(0.25, ctaP);
  const dy = (1 - ctaP) * 28;
  drawEditorialPanel(ctx, cx - 540, 1145 + dy, 1080, 275, 'obsidian', {
    radius: 26,
    accent: THEME.turqBright,
    headerLabel: 'TULIS DI KOLOM KOMENTAR',
  });
  ctx.textAlign = 'center';
  ctx.font = '800 35px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('Kebaikan kecil apa yang paling membekas di hidupmu?', cx, 1278 + dy);
  ctx.font = '600 23px Jakarta';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('Bagikan satu cerita kebaikanmu — semoga menjadi inspirasi bagi yang lain', cx, 1348 + dy);
  ctx.restore();

  drawArabicRibbon(ctx, scene, cx, 1720, 1100, localT, 'obsidian', {
    delay: 1.0,
    arabicSize: 48,
  });
}

// ============================================================================
// 9. CINEMATIC WIPE TRANSITIONS & FRAME COMPOSITOR
// ============================================================================

export function drawSceneTransitionOverlay(ctx, transitionType, u) {
  if (u <= 0 || u >= 1 || transitionType === 'none') return;
  const bell = Math.sin(u * Math.PI);

  ctx.save();
  if (transitionType === 'iris_gold' || transitionType === 'star_iris') {
    const r = lerp(0, 1450, bell);
    ctx.strokeStyle = rgba(THEME.goldBright, 0.45 * bell);
    ctx.lineWidth = 6 * bell;
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, r, 0, TAU);
    ctx.stroke();
  } else {
    const barX = lerp(-120, WIDTH + 120, easeInOutQuart(u));
    const grad = ctx.createLinearGradient(barX - 100, 0, barX + 100, 0);
    grad.addColorStop(0, 'rgba(255,228,140,0)');
    grad.addColorStop(0.5, rgba(THEME.goldBright, 0.22 * bell));
    grad.addColorStop(1, 'rgba(255,228,140,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(barX - 100, 0, 200, HEIGHT);
    drawStrokeLine(ctx, barX, 0, barX, HEIGHT, rgba(THEME.goldBright, 0.5 * bell), 3);
  }
  ctx.restore();
}

export async function loadSceneModules() {
  const mods = {};
  for (const sc of SCENES_DATA) {
    const mod = await import(sc.module);
    mods[sc.id] = mod.default || mod.renderScene;
  }
  return mods;
}

export function createHelpers() {
  return {
    WIDTH,
    HEIGHT,
    FPS,
    THEME,
    STAGE_WORLDS,
    SCENE_WORLD_MAP,
    clamp,
    clamp01,
    lerp,
    invLerp,
    smoothstep,
    easeOutCubic,
    easeOutQuart,
    easeInOutQuart,
    easeOutExpo,
    easeOutBack,
    easeOutElastic,
    springVal,
    stagger,
    rgba,
    lerpColor,
    createCameraState,
    applyCamera,
    roundRectPath,
    drawStrokeLine,
    drawRegistrationMark,
    drawRubElHizbBadge,
    drawEditorialPanel,
    drawAnimatedArrow,
    drawHighlighterStroke,
    drawStampSeal,
    drawCalloutTag,
    drawBeatIndicatorBar,
    drawEditorialStage,
    drawArabicRibbon,
    renderScene01,
    renderScene02,
    renderScene03,
    renderScene04,
    renderScene05,
    renderScene06,
    renderScene07,
    renderScene08,
    renderScene09,
    renderScene10,
    renderScene11,
    renderScene12,
    renderScene13,
    renderScene14,
  };
}

export function renderSingleFrame(ctx, timeline, sceneRenderers, helpers, frameIdx) {
  const totalT = frameIdx / FPS;
  const scenes = timeline.scenes;

  let idx = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (frameIdx >= scenes[i].startFrame && frameIdx < scenes[i].endFrame) {
      idx = i;
      break;
    }
    if (frameIdx >= scenes[scenes.length - 1].endFrame) {
      idx = scenes.length - 1;
    }
  }

  const sc = scenes[idx];
  const worldKey = SCENE_WORLD_MAP[sc.id] || 'obsidian';
  const localFrame = frameIdx - sc.startFrame;
  const localT = localFrame / FPS;
  const progress = clamp01(localT / sc.durationSec);

  const inAlpha = clamp01(localT / 0.16);
  const outAlpha = idx < scenes.length - 1 ? clamp01((sc.durationSec - localT) / 0.14) : clamp01((sc.durationSec - localT) / 0.4);
  const sceneAlpha = Math.min(inAlpha, outAlpha);

  const fn = sceneRenderers[sc.id];
  if (fn) {
    fn(ctx, {
      scene: sc,
      sceneIndex: idx,
      frameIdx,
      localFrame,
      localT,
      totalT,
      durationSec: sc.durationSec,
      progress,
      sceneAlpha,
      worldKey,
      h: helpers,
    });
  }

  drawTopHUD(ctx, sc, localT, worldKey);
  drawKineticHeadline(ctx, sc, localT, worldKey);
  drawBroadcastCaptions(ctx, sc, localT, worldKey);
  drawSourceFooter(ctx, sc.source, localT, worldKey);

  const transDur = 0.28;
  if (idx < scenes.length - 1 && sc.durationSec - localT < transDur * 0.5) {
    const u = (transDur * 0.5 - (sc.durationSec - localT)) / transDur;
    drawSceneTransitionOverlay(ctx, sc.transition, u);
  } else if (idx > 0 && localT < transDur * 0.5) {
    const u = 0.5 + localT / transDur;
    drawSceneTransitionOverlay(ctx, scenes[idx - 1].transition, u);
  }
}

// ============================================================================
// 10. MULTI-WORKER RENDER PIPELINE WITH BACKPRESSURE
// ============================================================================

async function runWorker() {
  initFonts();
  const { timelinePath } = workerData;
  const timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));
  const sceneRenderers = await loadSceneModules();
  const helpers = createHelpers();
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  parentPort.on('message', (msg) => {
    if (msg.stop) process.exit(0);
    const f = msg.frame;
    renderSingleFrame(ctx, timeline, sceneRenderers, helpers, f);
    const img = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const outBuf = new Uint8Array(img.data.buffer);
    parentPort.postMessage({ frame: f, buf: outBuf }, [outBuf.buffer]);
  });

  parentPort.postMessage({ ready: true });
}

async function runPreview(timeline) {
  initFonts();
  const sceneRenderers = await loadSceneModules();
  const helpers = createHelpers();
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const outDir = join(ROOT, 'out', 'previews');
  mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < timeline.scenes.length; i++) {
    const sc = timeline.scenes[i];
    const targetFrame = sc.startFrame + Math.round(sc.durationFrames * 0.72);
    renderSingleFrame(ctx, timeline, sceneRenderers, helpers, targetFrame);
    const outPath = join(outDir, `${sc.id}.png`);
    writeFileSync(outPath, canvas.toBufferSync('png'));
    console.log(`Preview ${sc.id} -> ${outPath} (frame ${targetFrame})`);
  }
}

async function runFullRender(timeline, maxFrames = null) {
  const ffmpeg = findFfmpeg();
  const masterAudio = join(ROOT, '.tmp', 'master_audio.m4a');
  if (!existsSync(masterAudio)) {
    throw new Error('Missing master_audio.m4a — run buildAudioAndTimeline() first.');
  }

  const outPath = maxFrames ? join(ROOT, '.tmp', 'render_test.mp4') : VIDEO_CONFIG.outputVideo;
  mkdirSync(join(ROOT, 'out'), { recursive: true });
  mkdirSync(join(ROOT, '.tmp'), { recursive: true });

  const totalFrames = maxFrames ? Math.min(timeline.totalFrames, maxFrames) : timeline.totalFrames;
  const workerCount = Math.max(2, Math.min(4, cpus().length));
  const MAX_AHEAD = workerCount * 4;

  console.log(`Rendering ${totalFrames} frames (${(totalFrames / FPS).toFixed(2)}s) @ ${WIDTH}x${HEIGHT} ${FPS}fps using ${workerCount} workers...`);
  const t0 = Date.now();

  const ff = spawn(
    ffmpeg,
    [
      '-hide_banner',
      '-loglevel',
      'error',
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
      masterAudio,
      '-c:v',
      'libx264',
      '-profile:v',
      'high',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '22',
      '-maxrate',
      '3600k',
      '-bufsize',
      '7200k',
      '-preset',
      'veryfast',
      '-c:a',
      'copy',
      '-movflags',
      '+faststart',
      outPath,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );

  const frameBuffer = new Map();
  let nextWriteFrame = 0;
  let nextDispatchFrame = 0;
  let drainWaiter = null;
  const idleWorkers = [];

  ff.stdin.on('error', (err) => {
    if (err.code !== 'EPIPE') throw err;
  });

  ff.stdin.on('drain', () => {
    if (drainWaiter) {
      const r = drainWaiter;
      drainWaiter = null;
      r();
    }
  });

  const dispatchMore = () => {
    while (
      idleWorkers.length > 0 &&
      nextDispatchFrame < totalFrames &&
      nextDispatchFrame - nextWriteFrame < MAX_AHEAD
    ) {
      const wk = idleWorkers.shift();
      const f = nextDispatchFrame++;
      wk.postMessage({ frame: f });
    }
    if (nextDispatchFrame >= totalFrames) {
      while (idleWorkers.length > 0) {
        idleWorkers.shift().postMessage({ stop: true });
      }
    }
  };

  const flushOrdered = async () => {
    while (frameBuffer.has(nextWriteFrame)) {
      const buf = frameBuffer.get(nextWriteFrame);
      frameBuffer.delete(nextWriteFrame);
      nextWriteFrame++;
      const ok = ff.stdin.write(buf);
      if (!ok) {
        await new Promise((res) => {
          drainWaiter = res;
        });
      }
      dispatchMore();
      if (nextWriteFrame % 450 === 0 || nextWriteFrame === totalFrames) {
        const elapsed = (Date.now() - t0) / 1000;
        const pct = ((nextWriteFrame / totalFrames) * 100).toFixed(1);
        const fpsActual = (nextWriteFrame / Math.max(0.1, elapsed)).toFixed(1);
        const eta = ((totalFrames - nextWriteFrame) / Math.max(0.1, Number(fpsActual))).toFixed(0);
        console.log(`[${elapsed.toFixed(0)}s] Encoded ${nextWriteFrame}/${totalFrames} (${pct}%) @ ${fpsActual} fps | ETA ${eta}s`);
      }
    }
    if (nextWriteFrame === totalFrames && !ff.stdin.writableEnded) {
      ff.stdin.end();
    }
  };

  let flushing = Promise.resolve();

  await new Promise((resolve, reject) => {
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });

    for (let w = 0; w < workerCount; w++) {
      const wk = new Worker(new URL(import.meta.url), {
        workerData: { timelinePath: VIDEO_CONFIG.timelineFile },
      });
      wk.on('message', (msg) => {
        if (msg.ready) {
          idleWorkers.push(wk);
          dispatchMore();
          return;
        }
        frameBuffer.set(msg.frame, Buffer.from(msg.buf.buffer, msg.buf.byteOffset, msg.buf.byteLength));
        idleWorkers.push(wk);
        dispatchMore();
        flushing = flushing.then(() => flushOrdered()).catch(reject);
      });
      wk.on('error', reject);
    }
  });

  console.log(`Render complete: ${outPath}`);
}

// ============================================================================
// 11. CLI ENTRYPOINT
// ============================================================================

if (!isMainThread && workerData) {
  runWorker().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const args = process.argv.slice(2);
    const timeline = existsSync(VIDEO_CONFIG.timelineFile)
      ? JSON.parse(readFileSync(VIDEO_CONFIG.timelineFile, 'utf8'))
      : buildAudioAndTimeline();

    if (args.includes('--preview')) {
      await runPreview(timeline);
    } else if (args.some((a) => a.startsWith('--scene='))) {
      const spec = args.find((a) => a.startsWith('--scene=')).split('=')[1];
      const [targetId, pctStr] = spec.split(':');
      const pct = pctStr ? Number(pctStr) : 0.72;
      initFonts();
      const sceneRenderers = await loadSceneModules();
      const helpers = createHelpers();
      const sc = timeline.scenes.find((s) => s.id === targetId);
      if (!sc) throw new Error(`Unknown scene ${targetId}`);
      const canvas = new Canvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext('2d');
      const outDir = join(ROOT, 'out', 'previews');
      mkdirSync(outDir, { recursive: true });
      renderSingleFrame(ctx, timeline, sceneRenderers, helpers, sc.startFrame + Math.round(sc.durationFrames * pct));
      const p = join(outDir, `${sc.id}.png`);
      writeFileSync(p, canvas.toBufferSync('png'));
      console.log(`Rendered single frame preview: ${p} (@ ${(pct * 100).toFixed(0)}%)`);
    } else {
      const limArg = args.find((a) => a.startsWith('--limit='));
      const maxFrames = limArg ? Number(limArg.split('=')[1]) : null;
      await runFullRender(timeline, maxFrames);
    }
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
