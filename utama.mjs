#!/usr/bin/env node
/**
 * Engine Visual 2K 90FPS — Studio Motion Graphics Edition
 * Topik: "Kenapa Satu Kebaikan Dibalas 700 Kali Lipat dalam Islam?"
 * Arsitektur: Multi-worker Skia Canvas vector compositor + FFmpeg rawvideo pipe
 */
import { Canvas, FontLibrary } from 'skia-canvas';
import { execFileSync, spawn } from 'node:child_process';
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
// 1. EDITORIAL COLOR SYSTEM & STUDIO PALETTES
// ============================================================================

export const THEME = {
  bgObsidian: '#050C0B',
  bgEmeraldDeep: '#071714',
  bgEmeraldMid: '#0B231E',
  bgEmeraldCard: '#0A1E1A',
  bgIndigoDeep: '#07131E',
  bgIndigoMid: '#0D2133',
  bgDesertDeep: '#14110B',
  bgDesertMid: '#211B11',

  goldBright: '#FFE48C',
  goldMedina: '#D9AF43',
  goldAmber: '#B88422',
  goldDeep: '#6B4D12',

  turqBright: '#3EE6C8',
  turqMid: '#18A890',
  turqDeep: '#0B4D43',

  crimsonBright: '#FF6B6B',
  crimsonMid: '#D94848',
  crimsonDeep: '#5C1B1B',

  silverBright: '#D7E0E4',
  silverMid: '#8C9BA3',

  ivory: '#F6F4EC',
  ivoryMuted: '#B8C2BD',
  slateText: '#7E8E88',
  gridLine: '#1B3A33',
};

export const STAGE_PALETTES = {
  emerald: { top: '#061512', mid: '#0C2822', bot: '#040B0A', key: '#D9AF43', rim: '#18A890' },
  justice: { top: '#0B1716', mid: '#112523', bot: '#050B0A', key: '#D9AF43', rim: '#D94848' },
  botanical: { top: '#061813', mid: '#0D2E24', bot: '#040B09', key: '#E5BD4D', rim: '#3EE6C8' },
  nocturne: { top: '#06111B', mid: '#0C2032', bot: '#040A10', key: '#3EE6C8', rim: '#D9AF43' },
  desert: { top: '#13100A', mid: '#231C11', bot: '#090704', key: '#E8B84B', rim: '#18A890' },
  finale: { top: '#071A15', mid: '#103128', bot: '#040C0A', key: '#FFE48C', rim: '#3EE6C8' },
};

// ============================================================================
// 2. FONT REGISTRATION (@fontsource WOFF2)
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

// Critically/lightly damped editorial spring
export function springVal(t, stiffness = 170, damping = 18) {
  if (t <= 0) return 0;
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * omega);
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return clamp(1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t)), 0, 1.15);
  }
  return clamp01(1 - Math.exp(-omega * t) * (1 + omega * t));
}

export function stagger(localT, index, step = 0.14, dur = 0.55) {
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
// 4. PRECISION EDITORIAL CAMERA & PRIMITIVES
// ============================================================================

export function createCameraState(localT, durationSec, opts = {}) {
  const { zoomStart = 1.022, zoomEnd = 1.0, panX = 0, panY = 0, pushAt = null } = opts;
  const p = clamp01(localT / Math.max(0.1, durationSec));
  let zoom = lerp(zoomStart, zoomEnd, easeOutCubic(p));
  if (pushAt !== null && localT > pushAt) {
    const qp = clamp01((localT - pushAt) / 0.8);
    zoom += Math.sin(qp * Math.PI) * 0.012;
  }
  const x = panX * easeInOutQuart(p);
  const y = panY * easeInOutQuart(p);
  return { zoom, x, y };
}

export function applyCamera(ctx, cam) {
  ctx.translate(WIDTH / 2 + cam.x, HEIGHT / 2 + cam.y);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function drawStrokeLine(ctx, x1, y1, x2, y2, color, width = 2.5, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawRegistrationMark(ctx, x, y, size = 8, color = THEME.goldMedina, alpha = 0.45) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

export function drawRubElHizbBadge(ctx, cx, cy, r, rot = 0, strokeColor = THEME.goldMedina, lw = 2, fillColor = null) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const drawSq = (angle) => {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.rect(-r * 0.707, -r * 0.707, r * 1.414, r * 1.414);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.restore();
  };
  drawSq(0);
  drawSq(Math.PI / 4);
  ctx.restore();
}

export function drawBevelCard(ctx, x, y, w, h, opts = {}) {
  const {
    radius = 24,
    accent = THEME.goldMedina,
    bgTop = 'rgba(13, 35, 30, 0.92)',
    bgBot = 'rgba(6, 17, 15, 0.96)',
    borderAlpha = 0.55,
    headerLabel = '',
    headerColor = accent,
    shadow = true,
  } = opts;

  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, bgTop);
  grad.addColorStop(1, bgBot);
  ctx.fillStyle = grad;
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = rgba(accent, borderAlpha);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top studio specular highlight edge
  const spec = ctx.createLinearGradient(x + 24, y, x + w - 24, y);
  spec.addColorStop(0, rgba('#FFFFFF', 0));
  spec.addColorStop(0.5, rgba(accent, 0.8));
  spec.addColorStop(1, rgba('#FFFFFF', 0));
  ctx.strokeStyle = spec;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 28, y + 1.5);
  ctx.lineTo(x + w - 28, y + 1.5);
  ctx.stroke();

  if (headerLabel) {
    ctx.fillStyle = rgba(accent, 0.1);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + 52);
    ctx.lineTo(x, y + 52);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(accent, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 52);
    ctx.lineTo(x + w, y + 52);
    ctx.stroke();

    ctx.font = '700 22px JetBrains';
    ctx.fillStyle = headerColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(headerLabel, x + w / 2, y + 27);
  }
  ctx.restore();
}

export function drawCalloutLeader(ctx, x1, y1, x2, y2, label, accent = THEME.goldBright, progress = 1, align = 'left') {
  const p = easeOutCubic(clamp01(progress));
  if (p <= 0.02) return;
  ctx.save();
  const elbowX = lerp(x1, x2, 0.45);
  const seg1P = clamp01(p * 2);
  const seg2P = clamp01((p - 0.35) / 0.5);
  const labelP = clamp01((p - 0.55) / 0.45);

  // Anchor dot
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x1, y1, 6 * clamp01(p * 3), 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x1, y1, 12 * clamp01(p * 2.5), 0, TAU);
  ctx.stroke();

  // Elbow trace
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(lerp(x1, elbowX, seg1P), lerp(y1, y2, seg1P));
  if (seg2P > 0) {
    ctx.lineTo(lerp(elbowX, x2, seg2P), y2);
  }
  ctx.stroke();

  if (labelP > 0.02 && label) {
    ctx.globalAlpha = labelP;
    ctx.font = '700 22px JetBrains';
    const tw = ctx.measureText(label).width;
    const pw = tw + 30;
    const ph = 42;
    const px = align === 'right' ? x2 - pw : align === 'center' ? x2 - pw / 2 : x2;
    roundRectPath(ctx, px, y2 - ph / 2, pw, ph, 10);
    ctx.fillStyle = 'rgba(8, 22, 19, 0.94)';
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.75);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px + pw / 2, y2 + 1);
  }
  ctx.restore();
}

// ============================================================================
// 5. CLEAN ARCHITECTURAL STAGE BACKDROP (ZERO PARTICLE CLUTTER)
// ============================================================================

const stageCache = new Map();

function getCachedStageCanvas(paletteName) {
  const key = paletteName || 'emerald';
  if (stageCache.has(key)) return stageCache.get(key);
  const pal = STAGE_PALETTES[key] || STAGE_PALETTES.emerald;

  const c = new Canvas(WIDTH, HEIGHT);
  const bctx = c.getContext('2d');

  // 1. Studio dark architectural gradient
  const grad = bctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, pal.bot);
  grad.addColorStop(0.28, pal.top);
  grad.addColorStop(0.68, pal.mid);
  grad.addColorStop(1, pal.bot);
  bctx.fillStyle = grad;
  bctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 2. Soft centered studio key-light dome (no noisy orbs)
  const keyLight = bctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.42, 40, WIDTH * 0.5, HEIGHT * 0.42, 980);
  keyLight.addColorStop(0, rgba(pal.key, 0.12));
  keyLight.addColorStop(0.55, rgba(pal.rim, 0.05));
  keyLight.addColorStop(1, rgba(pal.bot, 0));
  bctx.fillStyle = keyLight;
  bctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 3. Subtle architectural drafting grid (masked smoothly at edges)
  bctx.save();
  const step = 96;
  bctx.lineWidth = 1;
  bctx.strokeStyle = rgba(pal.rim, 0.065);
  bctx.beginPath();
  for (let x = 96; x < WIDTH; x += step) {
    bctx.moveTo(x, 220);
    bctx.lineTo(x, HEIGHT - 220);
  }
  for (let y = 260; y < HEIGHT - 220; y += step) {
    bctx.moveTo(72, y);
    bctx.lineTo(WIDTH - 72, y);
  }
  bctx.stroke();

  // Stronger major grid axes every 384px
  bctx.strokeStyle = rgba(pal.key, 0.075);
  bctx.beginPath();
  for (let x = 144; x < WIDTH; x += step * 4) {
    bctx.moveTo(x, 220);
    bctx.lineTo(x, HEIGHT - 220);
  }
  for (let y = 548; y < HEIGHT - 220; y += step * 4) {
    bctx.moveTo(72, y);
    bctx.lineTo(WIDTH - 72, y);
  }
  bctx.stroke();
  bctx.restore();

  // 4. Crisp architectural outer frame & registration ticks
  bctx.save();
  bctx.strokeStyle = rgba(pal.key, 0.18);
  bctx.lineWidth = 1.5;
  roundRectPath(bctx, 42, 42, WIDTH - 84, HEIGHT - 84, 34);
  bctx.stroke();
  drawRegistrationMark(bctx, 74, 248, 8, pal.key, 0.4);
  drawRegistrationMark(bctx, WIDTH - 74, 248, 8, pal.key, 0.4);
  drawRegistrationMark(bctx, 74, 2005, 8, pal.key, 0.4);
  drawRegistrationMark(bctx, WIDTH - 74, 2005, 8, pal.key, 0.4);
  bctx.restore();

  // 5. Clean radial edge vignette
  const vig = bctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.48, WIDTH * 0.36, WIDTH / 2, HEIGHT * 0.5, HEIGHT * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.75, 'rgba(2, 6, 6, 0.20)');
  vig.addColorStop(1, 'rgba(1, 3, 3, 0.58)');
  bctx.fillStyle = vig;
  bctx.fillRect(0, 0, WIDTH, HEIGHT);

  stageCache.set(key, c);
  return c;
}

export function drawArchitecturalStage(ctx, totalT, paletteName = 'emerald') {
  const base = getCachedStageCanvas(paletteName);
  ctx.drawImage(base, 0, 0);

  // Subtle horizontal stage horizon scan-glow (editorial studio polish, zero particles)
  const pal = STAGE_PALETTES[paletteName] || STAGE_PALETTES.emerald;
  ctx.save();
  const scanY = 580 + Math.sin(totalT * 0.45) * 40;
  const band = ctx.createLinearGradient(0, scanY - 120, 0, scanY + 120);
  band.addColorStop(0, rgba(pal.key, 0));
  band.addColorStop(0.5, rgba(pal.key, 0.045));
  band.addColorStop(1, rgba(pal.key, 0));
  ctx.fillStyle = band;
  ctx.fillRect(44, scanY - 120, WIDTH - 88, 240);
  ctx.restore();
}

// ============================================================================
// 6. EDITORIAL HUD, HEADLINE, ARABIC PLAQUE & BROADCAST CAPTIONS
// ============================================================================

export function drawTopHUD(ctx, scene, localT) {
  const enter = easeOutCubic(clamp01(localT / 0.45));
  ctx.save();
  ctx.globalAlpha = enter;

  // Left: Brand Emblem + Handle
  const bx = 84;
  const by = 92;
  drawRubElHizbBadge(ctx, bx + 20, by, 18, localT * 0.25, THEME.goldMedina, 2, rgba(THEME.goldMedina, 0.16));
  ctx.font = '700 27px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(VIDEO_CONFIG.channelHandle, bx + 54, by + 1);

  // Right: Category Tag
  ctx.font = '700 21px JetBrains';
  const catW = ctx.measureText(VIDEO_CONFIG.categoryLabel).width + 44;
  roundRectPath(ctx, WIDTH - 84 - catW, by - 21, catW, 42, 21);
  ctx.fillStyle = 'rgba(9, 25, 22, 0.86)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.turqBright, 0.42);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = THEME.turqBright;
  ctx.textAlign = 'center';
  ctx.fillText(VIDEO_CONFIG.categoryLabel, WIDTH - 84 - catW / 2, by + 1);

  // Editorial Chapter Indicator Bar
  const chapY = 178;
  const chapText = `${scene.chapter}  ·  ${scene.badge}`;
  ctx.font = '700 23px JetBrains';
  const cw = ctx.measureText(chapText).width + 58;

  // Flanking editorial hairlines
  const lineLen = 190 * enter;
  drawStrokeLine(ctx, WIDTH / 2 - cw / 2 - 20 - lineLen, chapY, WIDTH / 2 - cw / 2 - 20, chapY, rgba(THEME.goldMedina, 0.45), 1.5);
  drawStrokeLine(ctx, WIDTH / 2 + cw / 2 + 20, chapY, WIDTH / 2 + cw / 2 + 20 + lineLen, chapY, rgba(THEME.goldMedina, 0.45), 1.5);

  roundRectPath(ctx, WIDTH / 2 - cw / 2, chapY - 22, cw, 44, 12);
  ctx.fillStyle = 'rgba(9, 22, 19, 0.92)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.55);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = THEME.goldBright;
  ctx.textAlign = 'center';
  ctx.fillText(chapText, WIDTH / 2, chapY + 1);

  ctx.restore();
}

export function drawKineticHeadline(ctx, scene, localT) {
  const words = scene.headline.split(' ');
  const hlSet = new Set((scene.highlightWords || []).flatMap((hw) => hw.toUpperCase().split(' ')));

  ctx.save();
  const fontSize = words.length > 7 ? 56 : 62;
  ctx.font = `800 ${fontSize}px Jakarta`;
  const maxW = 1220;
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineH = fontSize + 20;
  const startY = lines.length === 1 ? 316 : 292;
  const wipeP = easeOutQuart(clamp01((localT - 0.18) / 0.55));

  lines.forEach((ln, li) => {
    const lp = easeOutExpo(clamp01((localT - li * 0.08) / 0.42));
    const y = startY + li * lineH + (1 - lp) * 24;
    ctx.save();
    ctx.globalAlpha = lp;
    ctx.font = `800 ${fontSize}px Jakarta`;
    ctx.textBaseline = 'middle';

    const lineWords = ln.split(' ');
    const spaceW = ctx.measureText(' ').width;
    const widths = lineWords.map((w) => ctx.measureText(w).width);
    const totalW = widths.reduce((a, b) => a + b, 0) + spaceW * (lineWords.length - 1);
    let cx = WIDTH / 2 - totalW / 2;

    lineWords.forEach((w, wi) => {
      const cleanW = w.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
      const isHL = hlSet.has(cleanW);
      const ww = widths[wi];

      if (isHL) {
        // Editorial gold highlighter sweep under + behind keyword
        const padX = 12;
        const boxW = (ww + padX * 2) * wipeP;
        if (boxW > 4) {
          roundRectPath(ctx, cx - padX, y - fontSize * 0.54, boxW, fontSize * 1.08, 12);
          const g = ctx.createLinearGradient(cx - padX, y - 30, cx - padX + ww + padX * 2, y + 30);
          g.addColorStop(0, THEME.goldBright);
          g.addColorStop(1, THEME.goldMedina);
          ctx.fillStyle = g;
          ctx.fill();
        }
        ctx.fillStyle = wipeP > 0.35 ? THEME.bgObsidian : THEME.ivory;
      } else {
        ctx.fillStyle = THEME.ivory;
      }
      ctx.textAlign = 'left';
      ctx.fillText(w, cx, y);
      cx += ww + spaceW;
    });
    ctx.restore();
  });

  // Subtle divider bar beneath headline
  const divY = startY + lines.length * lineH + 8;
  const divW = 240 * easeOutCubic(clamp01(localT / 0.55));
  drawStrokeLine(ctx, WIDTH / 2 - divW / 2, divY, WIDTH / 2 + divW / 2, divY, rgba(THEME.goldMedina, 0.45), 2);
  ctx.restore();
}

export function drawArabicPlaque(ctx, scene, cx, cy, maxW, localT, opts = {}) {
  const { delay = 0.6, arabicSize = 48, showTrans = true } = opts;
  const p = easeOutExpo(clamp01((localT - delay) / 0.6));
  if (p <= 0.01 || !scene.arabic) return;

  ctx.save();
  ctx.globalAlpha = p;
  const yShift = (1 - p) * 20;

  let fittedArSize = arabicSize;
  ctx.font = `700 ${fittedArSize}px Amiri`;
  while (ctx.measureText(scene.arabic).width > maxW - 110 && fittedArSize > 32) {
    fittedArSize -= 2;
    ctx.font = `700 ${fittedArSize}px Amiri`;
  }
  const arW = ctx.measureText(scene.arabic).width;

  const transText = scene.arabicTrans ? `"${scene.arabicTrans}"` : '';
  ctx.font = 'italic 600 24px Playfair';
  const targetMaxTextW = Math.min(maxW - 110, 1020);
  const transLines = [];
  if (showTrans && transText) {
    const words = transText.split(' ');
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > targetMaxTextW && cur) {
        transLines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) transLines.push(cur);
  }
  const widestTrans = transLines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
  const boxW = Math.max(660, Math.min(maxW, Math.max(arW, widestTrans) + 140));
  const extraH = transLines.length > 1 ? (transLines.length - 1) * 32 : 0;
  const boxH = (showTrans ? 186 : 118) + extraH;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2 + yShift;

  drawBevelCard(ctx, bx, by, boxW, boxH, {
    radius: 22,
    accent: THEME.goldMedina,
    bgTop: 'rgba(10, 26, 22, 0.94)',
    bgBot: 'rgba(5, 14, 12, 0.97)',
    borderAlpha: 0.55,
  });

  // Left vertical gold accent spine
  roundRectPath(ctx, bx + 16, by + 20, 5, boxH - 40, 3);
  ctx.fillStyle = THEME.goldMedina;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = THEME.goldBright;
  ctx.font = `700 ${fittedArSize}px Amiri`;
  const arY = showTrans ? by + 62 : cy + yShift;
  ctx.fillText(scene.arabic, cx, arY);

  if (showTrans && transLines.length > 0) {
    drawStrokeLine(ctx, cx - 180, by + 108, cx + 180, by + 108, rgba(THEME.goldMedina, 0.35), 1.5);
    ctx.font = 'italic 600 24px Playfair';
    ctx.fillStyle = THEME.ivoryMuted;
    transLines.forEach((tl, li) => {
      ctx.fillText(tl, cx, by + 142 + li * 32);
    });
  }
  ctx.restore();
}

export function drawBroadcastCaptions(ctx, scene, localT) {
  const words = scene.words;
  if (!words || words.length === 0) return;

  const chunks = [];
  const chunkSize = 5;
  for (let i = 0; i < words.length; i += chunkSize) {
    const slice = words.slice(i, i + chunkSize);
    chunks.push({
      words: slice,
      start: slice[0].start,
      end: slice[slice.length - 1].end + 0.2,
    });
  }

  let activeChunk = chunks[0];
  for (let i = 0; i < chunks.length; i++) {
    if (localT >= chunks[i].start - 0.04) activeChunk = chunks[i];
  }
  if (!activeChunk || localT > activeChunk.end + 0.55) return;

  const chunkAlpha = clamp01((localT - activeChunk.start + 0.12) / 0.12);
  ctx.save();
  ctx.globalAlpha = chunkAlpha;

  const baseFont = '700 42px Jakarta';
  ctx.font = baseFont;
  const maxRowW = 1100;
  const rows = [[]];
  let rowW = 0;
  const spaceW = 16;
  for (const wObj of activeChunk.words) {
    const ww = ctx.measureText(wObj.word).width;
    if (rows[rows.length - 1].length > 0 && rowW + spaceW + ww > maxRowW) {
      rows.push([wObj]);
      rowW = ww;
    } else {
      rows[rows.length - 1].push(wObj);
      rowW += (rows[rows.length - 1].length > 1 ? spaceW : 0) + ww;
    }
  }

  const rowWidths = rows.map((row) => {
    const sum = row.reduce((acc, wObj) => acc + ctx.measureText(wObj.word).width, 0);
    return sum + Math.max(0, row.length - 1) * spaceW;
  });
  const widest = Math.max(...rowWidths, 280);
  const pillW = Math.min(1240, widest + 80);
  const pillH = rows.length === 1 ? 86 : 146;
  const centerY = 2165;
  const px = WIDTH / 2 - pillW / 2;
  const py = centerY - pillH / 2;

  roundRectPath(ctx, px, py, pillW, pillH, 22);
  ctx.fillStyle = 'rgba(4, 13, 11, 0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 22;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.35);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  rows.forEach((row, ri) => {
    const ry = rows.length === 1 ? centerY : centerY - 30 + ri * 58;
    let wx = WIDTH / 2 - rowWidths[ri] / 2;
    row.forEach((wObj) => {
      const ww = ctx.measureText(wObj.word).width;
      const isActive = localT >= wObj.start - 0.03 && localT <= wObj.end + 0.1;
      const isSpoken = localT > wObj.end + 0.1;

      if (isActive) {
        roundRectPath(ctx, wx - 8, ry - 27, ww + 16, 54, 10);
        ctx.fillStyle = rgba(THEME.goldBright, 0.16);
        ctx.fill();
        ctx.fillStyle = THEME.goldBright;
      } else {
        ctx.fillStyle = isSpoken ? THEME.ivory : 'rgba(210, 218, 214, 0.58)';
      }
      ctx.font = baseFont;
      ctx.fillText(wObj.word, wx, ry);
      wx += ww + spaceW;
    });
  });

  ctx.restore();
}

export function drawSourceFooter(ctx, sourceText, localT) {
  if (!sourceText) return;
  const p = easeOutCubic(clamp01((localT - 0.35) / 0.5));
  ctx.save();
  ctx.globalAlpha = p * 0.9;
  const txt = `SUMBER: ${sourceText}`;
  ctx.font = '600 22px JetBrains';
  const w = Math.min(1260, ctx.measureText(txt).width + 52);
  const y = 2385;
  roundRectPath(ctx, WIDTH / 2 - w / 2, y - 20, w, 40, 12);
  ctx.fillStyle = 'rgba(6, 17, 15, 0.85)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.slateText, 0.32);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = THEME.ivoryMuted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, WIDTH / 2, y + 1);
  ctx.restore();
}

// ============================================================================
// 7. BESPOKE EXPLANATORY MOTION GRAPHICS & ILLUSTRATIONS (ZERO FILLER)
// ============================================================================

/**
 * x01: Human Math Calculator (1+1=2) morphing into Islamic Multiplication Matrix (1 -> 10x -> 100x -> 700x -> INF)
 */
export function drawHumanVsIslamicMath(ctx, cx, cy, localT, totalT) {
  const morphP = easeInOutQuart(clamp01((localT - 4.2) / 1.4));
  const enterP = easeOutExpo(clamp01(localT / 0.7));

  // Phase 1: Mechanical Human Calculator Panel (shifts up/shrinks cleanly when Islamic Matrix activates)
  const calcY = lerp(cy - 40, cy - 390, morphP);
  const calcScale = lerp(1.0, 0.74, morphP);
  const calcAlpha = lerp(1.0, 0.72, morphP) * enterP;

  ctx.save();
  ctx.translate(cx, calcY);
  ctx.scale(calcScale, calcScale);
  ctx.globalAlpha = calcAlpha;

  drawBevelCard(ctx, -370, -140, 740, 280, {
    radius: 26,
    accent: morphP > 0.5 ? THEME.slateText : THEME.turqBright,
    headerLabel: 'HITUNGAN MATEMATIKA MANUSIA',
  });

  // Mechanical split-flap digit slots: [1] + [1] = [2]
  const slots = [
    { x: -215, txt: '1', box: true },
    { x: -108, txt: '+', box: false },
    { x: 0, txt: '1', box: true },
    { x: 108, txt: '=', box: false },
    { x: 215, txt: '2', box: true, highlight: true },
  ];
  slots.forEach((s, idx) => {
    const sp = springVal(localT - 0.35 - idx * 0.14);
    ctx.save();
    ctx.translate(s.x, 32);
    ctx.scale(0.85 + 0.15 * sp, 0.85 + 0.15 * sp);
    if (s.box) {
      roundRectPath(ctx, -64, -68, 128, 136, 18);
      ctx.fillStyle = s.highlight ? 'rgba(28, 44, 40, 0.95)' : 'rgba(14, 29, 26, 0.95)';
      ctx.fill();
      ctx.strokeStyle = s.highlight ? rgba(THEME.ivoryMuted, 0.6) : rgba(THEME.slateText, 0.4);
      ctx.lineWidth = 2;
      ctx.stroke();
      // Split-flap mechanical horizontal seam
      drawStrokeLine(ctx, -62, 0, 62, 0, 'rgba(0,0,0,0.45)', 2);
    }
    ctx.font = '800 72px JetBrains';
    ctx.fillStyle = s.highlight ? THEME.ivory : THEME.ivoryMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.txt, 0, 3);
    ctx.restore();
  });

  // Editorial strikethrough / "TERBATAS" tag once Islamic matrix takes over
  if (morphP > 0.6) {
    const stP = clamp01((morphP - 0.6) / 0.4);
    ctx.save();
    ctx.globalAlpha = stP;
    roundRectPath(ctx, -170, 114, 340, 42, 12);
    ctx.fillStyle = 'rgba(92, 27, 27, 0.94)';
    ctx.fill();
    ctx.strokeStyle = THEME.crimsonBright;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.font = '700 21px JetBrains';
    ctx.fillStyle = '#FFDADA';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KALKULASI DUNIA TERBATAS', 0, 136);
    ctx.restore();
  }
  ctx.restore();

  // Phase 2: Islamic Multiplication Matrix (1 -> 10x -> 100x -> 700x -> INF)
  if (morphP > 0.05) {
    const mY = cy + 185;
    ctx.save();
    ctx.globalAlpha = clamp01(morphP * 1.4);

    // Master Card Backdrop
    drawBevelCard(ctx, cx - 560, mY - 300, 1120, 600, {
      radius: 28,
      accent: THEME.goldMedina,
      headerLabel: 'MATEMATIKA LANGIT · PELIPATGANDAAN PAHALA',
    });

    // Source Node: 1 AMAL
    const srcX = cx - 410;
    const srcY = mY + 28;
    const tierTargets = [
      { x: cx - 105, y: mY - 125, val: '10×', label: 'MINIMAL', col: THEME.turqBright },
      { x: cx - 105, y: mY + 180, val: '100×', label: 'BERTUMBUH', col: THEME.turqBright },
      { x: cx + 295, y: mY - 125, val: '700×', label: 'AL-BAQARAH', col: THEME.goldBright },
      { x: cx + 295, y: mY + 180, val: '∞', label: 'TANPA BATAS', col: THEME.goldBright },
    ];

    // Animated Bezier Conduits connecting 1 AMAL -> 10x/100x -> 700x/INF
    const conP = easeOutCubic(clamp01((localT - 5.2) / 1.4));
    const drawConduit = (x1, y1, x2, y2, color, p) => {
      if (p <= 0.01) return;
      ctx.save();
      const midX = (x1 + x2) / 2;
      ctx.strokeStyle = rgba(color, 0.55);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(midX, y1, midX, y2, x2, y2);
      ctx.stroke();

      // Traveling signal pulse along bezier
      const u = ((totalT * 0.75) % 1);
      const iu = 1 - u;
      const px = iu * iu * iu * x1 + 3 * iu * iu * u * midX + 3 * iu * u * u * midX + u * u * u * x2;
      const py = iu * iu * iu * y1 + 3 * iu * iu * u * y1 + 3 * iu * u * u * y2 + u * u * u * y2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    if (conP > 0.01) {
      drawConduit(srcX + 95, srcY, tierTargets[0].x - 125, tierTargets[0].y, THEME.turqBright, conP);
      drawConduit(srcX + 95, srcY, tierTargets[1].x - 125, tierTargets[1].y, THEME.turqBright, conP);
      drawConduit(tierTargets[0].x + 125, tierTargets[0].y, tierTargets[2].x - 135, tierTargets[2].y, THEME.goldBright, clamp01((localT - 6.0) / 1.0));
      drawConduit(tierTargets[1].x + 125, tierTargets[1].y, tierTargets[3].x - 135, tierTargets[3].y, THEME.goldBright, clamp01((localT - 6.6) / 1.0));
    }

    // Source 1 AMAL node
    const sScale = springVal(localT - 4.8);
    ctx.save();
    ctx.translate(srcX, srcY);
    ctx.scale(sScale, sScale);
    roundRectPath(ctx, -95, -95, 190, 190, 28);
    ctx.fillStyle = 'rgba(17, 50, 43, 0.95)';
    ctx.fill();
    ctx.strokeStyle = THEME.turqBright;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 72px Cinzel';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('1', 0, -16);
    ctx.font = '700 20px JetBrains';
    ctx.fillStyle = THEME.turqBright;
    ctx.fillText('KEBAIKAN', 0, 44);
    ctx.restore();

    // 4 Output Tier Cards
    tierTargets.forEach((node, idx) => {
      const np = springVal(localT - (5.3 + idx * 0.55));
      if (np <= 0.02) return;
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.scale(np, np);
      roundRectPath(ctx, -135, -95, 270, 190, 24);
      ctx.fillStyle = idx >= 2 ? 'rgba(30, 26, 13, 0.96)' : 'rgba(10, 33, 28, 0.96)';
      ctx.fill();
      ctx.strokeStyle = node.col;
      ctx.lineWidth = idx >= 2 ? 3 : 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 68px Cinzel';
      ctx.fillStyle = node.col;
      ctx.fillText(node.val, 0, -16);
      ctx.font = '700 20px JetBrains';
      ctx.fillStyle = THEME.ivoryMuted;
      ctx.fillText(node.label, 0, 48);
      ctx.restore();
    });

    ctx.restore();
  }
}

/**
 * x02: Illuminated Open Mushaf + 1 Unit Block Duplicating into 10 Extruded Gold Ingots (2x5 grid)
 */
export function drawMushafAndTenBlocks(ctx, cx, cy, localT, totalT) {
  const bookP = easeOutExpo(clamp01(localT / 0.8));

  // Top: 3D Open Mushaf Book framing the Surah badge
  ctx.save();
  ctx.translate(cx, cy - 285);
  ctx.scale(0.9 + 0.1 * bookP, 0.9 + 0.1 * bookP);
  ctx.globalAlpha = bookP;

  // Book outer leather cover
  roundRectPath(ctx, -490, -155, 980, 310, 22);
  ctx.fillStyle = '#0D2620';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = THEME.goldMedina;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Left & Right Ivory/Emerald Parchment Pages
  for (const side of [-1, 1]) {
    const px = side < 0 ? -466 : 8;
    roundRectPath(ctx, px, -135, 458, 270, 14);
    const pGrad = ctx.createLinearGradient(side < 0 ? px + 458 : px, 0, side < 0 ? px : px + 458, 0);
    pGrad.addColorStop(0, '#071713');
    pGrad.addColorStop(0.14, '#0E2B24');
    pGrad.addColorStop(1, '#12332B');
    ctx.fillStyle = pGrad;
    ctx.fill();
    ctx.strokeStyle = rgba(THEME.goldMedina, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Decorative inner border on each Mushaf page
    roundRectPath(ctx, px + 18, -118, 422, 236, 10);
    ctx.strokeStyle = rgba(THEME.goldMedina, 0.25);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Fine Quranic guide lines + crisp page label
    for (let ln = 0; ln < 4; ln++) {
      const ly = -76 + ln * 46;
      drawStrokeLine(ctx, px + 44, ly, px + 414, ly, rgba(THEME.goldMedina, 0.14), 1.8);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 20px JetBrains';
    ctx.fillStyle = THEME.turqBright;
    ctx.fillText(side < 0 ? 'WAHYU AL-QUR\'AN' : 'KAIDAH RAHMAT', px + 229, -46);
    ctx.font = '800 32px Cinzel';
    ctx.fillStyle = THEME.goldBright;
    ctx.fillText(side < 0 ? 'QS. AL-AN\'AM' : 'AYAT 160 · 10×', px + 229, 10);
    ctx.font = '500 20px Jakarta';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(side < 0 ? 'Juz 8 · Ayat ke-160' : 'Batas Bawah Pahala', px + 229, 54);
  }

  // Spine & Bookmark Ribbon
  const spine = ctx.createLinearGradient(-16, 0, 16, 0);
  spine.addColorStop(0, 'rgba(0,0,0,0.6)');
  spine.addColorStop(0.5, rgba(THEME.goldBright, 0.35));
  spine.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = spine;
  ctx.fillRect(-16, -135, 32, 270);
  drawRubElHizbBadge(ctx, 0, 0, 16, totalT * 0.2, THEME.goldBright, 2, '#0A1E1A');

  // Ribbon bookmark hanging from center
  ctx.fillStyle = THEME.turqMid;
  ctx.beginPath();
  ctx.moveTo(-10, 135);
  ctx.lineTo(10, 135);
  ctx.lineTo(10, 185);
  ctx.lineTo(0, 172);
  ctx.lineTo(-10, 185);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Bottom Stage: 1 Gold Block -> 10 Gold Blocks (2x5 Matrix)
  const matY = cy + 205;
  drawBevelCard(ctx, cx - 560, matY - 210, 1120, 420, {
    radius: 26,
    accent: THEME.turqBright,
    headerLabel: 'MULTIPLIKASI MINIMAL · 1 KEBAIKAN MENJADI 10 PAHALA',
  });

  // Left: 1 Source Unit Block
  const srcP = springVal(localT - 0.8);
  const drawIngot = (x, y, w, h, colorTop, colorFront, label, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const depth = 12;
    // Top face
    ctx.fillStyle = colorTop;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(-w / 2 + depth, -h / 2 - depth);
    ctx.lineTo(w / 2 + depth, -h / 2 - depth);
    ctx.lineTo(w / 2, -h / 2);
    ctx.closePath();
    ctx.fill();
    // Right face
    ctx.fillStyle = rgba(colorFront, 0.55);
    ctx.beginPath();
    ctx.moveTo(w / 2, -h / 2);
    ctx.lineTo(w / 2 + depth, -h / 2 - depth);
    ctx.lineTo(w / 2 + depth, h / 2 - depth);
    ctx.lineTo(w / 2, h / 2);
    ctx.closePath();
    ctx.fill();
    // Front face
    roundRectPath(ctx, -w / 2, -h / 2, w, h, 10);
    ctx.fillStyle = colorFront;
    ctx.fill();
    ctx.strokeStyle = rgba('#FFFFFF', 0.35);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '800 28px JetBrains';
    ctx.fillStyle = THEME.bgObsidian;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 2);
    ctx.restore();
  };

  if (srcP > 0.02) {
    drawIngot(cx - 400, matY + 25, 130, 130, '#6FF7DF', THEME.turqBright, '1×', srcP);
  }

  // Animated Arrow Connector
  const arrP = easeOutCubic(clamp01((localT - 1.5) / 0.5));
  if (arrP > 0.02) {
    const ax1 = cx - 295;
    const ax2 = lerp(ax1, cx - 185, arrP);
    drawStrokeLine(ctx, ax1, matY + 25, ax2, matY + 25, THEME.goldBright, 5, arrP);
    if (arrP > 0.7) {
      ctx.fillStyle = THEME.goldBright;
      ctx.beginPath();
      ctx.moveTo(ax2 + 16, matY + 25);
      ctx.lineTo(ax2 - 6, matY + 12);
      ctx.lineTo(ax2 - 6, matY + 38);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Right: 2 rows x 5 cols = 10 Gold Ingots appearing sequentially
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const gx = cx - 80 + col * 130;
    const gy = matY - 42 + row * 124;
    const gp = springVal(localT - (1.8 + i * 0.14), 220, 16);
    if (gp > 0.02) {
      drawIngot(gx, gy, 96, 92, '#FFF1BA', THEME.goldBright, String(i + 1), gp);
    }
  }
}

/**
 * x03: Precision Balance Instrument (Mizan) + Justice vs Mercy Split Ledger
 */
export function drawPrecisionMizan(ctx, cx, cy, localT, totalT) {
  const enter = easeOutExpo(clamp01(localT / 0.75));
  const tiltTarget = lerp(0, 0.25, easeOutElastic(clamp01((localT - 0.9) / 1.7))) + Math.sin(totalT * 1.4) * 0.015;

  ctx.save();
  ctx.globalAlpha = enter;

  // Architectural base pedestal
  const baseY = cy + 90;
  roundRectPath(ctx, cx - 190, baseY - 20, 380, 34, 10);
  ctx.fillStyle = THEME.goldAmber;
  ctx.fill();
  roundRectPath(ctx, cx - 125, baseY - 46, 250, 28, 8);
  ctx.fillStyle = THEME.goldMedina;
  ctx.fill();

  // Calibrated Fulcrum Protractor Gauge behind pivot
  const pivY = cy - 230;
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, pivY, 130, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  for (let a = 0; a <= 8; a++) {
    const ang = Math.PI * (0.15 + (a / 8) * 0.7);
    const r1 = 122;
    const r2 = a === 4 ? 144 : 134;
    drawStrokeLine(
      ctx,
      cx + Math.cos(ang) * r1,
      pivY + Math.sin(ang) * r1,
      cx + Math.cos(ang) * r2,
      pivY + Math.sin(ang) * r2,
      a === 4 ? THEME.ivoryMuted : rgba(THEME.goldMedina, 0.5),
      a === 4 ? 3 : 1.5,
    );
  }

  // Central Vertical Brass Column
  const colGrad = ctx.createLinearGradient(cx - 12, pivY, cx + 12, baseY - 46);
  colGrad.addColorStop(0, THEME.goldBright);
  colGrad.addColorStop(0.5, THEME.goldMedina);
  colGrad.addColorStop(1, THEME.goldDeep);
  roundRectPath(ctx, cx - 12, pivY, 24, baseY - 46 - pivY, 6);
  ctx.fillStyle = colGrad;
  ctx.fill();

  // Tilting Beam
  const beamW = 760;
  const lx = cx - (beamW / 2) * Math.cos(tiltTarget);
  const ly = pivY - (beamW / 2) * Math.sin(tiltTarget);
  const rx = cx + (beamW / 2) * Math.cos(tiltTarget);
  const ry = pivY + (beamW / 2) * Math.sin(tiltTarget);

  ctx.save();
  ctx.translate(cx, pivY);
  ctx.rotate(tiltTarget);
  roundRectPath(ctx, -beamW / 2 - 14, -9, beamW + 28, 18, 9);
  ctx.fillStyle = THEME.goldBright;
  ctx.fill();
  ctx.restore();

  // Pivot Pointer Needle
  ctx.save();
  ctx.translate(cx, pivY);
  ctx.rotate(tiltTarget);
  ctx.fillStyle = THEME.ivory;
  ctx.beginPath();
  ctx.moveTo(-6, 12);
  ctx.lineTo(6, 12);
  ctx.lineTo(0, 118);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Pivot Medallion
  ctx.fillStyle = THEME.bgObsidian;
  ctx.beginPath();
  ctx.arc(cx, pivY, 22, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Left Pan: 1 Crimson Block (KEBURUKAN = 1x)
  const panHang = 185;
  const drawPan = (px, py, isRight) => {
    const panW = 240;
    drawStrokeLine(ctx, px, py, px - panW * 0.44, py + panHang, rgba(THEME.goldMedina, 0.75), 2.5);
    drawStrokeLine(ctx, px, py, px + panW * 0.44, py + panHang, rgba(THEME.goldMedina, 0.75), 2.5);

    const dishY = py + panHang;
    ctx.fillStyle = THEME.goldMedina;
    ctx.beginPath();
    ctx.moveTo(px - panW / 2, dishY);
    ctx.lineTo(px + panW / 2, dishY);
    ctx.quadraticCurveTo(px, dishY + 34, px - panW / 2, dishY);
    ctx.fill();

    if (!isRight) {
      // Single crimson unit cube
      roundRectPath(ctx, px - 28, dishY - 56, 56, 56, 10);
      ctx.fillStyle = THEME.crimsonBright;
      ctx.fill();
      ctx.strokeStyle = '#FFB3B3';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '800 26px JetBrains';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1×', px, dishY - 28);
    } else {
      // 10 stacked gold bars (2 cols x 5 rows)
      for (let i = 0; i < 10; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = px - 58 + col * 64;
        const by = dishY - 24 - row * 24;
        roundRectPath(ctx, bx, by, 54, 19, 5);
        ctx.fillStyle = row % 2 === 0 ? THEME.goldBright : THEME.goldMedina;
        ctx.fill();
      }
    }

    // Precision callout badge below pan
    roundRectPath(ctx, px - 135, dishY + 38, 270, 74, 14);
    ctx.fillStyle = isRight ? 'rgba(13, 38, 31, 0.94)' : 'rgba(38, 16, 16, 0.94)';
    ctx.fill();
    ctx.strokeStyle = isRight ? THEME.goldBright : THEME.crimsonBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 28px Cinzel';
    ctx.fillStyle = isRight ? THEME.goldBright : THEME.crimsonBright;
    ctx.fillText(isRight ? '10× — 700×' : '1× SAJA', px, dishY + 62);
    ctx.font = '700 18px JetBrains';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(isRight ? 'KEBAIKAN (RAHMAT)' : 'KEBURUKAN (ADIL)', px, dishY + 92);
  };

  drawPan(lx, ly, false);
  drawPan(rx, ry, true);

  // Bottom Dual Editorial Comparison Cards (Al-Qurthubi)
  const cardP = easeOutExpo(clamp01((localT - 1.8) / 0.7));
  if (cardP > 0.02) {
    ctx.save();
    ctx.globalAlpha = cardP;
    const cardY = cy + 235;
    drawBevelCard(ctx, cx - 560, cardY, 540, 175, {
      radius: 20,
      accent: THEME.crimsonBright,
      headerLabel: 'KEADILAN ALLAH',
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 40px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('1 DOSA = 1 BALASAN', cx - 290, cardY + 100);
    ctx.font = '500 23px Jakarta';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText('Tidak pernah dilebihkan seberat pun', cx - 290, cardY + 142);

    drawBevelCard(ctx, cx + 20, cardY, 540, 175, {
      radius: 20,
      accent: THEME.goldBright,
      headerLabel: 'RAHMAT ALLAH',
    });
    ctx.font = '800 40px Jakarta';
    ctx.fillStyle = THEME.goldBright;
    ctx.fillText('1 AMAL = 10× — 700×', cx + 290, cardY + 100);
    ctx.font = '500 23px Jakarta';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText('Dilipatgandakan tanpa batas hitungan', cx + 290, cardY + 142);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * x04: Heart-to-Angelic-Scroll Intention System (+1 Hasanah Kamilah Stamp)
 */
export function drawHeartToScrollSystem(ctx, cx, cy, localT, totalT) {
  const enter = easeOutExpo(clamp01(localT / 0.7));
  ctx.save();
  ctx.globalAlpha = enter;

  // Left: Anatomical/Geometric Heart Chamber emitting Intention Beam
  const hx = cx - 330;
  const hy = cy - 90;
  const pulse = 1 + 0.04 * Math.sin(totalT * 4.2);

  drawBevelCard(ctx, hx - 210, hy - 220, 420, 440, {
    radius: 26,
    accent: THEME.turqBright,
    headerLabel: 'NIAT DI DALAM HATI',
  });

  ctx.save();
  ctx.translate(hx, hy + 10);
  ctx.scale(pulse, pulse);
  // Crisp geometric heart emblem
  ctx.beginPath();
  ctx.moveTo(0, 76);
  ctx.bezierCurveTo(-110, 10, -110, -80, -45, -80);
  ctx.bezierCurveTo(-10, -80, 0, -45, 0, -35);
  ctx.bezierCurveTo(0, -45, 10, -80, 45, -80);
  ctx.bezierCurveTo(110, -80, 110, 10, 0, 76);
  ctx.closePath();
  const hGrad = ctx.createLinearGradient(0, -80, 0, 80);
  hGrad.addColorStop(0, THEME.turqBright);
  hGrad.addColorStop(1, THEME.turqDeep);
  ctx.fillStyle = hGrad;
  ctx.fill();
  ctx.strokeStyle = '#B0FFF1';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '800 26px JetBrains';
  ctx.fillStyle = THEME.bgObsidian;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TEKAD BAIK', 0, -6);
  ctx.restore();

  ctx.font = '500 24px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.textAlign = 'center';
  ctx.fillText('Walau belum terlaksana', hx, hy + 165);

  // Connecting Intent Conduit Line -> Angelic Ledger
  const beamP = easeOutCubic(clamp01((localT - 0.9) / 0.8));
  if (beamP > 0.01) {
    const bx1 = hx + 210;
    const bx2 = lerp(bx1, cx - 25, beamP);
    drawStrokeLine(ctx, bx1, hy + 10, bx2, hy + 10, THEME.goldBright, 5, 0.9);
    if (beamP > 0.7) {
      ctx.fillStyle = THEME.goldBright;
      ctx.beginPath();
      ctx.moveTo(bx2 + 16, hy + 10);
      ctx.lineTo(bx2 - 6, hy - 4);
      ctx.lineTo(bx2 - 6, hy + 24);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Right: Angelic Ledger Card + Gold Seal Stamp (+1 PENUH)
  const lx = cx + 260;
  drawBevelCard(ctx, lx - 280, hy - 220, 560, 440, {
    radius: 26,
    accent: THEME.goldBright,
    headerLabel: 'CATATAN MALAIKAT',
  });

  // Two ledger line entries
  const rows = [
    { y: hy - 95, tag: 'STATUS NIAT', val: 'TERCATAT OTOMATIS', p: stagger(localT - 1.1, 0, 0.35) },
    { y: hy + 5, tag: 'NILAI PAHALA', val: '1 KEBAIKAN SEMPURNA', p: stagger(localT - 1.1, 1, 0.35) },
  ];
  rows.forEach((r) => {
    if (r.p <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = easeOutCubic(r.p);
    roundRectPath(ctx, lx - 240, r.y - 36, 480, 74, 14);
    ctx.fillStyle = 'rgba(13, 36, 30, 0.9)';
    ctx.fill();
    ctx.strokeStyle = rgba(THEME.goldMedina, 0.45);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '700 18px JetBrains';
    ctx.fillStyle = THEME.turqBright;
    ctx.fillText(r.tag, lx - 218, r.y - 11);

    ctx.font = '800 26px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText(r.val, lx - 218, r.y + 18);
    ctx.restore();
  });

  // Embossed Stamp: +1 HASANAH KAMILAH
  const stampP = springVal(localT - 2.3, 260, 16);
  if (stampP > 0.02) {
    ctx.save();
    ctx.translate(lx, hy + 135);
    ctx.scale(lerp(1.5, 1.0, stampP), lerp(1.5, 1.0, stampP));
    ctx.globalAlpha = clamp01(stampP);
    roundRectPath(ctx, -210, -44, 420, 88, 16);
    ctx.fillStyle = THEME.goldBright;
    ctx.fill();
    ctx.font = '900 34px Cinzel';
    ctx.fillStyle = THEME.bgObsidian;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+1  PAHALA PENUH', 0, 2);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * x05: Intercept & Transform Gate (Bad Impulse Deflected by Taqwa Shield into +1 Good Deed)
 */
export function drawInterceptGateDiagram(ctx, cx, cy, localT) {
  const enter = easeOutExpo(clamp01(localT / 0.65));
  ctx.save();
  ctx.globalAlpha = enter;

  drawBevelCard(ctx, cx - 560, cy - 330, 1120, 620, {
    radius: 28,
    accent: THEME.turqBright,
    headerLabel: 'MEKANISME PENOLAKAN NIAT BURUK KARENA ALLAH',
  });

  const leftX = cx - 400;
  const shieldX = cx;
  const rightTopY = cy - 110;
  const rightBotY = cy + 165;
  const rightX = cx + 380;

  // Target A (Bottom): CATATAN DOSA (blocked / dimmed)
  roundRectPath(ctx, rightX - 150, rightBotY - 68, 300, 136, 18);
  ctx.fillStyle = 'rgba(42, 16, 16, 0.72)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.crimsonBright, 0.35);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = THEME.crimsonBright;
  ctx.fillText('CATATAN DOSA', rightX, rightBotY - 22);
  ctx.font = '800 38px Cinzel';
  ctx.fillStyle = rgba(THEME.ivoryMuted, 0.45);
  ctx.fillText('0 (BATAL)', rightX, rightBotY + 22);

  // Blocked dashed track from shield to Dosa
  ctx.save();
  ctx.setLineDash([10, 10]);
  drawStrokeLine(ctx, shieldX + 40, cy + 40, rightX - 160, rightBotY, rgba(THEME.crimsonBright, 0.3), 3);
  ctx.restore();

  // Target B (Top): CATATAN PAHALA (+1)
  const hitP = easeOutCubic(clamp01((localT - 1.9) / 0.7));
  roundRectPath(ctx, rightX - 150, rightTopY - 72, 300, 144, 18);
  ctx.fillStyle = hitP > 0.5 ? 'rgba(26, 44, 24, 0.96)' : 'rgba(13, 33, 28, 0.9)';
  ctx.fill();
  ctx.strokeStyle = hitP > 0.5 ? THEME.goldBright : rgba(THEME.goldMedina, 0.45);
  ctx.lineWidth = hitP > 0.5 ? 3.5 : 2;
  ctx.stroke();
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('CATATAN PAHALA', rightX, rightTopY - 26);
  ctx.font = '900 46px Cinzel';
  ctx.fillStyle = hitP > 0.5 ? THEME.goldBright : THEME.ivoryMuted;
  ctx.fillText('+1 PENUH', rightX, rightTopY + 22);

  // Source: NIAT BURUK MUNCUL
  roundRectPath(ctx, leftX - 135, cy - 30, 270, 130, 18);
  ctx.fillStyle = 'rgba(42, 16, 16, 0.92)';
  ctx.fill();
  ctx.strokeStyle = THEME.crimsonBright;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '700 20px JetBrains';
  ctx.fillStyle = '#FFB3B3';
  ctx.fillText('DORONGAN HATI', leftX, cy + 12);
  ctx.font = '800 30px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('NIAT BURUK', leftX, cy + 54);

  // Incoming crimson path -> Shield -> Deflected golden curve -> Pahala
  const inP = clamp01((localT - 0.5) / 0.9);
  drawStrokeLine(ctx, leftX + 135, cy + 35, lerp(leftX + 135, shieldX - 30, inP), cy + 35, THEME.crimsonBright, 5);

  const defP = easeOutCubic(clamp01((localT - 1.4) / 0.9));
  if (defP > 0.01) {
    ctx.save();
    ctx.strokeStyle = THEME.goldBright;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shieldX, cy + 35);
    const ex = lerp(shieldX, rightX - 155, defP);
    const ey = lerp(cy + 35, rightTopY, defP);
    ctx.quadraticCurveTo(shieldX + 90, rightTopY, ex, ey);
    ctx.stroke();
    ctx.restore();
  }

  // Center Taqwa Shield Barrier
  const shP = springVal(localT - 1.0, 240, 16);
  ctx.save();
  ctx.translate(shieldX, cy + 35);
  ctx.scale(shP, shP);
  ctx.beginPath();
  ctx.moveTo(0, -108);
  ctx.lineTo(86, -68);
  ctx.lineTo(74, 38);
  ctx.quadraticCurveTo(0, 112, 0, 112);
  ctx.quadraticCurveTo(0, 112, -74, 38);
  ctx.lineTo(-86, -68);
  ctx.closePath();
  const shG = ctx.createLinearGradient(0, -108, 0, 112);
  shG.addColorStop(0, THEME.turqBright);
  shG.addColorStop(1, THEME.turqDeep);
  ctx.fillStyle = shG;
  ctx.fill();
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = '800 22px JetBrains';
  ctx.fillStyle = THEME.bgObsidian;
  ctx.fillText('TAKUT', 0, -18);
  ctx.fillText('ALLAH', 0, 14);
  ctx.restore();

  ctx.restore();
}

/**
 * x06: Studio-Grade Exponential Area Chart & Callout Flags (1 -> 10x -> 100x -> 700x -> INF)
 */
export function drawExponentialAreaChart(ctx, cx, cy, localT) {
  const enter = easeOutExpo(clamp01(localT / 0.65));
  ctx.save();
  ctx.globalAlpha = enter;

  const boxW = 1140;
  const boxH = 740;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2 - 40;

  drawBevelCard(ctx, bx, by, boxW, boxH, {
    radius: 28,
    accent: THEME.goldMedina,
    headerLabel: 'KURVA ESKALASI PAHALA SAAT NIAT DIAMALKAN',
  });

  // Chart plotting region
  const px = bx + 135;
  const py = by + 110;
  const pw = boxW - 210;
  const ph = boxH - 220;

  // Horizontal Y-axis reference gridlines (exponential spacing)
  const yLevels = [
    { ratio: 0.08, label: '1×' },
    { ratio: 0.18, label: '10×' },
    { ratio: 0.36, label: '100×' },
    { ratio: 0.66, label: '700×' },
    { ratio: 0.95, label: '∞' },
  ];
  yLevels.forEach((lv) => {
    const ly = py + ph * (1 - lv.ratio);
    drawStrokeLine(ctx, px, ly, px + pw, ly, rgba(THEME.turqBright, 0.14), 1.5);
    ctx.font = '700 24px JetBrains';
    ctx.fillStyle = lv.label === '700×' || lv.label === '∞' ? THEME.goldBright : THEME.slateText;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(lv.label, px - 18, ly);
  });

  // Axes
  drawStrokeLine(ctx, px, py, px, py + ph, rgba(THEME.ivoryMuted, 0.4), 2);
  drawStrokeLine(ctx, px, py + ph, px + pw, py + ph, rgba(THEME.ivoryMuted, 0.4), 2);

  // 5 Key data points along exponential curve
  const pts = [
    { x: px + pw * 0.08, y: py + ph * (1 - 0.08), val: '1×', tag: 'NIAT', col: THEME.turqBright },
    { x: px + pw * 0.30, y: py + ph * (1 - 0.18), val: '10×', tag: 'MINIMAL', col: THEME.turqBright },
    { x: px + pw * 0.53, y: py + ph * (1 - 0.36), val: '100×', tag: 'BERTUMBUH', col: THEME.goldMedina },
    { x: px + pw * 0.76, y: py + ph * (1 - 0.66), val: '700×', tag: 'AL-BAQARAH', col: THEME.goldBright },
    { x: px + pw * 0.95, y: py + ph * (1 - 0.95), val: '∞', tag: 'TAK TERHINGGA', col: '#FFFFFF' },
  ];

  const drawP = easeOutCubic(clamp01((localT - 0.4) / 2.6));
  const totalSegs = pts.length - 1;
  const curFloat = drawP * totalSegs;

  // Build interpolated spline path up to drawP
  const activePts = [pts[0]];
  for (let i = 0; i < totalSegs; i++) {
    if (curFloat >= i + 1) {
      activePts.push(pts[i + 1]);
    } else if (curFloat > i) {
      const f = curFloat - i;
      activePts.push({
        x: lerp(pts[i].x, pts[i + 1].x, f),
        y: lerp(pts[i].y, pts[i + 1].y, f * f * (3 - 2 * f)),
      });
    }
  }

  if (activePts.length >= 2) {
    // Translucent Area Fill
    const areaGrad = ctx.createLinearGradient(0, py, 0, py + ph);
    areaGrad.addColorStop(0, rgba(THEME.goldBright, 0.32));
    areaGrad.addColorStop(0.55, rgba(THEME.turqBright, 0.14));
    areaGrad.addColorStop(1, rgba(THEME.turqBright, 0.0));
    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    ctx.moveTo(activePts[0].x, py + ph);
    activePts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(activePts[activePts.length - 1].x, py + ph);
    ctx.closePath();
    ctx.fill();

    // Glowing Curve Stroke
    const lineGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
    lineGrad.addColorStop(0, THEME.turqBright);
    lineGrad.addColorStop(0.65, THEME.goldBright);
    lineGrad.addColorStop(1, '#FFFFFF');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    activePts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
  }

  // Milestone Nodes + Flags
  pts.forEach((pt, idx) => {
    const mp = springVal(localT - (0.4 + idx * 0.55));
    if (mp <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = clamp01(mp);

    // Vertical drop guide
    drawStrokeLine(ctx, pt.x, pt.y, pt.x, py + ph, rgba(pt.col, 0.25), 1.5);

    // Node Ring
    ctx.fillStyle = THEME.bgObsidian;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 12, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = pt.col;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Floating value pill above node
    const pillY = pt.y - 46;
    roundRectPath(ctx, pt.x - 56, pillY - 22, 112, 44, 12);
    ctx.fillStyle = idx >= 3 ? THEME.goldBright : 'rgba(10, 32, 27, 0.96)';
    ctx.fill();
    ctx.strokeStyle = pt.col;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '900 24px Cinzel';
    ctx.fillStyle = idx >= 3 ? THEME.bgObsidian : pt.col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pt.val, pt.x, pillY + 1);

    // X-axis label
    ctx.font = '700 19px JetBrains';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(pt.tag, pt.x, py + ph + 32);
    ctx.restore();
  });

  ctx.restore();
}

/**
 * x07: Botanical Cross-Section Growth Diagram (Soil Strata + Roots + 7 Articulated Wheat Stalks)
 */
export function drawBotanicalCrossSection(ctx, cx, cy, localT, totalT) {
  const enter = easeOutExpo(clamp01(localT / 0.6));
  ctx.save();
  ctx.globalAlpha = enter;

  drawBevelCard(ctx, cx - 560, cy - 410, 1120, 820, {
    radius: 28,
    accent: THEME.goldMedina,
    headerLabel: 'ANATOMI PERUMPAMAAN AL-BAQARAH AYAT 261',
  });

  const groundY = cy + 190;
  const seedY = groundY + 46;

  // Soil Cross-Section Strata inside bottom of card
  ctx.save();
  roundRectPath(ctx, cx - 530, groundY, 1060, 185, 18);
  ctx.clip();
  const soilG = ctx.createLinearGradient(0, groundY, 0, groundY + 185);
  soilG.addColorStop(0, '#1B2E24');
  soilG.addColorStop(0.25, '#191C12');
  soilG.addColorStop(1, '#0F0D09');
  ctx.fillStyle = soilG;
  ctx.fillRect(cx - 530, groundY, 1060, 185);
  drawStrokeLine(ctx, cx - 530, groundY + 4, cx + 530, groundY + 4, THEME.turqMid, 4);
  ctx.restore();

  ctx.font = '700 19px JetBrains';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.textAlign = 'left';
  ctx.fillText('1 BUTIR BENIH DITANAM', cx - 500, groundY + 34);

  // Animated Root Tendrils branching downward
  const rootP = easeOutCubic(clamp01((localT - 0.5) / 1.2));
  if (rootP > 0.01) {
    ctx.save();
    ctx.strokeStyle = rgba(THEME.goldMedina, 0.7);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let r = -3; r <= 3; r++) {
      const rx = cx + r * 38 * rootP;
      const ry = seedY + (45 + (3 - Math.abs(r)) * 18) * rootP;
      ctx.beginPath();
      ctx.moveTo(cx, seedY + 10);
      ctx.quadraticCurveTo(cx + r * 14, seedY + 42, rx, ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Central Seed Capsule
  const seedScale = springVal(localT - 0.2);
  ctx.save();
  ctx.translate(cx, seedY);
  ctx.scale(seedScale, seedScale);
  ctx.fillStyle = THEME.goldBright;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 15, -0.15, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#FFF5CC';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 7 Articulated Golden Stalks sprouting from the single seed
  const stalkCount = 7;
  const sproutP = easeOutCubic(clamp01((localT - 1.1) / 2.0));
  if (sproutP > 0.01) {
    for (let i = 0; i < stalkCount; i++) {
      const norm = i - 3; // -3..3
      const sp = clamp01((sproutP - Math.abs(norm) * 0.07) / 0.75);
      if (sp <= 0.01) continue;

      const sway = Math.sin(totalT * 1.3 + i * 0.6) * 8;
      const tipX = cx + norm * 125 * sp + sway;
      const len = (445 - Math.abs(norm) * 30) * sp;
      const tipY = groundY - len;
      const ctrlX = cx + norm * 32;
      const ctrlY = groundY - len * 0.48;

      // Primary stalk
      const sg = ctx.createLinearGradient(cx, groundY, tipX, tipY);
      sg.addColorStop(0, THEME.turqBright);
      sg.addColorStop(0.45, THEME.goldMedina);
      sg.addColorStop(1, THEME.goldBright);
      ctx.strokeStyle = sg;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, seedY - 8);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.stroke();

      // Leaf blade at mid-height
      if (sp > 0.45) {
        const lx = lerp(cx, tipX, 0.48);
        const ly = lerp(groundY, tipY, 0.48);
        const dir = norm >= 0 ? 1 : -1;
        ctx.fillStyle = rgba(THEME.turqMid, 0.85);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(lx + dir * 48, ly - 24, lx + dir * 64, ly + 8);
        ctx.quadraticCurveTo(lx + dir * 24, ly + 4, lx, ly);
        ctx.fill();
      }

      // Golden Wheat Spike aligned along stalk tangent + Numbered Callout Tag (1..7)
      if (sp > 0.72) {
        const earP = clamp01((sp - 0.72) / 0.28);
        const tangent = Math.atan2(tipY - ctrlY, tipX - ctrlX) + Math.PI / 2;
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(tangent);
        for (let g = 0; g < 6; g++) {
          const gy = g * 14;
          ctx.fillStyle = THEME.goldBright;
          ctx.beginPath();
          ctx.ellipse(-8, gy, 7 * earP, 11 * earP, -0.35, 0, TAU);
          ctx.ellipse(8, gy, 7 * earP, 11 * earP, 0.35, 0, TAU);
          ctx.fill();
        }
        ctx.restore();

        // Crisp numbered badge above stalk tip
        const badgeY = tipY - 46;
        roundRectPath(ctx, tipX - 24, badgeY - 18, 48, 36, 10);
        ctx.fillStyle = 'rgba(10, 26, 22, 0.96)';
        ctx.fill();
        ctx.strokeStyle = THEME.goldBright;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '800 20px JetBrains';
        ctx.fillStyle = THEME.goldBright;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), tipX, badgeY + 1);
      }
    }
  }

  ctx.restore();
}

/**
 * x08: Close-Up Wheat Ear + 10x10 Optical Loupe (7 x 100 = 700x Blueprint)
 */
export function drawWheatEarLoupe(ctx, cx, cy, localT) {
  const enter = easeOutExpo(clamp01(localT / 0.65));
  ctx.save();
  ctx.globalAlpha = enter;

  drawBevelCard(ctx, cx - 560, cy - 390, 1120, 780, {
    radius: 28,
    accent: THEME.goldBright,
    headerLabel: 'DIAGNOSTIK PERKALIAN · 7 TANGKAI × 100 BIJI = 700×',
  });

  // Left: Detailed Sunbulah (Golden Wheat Ear)
  const wx = cx - 365;
  const wy = cy - 45;
  drawStrokeLine(ctx, wx, wy + 205, wx, wy - 190, THEME.goldMedina, 7);
  for (let row = 0; row < 9; row++) {
    const ry = wy + 135 - row * 38;
    const wSize = 1 - Math.abs(row - 4) * 0.08;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(wx + side * 24, ry);
      ctx.rotate(side * 0.42);
      ctx.fillStyle = row % 2 === 0 ? THEME.goldBright : THEME.goldMedina;
      ctx.beginPath();
      ctx.ellipse(0, 0, 17 * wSize, 29 * wSize, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#FFF5C2';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Clean horizontal connector between Wheat Ear & Loupe
  const loupeX = cx + 255;
  const loupeY = cy - 55;
  const matP = easeOutCubic(clamp01((localT - 0.6) / 1.8));
  drawStrokeLine(ctx, wx + 65, loupeY, loupeX - 195, loupeY, rgba(THEME.turqBright, 0.65), 3);
  roundRectPath(ctx, cx - 255, loupeY - 24, 276, 48, 12);
  ctx.fillStyle = 'rgba(8, 22, 19, 0.96)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.turqBright, 0.78);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '700 21px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1 TANGKAI = 100 BIJI', cx - 117, loupeY + 1);

  // Optical Loupe Ring with 10x10 = 100 Illuminated Grains
  ctx.save();
  ctx.translate(loupeX, loupeY);
  ctx.fillStyle = 'rgba(7, 20, 17, 0.96)';
  ctx.beginPath();
  ctx.arc(0, 0, 195, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = rgba(THEME.turqBright, 0.45);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 178, 0, TAU);
  ctx.stroke();

  const litCount = Math.round(matP * 100);
  const startG = -117;
  const cell = 26;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const idx = r * 10 + c;
      const gx = startG + c * cell;
      const gy = startG + r * cell;
      const active = idx < litCount;
      ctx.fillStyle = active ? THEME.goldBright : 'rgba(126, 142, 136, 0.22)';
      ctx.beginPath();
      ctx.ellipse(gx, gy, 7, 10, 0.2, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();

  // Bottom Equation Strip inside Card
  const eqP = springVal(localT - 2.0);
  if (eqP > 0.02) {
    ctx.save();
    ctx.globalAlpha = clamp01(eqP);
    const eqY = cy + 255;
    roundRectPath(ctx, cx - 490, eqY - 62, 980, 124, 20);
    ctx.fillStyle = 'rgba(13, 35, 30, 0.96)';
    ctx.fill();
    ctx.strokeStyle = THEME.goldBright;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 46px Cinzel';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('7 TANGKAI  ×  100 BIJI  =  ', cx - 105, eqY + 2);
    ctx.font = '900 56px Cinzel';
    ctx.fillStyle = THEME.goldBright;
    ctx.fillText('700×', cx + 330, eqY + 2);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * x09: Altitude Breakthrough Gauge (Puasa Shattering 700x Ceiling -> Hilal Horizon)
 */
export function drawBreakthroughAltitudeMeter(ctx, cx, cy, localT, totalT) {
  const enter = easeOutExpo(clamp01(localT / 0.6));
  ctx.save();
  ctx.globalAlpha = enter;

  drawBevelCard(ctx, cx - 560, cy - 390, 1120, 780, {
    radius: 28,
    accent: THEME.turqBright,
    headerLabel: 'PENGECUALIAN KHUSUS · PUASA MENEMBUS BATAS 700×',
  });

  // Left Vertical Altitude Gauge
  const gx = cx - 320;
  const gTop = cy - 260;
  const gBot = cy + 310;
  const gH = gBot - gTop;

  roundRectPath(ctx, gx - 26, gTop, 52, gH, 26);
  ctx.fillStyle = 'rgba(12, 27, 36, 0.95)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.turqBright, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  const riseP = easeInOutQuart(clamp01((localT - 0.5) / 2.6));
  const fillH = gH * riseP;
  const fillGrad = ctx.createLinearGradient(0, gBot, 0, gTop);
  fillGrad.addColorStop(0, THEME.turqMid);
  fillGrad.addColorStop(0.55, THEME.goldBright);
  fillGrad.addColorStop(1, '#FFFFFF');
  roundRectPath(ctx, gx - 18, gBot - fillH, 36, Math.max(24, fillH), 18);
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Gauge ticks: 10x, 100x, 700x barrier (cleanly separated from Hilal above & Banner below)
  const marks = [
    { r: 0.18, label: '10×', col: THEME.ivoryMuted },
    { r: 0.36, label: '100×', col: THEME.ivoryMuted },
    { r: 0.56, label: 'BATAS 700×', col: THEME.crimsonBright, barrier: true },
  ];
  const breached = riseP > 0.56;

  marks.forEach((m) => {
    const my = gBot - gH * m.r;
    if (m.barrier) {
      const splitOffset = breached ? easeOutExpo(clamp01((riseP - 0.56) / 0.25)) * 22 : 0;
      ctx.save();
      ctx.globalAlpha = breached ? 0.8 : 1;
      drawStrokeLine(ctx, gx - 55, my - splitOffset, cx + 10, my - splitOffset, THEME.crimsonBright, 4);
      drawStrokeLine(ctx, cx + 320, my + splitOffset, cx + 490, my + splitOffset, THEME.crimsonBright, 4);
      roundRectPath(ctx, cx + 30, my - 22, 270, 44, 10);
      ctx.fillStyle = breached ? 'rgba(92, 27, 27, 0.85)' : 'rgba(92, 27, 27, 0.96)';
      ctx.fill();
      ctx.strokeStyle = THEME.crimsonBright;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '700 20px JetBrains';
      ctx.fillStyle = '#FFD1D1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(breached ? 'BATAS DITEMBUS' : 'BATAS 700×', cx + 165, my + 1);
      ctx.restore();
    } else {
      drawStrokeLine(ctx, gx - 50, my, gx - 30, my, m.col, 2.5);
      ctx.font = '700 22px JetBrains';
      ctx.fillStyle = m.col;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, gx - 60, my);
    }
  });

  // Right Upper Zone: Illuminated Hilal Crescent (clear above barrier)
  const hilalP = springVal(localT - 1.9);
  const rx = cx + 165;
  const ry = cy - 175;
  ctx.save();
  ctx.translate(rx, ry);
  ctx.scale(hilalP, hilalP);

  ctx.fillStyle = THEME.goldBright;
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0.35 * Math.PI, 1.65 * Math.PI, false);
  ctx.arc(32, -12, 60, 1.55 * Math.PI, 0.45 * Math.PI, true);
  ctx.closePath();
  ctx.fill();

  drawRubElHizbBadge(ctx, 48, -20, 15, totalT * 0.3, THEME.turqBright, 2.2, THEME.turqBright);
  ctx.restore();

  // Direct Reward Banner below barrier
  if (breached) {
    const bp = easeOutExpo(clamp01((localT - 2.3) / 0.7));
    ctx.save();
    ctx.globalAlpha = bp;
    roundRectPath(ctx, cx - 155, cy + 145, 640, 150, 22);
    ctx.fillStyle = 'rgba(12, 37, 46, 0.96)';
    ctx.fill();
    ctx.strokeStyle = THEME.turqBright;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 50px Cinzel';
    ctx.fillStyle = THEME.turqBright;
    ctx.fillText('> 700×  ·  PUASA', cx + 165, cy + 195);
    ctx.font = '600 23px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('Allah sendiri yang membalasnya secara langsung', cx + 165, cy + 250);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * x10: Mechanical Limit (999...) vs Twin Pillars (PUASA + SABAR) & 3D Mobius Infinity Ribbon
 */
export function drawUnboundedAbacusAndRibbon(ctx, cx, cy, localT, totalT) {
  const enter = easeOutExpo(clamp01(localT / 0.65));
  ctx.save();
  ctx.globalAlpha = enter;

  drawBevelCard(ctx, cx - 560, cy - 390, 1120, 780, {
    radius: 28,
    accent: THEME.goldMedina,
    headerLabel: 'BIGHAIRI HISAB · PAHALA TANPA ALAT HITUNG',
  });

  // Top Strip: Mechanical Counter Hitting Limit vs Unbounded
  const topY = cy - 220;
  roundRectPath(ctx, cx - 490, topY - 62, 430, 124, 18);
  ctx.fillStyle = 'rgba(18, 28, 28, 0.92)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.crimsonBright, 0.45);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 19px JetBrains';
  ctx.fillStyle = THEME.crimsonBright;
  ctx.fillText('KALKULATOR TERBATAS', cx - 275, topY - 26);
  ctx.font = '800 44px JetBrains';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('999.999...', cx - 275, topY + 20);
  drawStrokeLine(ctx, cx - 410, topY + 20, cx - 140, topY + 20, THEME.crimsonBright, 4);

  roundRectPath(ctx, cx + 60, topY - 62, 430, 124, 18);
  ctx.fillStyle = 'rgba(16, 36, 32, 0.95)';
  ctx.fill();
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '700 19px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('JANJI AL-QUR\'AN', cx + 275, topY - 26);
  ctx.font = '900 42px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('TANPA HISAB', cx + 275, topY + 20);

  // Center: Twin Pillars (PUASA & SABAR) linked by 3D-shaded Infinity Lemniscate Ribbon
  const pilY = cy + 120;
  const p1 = springVal(localT - 0.5);
  const p2 = springVal(localT - 0.9);

  const drawPillar = (px, title, accent, p) => {
    ctx.save();
    ctx.globalAlpha = clamp01(p);
    roundRectPath(ctx, px - 145, pilY - 190 * p, 290, 380 * p, 22);
    const g = ctx.createLinearGradient(px, pilY - 190, px, pilY + 190);
    g.addColorStop(0, rgba(accent, 0.3));
    g.addColorStop(1, rgba(accent, 0.04));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.75);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.font = '900 34px Cinzel';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(title, px, pilY - 145);
    ctx.restore();
  };

  drawPillar(cx - 250, 'PUASA', THEME.turqBright, p1);
  drawPillar(cx + 250, 'SABAR', THEME.goldBright, p2);

  // Swept Infinity Lemniscate Ribbon bridging both pillars
  const ribP = easeOutCubic(clamp01((localT - 1.1) / 1.5));
  if (ribP > 0.02) {
    const steps = 160;
    const maxStep = Math.floor(steps * ribP);
    const pts = [];
    for (let i = 0; i <= maxStep; i++) {
      const a = (i / steps) * TAU;
      const denom = 1 + Math.sin(a) * Math.sin(a);
      const ix = cx + (380 * Math.cos(a)) / denom;
      const iy = pilY + 20 + (320 * Math.sin(a) * Math.cos(a)) / denom;
      pts.push({ x: ix, y: iy });
    }
    if (pts.length > 1) {
      // Dark under-ribbon
      ctx.strokeStyle = 'rgba(4, 13, 11, 0.9)';
      ctx.lineWidth = 34;
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.stroke();

      // Main metallic ribbon
      const rg = ctx.createLinearGradient(cx - 380, pilY, cx + 380, pilY);
      rg.addColorStop(0, THEME.turqBright);
      rg.addColorStop(0.5, THEME.goldBright);
      rg.addColorStop(1, THEME.turqBright);
      ctx.strokeStyle = rg;
      ctx.lineWidth = 18;
      ctx.beginPath();
      pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.stroke();

      // Specular inner thread
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.stroke();

      // Traveling highlight bead
      const hIdx = Math.floor(((totalT * 0.45) % 1) * (pts.length - 1));
      const hp = pts[hIdx];
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 10, 0, TAU);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * x11: Editorial Historical Cartography Map (Syam -> Madinah) + Laden Camels + 1.000 Counter
 */
export function drawSyamMadinahMap(ctx, cx, cy, localT, totalT) {
  const enter = easeOutExpo(clamp01(localT / 0.65));
  ctx.save();
  ctx.globalAlpha = enter;

  // Top Odometer: 0 -> 1.000 UNTA
  const cntP = easeOutExpo(clamp01((localT - 0.3) / 1.8));
  const val = Math.round(lerp(0, 1000, cntP));
  const valStr = val === 1000 ? '1.000' : String(val);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 148px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText(valStr, cx, cy - 385);
  ctx.font = '700 24px JetBrains';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('UNTA KAFILAH DAGANG · GANDUM & MINYAK ZAITUN', cx, cy - 285);

  // Historical Cartography Frame
  const mapX = cx - 560;
  const mapY = cy - 220;
  const mapW = 1120;
  const mapH = 680;
  drawBevelCard(ctx, mapX, mapY, mapW, mapH, {
    radius: 26,
    accent: THEME.goldMedina,
    bgTop: 'rgba(26, 22, 13, 0.94)',
    bgBot: 'rgba(13, 11, 7, 0.98)',
    headerLabel: 'PETA JALUR KAFILAH · SYAM MENUJU MADINAH AL-MUNAWWARAH',
  });

  // Topographic Contour Rings inside map
  ctx.save();
  roundRectPath(ctx, mapX + 16, mapY + 60, mapW - 32, mapH - 76, 18);
  ctx.clip();
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.14);
  ctx.lineWidth = 1.6;
  for (let c = 1; c <= 5; c++) {
    ctx.beginPath();
    ctx.ellipse(mapX + 260, mapY + 230, c * 90, c * 52, 0.25, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(mapX + 860, mapY + 480, c * 100, c * 58, -0.2, 0, TAU);
    ctx.stroke();
  }

  // Compass Rose (Top Right of Map)
  const crX = mapX + mapW - 110;
  const crY = mapY + 145;
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.55);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(crX, crY, 42, 0, TAU);
  ctx.stroke();
  drawStrokeLine(ctx, crX, crY - 52, crX, crY + 52, THEME.goldBright, 2);
  drawStrokeLine(ctx, crX - 52, crY, crX + 52, crY, THEME.goldMedina, 1.5);
  ctx.font = '700 16px JetBrains';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('U', crX, crY - 62);

  // Route Bezier from Syam (North-West) -> Madinah (South-East)
  const sx = mapX + 175;
  const sy = mapY + 215;
  const mx = mapX + mapW - 185;
  const my = mapY + 465;
  const c1x = mapX + 490;
  const c1y = mapY + 150;
  const c2x = mapX + 640;
  const c2y = mapY + 510;

  // Base faint route track
  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = rgba(THEME.ivoryMuted, 0.28);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, mx, my);
  ctx.stroke();
  ctx.restore();

  // Animated progress path
  const routeP = easeInOutQuart(clamp01((localT - 0.5) / 3.2));
  const steps = 60;
  const maxI = Math.floor(steps * routeP);
  const routePts = [];
  for (let i = 0; i <= maxI; i++) {
    const u = i / steps;
    const iu = 1 - u;
    routePts.push({
      x: iu * iu * iu * sx + 3 * iu * iu * u * c1x + 3 * iu * u * u * c2x + u * u * u * mx,
      y: iu * iu * iu * sy + 3 * iu * iu * u * c1y + 3 * iu * u * u * c2y + u * u * u * my,
    });
  }
  if (routePts.length > 1) {
    ctx.strokeStyle = THEME.turqBright;
    ctx.lineWidth = 6;
    ctx.beginPath();
    routePts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
  }

  // City Pins: SYAM & MADINAH
  const drawCityPin = (px, py, name, sub, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    roundRectPath(ctx, px - 105, py + 24, 210, 68, 12);
    ctx.fillStyle = 'rgba(10, 18, 16, 0.94)';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '800 22px JetBrains';
    ctx.fillStyle = col;
    ctx.fillText(name, px, py + 48);
    ctx.font = '500 18px Jakarta';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(sub, px, py + 74);
  };
  drawCityPin(sx, sy, 'SYAM', 'Titik Muat Kafilah', THEME.goldBright);
  drawCityPin(mx, my, 'MADINAH', 'Dilanda Paceklik', THEME.turqBright);

  // Silhouette Caravan strip along bottom of map
  const duneY = mapY + mapH - 65;
  ctx.fillStyle = '#090805';
  ctx.beginPath();
  ctx.moveTo(mapX, mapY + mapH);
  ctx.lineTo(mapX, duneY);
  ctx.quadraticCurveTo(cx, duneY - 28, mapX + mapW, duneY + 12);
  ctx.lineTo(mapX + mapW, mapY + mapH);
  ctx.closePath();
  ctx.fill();

  const drawCamel = (x, y, s, walk) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = THEME.goldMedina;
    // Loaded packs (grain sacks) on hump
    roundRectPath(ctx, -20, -48, 34, 22, 6);
    ctx.fillStyle = THEME.turqMid;
    ctx.fill();
    // Body & neck
    ctx.fillStyle = THEME.goldBright;
    ctx.beginPath();
    ctx.ellipse(0, -24, 24, 14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -24);
    ctx.quadraticCurveTo(32, -32, 34, -52);
    ctx.lineTo(44, -52);
    ctx.lineTo(44, -44);
    ctx.quadraticCurveTo(36, -42, 24, -18);
    ctx.fill();
    // Legs
    const sw = Math.sin(walk) * 5;
    drawStrokeLine(ctx, -14, -14, -16 + sw, 6, THEME.goldBright, 4);
    drawStrokeLine(ctx, -6, -14, -6 - sw, 6, THEME.goldBright, 4);
    drawStrokeLine(ctx, 10, -14, 10 + sw, 6, THEME.goldBright, 4);
    drawStrokeLine(ctx, 18, -14, 18 - sw, 6, THEME.goldBright, 4);
    ctx.restore();
  };

  for (let i = 0; i < 6; i++) {
    const cxPos = mapX + 160 + ((i * 155 + totalT * 42) % (mapW - 260));
    drawCamel(cxPos, duneY - 6, 0.92, totalT * 6 + i * 1.1);
  }

  ctx.restore();
  ctx.restore();
}

/**
 * x12: Editorial Bid Rejection Sequence (2x -> 5x DITOLAK) vs Covenant (10x-700x) & Free Grain Distribution
 */
export function drawAuctionOfferSequence(ctx, cx, cy, localT) {
  const enter = easeOutExpo(clamp01(localT / 0.6));
  ctx.save();
  ctx.globalAlpha = enter;

  // Left Card: Merchant Bids (2x -> 3x -> 5x) Stamped DITOLAK
  const lx = cx - 285;
  const cardY = cy - 110;
  drawBevelCard(ctx, lx - 255, cardY - 210, 510, 420, {
    radius: 24,
    accent: THEME.crimsonBright,
    headerLabel: 'TAWARAN PARA PEDAGANG',
  });

  const bids = [
    { txt: 'UNTUNG 2× LIPAT', p: stagger(localT - 0.3, 0, 0.35) },
    { txt: 'UNTUNG 3× LIPAT', p: stagger(localT - 0.3, 1, 0.35) },
    { txt: 'UNTUNG 5× LIPAT', p: stagger(localT - 0.3, 2, 0.35) },
  ];
  bids.forEach((b, idx) => {
    if (b.p <= 0.02) return;
    const by = cardY - 82 + idx * 96;
    ctx.save();
    ctx.globalAlpha = easeOutCubic(b.p);
    roundRectPath(ctx, lx - 215, by - 34, 430, 68, 14);
    ctx.fillStyle = idx === 2 ? 'rgba(60, 22, 22, 0.94)' : 'rgba(28, 22, 22, 0.9)';
    ctx.fill();
    ctx.strokeStyle = rgba(THEME.crimsonBright, 0.55);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 30px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText(b.txt, lx, by + 1);
    ctx.restore();
  });

  // Snappy DITOLAK Stamp over merchant card
  const stampP = springVal(localT - 1.7, 280, 16);
  if (stampP > 0.02) {
    ctx.save();
    ctx.translate(lx, cardY + 25);
    ctx.rotate(-0.18);
    ctx.scale(lerp(1.7, 1.0, stampP), lerp(1.7, 1.0, stampP));
    ctx.globalAlpha = clamp01(stampP);
    roundRectPath(ctx, -165, -46, 330, 92, 14);
    ctx.fillStyle = 'rgba(165, 29, 29, 0.94)';
    ctx.fill();
    ctx.strokeStyle = '#FFD0D0';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = '900 44px Cinzel';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DITOLAK', 0, 2);
    ctx.restore();
  }

  // Right Card: Covenant with Allah (10x - 700x)
  const rx = cx + 285;
  const rightP = springVal(localT - 2.1);
  if (rightP > 0.02) {
    ctx.save();
    ctx.globalAlpha = clamp01(rightP);
    drawBevelCard(ctx, rx - 255, cardY - 210, 510, 420, {
      radius: 24,
      accent: THEME.goldBright,
      headerLabel: 'TAWARAN ALLAH AZZA WA JALLA',
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 84px Cinzel';
    ctx.fillStyle = THEME.goldBright;
    ctx.fillText('10×–700×', rx, cardY - 20);

    ctx.font = '600 26px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('Balasan berlipat ganda tanpa rugi', rx, cardY + 62);

    roundRectPath(ctx, rx - 185, cardY + 106, 370, 58, 14);
    ctx.fillStyle = THEME.turqBright;
    ctx.fill();
    ctx.font = '800 24px JetBrains';
    ctx.fillStyle = THEME.bgObsidian;
    ctx.fillText('DIPILIH UTSMAN RA', rx, cardY + 136);
    ctx.restore();
  }

  // Bottom Distribution Banner: 100% Sedekah Gratis to Madinah Citizens
  const distP = easeOutExpo(clamp01((localT - 3.0) / 0.8));
  if (distP > 0.02) {
    ctx.save();
    ctx.globalAlpha = distP;
    const dy = cy + 235;
    drawBevelCard(ctx, cx - 540, dy - 75, 1080, 150, {
      radius: 22,
      accent: THEME.turqBright,
    });
    // 3 Golden Grain Crate Icons on the left
    for (let k = 0; k < 3; k++) {
      const kx = cx - 440 + k * 76;
      roundRectPath(ctx, kx - 26, dy - 26, 52, 52, 10);
      ctx.fillStyle = THEME.goldMedina;
      ctx.fill();
      drawStrokeLine(ctx, kx - 26, dy, kx + 26, dy, THEME.bgObsidian, 3);
      drawStrokeLine(ctx, kx, dy - 26, kx, dy + 26, THEME.bgObsidian, 3);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '700 22px JetBrains';
    ctx.fillStyle = THEME.turqBright;
    ctx.fillText('AKSI NYATA DI MADINAH', cx - 220, dy - 26);
    ctx.font = '800 36px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('1.000 Unta Muatan Dibagikan Gratis', cx - 220, dy + 20);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * x13: Precision Split Infographic (Lifespan Ruler 950 vs 60-70 + 1 Gold Dirham vs 100.000 Silver Dirham)
 */
export function drawLifespanAndDirhamInfographic(ctx, cx, cy, localT) {
  const enter = easeOutExpo(clamp01(localT / 0.6));
  ctx.save();
  ctx.globalAlpha = enter;

  // TOP PANEL: Lifespan Ruler Comparison
  const topY = cy - 235;
  drawBevelCard(ctx, cx - 560, topY - 190, 1120, 380, {
    radius: 26,
    accent: THEME.turqBright,
    headerLabel: 'FAKTOR USIA · MENGAPA PAHALA UMAT INI DILIPATGANDAKAN',
  });

  const barX = cx - 490;
  const barW = 980;
  const p1 = easeOutExpo(clamp01((localT - 0.3) / 1.0));
  const p2 = easeOutExpo(clamp01((localT - 0.7) / 1.0));

  // Bar 1: Umat Terdahulu (~950 Tahun)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 24px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('UMAT TERDAHULU (NABI NUH AS)', barX, topY - 95);
  ctx.textAlign = 'right';
  ctx.font = '800 28px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('± 950 TAHUN', barX + barW, topY - 95);

  roundRectPath(ctx, barX, topY - 68, barW, 38, 12);
  ctx.fillStyle = 'rgba(13, 30, 27, 0.9)';
  ctx.fill();
  roundRectPath(ctx, barX, topY - 68, Math.max(24, barW * 0.94 * p1), 38, 12);
  ctx.fillStyle = THEME.turqMid;
  ctx.fill();

  // Bar 2: Umat Nabi Muhammad SAW (60-70 Tahun)
  ctx.textAlign = 'left';
  ctx.font = '700 24px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText('UMAT NABI MUHAMMAD SAW', barX, topY + 12);
  ctx.textAlign = 'right';
  ctx.font = '800 28px JetBrains';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('60 – 70 TAHUN', barX + barW, topY + 12);

  roundRectPath(ctx, barX, topY + 38, barW, 38, 12);
  ctx.fillStyle = 'rgba(13, 30, 27, 0.9)';
  ctx.fill();
  roundRectPath(ctx, barX, topY + 38, Math.max(24, barW * 0.14 * p2), 38, 12);
  ctx.fillStyle = THEME.goldBright;
  ctx.fill();

  // Multiplier extension bracket showing Lailatul Qadar + 700x bridging the gap
  const brP = easeOutCubic(clamp01((localT - 1.4) / 0.8));
  if (brP > 0.02) {
    ctx.save();
    ctx.globalAlpha = brP;
    const bx1 = barX + barW * 0.15;
    const bx2 = lerp(bx1, barX + barW * 0.94, brP);
    drawStrokeLine(ctx, bx1, topY + 95, bx2, topY + 95, THEME.goldBright, 3);
    drawStrokeLine(ctx, bx1, topY + 85, bx1, topY + 105, THEME.goldBright, 3);
    drawStrokeLine(ctx, bx2, topY + 85, bx2, topY + 105, THEME.goldBright, 3);

    const lbl = 'DIKEJAR DENGAN PELIPATGANDAAN 700× & LAILATUL QADAR';
    ctx.font = '700 20px JetBrains';
    const pw = Math.min(940, ctx.measureText(lbl).width + 48);
    const pxCenter = cx + 60;
    roundRectPath(ctx, pxCenter - pw / 2, topY + 115, pw, 44, 12);
    ctx.fillStyle = 'rgba(26, 22, 11, 0.96)';
    ctx.fill();
    ctx.strokeStyle = THEME.goldBright;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = THEME.goldBright;
    ctx.fillText(lbl, pxCenter, topY + 138);
    ctx.restore();
  }

  // BOTTOM PANEL: 1 Gold Dirham vs 100.000 Silver Dirham Fulcrum
  const botY = cy + 215;
  drawBevelCard(ctx, cx - 560, botY - 195, 1120, 390, {
    radius: 26,
    accent: THEME.goldMedina,
    headerLabel: 'BERAT KEIKHLASAN · HR. AN-NASA\'I NO. 2527',
  });

  const tiltP = easeOutElastic(clamp01((localT - 2.3) / 1.4));
  const tilt = lerp(0.08, -0.17, tiltP); // Left (1 Dirham) drops down heavier!
  const pivY = botY + 128;

  // Fulcrum triangle
  ctx.fillStyle = THEME.goldMedina;
  ctx.beginPath();
  ctx.moveTo(cx, pivY);
  ctx.lineTo(cx - 32, pivY + 42);
  ctx.lineTo(cx + 32, pivY + 42);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(cx, pivY);
  ctx.rotate(tilt);

  // Lever Plank
  roundRectPath(ctx, -430, -10, 860, 20, 8);
  ctx.fillStyle = THEME.goldBright;
  ctx.fill();

  // Left: 1 Glowing Gold Dirham (50% dari harta si miskin)
  ctx.fillStyle = THEME.goldBright;
  ctx.beginPath();
  ctx.arc(-280, -64, 52, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#FFF5CA';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = THEME.bgObsidian;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-280, -64, 38, 0, TAU);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 30px Cinzel';
  ctx.fillStyle = THEME.bgObsidian;
  ctx.fillText('1', -280, -64);

  ctx.font = '800 23px Jakarta';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText('1 DIRHAM', -280, -152);
  ctx.font = '700 18px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('IKHLAS PENUH (50% HARTA)', -280, -126);

  // Right: Stack of 100.000 Silver Dirham
  for (let i = 0; i < 9; i++) {
    const sy = -20 - i * 13;
    roundRectPath(ctx, 210, sy, 140, 10, 4);
    ctx.fillStyle = i % 2 === 0 ? THEME.silverBright : THEME.silverMid;
    ctx.fill();
  }
  ctx.font = '800 23px Jakarta';
  ctx.fillStyle = THEME.silverBright;
  ctx.fillText('100.000 DIRHAM', 280, -178);
  ctx.font = '600 18px JetBrains';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('SISA HARTA BERLEBIH', 280, -152);

  ctx.restore();
  ctx.restore();
}

/**
 * x14: Ripple-of-Impact Domino Arches + Clean Editorial Comment CTA
 */
export function drawDominoImpactChain(ctx, cx, cy, localT) {
  const enter = easeOutExpo(clamp01(localT / 0.65));
  ctx.save();
  ctx.globalAlpha = enter;

  const boxY = cy - 230;
  drawBevelCard(ctx, cx - 560, boxY - 215, 1120, 430, {
    radius: 28,
    accent: THEME.goldBright,
    headerLabel: 'EFEK DOMINO KEBAIKAN · DARI TINDAKAN SEDERHANA',
  });

  const nodes = [
    { x: cx - 390, r: 58, val: '1', sub: 'NIAT / SENYUM', col: THEME.turqBright },
    { x: cx - 140, r: 74, val: '10×', sub: 'MINIMAL', col: THEME.turqBright },
    { x: cx + 125, r: 92, val: '700×', sub: 'SEDEKAH', col: THEME.goldBright },
    { x: cx + 395, r: 108, val: '∞', sub: 'SABAR & IKHLAS', col: THEME.goldBright },
  ];

  // Connecting forward arrow spine
  const lineP = easeOutCubic(clamp01((localT - 0.3) / 1.5));
  drawStrokeLine(ctx, nodes[0].x, boxY + 20, lerp(nodes[0].x, nodes[3].x, lineP), boxY + 20, rgba(THEME.goldMedina, 0.55), 5);

  nodes.forEach((n, idx) => {
    const np = springVal(localT - (0.3 + idx * 0.32));
    if (np <= 0.02) return;
    ctx.save();
    ctx.translate(n.x, boxY + 20);
    ctx.scale(np, np);

    // Outer architectural halo ring
    ctx.strokeStyle = rgba(n.col, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, n.r + 14, 0, TAU);
    ctx.stroke();

    // Main circle badge
    ctx.fillStyle = idx >= 2 ? 'rgba(28, 24, 12, 0.96)' : 'rgba(9, 27, 23, 0.96)';
    ctx.beginPath();
    ctx.arc(0, 0, n.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = n.col;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(n.r * 0.58)}px Cinzel`;
    ctx.fillStyle = n.col;
    ctx.fillText(n.val, 0, 2);

    ctx.font = '700 19px JetBrains';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(n.sub, 0, n.r + 36);
    ctx.restore();
  });

  // Clean Comment CTA Box
  const ctaP = easeOutExpo(clamp01((localT - 1.5) / 0.8));
  if (ctaP > 0.02) {
    ctx.save();
    ctx.globalAlpha = ctaP;
    const ctaY = cy + 295;
    drawBevelCard(ctx, cx - 540, ctaY - 90, 1080, 180, {
      radius: 24,
      accent: THEME.turqBright,
      headerLabel: 'TULIS DI KOLOM KOMENTAR',
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 34px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText('Kebaikan kecil apa yang paling membekas di hidupmu?', cx, ctaY + 28);
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 8. CLEAN EDITORIAL SCENE TRANSITIONS (WIPE / CURTAIN / LIGHT SWEEP)
// ============================================================================

export function drawSceneTransitionOverlay(ctx, transitionType, u) {
  const t = clamp01(u);
  const bell = Math.sin(t * Math.PI);
  if (bell <= 0.01) return;

  ctx.save();
  // Clean editorial vertical/horizontal wipe bar (zero blurry flash or particle noise)
  const barX = lerp(-240, WIDTH + 240, easeInOutQuart(t));
  const grad = ctx.createLinearGradient(barX - 180, 0, barX + 180, 0);
  grad.addColorStop(0, rgba(THEME.goldBright, 0));
  grad.addColorStop(0.5, rgba(THEME.goldBright, 0.22 * bell));
  grad.addColorStop(1, rgba(THEME.goldBright, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(barX - 180, 0, 360, HEIGHT);

  drawStrokeLine(ctx, barX, 0, barX, HEIGHT, rgba(THEME.goldBright, 0.35 * bell), 3);
  ctx.restore();
}

// ============================================================================
// 9. FRAME COMPOSITOR & SCENE MODULE LOADER
// ============================================================================

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
    drawBevelCard,
    drawCalloutLeader,
    drawArchitecturalStage,
    drawArabicPlaque,
    drawHumanVsIslamicMath,
    drawMushafAndTenBlocks,
    drawPrecisionMizan,
    drawHeartToScrollSystem,
    drawInterceptGateDiagram,
    drawExponentialAreaChart,
    drawBotanicalCrossSection,
    drawWheatEarLoupe,
    drawBreakthroughAltitudeMeter,
    drawUnboundedAbacusAndRibbon,
    drawSyamMadinahMap,
    drawAuctionOfferSequence,
    drawLifespanAndDirhamInfographic,
    drawDominoImpactChain,
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
  const localFrame = frameIdx - sc.startFrame;
  const localT = localFrame / FPS;
  const progress = clamp01(localT / sc.durationSec);

  const inAlpha = clamp01(localT / 0.2);
  const outAlpha = idx < scenes.length - 1 ? clamp01((sc.durationSec - localT) / 0.16) : clamp01((sc.durationSec - localT) / 0.4);
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
      h: helpers,
    });
  }

  drawTopHUD(ctx, sc, localT);
  drawKineticHeadline(ctx, sc, localT);
  drawBroadcastCaptions(ctx, sc, localT);
  drawSourceFooter(ctx, sc.source, localT);

  const transDur = 0.34;
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
    const targetFrame = sc.startFrame + Math.round(sc.durationFrames * 0.65);
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
// 11. ADDITIONAL STUDIO EXPLANATORY HELPERS (MODULAR GRAPHICS)
// ============================================================================

export function drawStepFlowPill(ctx, cx, cy, num, title, desc, accent, progress) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 20;
  drawBevelCard(ctx, cx - 520, cy - 58 + dy, 1040, 116, { radius: 20, accent });
  roundRectPath(ctx, cx - 495, cy - 34 + dy, 68, 68, 16);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 28px Cinzel';
  ctx.fillStyle = THEME.bgObsidian;
  ctx.fillText(num, cx - 461, cy + 1 + dy);

  ctx.textAlign = 'left';
  ctx.font = '800 28px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText(title, cx - 405, cy - 14 + dy);
  ctx.font = '500 22px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText(desc, cx - 405, cy + 20 + dy);
  ctx.restore();
}

export function drawComparisonSplitBadge(ctx, cx, cy, leftVal, leftLbl, rightVal, rightLbl, progress) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = p;
  drawBevelCard(ctx, cx - 540, cy - 80, 520, 160, { radius: 20, accent: THEME.turqBright });
  drawBevelCard(ctx, cx + 20, cy - 80, 520, 160, { radius: 20, accent: THEME.goldBright });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 46px Cinzel';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText(leftVal, cx - 280, cy - 16);
  ctx.font = '600 22px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText(leftLbl, cx - 280, cy + 34);

  ctx.font = '900 46px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.fillText(rightVal, cx + 280, cy - 16);
  ctx.font = '600 22px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText(rightLbl, cx + 280, cy + 34);
  ctx.restore();
}

// ============================================================================
// 12. CLI ENTRYPOINT
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
      const targetId = args.find((a) => a.startsWith('--scene=')).split('=')[1];
      initFonts();
      const sceneRenderers = await loadSceneModules();
      const helpers = createHelpers();
      const sc = timeline.scenes.find((s) => s.id === targetId);
      if (!sc) throw new Error(`Unknown scene ${targetId}`);
      const canvas = new Canvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext('2d');
      const outDir = join(ROOT, 'out', 'previews');
      mkdirSync(outDir, { recursive: true });
      renderSingleFrame(ctx, timeline, sceneRenderers, helpers, sc.startFrame + Math.round(sc.durationFrames * 0.65));
      const p = join(outDir, `${sc.id}.png`);
      writeFileSync(p, canvas.toBufferSync('png'));
      console.log(`Rendered single frame preview: ${p}`);
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
