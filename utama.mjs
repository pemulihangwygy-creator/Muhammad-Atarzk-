#!/usr/bin/env node
/**
 * Engine Visual 2K 90FPS — "Kenapa Satu Kebaikan Dibalas 700 Kali Lipat dalam Islam?"
 * Identitas Visual: Luminous Emerald & Celestial Medina Gold / Sacred Girih Geometry
 * Arsitektur: Multi-worker Skia Canvas vector/particle compositor + FFmpeg rawvideo pipe
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
// 1. PALET & IDENTITAS VISUAL ("LUMINOUS EMERALD & CELESTIAL MEDINA GOLD")
// ============================================================================

export const THEME = {
  bgObsidian: '#030A09',
  bgEmeraldDeep: '#061815',
  bgEmeraldMid: '#0A2922',
  bgEmeraldSoft: '#113A30',
  bgAmberTint: '#1E1A0E',

  goldBright: '#FFE48C',
  goldMedina: '#F5C451',
  goldBurnished: '#D49A2A',
  goldDeep: '#8A5D14',

  turqBright: '#5DF2D6',
  turqMid: '#26B99F',
  turqDeep: '#0E5B4F',

  ivory: '#F8F2E4',
  ivoryMuted: '#C8C2B2',
  slateText: '#9AB0A9',

  crimsonBright: '#FF6B63',
  crimsonDeep: '#8E2520',

  glassDark: 'rgba(5, 19, 16, 0.78)',
  glassCard: 'rgba(8, 28, 24, 0.72)',
  glassBorderGold: 'rgba(245, 196, 81, 0.36)',
  glassBorderTurq: 'rgba(93, 242, 214, 0.28)',
};

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha).toFixed(4)})`;
}

export function lerpColor(hexA, hexB, t) {
  const u = clamp01(t);
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * u);
  const g = Math.round(a.g + (b.g - a.g) * u);
  const bl = Math.round(a.b + (b.b - a.b) * u);
  return `rgb(${r}, ${g}, ${bl})`;
}

// ============================================================================
// 2. REGISTRASI FONT TIPOGRAFI ARAB & LATIN
// ============================================================================

let fontsLoaded = false;

export function initFonts() {
  if (fontsLoaded) return;
  const f = (pkg, file) => join(ROOT, 'node_modules', pkg, 'files', file);

  FontLibrary.use('Amiri', [
    f('@fontsource/amiri', 'amiri-arabic-400-normal.woff2'),
    f('@fontsource/amiri', 'amiri-arabic-700-normal.woff2'),
  ]);
  FontLibrary.use('Cinzel', [
    f('@fontsource/cinzel', 'cinzel-latin-600-normal.woff2'),
    f('@fontsource/cinzel', 'cinzel-latin-700-normal.woff2'),
    f('@fontsource/cinzel', 'cinzel-latin-800-normal.woff2'),
    f('@fontsource/cinzel', 'cinzel-latin-900-normal.woff2'),
  ]);
  FontLibrary.use('Playfair', [
    f('@fontsource/playfair-display', 'playfair-display-latin-600-normal.woff2'),
    f('@fontsource/playfair-display', 'playfair-display-latin-700-normal.woff2'),
    f('@fontsource/playfair-display', 'playfair-display-latin-700-italic.woff2'),
  ]);
  FontLibrary.use('Jakarta', [
    f('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-400-normal.woff2'),
    f('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-500-normal.woff2'),
    f('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-600-normal.woff2'),
    f('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-700-normal.woff2'),
    f('@fontsource/plus-jakarta-sans', 'plus-jakarta-sans-latin-800-normal.woff2'),
  ]);
  FontLibrary.use('JetBrains', [
    f('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2'),
    f('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-600-normal.woff2'),
    f('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-700-normal.woff2'),
  ]);

  fontsLoaded = true;
}

// ============================================================================
// 3. MATEMATIKA GERAK, FISIKA PEGAS & NOISE DETERMINISTIK
// ============================================================================

export const TAU = Math.PI * 2;

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function invLerp(a, b, v) {
  if (Math.abs(b - a) < 1e-9) return 0;
  return clamp01((v - a) / (b - a));
}

export function remap(v, inMin, inMax, outMin, outMax) {
  return lerp(outMin, outMax, invLerp(inMin, inMax, v));
}

export function smoothstep(edge0, edge1, x) {
  const t = invLerp(edge0, edge1, x);
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0, edge1, x) {
  const t = invLerp(edge0, edge1, x);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function easeOutCubic(t) {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, 3);
}

export function easeInOutCubic(t) {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

export function easeOutExpo(t) {
  const u = clamp01(t);
  return u === 1 ? 1 : 1 - Math.pow(2, -10 * u);
}

export function easeInOutQuint(t) {
  const u = clamp01(t);
  return u < 0.5 ? 16 * u * u * u * u * u : 1 - Math.pow(-2 * u + 2, 5) / 2;
}

export function easeOutBack(t, overshoot = 1.70158) {
  const u = clamp01(t);
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + overshoot * Math.pow(u - 1, 2);
}

export function easeOutElastic(t) {
  const u = clamp01(t);
  if (u === 0 || u === 1) return u;
  const c4 = TAU / 3;
  return Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * c4) + 1;
}

export function spring(t, { stiffness = 180, damping = 18, mass = 1, velocity = 0 } = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * w0 * t);
    const a = 1;
    const b = (zeta * w0 * a - velocity) / wd;
    return 1 - envelope * (a * Math.cos(wd * t) + b * Math.sin(wd * t));
  }
  const envelope = Math.exp(-w0 * t);
  return 1 - envelope * (1 + (w0 - velocity) * t);
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2D(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function noise2D(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

export function fbm2D(x, y, octaves = 3) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2D(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.02;
  }
  return val / norm;
}

// ============================================================================
// 4. RIG KAMERA VIRTUAL & PROYEKSI 3D
// ============================================================================

export function createCameraState(localT, durationSec, opts = {}) {
  const {
    zoomStart = 1.02,
    zoomEnd = 1.0,
    driftX = 10,
    driftY = 12,
    shake = 0,
    shakeDecay = 4.5,
  } = opts;
  const u = clamp01(localT / Math.max(0.1, durationSec));
  const breatheX = Math.sin(localT * 0.72) * driftX + Math.cos(localT * 0.37) * (driftX * 0.4);
  const breatheY = Math.cos(localT * 0.58) * driftY + Math.sin(localT * 0.31) * (driftY * 0.35);
  const shakeEnv = shake * Math.exp(-localT * shakeDecay);
  const sx = shakeEnv * Math.sin(localT * 47.0);
  const sy = shakeEnv * Math.cos(localT * 53.0);
  const zoom = lerp(zoomStart, zoomEnd, easeOutCubic(Math.min(1, u * 1.4))) + Math.sin(localT * 0.45) * 0.004;
  return {
    x: breatheX + sx,
    y: breatheY + sy,
    zoom,
    rot: Math.sin(localT * 0.25) * 0.0035,
  };
}

export function applyCamera(ctx, cam, pivotX = WIDTH / 2, pivotY = HEIGHT / 2) {
  ctx.translate(pivotX + cam.x, pivotY + cam.y);
  ctx.rotate(cam.rot);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-pivotX, -pivotY);
}

export function project3D(x, y, z, fov = 1100, cx = WIDTH / 2, cy = HEIGHT / 2) {
  const scale = fov / Math.max(80, fov + z);
  return {
    x: cx + x * scale,
    y: cy + y * scale,
    scale,
  };
}

// ============================================================================
// 5. PRIMITIF GRAFIS & GEOMETRI ISLAMI PROSEDURAL
// ============================================================================

export function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
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

export function drawGlowingLine(ctx, x1, y1, x2, y2, color, width = 2, glow = 12) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawFourPointStar(ctx, x, y, size, alpha = 1, color = THEME.goldBright, rot = 0) {
  if (alpha <= 0.01 || size <= 0.2) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = clamp01(alpha);
  ctx.fillStyle = color;
  ctx.beginPath();
  const inner = size * 0.22;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? size : inner;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawRubElHizb(ctx, cx, cy, radius, rot = 0, strokeColor = THEME.goldMedina, lineWidth = 2.5, fillColor = null) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const side = radius * Math.SQRT2;
  const half = side / 2;

  for (let k = 0; k < 2; k++) {
    ctx.save();
    ctx.rotate((k * Math.PI) / 4);
    ctx.beginPath();
    ctx.rect(-half, -half, side, side);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawGirihRosette(ctx, cx, cy, outerR, folds = 12, rot = 0, progress = 1, opts = {}) {
  const {
    strokeColor = THEME.goldMedina,
    accentColor = THEME.turqBright,
    alpha = 0.85,
    lineWidth = 2.2,
    glow = true,
    innerDetail = true,
  } = opts;
  if (progress <= 0.005 || alpha <= 0.005) return;

  const p = clamp01(progress);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;

  if (glow) {
    ctx.shadowColor = rgba(strokeColor.startsWith('#') ? strokeColor : THEME.goldMedina, 0.45);
    ctx.shadowBlur = 18;
  }

  // Outer celestial ring
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth * 0.85;
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, TAU * p);
  ctx.stroke();

  if (p > 0.15) {
    const p2 = clamp01((p - 0.15) / 0.85);
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 0.91, 0, TAU * p2);
    ctx.strokeStyle = rgba(THEME.goldBright, 0.35);
    ctx.lineWidth = lineWidth * 0.55;
    ctx.stroke();
  }

  // Primary interlocking star polygons (step k=5 for 12-fold, k=3 for 8-fold)
  const step = folds >= 12 ? 5 : Math.max(2, Math.floor(folds / 3));
  const rings = [
    { r: outerR * 0.88, w: lineWidth * 1.15, col: strokeColor },
    { r: outerR * 0.64, w: lineWidth * 0.9, col: accentColor },
  ];

  for (let rIdx = 0; rIdx < rings.length; rIdx++) {
    if (rIdx === 1 && !innerDetail) continue;
    const rg = rings[rIdx];
    const subP = clamp01((p - rIdx * 0.14) / 0.86);
    if (subP <= 0) continue;

    ctx.strokeStyle = rg.col;
    ctx.lineWidth = rg.w;
    const totalEdges = folds;
    const drawnEdges = subP * totalEdges;

    for (let i = 0; i < totalEdges; i++) {
      if (i > drawnEdges) break;
      const frac = Math.min(1, drawnEdges - i);
      const a0 = (i * TAU) / folds;
      const a1 = (((i + step) % folds) * TAU) / folds;
      const x0 = Math.cos(a0) * rg.r;
      const y0 = Math.sin(a0) * rg.r;
      const x1 = Math.cos(a1) * rg.r;
      const y1 = Math.sin(a1) * rg.r;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(lerp(x0, x1, frac), lerp(y0, y1, frac));
      ctx.stroke();
    }
  }

  // Petal filigree & vertex nodes
  if (innerDetail && p > 0.35) {
    const p3 = clamp01((p - 0.35) / 0.65);
    ctx.strokeStyle = rgba(THEME.goldBright, 0.55 * p3);
    ctx.lineWidth = lineWidth * 0.7;
    for (let i = 0; i < folds; i++) {
      const a = (i * TAU) / folds;
      const nx = Math.cos(a) * outerR * 0.88;
      const ny = Math.sin(a) * outerR * 0.88;
      const mx = Math.cos(a + Math.PI / folds) * outerR * 0.44;
      const my = Math.sin(a + Math.PI / folds) * outerR * 0.44;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(mx, my, nx * p3, ny * p3);
      ctx.stroke();

      if (p3 > 0.7) {
        ctx.fillStyle = THEME.goldBright;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.6, 0, TAU);
        ctx.fill();
      }
    }

    // Center Khatam octagon
    drawRubElHizb(ctx, 0, 0, outerR * 0.24 * easeOutBack(p3), -rot * 1.5, THEME.goldBright, lineWidth * 0.9);
  }

  ctx.restore();
}

export function drawMihrabArch(ctx, cx, topY, w, h, progress = 1, alpha = 0.35) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha * p;
  const halfW = w / 2;
  const springY = topY + h * 0.34;
  const bottomY = topY + h;

  const traceArch = (inset) => {
    const hw = halfW - inset;
    const ty = topY + inset * 1.1;
    const sy = springY + inset * 0.3;
    const by = bottomY - inset;
    ctx.beginPath();
    ctx.moveTo(cx - hw, by);
    ctx.lineTo(cx - hw, sy);
    ctx.bezierCurveTo(cx - hw, ty + (sy - ty) * 0.35, cx - hw * 0.35, ty + 28, cx, ty);
    ctx.bezierCurveTo(cx + hw * 0.35, ty + 28, cx + hw, ty + (sy - ty) * 0.35, cx + hw, sy);
    ctx.lineTo(cx + hw, by);
  };

  // Ambient inner glow fill
  traceArch(0);
  const grad = ctx.createLinearGradient(cx, topY, cx, bottomY);
  grad.addColorStop(0, rgba(THEME.goldMedina, 0.18));
  grad.addColorStop(0.45, rgba(THEME.turqMid, 0.08));
  grad.addColorStop(1, rgba(THEME.bgObsidian, 0));
  ctx.fillStyle = grad;
  ctx.fill();

  // Outer gold frame
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.75);
  ctx.lineWidth = 3;
  ctx.shadowColor = rgba(THEME.goldMedina, 0.4);
  ctx.shadowBlur = 16;
  traceArch(0);
  ctx.stroke();

  // Inner filigree frame
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(THEME.goldBright, 0.38);
  ctx.lineWidth = 1.4;
  traceArch(18);
  ctx.stroke();

  // Apex finial ornament
  drawFourPointStar(ctx, cx, topY - 16, 14 * p, 0.9, THEME.goldBright);
  ctx.restore();
}

// ============================================================================
// 6. LATAR BELAKANG ATMOSFERIK, CAHAYA VOLUMETRIK & PARTIKEL
// ============================================================================

let cachedGrainCanvas = null;

function getGrainCanvas() {
  if (cachedGrainCanvas) return cachedGrainCanvas;
  const gw = 360;
  const gh = 640;
  const c = new Canvas(gw, gh);
  const gctx = c.getContext('2d');
  const img = gctx.createImageData(gw, gh);
  const rnd = mulberry32(9091);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 15;
  }
  gctx.putImageData(img, 0, 0);
  cachedGrainCanvas = c;
  return c;
}

const backdropCache = new Map();
const rosetteSpriteCache = new Map();
const orbSpriteCache = new Map();
const latticeCache = new Map();
const dustDotCache = new Map();

function getOrbSprite(colorHex, innerAlpha, midAlpha, radius) {
  const key = `${colorHex}_${innerAlpha}_${midAlpha}_${radius}`;
  if (orbSpriteCache.has(key)) return orbSpriteCache.get(key);
  const size = radius * 2;
  const c = new Canvas(size, size);
  const gctx = c.getContext('2d');
  const grad = gctx.createRadialGradient(radius, radius, 10, radius, radius, radius);
  grad.addColorStop(0, rgba(colorHex, innerAlpha));
  grad.addColorStop(0.5, rgba(colorHex, midAlpha));
  grad.addColorStop(1, rgba(colorHex, 0));
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, size, size);
  orbSpriteCache.set(key, c);
  return c;
}

function getDustDotSprite(tint) {
  if (dustDotCache.has(tint)) return dustDotCache.get(tint);
  const s = 48;
  const c = new Canvas(s, s);
  const gctx = c.getContext('2d');
  const grad = gctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, rgba(tint, 1));
  grad.addColorStop(0.45, rgba(tint, 0.35));
  grad.addColorStop(1, rgba(tint, 0));
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, s, s);
  dustDotCache.set(tint, c);
  return c;
}

function getStaticBackdropCanvas(accentTop, accentGlow, turqGlow, mihrabAlpha) {
  const key = `${accentTop}_${accentGlow}_${turqGlow}_${mihrabAlpha}`;
  if (backdropCache.has(key)) return backdropCache.get(key);
  const c = new Canvas(WIDTH, HEIGHT);
  const bctx = c.getContext('2d');
  const baseGrad = bctx.createLinearGradient(0, 0, 0, HEIGHT);
  baseGrad.addColorStop(0, THEME.bgObsidian);
  baseGrad.addColorStop(0.35, accentTop);
  baseGrad.addColorStop(0.75, THEME.bgEmeraldDeep);
  baseGrad.addColorStop(1, THEME.bgObsidian);
  bctx.fillStyle = baseGrad;
  bctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle baked atmospheric aurora glows
  const g1 = bctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.28, 20, WIDTH * 0.5, HEIGHT * 0.28, 860);
  g1.addColorStop(0, rgba(accentGlow, 0.16));
  g1.addColorStop(0.5, rgba(accentGlow, 0.05));
  g1.addColorStop(1, rgba(accentGlow, 0));
  bctx.fillStyle = g1;
  bctx.fillRect(0, 0, WIDTH, HEIGHT);

  const g2 = bctx.createRadialGradient(WIDTH * 0.42, HEIGHT * 0.68, 20, WIDTH * 0.42, HEIGHT * 0.68, 920);
  g2.addColorStop(0, rgba(turqGlow, 0.14));
  g2.addColorStop(0.55, rgba(turqGlow, 0.04));
  g2.addColorStop(1, rgba(turqGlow, 0));
  bctx.fillStyle = g2;
  bctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (mihrabAlpha > 0) {
    drawMihrabArch(bctx, WIDTH * 0.5, 210, 1280, 2120, 1, mihrabAlpha);
  }

  // Baked edge vignette for clean cinematic framing
  const vig = bctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.46, WIDTH * 0.38, WIDTH / 2, HEIGHT * 0.5, HEIGHT * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.7, 'rgba(2, 8, 7, 0.18)');
  vig.addColorStop(1, 'rgba(1, 5, 4, 0.55)');
  bctx.fillStyle = vig;
  bctx.fillRect(0, 0, WIDTH, HEIGHT);

  backdropCache.set(key, c);
  return c;
}

function getRosetteSprite(rosetteAlpha) {
  const key = `${rosetteAlpha}`;
  if (rosetteSpriteCache.has(key)) return rosetteSpriteCache.get(key);
  const size = 1280;
  const c = new Canvas(size, size);
  const rctx = c.getContext('2d');
  drawGirihRosette(rctx, size / 2, size / 2, 580, 12, 0, 1, {
    strokeColor: rgba(THEME.goldMedina, rosetteAlpha),
    accentColor: rgba(THEME.turqBright, rosetteAlpha * 0.7),
    alpha: 1,
    lineWidth: 1.8,
    glow: false,
    innerDetail: true,
  });
  rosetteSpriteCache.set(key, c);
  return c;
}

function getLatticeSprite(alpha, scale) {
  const key = `${alpha}_${scale}`;
  if (latticeCache.has(key)) return latticeCache.get(key);
  const w = WIDTH + scale * 2;
  const h = HEIGHT + scale * 2;
  const c = new Canvas(w, h);
  const lctx = c.getContext('2d');
  lctx.globalAlpha = alpha;
  lctx.strokeStyle = THEME.goldMedina;
  lctx.lineWidth = 1.2;
  const r = scale * 0.36;
  lctx.beginPath();
  for (let gx = scale * 0.5; gx < w; gx += scale) {
    for (let gy = scale * 0.5; gy < h; gy += scale) {
      lctx.moveTo(gx, gy - r);
      lctx.lineTo(gx + r, gy);
      lctx.lineTo(gx, gy + r);
      lctx.lineTo(gx - r, gy);
      lctx.closePath();
      const cr = r * 0.32;
      lctx.moveTo(gx + cr, gy);
      lctx.arc(gx, gy, cr, 0, TAU);
    }
  }
  lctx.stroke();
  latticeCache.set(key, c);
  return c;
}

export function drawMashrabiyaLattice(ctx, t, alpha = 0.06, scale = 140) {
  const sprite = getLatticeSprite(alpha, scale);
  const driftX = ((t * 9) % scale + scale) % scale;
  const driftY = ((t * 6) % scale + scale) % scale;
  ctx.drawImage(sprite, driftX - scale, driftY - scale);
}

export function drawVolumetricRays(ctx, t, originX = WIDTH * 0.5, originY = -120, rayCount = 5, intensity = 0.22, colorHex = THEME.goldMedina) {
  ctx.save();
  const count = Math.min(rayCount, 5);
  for (let i = 0; i < count; i++) {
    const baseAngle = Math.PI * 0.5 + (i - (count - 1) / 2) * 0.16;
    const sway = Math.sin(t * 0.42 + i * 1.37) * 0.045;
    const angle = baseAngle + sway;
    const spread = 0.055 + 0.025 * Math.sin(t * 0.65 + i);
    const len = 2100;
    const a1 = angle - spread;
    const a2 = angle + spread;

    const ex = originX + Math.cos(angle) * len * 0.85;
    const ey = originY + Math.sin(angle) * len * 0.85;
    const grad = ctx.createLinearGradient(originX, originY, ex, ey);
    const pulse = 0.72 + 0.28 * Math.sin(t * 0.8 + i * 2.1);
    grad.addColorStop(0, rgba(colorHex, intensity * pulse));
    grad.addColorStop(0.45, rgba(colorHex, intensity * 0.32 * pulse));
    grad.addColorStop(1, rgba(colorHex, 0));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + Math.cos(a1) * len, originY + Math.sin(a1) * len);
    ctx.lineTo(originX + Math.cos(a2) * len, originY + Math.sin(a2) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawStarAndDustField(ctx, t, count = 65, seedBase = 101, tint = THEME.goldBright) {
  const rnd = mulberry32(seedBase);
  const dot = getDustDotSprite(tint);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const bx = rnd() * WIDTH;
    const by = rnd() * HEIGHT;
    const depth = 0.3 + rnd() * 0.9;
    const speedY = 14 + rnd() * 26;
    const speedX = (rnd() - 0.5) * 14;
    const size = 1.4 + rnd() * 4.2 * depth;
    const phase = rnd() * TAU;

    const x = ((bx + t * speedX * depth + Math.sin(t * 0.7 + phase) * 22) % (WIDTH + 40) + WIDTH + 40) % (WIDTH + 40) - 20;
    const y = ((by - t * speedY * depth) % (HEIGHT + 40) + HEIGHT + 40) % (HEIGHT + 40) - 20;

    const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1.8 + rnd() * 2.4) + phase));
    const edgeFade = smoothstep(0, 160, y) * smoothstep(HEIGHT, HEIGHT - 160, y);
    const alpha = twinkle * edgeFade * (0.32 + 0.45 * depth);

    if (i % 7 === 0) {
      drawFourPointStar(ctx, x, y, size * 2.2, alpha * 0.9, tint, t * 0.4 + phase);
    } else {
      const d = size * 5;
      ctx.globalAlpha = alpha;
      ctx.drawImage(dot, x - d / 2, y - d / 2, d, d);
    }
  }
  ctx.restore();
}

export function drawCosmicBackdrop(ctx, totalT, sceneIndex, options = {}) {
  const {
    accentTop = THEME.bgEmeraldMid,
    accentGlow = THEME.goldMedina,
    turqGlow = THEME.turqMid,
    rayIntensity = 0.2,
    latticeAlpha = 0.055,
    mihrabAlpha = 0.25,
    rosetteAlpha = 0.14,
  } = options;

  // 1, 2 & 5. Cached opaque emerald-obsidian gradient + aurora + Mihrab frame + vignette
  const staticBg = getStaticBackdropCanvas(accentTop, accentGlow, turqGlow, mihrabAlpha);
  ctx.drawImage(staticBg, 0, 0);

  // 3. Lightweight Mashrabiya lattice drift (single batched stroke)
  if (latticeAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = latticeAlpha;
    ctx.strokeStyle = THEME.goldMedina;
    ctx.lineWidth = 1.2;
    const scale = 220;
    const driftX = ((totalT * 9) % scale + scale) % scale;
    const driftY = ((totalT * 6) % scale + scale) % scale;
    const r = scale * 0.34;
    ctx.beginPath();
    for (let gx = -scale * 0.5; gx < WIDTH + scale; gx += scale) {
      for (let gy = -scale * 0.5; gy < HEIGHT + scale; gy += scale) {
        const cx = gx + driftX;
        const cy = gy + driftY;
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // 4. Crisp rotating background Girih watermark rosette (single vector batch, zero large bitmap composite)
  if (rosetteAlpha > 0) {
    drawGirihRosette(ctx, WIDTH * 0.5, HEIGHT * 0.45, 580, 12, totalT * 0.035, 1, {
      strokeColor: rgba(THEME.goldMedina, rosetteAlpha),
      accentColor: rgba(THEME.turqBright, rosetteAlpha * 0.7),
      alpha: 1,
      lineWidth: 1.8,
      glow: false,
      innerDetail: false,
    });
  }

  // 6. Volumetric golden light shafts
  if (rayIntensity > 0) {
    drawVolumetricRays(ctx, totalT, WIDTH * 0.5, -140, 5, rayIntensity, accentGlow);
  }

  // 7. Floating dust motes & stars
  drawStarAndDustField(ctx, totalT, 48, 300 + sceneIndex * 19, THEME.goldBright);
}

// ============================================================================
// 7. SISTEM TIPOGRAFI, HUD, ARABIC PLAQUE & KINETIC CAPTIONS
// ============================================================================

export function drawTopHUD(ctx, scene, localT) {
  const enter = easeOutExpo(clamp01(localT / 0.55));
  ctx.save();
  ctx.globalAlpha = enter;

  // Left: Brand Emblem + @MuhammadAtarzk
  const bx = 84;
  const by = 92;
  drawRubElHizb(ctx, bx + 20, by, 20, localT * 0.35, THEME.goldMedina, 2.2, rgba(THEME.goldMedina, 0.18));
  drawFourPointStar(ctx, bx + 20, by, 7, 0.95, THEME.goldBright);

  ctx.font = '700 28px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(VIDEO_CONFIG.channelHandle, bx + 54, by + 1);

  // Right: Category Pill
  ctx.font = '600 22px JetBrains';
  const catText = VIDEO_CONFIG.categoryLabel;
  const catW = ctx.measureText(catText).width + 44;
  const catX = WIDTH - 84 - catW;
  const catY = by - 23;
  roundRectPath(ctx, catX, catY, catW, 46, 23);
  ctx.fillStyle = THEME.glassDark;
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.turqBright, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = THEME.turqBright;
  ctx.textAlign = 'center';
  ctx.fillText(catText, catX + catW / 2, by + 1);

  // Center Chapter Banner
  const chapY = 205 - (1 - enter) * 18;
  const chapLabel = `${scene.chapter}  ·  ${scene.badge}`;
  ctx.font = '700 24px JetBrains';
  const cw = ctx.measureText(chapLabel).width + 54;
  const wingLen = 180;

  // Tapered gold wings
  const leftWing = ctx.createLinearGradient(WIDTH / 2 - cw / 2 - wingLen, chapY, WIDTH / 2 - cw / 2, chapY);
  leftWing.addColorStop(0, rgba(THEME.goldMedina, 0));
  leftWing.addColorStop(1, rgba(THEME.goldMedina, 0.8));
  ctx.strokeStyle = leftWing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - cw / 2 - wingLen, chapY);
  ctx.lineTo(WIDTH / 2 - cw / 2 - 14, chapY);
  ctx.stroke();

  const rightWing = ctx.createLinearGradient(WIDTH / 2 + cw / 2, chapY, WIDTH / 2 + cw / 2 + wingLen, chapY);
  rightWing.addColorStop(0, rgba(THEME.goldMedina, 0.8));
  rightWing.addColorStop(1, rgba(THEME.goldMedina, 0));
  ctx.strokeStyle = rightWing;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 + cw / 2 + 14, chapY);
  ctx.lineTo(WIDTH / 2 + cw / 2 + wingLen, chapY);
  ctx.stroke();

  roundRectPath(ctx, WIDTH / 2 - cw / 2, chapY - 24, cw, 48, 24);
  ctx.fillStyle = rgba(THEME.goldMedina, 0.16);
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.65);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = THEME.goldBright;
  ctx.textAlign = 'center';
  ctx.fillText(chapLabel, WIDTH / 2, chapY + 1);

  ctx.restore();
}

export function drawKineticHeadline(ctx, scene, localT) {
  const maxW = 1220;
  const fontSize = 68;
  const lineHeight = 86;
  ctx.save();
  ctx.font = `800 ${fontSize}px Jakarta`;
  ctx.textBaseline = 'middle';

  const rawWords = scene.headline.split(' ');
  const lines = [];
  let current = '';
  for (const w of rawWords) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const highlightPhrases = (scene.highlightWords || []).map((s) => s.toUpperCase());
  const startY = 315 + (lines.length === 1 ? 35 : lines.length === 2 ? 15 : 0);

  lines.forEach((line, li) => {
    const delay = 0.06 + li * 0.09;
    const p = easeOutExpo(clamp01((localT - delay) / 0.45));
    const y = startY + li * lineHeight + (1 - p) * 28;
    const lineW = ctx.measureText(line).width;
    let cursorX = (WIDTH - lineW) / 2;

    ctx.globalAlpha = p;

    // Identify highlight spans inside this line (full-height rounded pill!)
    const upperLine = line.toUpperCase();
    const spans = [];
    for (const phrase of highlightPhrases) {
      let idx = upperLine.indexOf(phrase);
      while (idx !== -1) {
        spans.push([idx, idx + phrase.length]);
        idx = upperLine.indexOf(phrase, idx + phrase.length);
      }
    }

    // Draw highlight pills first behind text
    for (const [s0, s1] of spans) {
      const before = line.slice(0, s0);
      const target = line.slice(s0, s1);
      const x0 = cursorX + ctx.measureText(before).width;
      const wTarget = ctx.measureText(target).width;
      const sweep = easeOutExpo(clamp01((localT - delay - 0.14) / 0.42));

      const padX = 18;
      const pillH = 74;
      const pillW = (wTarget + padX * 2) * sweep;

      if (pillW > 4) {
        roundRectPath(ctx, x0 - padX, y - pillH / 2 - 2, pillW, pillH, 16);
        const pillGrad = ctx.createLinearGradient(x0 - padX, y - 35, x0 + wTarget + padX, y + 35);
        pillGrad.addColorStop(0, THEME.goldMedina);
        pillGrad.addColorStop(1, THEME.goldBright);
        ctx.fillStyle = pillGrad;
        ctx.shadowColor = rgba(THEME.goldMedina, 0.45);
        ctx.shadowBlur = 22;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw line characters segment-by-segment so highlighted words turn deep obsidian
    spans.sort((a, b) => a[0] - b[0]);
    let pos = 0;
    const segments = [];
    for (const [s0, s1] of spans) {
      if (s0 > pos) segments.push({ text: line.slice(pos, s0), hi: false });
      segments.push({ text: line.slice(s0, s1), hi: true });
      pos = s1;
    }
    if (pos < line.length) segments.push({ text: line.slice(pos), hi: false });

    ctx.textAlign = 'left';
    for (const seg of segments) {
      const sw = ctx.measureText(seg.text).width;
      if (seg.hi) {
        const sweep = clamp01((localT - delay - 0.14) / 0.35);
        ctx.fillStyle = sweep > 0.45 ? THEME.bgObsidian : THEME.ivory;
        ctx.fillText(seg.text, cursorX, y);
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = THEME.ivory;
        ctx.fillText(seg.text, cursorX, y);
        ctx.shadowBlur = 0;
      }
      cursorX += sw;
    }
  });

  ctx.restore();
}

export function drawArabicPlaque(ctx, scene, cx, cy, maxW = 1140, localT = 1, opts = {}) {
  const { delay = 0.25, arabicSize = 54, showTrans = true, alpha = 1 } = opts;
  const p = easeOutExpo(clamp01((localT - delay) / 0.55));
  if (p <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = p * alpha;
  const yShift = (1 - p) * 22;

  ctx.font = `700 ${arabicSize}px Amiri`;
  const arW = ctx.measureText(scene.arabic).width;

  // Measure and wrap translation cleanly so zero characters ever clip
  const transText = scene.arabicTrans ? `"${scene.arabicTrans}"` : '';
  ctx.font = 'italic 600 25px Playfair';
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
  const boxW = Math.max(680, Math.min(maxW, Math.max(arW, widestTrans) + 140));
  const extraH = transLines.length > 1 ? (transLines.length - 1) * 34 : 0;
  const boxH = (showTrans ? 196 : 124) + extraH;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2 + yShift;

  // Frosted emerald plaque with gold border
  roundRectPath(ctx, bx, by, boxW, boxH, 28);
  const bg = ctx.createLinearGradient(bx, by, bx, by + boxH);
  bg.addColorStop(0, 'rgba(9, 32, 27, 0.90)');
  bg.addColorStop(1, 'rgba(4, 15, 13, 0.94)');
  ctx.fillStyle = bg;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 28;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = rgba(THEME.goldMedina, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner filigree border
  roundRectPath(ctx, bx + 10, by + 10, boxW - 20, boxH - 20, 20);
  ctx.strokeStyle = rgba(THEME.goldBright, 0.18);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Corner diamonds
  drawFourPointStar(ctx, bx + 26, by + 26, 7, 0.75, THEME.goldMedina);
  drawFourPointStar(ctx, bx + boxW - 26, by + 26, 7, 0.75, THEME.goldMedina);
  drawFourPointStar(ctx, bx + 26, by + boxH - 26, 7, 0.75, THEME.goldMedina);
  drawFourPointStar(ctx, bx + boxW - 26, by + boxH - 26, 7, 0.75, THEME.goldMedina);

  // Arabic script (auto-scaled if wider than plaque)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = THEME.goldBright;
  ctx.shadowColor = rgba(THEME.goldMedina, 0.45);
  ctx.shadowBlur = 16;
  let fittedArSize = arabicSize;
  ctx.font = `700 ${fittedArSize}px Amiri`;
  while (ctx.measureText(scene.arabic).width > boxW - 90 && fittedArSize > 32) {
    fittedArSize -= 2;
    ctx.font = `700 ${fittedArSize}px Amiri`;
  }
  const arY = showTrans ? by + 66 : cy + yShift;
  ctx.fillText(scene.arabic, cx, arY);
  ctx.shadowBlur = 0;

  if (showTrans && transLines.length > 0) {
    // Divider hairline
    const divGrad = ctx.createLinearGradient(cx - 220, 0, cx + 220, 0);
    divGrad.addColorStop(0, rgba(THEME.goldMedina, 0));
    divGrad.addColorStop(0.5, rgba(THEME.goldMedina, 0.6));
    divGrad.addColorStop(1, rgba(THEME.goldMedina, 0));
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 220, by + 114);
    ctx.lineTo(cx + 220, by + 114);
    ctx.stroke();

    ctx.font = 'italic 600 25px Playfair';
    ctx.fillStyle = THEME.ivoryMuted;
    transLines.forEach((tl, li) => {
      ctx.fillText(tl, cx, by + 150 + li * 34);
    });
  }

  ctx.restore();
}

export function drawBroadcastCaptions(ctx, scene, localT) {
  const words = scene.words || [];
  if (words.length === 0) return;

  // Group words into rhythmic 4-5 word chunks
  const chunkSize = 5;
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const slice = words.slice(i, i + chunkSize);
    chunks.push({
      words: slice,
      start: slice[0].start,
      end: slice[slice.length - 1].end,
    });
  }

  let activeChunk = chunks.find((c) => localT >= c.start - 0.05 && localT <= c.end + 0.16);
  if (!activeChunk) {
    if (localT < chunks[0].start) activeChunk = chunks[0];
    else activeChunk = chunks[chunks.length - 1];
  }

  const chunkFadeIn = easeOutCubic(clamp01((localT - (activeChunk.start - 0.05)) / 0.16));
  const cy = 2170;

  ctx.save();
  ctx.globalAlpha = chunkFadeIn;
  ctx.font = '700 42px Jakarta';
  ctx.textBaseline = 'middle';

  // Split chunk into 1 or 2 balanced visual rows
  const maxRowW = 1120;
  const rows = [[]];
  let rowW = 0;
  const spaceW = 18;
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

  const rowWidths = rows.map((r) => {
    const sum = r.reduce((acc, w) => acc + ctx.measureText(w.word).width, 0);
    return sum + Math.max(0, r.length - 1) * spaceW;
  });
  const widest = Math.max(...rowWidths, 360);
  const padX = 48;
  const padY = 26;
  const rowH = 58;
  const boxW = widest + padX * 2;
  const boxH = rows.length * rowH + padY * 2;
  const bx = (WIDTH - boxW) / 2;
  const by = cy - boxH / 2;

  // Frosted dark glass capsule
  roundRectPath(ctx, bx, by, boxW, boxH, 28);
  ctx.fillStyle = 'rgba(4, 14, 12, 0.86)';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.35);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Render words with active gold highlight
  rows.forEach((r, ri) => {
    const rw = rowWidths[ri];
    let wx = (WIDTH - rw) / 2;
    const wy = by + padY + rowH * (ri + 0.5);

    for (const wObj of r) {
      const ww = ctx.measureText(wObj.word).width;
      const isSpoken = localT >= wObj.start && localT <= wObj.end + 0.08;
      const wasSpoken = localT > wObj.end + 0.08;

      ctx.save();
      if (isSpoken) {
        const pop = 1 + 0.06 * Math.sin(clamp01((localT - wObj.start) / Math.max(0.1, wObj.end - wObj.start)) * Math.PI);
        ctx.translate(wx + ww / 2, wy);
        ctx.scale(pop, pop);
        ctx.font = '800 42px Jakarta';
        ctx.fillStyle = THEME.goldBright;
        ctx.shadowColor = rgba(THEME.goldMedina, 0.55);
        ctx.shadowBlur = 14;
        ctx.textAlign = 'center';
        ctx.fillText(wObj.word, 0, 0);
      } else {
        ctx.font = '700 42px Jakarta';
        ctx.fillStyle = wasSpoken ? THEME.ivory : 'rgba(232, 228, 214, 0.72)';
        ctx.textAlign = 'left';
        ctx.fillText(wObj.word, wx, wy);
      }
      ctx.restore();

      wx += ww + spaceW;
    }
  });

  ctx.restore();
}

export function drawSourceFooter(ctx, sourceText, localT) {
  if (!sourceText) return;
  const p = easeOutCubic(clamp01((localT - 0.3) / 0.45));
  ctx.save();
  ctx.globalAlpha = p * 0.9;
  ctx.font = '600 22px JetBrains';
  const label = `SUMBER: ${sourceText}`;
  const tw = ctx.measureText(label).width + 44;
  const fx = (WIDTH - tw) / 2;
  const fy = 2385;

  roundRectPath(ctx, fx, fy, tw, 44, 22);
  ctx.fillStyle = 'rgba(6, 22, 18, 0.75)';
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.turqBright, 0.28);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = THEME.slateText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, WIDTH / 2, fy + 23);
  ctx.restore();
}

// ============================================================================
// 8. KOMPONEN VISUAL KHUSUS DOMAIN ISLAM & ANIMASI PROSEDURAL
// ============================================================================

export function drawBigNumberCounter(ctx, cx, cy, valueText, subLabel, progress, opts = {}) {
  const {
    fontSize = 190,
    colorTop = THEME.goldBright,
    colorBot = THEME.goldBurnished,
    glowColor = THEME.goldMedina,
    echoTrails = true,
  } = opts;

  const p = clamp01(progress);
  const pop = easeOutBack(p, 1.35);
  if (p <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pop, pop);

  // Radial aura behind number
  const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, fontSize * 1.45);
  aura.addColorStop(0, rgba(glowColor, 0.34 * p));
  aura.addColorStop(0.55, rgba(glowColor, 0.1 * p));
  aura.addColorStop(1, rgba(glowColor, 0));
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, fontSize * 1.45, 0, TAU);
  ctx.fill();

  ctx.font = `900 ${fontSize}px Cinzel`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Motion-blur style echo layers during settle
  if (echoTrails && p < 0.98) {
    const spread = (1 - p) * 34;
    for (let k = 1; k <= 3; k++) {
      ctx.globalAlpha = 0.16 * (1 - k * 0.25) * (1 - p);
      ctx.fillStyle = glowColor;
      ctx.fillText(valueText, 0, k * spread * 0.4);
    }
  }

  ctx.globalAlpha = p;
  const g = ctx.createLinearGradient(0, -fontSize * 0.5, 0, fontSize * 0.5);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.28, colorTop);
  g.addColorStop(0.75, colorBot);
  g.addColorStop(1, THEME.goldDeep);

  ctx.shadowColor = rgba(glowColor, 0.6);
  ctx.shadowBlur = 32;
  ctx.fillStyle = g;
  ctx.fillText(valueText, 0, 0);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = rgba('#FFFFFF', 0.35);
  ctx.lineWidth = 2;
  ctx.strokeText(valueText, 0, 0);

  if (subLabel) {
    ctx.font = '700 32px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText(subLabel, 0, fontSize * 0.62);
  }
  ctx.restore();
}

export function drawGlassStatCard(ctx, x, y, w, h, title, mainText, subText, accentHex = THEME.goldMedina, progress = 1) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 30;
  const cy = y + dy;

  roundRectPath(ctx, x, cy, w, h, 28);
  const bg = ctx.createLinearGradient(x, cy, x, cy + h);
  bg.addColorStop(0, 'rgba(11, 38, 32, 0.85)');
  bg.addColorStop(1, 'rgba(4, 15, 13, 0.90)');
  ctx.fillStyle = bg;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = rgba(accentHex, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top specular highlight bar
  const spec = ctx.createLinearGradient(x + 30, cy, x + w - 30, cy);
  spec.addColorStop(0, rgba('#FFFFFF', 0));
  spec.addColorStop(0.5, rgba(accentHex, 0.75));
  spec.addColorStop(1, rgba('#FFFFFF', 0));
  ctx.strokeStyle = spec;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 36, cy + 2);
  ctx.lineTo(x + w - 36, cy + 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (title) {
    ctx.font = '700 24px JetBrains';
    ctx.fillStyle = accentHex;
    ctx.fillText(title, x + w / 2, subText ? cy + 36 : cy + h * 0.29);
  }
  if (mainText) {
    let mSize = subText ? 52 : 48;
    ctx.font = `800 ${mSize}px Jakarta`;
    while (ctx.measureText(mainText).width > w - 48 && mSize > 26) {
      mSize -= 2;
      ctx.font = `800 ${mSize}px Jakarta`;
    }
    ctx.fillStyle = THEME.ivory;
    ctx.fillText(mainText, x + w / 2, subText ? cy + h * 0.54 : cy + h * 0.68);
  }
  if (subText) {
    let sSize = 27;
    ctx.font = `500 ${sSize}px Jakarta`;
    while (ctx.measureText(subText).width > w - 48 && sSize > 18) {
      sSize -= 1;
      ctx.font = `500 ${sSize}px Jakarta`;
    }
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(subText, x + w / 2, cy + h - 34);
  }
  ctx.restore();
}

export function drawMizanScale(ctx, cx, cy, scaleW, tiltRad, leftInfo, rightInfo, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(cx, cy);

  const pillarH = 420;
  const topPivotY = -pillarH * 0.55;

  // Base pedestal
  const baseGrad = ctx.createLinearGradient(-140, pillarH * 0.45, 140, pillarH * 0.45);
  baseGrad.addColorStop(0, THEME.goldDeep);
  baseGrad.addColorStop(0.5, THEME.goldBright);
  baseGrad.addColorStop(1, THEME.goldDeep);
  ctx.fillStyle = baseGrad;
  roundRectPath(ctx, -135, pillarH * 0.42, 270, 26, 13);
  ctx.fill();
  roundRectPath(ctx, -85, pillarH * 0.36, 170, 22, 11);
  ctx.fill();

  // Ornate central vertical pillar
  const pGrad = ctx.createLinearGradient(-12, topPivotY, 12, pillarH * 0.4);
  pGrad.addColorStop(0, THEME.goldBright);
  pGrad.addColorStop(0.5, THEME.goldMedina);
  pGrad.addColorStop(1, THEME.goldDeep);
  ctx.fillStyle = pGrad;
  roundRectPath(ctx, -10, topPivotY, 20, pillarH * 0.92, 10);
  ctx.fill();

  // Finial Rub el Hizb atop pillar
  drawRubElHizb(ctx, 0, topPivotY - 34, 24, t * 0.5, THEME.goldBright, 2.2, rgba(THEME.goldMedina, 0.25));

  // Tilting beam
  ctx.save();
  ctx.translate(0, topPivotY);
  ctx.rotate(tiltRad);

  const halfArm = scaleW * 0.5;
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.shadowColor = rgba(THEME.goldMedina, 0.5);
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(-halfArm, 0);
  ctx.quadraticCurveTo(-halfArm * 0.5, -24, 0, 0);
  ctx.quadraticCurveTo(halfArm * 0.5, -24, halfArm, 0);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Left & Right hanging pans (keep pans upright)
  const drawPan = (px, info, isRight) => {
    ctx.save();
    ctx.translate(px, 0);
    ctx.rotate(-tiltRad);

    const dropLen = 220;
    const panW = 240;

    // Suspension chains
    ctx.strokeStyle = rgba(THEME.goldBright, 0.72);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-panW * 0.42, dropLen);
    ctx.moveTo(0, 0);
    ctx.lineTo(panW * 0.42, dropLen);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, dropLen);
    ctx.stroke();

    // Glowing pan bowl
    const bowlGrad = ctx.createLinearGradient(-panW / 2, dropLen, panW / 2, dropLen + 36);
    bowlGrad.addColorStop(0, THEME.goldDeep);
    bowlGrad.addColorStop(0.5, THEME.goldBright);
    bowlGrad.addColorStop(1, THEME.goldDeep);
    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    ctx.moveTo(-panW * 0.5, dropLen);
    ctx.lineTo(panW * 0.5, dropLen);
    ctx.quadraticCurveTo(0, dropLen + 52, -panW * 0.5, dropLen);
    ctx.closePath();
    ctx.fill();

    // Orbs / cargo sitting on pan
    const orbCount = info.orbs || 1;
    for (let o = 0; o < orbCount; o++) {
      const row = Math.floor(o / 4);
      const col = o % 4;
      const ox = (col - Math.min(3, orbCount - 1 - row * 4) / 2) * 42;
      const oy = dropLen - 22 - row * 36 + Math.sin(t * 2.5 + o) * 3;
      const og = ctx.createRadialGradient(ox - 5, oy - 5, 2, ox, oy, 20);
      og.addColorStop(0, '#FFFFFF');
      og.addColorStop(0.4, info.orbColor || THEME.goldBright);
      og.addColorStop(1, rgba(info.orbColor || THEME.goldMedina, 0.2));
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(ox, oy, 18, 0, TAU);
      ctx.fill();
    }

    // Badge above/below pan
    const badgeY = dropLen + 88;
    roundRectPath(ctx, -155, badgeY - 40, 310, 82, 20);
    ctx.fillStyle = isRight ? 'rgba(9, 36, 28, 0.9)' : 'rgba(38, 14, 14, 0.85)';
    ctx.fill();
    ctx.strokeStyle = isRight ? THEME.goldMedina : THEME.crimsonBright;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 32px Cinzel';
    ctx.fillStyle = isRight ? THEME.goldBright : THEME.crimsonBright;
    ctx.fillText(info.value, 0, badgeY - 11);

    ctx.font = '600 22px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText(info.label, 0, badgeY + 20);

    ctx.restore();
  };

  drawPan(-halfArm, leftInfo, false);
  drawPan(halfArm, rightInfo, true);
  ctx.restore();

  // Center fulcrum jewel
  ctx.fillStyle = THEME.goldBright;
  ctx.beginPath();
  ctx.arc(0, topPivotY, 16, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = THEME.bgObsidian;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

export function drawBotanicalSeedTree(ctx, cx, baseY, seedDropP, branchP, grainBurstP, t) {
  ctx.save();
  ctx.translate(cx, baseY);

  // Fertile glowing earth mound
  const moundW = 540;
  const earthGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, moundW);
  earthGrad.addColorStop(0, rgba(THEME.goldMedina, 0.35));
  earthGrad.addColorStop(0.5, rgba(THEME.turqMid, 0.14));
  earthGrad.addColorStop(1, rgba(THEME.bgObsidian, 0));
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, moundW, 74, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = rgba(THEME.goldMedina, 0.7);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-moundW * 0.75, 0);
  ctx.quadraticCurveTo(0, -24, moundW * 0.75, 0);
  ctx.stroke();

  // Single glowing seed
  const seedY = lerp(-260, -8, easeOutCubic(clamp01(seedDropP)));
  const seedAura = ctx.createRadialGradient(0, seedY, 2, 0, seedY, 46);
  seedAura.addColorStop(0, rgba(THEME.goldBright, 0.9));
  seedAura.addColorStop(0.5, rgba(THEME.goldMedina, 0.3));
  seedAura.addColorStop(1, rgba(THEME.goldMedina, 0));
  ctx.fillStyle = seedAura;
  ctx.beginPath();
  ctx.arc(0, seedY, 46, 0, TAU);
  ctx.fill();

  ctx.fillStyle = THEME.goldBright;
  ctx.beginPath();
  ctx.ellipse(0, seedY, 13, 21, 0, 0, TAU);
  ctx.fill();

  // Golden roots below earth
  if (branchP > 0.05) {
    const rp = clamp01((branchP - 0.05) / 0.4);
    ctx.strokeStyle = rgba(THEME.goldBurnished, 0.55 * rp);
    ctx.lineWidth = 2.5;
    for (let r = -2; r <= 2; r++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 45 * rp, 35 * rp, r * 92 * rp, 68 * rp);
      ctx.stroke();
    }
  }

  // 7 Graceful Golden Wheat Stalks (QS. Al-Baqarah 2:261)
  if (branchP > 0.01) {
    const bp = easeOutCubic(clamp01(branchP));
    const stalkAngles = [-0.54, -0.36, -0.18, 0, 0.18, 0.36, 0.54];
    const stalkHeights = [540, 625, 695, 745, 695, 625, 540];

    stalkAngles.forEach((ang, idx) => {
      const stagger = clamp01((bp - Math.abs(idx - 3) * 0.08) / 0.72);
      if (stagger <= 0.01) return;

      const sway = Math.sin(t * 1.45 + idx * 0.85) * 14 * stagger;
      const tipX = Math.sin(ang) * stalkHeights[idx] * stagger + sway;
      const tipY = -Math.cos(ang) * stalkHeights[idx] * stagger;
      const ctrlX = tipX * 0.42;
      const ctrlY = tipY * 0.58;

      // Stalk curve
      const sGrad = ctx.createLinearGradient(0, 0, tipX, tipY);
      sGrad.addColorStop(0, THEME.turqBright);
      sGrad.addColorStop(0.45, THEME.goldMedina);
      sGrad.addColorStop(1, THEME.goldBright);
      ctx.strokeStyle = sGrad;
      ctx.lineWidth = idx === 3 ? 6 : 4.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(THEME.goldMedina, 0.4);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Wheat ear & 100-grain bloom at tip
      if (stagger > 0.55) {
        const earP = clamp01((stagger - 0.55) / 0.45);
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(ang * 0.75);

        // Glowing aura around wheat ear
        const eAura = ctx.createRadialGradient(0, -36, 4, 0, -36, 86 * earP);
        eAura.addColorStop(0, rgba(THEME.goldBright, 0.42 * earP));
        eAura.addColorStop(1, rgba(THEME.goldMedina, 0));
        ctx.fillStyle = eAura;
        ctx.beginPath();
        ctx.arc(0, -36, 86 * earP, 0, TAU);
        ctx.fill();

        // Layered golden wheat kernels along the ear
        const pairCount = 7;
        for (let k = 0; k < pairCount; k++) {
          const ky = -k * 13 * earP;
          const kw = (1 - k / (pairCount + 2)) * 13 * earP;
          const kh = 20 * earP;
          ctx.fillStyle = k % 2 === 0 ? THEME.goldBright : THEME.goldMedina;
          ctx.beginPath();
          ctx.ellipse(-kw, ky, 6.5 * earP, kh * 0.5, -0.45, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(kw, ky, 6.5 * earP, kh * 0.5, 0.45, 0, TAU);
          ctx.fill();
        }

        // Sparkling 100-grain constellation burst when grainBurstP > 0
        if (grainBurstP > 0.01) {
          const gp = easeOutExpo(clamp01(grainBurstP));
          const rnd = mulberry32(700 + idx * 31);
          for (let g = 0; g < 18; g++) {
            const ga = rnd() * TAU;
            const gr = (18 + rnd() * 68) * gp;
            const gx = Math.cos(ga) * gr;
            const gy = -42 + Math.sin(ga) * gr;
            const gAlpha = (0.45 + 0.55 * Math.sin(t * 4 + g + idx)) * gp;
            ctx.fillStyle = rgba(THEME.goldBright, gAlpha);
            ctx.beginPath();
            ctx.arc(gx, gy, 2.2 + rnd() * 2.5, 0, TAU);
            ctx.fill();
          }

          // "100" badge above each stalk
          ctx.save();
          ctx.rotate(-ang * 0.75);
          ctx.globalAlpha = gp;
          roundRectPath(ctx, -40, -138, 80, 34, 17);
          ctx.fillStyle = 'rgba(6, 22, 18, 0.88)';
          ctx.fill();
          ctx.strokeStyle = THEME.goldMedina;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.font = '800 20px JetBrains';
          ctx.fillStyle = THEME.goldBright;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('100', 0, -120);
          ctx.restore();
        }

        ctx.restore();
      }
    });
  }

  ctx.restore();
}

export function drawExponentialStaircase(ctx, cx, baseY, progress, t) {
  const p = clamp01(progress);
  const steps = [
    { label: '1×', sub: 'Niat', h: 120, col: THEME.turqMid },
    { label: '10×', sub: 'Minimal', h: 250, col: THEME.turqBright },
    { label: '100×', sub: 'Bertumbuh', h: 410, col: THEME.goldMedina },
    { label: '700×', sub: 'Al-Baqarah', h: 610, col: THEME.goldBright },
    { label: '∞', sub: 'Tak Terhingga', h: 780, col: '#FFFFFF' },
  ];

  const colW = 164;
  const gap = 38;
  const totalW = steps.length * colW + (steps.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.save();
  // Subtle baseline
  drawGlowingLine(ctx, startX - 40, baseY, startX + totalW + 40, baseY, rgba(THEME.goldMedina, 0.55), 3, 10);

  const tops = [];
  steps.forEach((st, i) => {
    const sp = easeOutBack(clamp01((p - i * 0.14) / 0.44), 1.15);
    const x = startX + i * (colW + gap);
    const h = st.h * Math.max(0.02, sp);
    const y = baseY - h;
    tops.push({ x: x + colW / 2, y });

    if (sp > 0.02) {
      roundRectPath(ctx, x, y, colW, h, 20);
      const g = ctx.createLinearGradient(x, y, x, baseY);
      g.addColorStop(0, rgba(st.col, 0.92));
      g.addColorStop(0.35, rgba(st.col, 0.38));
      g.addColorStop(1, rgba(THEME.bgEmeraldDeep, 0.2));
      ctx.fillStyle = g;
      ctx.fill();

      ctx.strokeStyle = rgba(st.col, 0.85);
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Pillar crown label
      ctx.globalAlpha = clamp01(sp);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 44px Cinzel';
      ctx.fillStyle = st.col;
      ctx.shadowColor = rgba(st.col, 0.5);
      ctx.shadowBlur = 16;
      ctx.fillText(st.label, x + colW / 2, y - 42);
      ctx.shadowBlur = 0;

      ctx.font = '700 22px Jakarta';
      ctx.fillStyle = THEME.ivory;
      ctx.fillText(st.sub, x + colW / 2, baseY + 34);
      ctx.globalAlpha = 1;
    }
  });

  // Sweeping exponential light curve connecting tops
  if (p > 0.25 && tops.length >= 2) {
    ctx.save();
    ctx.strokeStyle = THEME.goldBright;
    ctx.lineWidth = 5;
    ctx.shadowColor = rgba(THEME.goldMedina, 0.75);
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(tops[0].x, tops[0].y - 8);
    for (let i = 1; i < tops.length; i++) {
      const prev = tops[i - 1];
      const cur = tops[i];
      const midX = (prev.x + cur.x) / 2;
      ctx.bezierCurveTo(midX, prev.y - 8, midX, cur.y - 8, cur.x, cur.y - 8);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Rising spark orb along the top
  const pulseIdx = (t * 0.9) % 1;
  const activeTop = tops[Math.min(tops.length - 1, Math.floor(pulseIdx * tops.length))];
  if (activeTop) {
    drawFourPointStar(ctx, activeTop.x, activeTop.y - 10, 18, 0.9, '#FFFFFF', t * 2);
  }

  ctx.restore();
}

export function drawIlluminatedManuscript(ctx, cx, cy, w, h, openP, t) {
  const p = easeOutExpo(clamp01(openP));
  if (p <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  const floatY = Math.sin(t * 1.4) * 8;
  ctx.translate(0, floatY);

  const curW = w * (0.25 + 0.75 * p);
  const x = -curW / 2;
  const y = -h / 2;

  // Manuscript outer shadow & leather spine
  roundRectPath(ctx, x - 18, y - 16, curW + 36, h + 32, 32);
  ctx.fillStyle = 'rgba(20, 14, 6, 0.88)';
  ctx.shadowColor = rgba(THEME.goldMedina, 0.3);
  ctx.shadowBlur = 35;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = THEME.goldBurnished;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Parchment twin pages
  const halfW = curW / 2 - 12;
  for (let side of [-1, 1]) {
    const px = side < 0 ? -curW / 2 + 6 : 6;
    roundRectPath(ctx, px, y + 6, halfW, h - 12, 18);
    const pg = ctx.createLinearGradient(px, y, px + halfW, y + h);
    pg.addColorStop(0, '#132E26');
    pg.addColorStop(0.5, '#0B1F1B');
    pg.addColorStop(1, '#081714');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = rgba(THEME.goldMedina, 0.6);
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Decorative gold ruled lines & margin medallion
    ctx.strokeStyle = rgba(THEME.goldMedina, 0.2);
    ctx.lineWidth = 1.2;
    for (let l = 1; l <= 6; l++) {
      const ly = y + 48 + l * ((h - 96) / 7);
      ctx.beginPath();
      ctx.moveTo(px + 28, ly);
      ctx.lineTo(px + halfW - 28, ly);
      ctx.stroke();
    }
    drawRubElHizb(ctx, px + halfW / 2, y + h * 0.25, 34, t * 0.2 * side, rgba(THEME.goldBright, 0.45), 1.6);
  }

  // Center golden gutter crease
  const spineGrad = ctx.createLinearGradient(-16, 0, 16, 0);
  spineGrad.addColorStop(0, 'rgba(0,0,0,0)');
  spineGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
  spineGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(-16, y + 6, 32, h - 12);

  ctx.restore();
}

export function drawCamelSilhouette(ctx, x, y, scale, stridePhase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const bob = Math.sin(stridePhase * 2) * 2.2;
  const legSwing = Math.sin(stridePhase) * 8;

  ctx.fillStyle = '#040B09';
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.55);
  ctx.lineWidth = 1.4;

  // Body & hump
  ctx.beginPath();
  ctx.moveTo(-26, -12 + bob);
  ctx.quadraticCurveTo(-18, -32 + bob, -4, -36 + bob);
  ctx.quadraticCurveTo(10, -34 + bob, 18, -18 + bob);
  // Neck & head
  ctx.quadraticCurveTo(28, -20 + bob, 32, -34 + bob);
  ctx.quadraticCurveTo(36, -42 + bob, 44, -40 + bob);
  ctx.quadraticCurveTo(48, -36 + bob, 42, -32 + bob);
  ctx.quadraticCurveTo(35, -14 + bob, 22, -4 + bob);
  ctx.lineTo(-22, -4 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs
  const legs = [
    { lx: -16, off: legSwing },
    { lx: -8, off: -legSwing },
    { lx: 12, off: -legSwing * 0.8 },
    { lx: 19, off: legSwing * 0.8 },
  ];
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#040B09';
  for (const lg of legs) {
    ctx.beginPath();
    ctx.moveTo(lg.lx, -6 + bob);
    ctx.lineTo(lg.lx + lg.off * 0.5, 16);
    ctx.lineTo(lg.lx + lg.off, 34);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCaravanTwilight(ctx, cx, horizonY, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  ctx.save();
  ctx.globalAlpha = p;

  // Twilight desert sun/moon glow behind dunes
  const sunG = ctx.createRadialGradient(cx, horizonY - 120, 20, cx, horizonY - 120, 420);
  sunG.addColorStop(0, rgba(THEME.goldBright, 0.45));
  sunG.addColorStop(0.4, rgba(THEME.goldMedina, 0.16));
  sunG.addColorStop(1, rgba(THEME.goldMedina, 0));
  ctx.fillStyle = sunG;
  ctx.fillRect(0, horizonY - 560, WIDTH, 680);

  // Distant Madinah dome & minaret silhouettes
  ctx.fillStyle = rgba(THEME.bgEmeraldSoft, 0.65);
  ctx.beginPath();
  ctx.arc(WIDTH * 0.78, horizonY - 40, 56, Math.PI, 0);
  ctx.lineTo(WIDTH * 0.78 + 70, horizonY + 40);
  ctx.lineTo(WIDTH * 0.78 - 70, horizonY + 40);
  ctx.closePath();
  ctx.fill();
  // Minaret
  ctx.fillRect(WIDTH * 0.78 + 82, horizonY - 165, 14, 190);
  ctx.beginPath();
  ctx.arc(WIDTH * 0.78 + 89, horizonY - 165, 11, Math.PI, 0);
  ctx.fill();

  // Back dune ridge
  const dune1 = ctx.createLinearGradient(0, horizonY - 90, 0, horizonY + 260);
  dune1.addColorStop(0, '#1B2D24');
  dune1.addColorStop(1, '#061411');
  ctx.fillStyle = dune1;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 280);
  ctx.lineTo(0, horizonY - 20);
  ctx.bezierCurveTo(380, horizonY - 110, 820, horizonY + 30, WIDTH, horizonY - 55);
  ctx.lineTo(WIDTH, horizonY + 280);
  ctx.closePath();
  ctx.fill();

  // Animated caravan of camels walking right-to-left or left-to-right across ridge
  const travel = (t * 42) % 320;
  for (let i = 0; i < 6; i++) {
    const camX = 180 + i * 195 + travel - 120;
    const ridgeT = clamp01(camX / WIDTH);
    const camY = horizonY - 38 - Math.sin(ridgeT * Math.PI) * 26;
    drawCamelSilhouette(ctx, camX, camY, 1.38, t * 4.5 + i * 1.1);
  }

  // Foreground dune with golden rim highlight
  const dune2 = ctx.createLinearGradient(0, horizonY + 10, 0, horizonY + 340);
  dune2.addColorStop(0, '#12221C');
  dune2.addColorStop(1, '#030A09');
  ctx.fillStyle = dune2;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 340);
  ctx.lineTo(0, horizonY + 45);
  ctx.bezierCurveTo(450, horizonY + 125, 960, horizonY - 15, WIDTH, horizonY + 70);
  ctx.lineTo(WIDTH, horizonY + 340);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rgba(THEME.goldMedina, 0.55);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 45);
  ctx.bezierCurveTo(450, horizonY + 125, 960, horizonY - 15, WIDTH, horizonY + 70);
  ctx.stroke();

  // Telemetry route arc SYAM -> MADINAH
  const arcY = horizonY - 250;
  ctx.strokeStyle = rgba(THEME.turqBright, 0.65);
  ctx.setLineDash([10, 10]);
  ctx.lineDashOffset = -t * 45;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(240, arcY + 80);
  ctx.quadraticCurveTo(WIDTH / 2, arcY - 90, WIDTH - 240, arcY + 80);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const pt of [
    { x: 240, label: 'SYAM', sub: 'Kafilah Dagang' },
    { x: WIDTH - 240, label: 'MADINAH', sub: '1.000 Unta' },
  ]) {
    ctx.fillStyle = THEME.turqBright;
    ctx.beginPath();
    ctx.arc(pt.x, arcY + 80, 10, 0, TAU);
    ctx.fill();
    ctx.font = '800 26px JetBrains';
    ctx.textAlign = 'center';
    ctx.fillText(pt.label, pt.x, arcY + 120);
    ctx.font = '600 22px Jakarta';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(pt.sub, pt.x, arcY + 150);
  }

  ctx.restore();
}

export function drawComparisonBars(ctx, x, y, w, items, progress, t) {
  const p = clamp01(progress);
  ctx.save();
  items.forEach((it, idx) => {
    const ip = easeOutExpo(clamp01((p - idx * 0.16) / 0.55));
    const iy = y + idx * 188;

    ctx.globalAlpha = ip;
    ctx.font = '700 30px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.label, x, iy);

    ctx.font = '800 34px Cinzel';
    ctx.fillStyle = it.color;
    ctx.textAlign = 'right';
    ctx.fillText(it.valueLabel, x + w, iy);

    // Track
    const trackY = iy + 36;
    const trackH = 44;
    roundRectPath(ctx, x, trackY, w, trackH, 22);
    ctx.fillStyle = 'rgba(10, 32, 27, 0.85)';
    ctx.fill();
    ctx.strokeStyle = rgba(it.color, 0.35);
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Fill bar
    const fillW = Math.max(44, w * it.ratio * ip);
    roundRectPath(ctx, x, trackY, fillW, trackH, 22);
    const bg = ctx.createLinearGradient(x, trackY, x + fillW, trackY);
    bg.addColorStop(0, rgba(it.color, 0.55));
    bg.addColorStop(1, it.color);
    ctx.fillStyle = bg;
    ctx.shadowColor = rgba(it.color, 0.45);
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Traveling shimmer along bar
    const shimmerX = x + ((t * 180 + idx * 90) % Math.max(60, fillW));
    const sg = ctx.createRadialGradient(shimmerX, trackY + trackH / 2, 2, shimmerX, trackY + trackH / 2, 50);
    sg.addColorStop(0, rgba('#FFFFFF', 0.45));
    sg.addColorStop(1, rgba('#FFFFFF', 0));
    ctx.fillStyle = sg;
    ctx.fillRect(x, trackY, fillW, trackH);
  });
  ctx.restore();
}

export function drawDirhamScale(ctx, cx, cy, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  const tilt = lerp(0.18, -0.24, easeOutCubic(clamp01((p - 0.25) / 0.55)));
  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(cx, cy);

  // Fulcrum triangle
  ctx.fillStyle = THEME.goldMedina;
  ctx.beginPath();
  ctx.moveTo(0, 120);
  ctx.lineTo(-42, 195);
  ctx.lineTo(42, 195);
  ctx.closePath();
  ctx.fill();

  // Tilting plank
  ctx.save();
  ctx.translate(0, 120);
  ctx.rotate(tilt);

  roundRectPath(ctx, -430, -14, 860, 28, 14);
  const plankG = ctx.createLinearGradient(-430, 0, 430, 0);
  plankG.addColorStop(0, THEME.goldDeep);
  plankG.addColorStop(0.5, THEME.goldBright);
  plankG.addColorStop(1, THEME.goldDeep);
  ctx.fillStyle = plankG;
  ctx.fill();

  // Left: Single luminous Dirham Ikhlas
  const lx = -290;
  const coinDrop = lerp(-240, -68, easeOutBack(clamp01((p - 0.1) / 0.45)));
  const cGlow = ctx.createRadialGradient(lx, coinDrop, 10, lx, coinDrop, 120);
  cGlow.addColorStop(0, rgba(THEME.goldBright, 0.55));
  cGlow.addColorStop(1, rgba(THEME.goldMedina, 0));
  ctx.fillStyle = cGlow;
  ctx.beginPath();
  ctx.arc(lx, coinDrop, 120, 0, TAU);
  ctx.fill();

  ctx.fillStyle = THEME.goldBright;
  ctx.beginPath();
  ctx.arc(lx, coinDrop, 54, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = THEME.goldDeep;
  ctx.lineWidth = 4;
  ctx.stroke();
  drawRubElHizb(ctx, lx, coinDrop, 32, t * 0.4, THEME.bgObsidian, 2.2);

  ctx.font = '800 32px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.textAlign = 'center';
  ctx.fillText('1 DIRHAM', lx, coinDrop - 88);
  ctx.font = '700 24px Jakarta';
  ctx.fillStyle = THEME.turqBright;
  ctx.fillText('IKHLAS PENUH', lx, coinDrop - 54);

  // Right: Towering stack of 100.000 Dirham
  const rx = 290;
  for (let s = 0; s < 14; s++) {
    const sy = -24 - s * 14;
    roundRectPath(ctx, rx - 78, sy, 156, 12, 6);
    ctx.fillStyle = s % 2 === 0 ? '#A8B6B2' : '#7C8B87';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.font = '800 30px Cinzel';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText('100.000 DIRHAM', rx, -252);
  ctx.font = '600 22px Jakarta';
  ctx.fillStyle = THEME.slateText;
  ctx.fillText('Sisa Harta Berlebih', rx, -218);

  ctx.restore();
  ctx.restore();
}

export function drawChecklistStamp(ctx, cx, cy, rows, progress) {
  const p = clamp01(progress);
  ctx.save();
  const boxW = 1080;
  const rowH = 144;
  const gap = 28;
  const totalH = rows.length * rowH + (rows.length - 1) * gap;
  const startY = cy - totalH / 2;

  rows.forEach((row, idx) => {
    const rp = easeOutExpo(clamp01((p - idx * 0.18) / 0.5));
    if (rp <= 0.01) return;
    const rx = cx - boxW / 2;
    const ry = startY + idx * (rowH + gap) + (1 - rp) * 24;

    ctx.globalAlpha = rp;
    roundRectPath(ctx, rx, ry, boxW, rowH, 26);
    ctx.fillStyle = 'rgba(8, 28, 23, 0.88)';
    ctx.fill();
    ctx.strokeStyle = rgba(row.accent || THEME.goldMedina, 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Left icon circle
    const icx = rx + 68;
    const icy = ry + rowH / 2;
    ctx.fillStyle = rgba(row.accent || THEME.goldMedina, 0.2);
    ctx.beginPath();
    ctx.arc(icx, icy, 34, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = row.accent || THEME.goldMedina;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '800 28px Cinzel';
    ctx.fillStyle = row.accent || THEME.goldBright;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.iconText, icx, icy + 1);

    // Text
    ctx.textAlign = 'left';
    ctx.font = '800 32px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText(row.title, rx + 126, ry + rowH * 0.36);

    ctx.font = '500 26px Jakarta';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(row.desc, rx + 126, ry + rowH * 0.68);

    // Right badge
    const bw = 200;
    roundRectPath(ctx, rx + boxW - bw - 26, ry + 34, bw, 76, 18);
    ctx.fillStyle = rgba(row.accent || THEME.goldMedina, 0.18);
    ctx.fill();
    ctx.strokeStyle = rgba(row.accent || THEME.goldMedina, 0.75);
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '800 28px Cinzel';
    ctx.fillStyle = row.accent || THEME.goldBright;
    ctx.fillText(row.badge, rx + boxW - bw / 2 - 26, ry + rowH / 2 + 1);
  });

  ctx.restore();
}

export function drawInfinityRibbon(ctx, cx, cy, w, h, progress, t, color = THEME.goldBright) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = p;

  const steps = 160;
  const maxStep = Math.floor(steps * p);

  // Glow trail
  ctx.strokeStyle = rgba(color, 0.35);
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= maxStep; i++) {
    const a = (i / steps) * TAU;
    const denom = 1 + Math.sin(a) ** 2;
    const x = ((w * 0.5) * Math.cos(a)) / denom;
    const y = ((h * 0.65) * Math.sin(a) * Math.cos(a)) / denom;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Sharp metallic core
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Orbiting light beads
  for (let b = 0; b < 4; b++) {
    const a = (t * 1.4 + (b * TAU) / 4) % TAU;
    const denom = 1 + Math.sin(a) ** 2;
    const bx = ((w * 0.5) * Math.cos(a)) / denom;
    const by = ((h * 0.65) * Math.sin(a) * Math.cos(a)) / denom;
    drawFourPointStar(ctx, bx, by, 14, 0.95, '#FFFFFF', t * 3 + b);
  }

  ctx.restore();
}

// ============================================================================
// 9. TRANSISI SINEMATIK ANTAR-ADEGAN & GLOBAL COLOR GRADE
// ============================================================================

export function drawSceneTransitionOverlay(ctx, transitionType, u) {
  if (u <= 0 || u >= 1) return;
  const bell = Math.sin(u * Math.PI);
  ctx.save();

  switch (transitionType) {
    case 'iris_gold':
    case 'star_iris': {
      const r = lerp(40, 1500, easeInOutCubic(u));
      drawGirihRosette(ctx, WIDTH / 2, HEIGHT / 2, r, 12, u * 1.2, 1, {
        strokeColor: rgba(THEME.goldBright, bell * 0.85),
        accentColor: rgba(THEME.turqBright, bell * 0.6),
        alpha: bell,
        lineWidth: 4,
        glow: true,
      });
      break;
    }
    case 'arch_wipe':
    case 'gold_curtain': {
      const sweepY = lerp(-200, HEIGHT + 200, easeInOutQuint(u));
      const g = ctx.createLinearGradient(0, sweepY - 220, 0, sweepY + 220);
      g.addColorStop(0, rgba(THEME.goldMedina, 0));
      g.addColorStop(0.5, rgba(THEME.goldBright, bell * 0.45));
      g.addColorStop(1, rgba(THEME.goldMedina, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, sweepY - 220, WIDTH, 440);
      break;
    }
    case 'prism_slice':
    case 'diagonal_sweep': {
      const sx = lerp(-400, WIDTH + 400, easeInOutCubic(u));
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createLinearGradient(sx - 260, 0, sx + 260, HEIGHT * 0.35);
      g.addColorStop(0, rgba(THEME.turqBright, 0));
      g.addColorStop(0.5, rgba(THEME.goldBright, bell * 0.48));
      g.addColorStop(1, rgba(THEME.turqBright, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      break;
    }
    default: {
      // Radial light flare shimmer
      ctx.globalCompositeOperation = 'screen';
      const rad = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.48, 10, WIDTH / 2, HEIGHT * 0.48, 1100);
      rad.addColorStop(0, rgba(THEME.goldBright, bell * 0.38));
      rad.addColorStop(0.5, rgba(THEME.turqBright, bell * 0.14));
      rad.addColorStop(1, rgba(THEME.bgObsidian, 0));
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      break;
    }
  }

  ctx.restore();
}

export function drawGlobalFinishing(ctx, totalT) {
  // Vignette is pre-baked into getStaticBackdropCanvas; subtle breathing rim accent only
  ctx.save();
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.08 + 0.03 * Math.sin(totalT * 1.4));
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, WIDTH - 36, HEIGHT - 36);
  ctx.restore();
}

// ============================================================================
// 10. KOMPOSITOR UTAMA PER FRAME & PEMUAT ADEGAN (x1.mjs .. x14.mjs)
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
    TAU,
    THEME,
    clamp,
    clamp01,
    lerp,
    invLerp,
    remap,
    smoothstep,
    smootherstep,
    easeOutCubic,
    easeInOutCubic,
    easeOutExpo,
    easeInOutQuint,
    easeOutBack,
    easeOutElastic,
    spring,
    mulberry32,
    noise2D,
    fbm2D,
    rgba,
    lerpColor,
    createCameraState,
    applyCamera,
    project3D,
    roundRectPath,
    drawGlowingLine,
    drawFourPointStar,
    drawRubElHizb,
    drawGirihRosette,
    drawMihrabArch,
    drawMashrabiyaLattice,
    drawVolumetricRays,
    drawStarAndDustField,
    drawCosmicBackdrop,
    drawTopHUD,
    drawKineticHeadline,
    drawArabicPlaque,
    drawBroadcastCaptions,
    drawSourceFooter,
    drawBigNumberCounter,
    drawGlassStatCard,
    drawMizanScale,
    drawBotanicalSeedTree,
    drawExponentialStaircase,
    drawIlluminatedManuscript,
    drawCamelSilhouette,
    drawCaravanTwilight,
    drawComparisonBars,
    drawDirhamScale,
    drawChecklistStamp,
    drawInfinityRibbon,
  };
}

export function renderSingleFrame(ctx, timeline, sceneRenderers, helpers, frameIdx) {
  const totalT = frameIdx / FPS;
  const scenes = timeline.scenes;

  // Locate active scene for this frame
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

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Scene fade-in / fade-out envelope (0.28s smooth cross-energy)
  const inAlpha = clamp01(localT / 0.22);
  const outAlpha = idx < scenes.length - 1 ? clamp01((sc.durationSec - localT) / 0.18) : clamp01((sc.durationSec - localT) / 0.45);
  const sceneAlpha = Math.min(inAlpha, outAlpha);

  // Render scene with camera motion
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

  // Persistent broadcast HUD, kinetic captions & source citation
  drawTopHUD(ctx, sc, localT);
  drawKineticHeadline(ctx, sc, localT);
  drawBroadcastCaptions(ctx, sc, localT);
  drawSourceFooter(ctx, sc.source, localT);

  // Transition light-sweep near boundary
  const transDur = 0.36;
  if (idx < scenes.length - 1 && sc.durationSec - localT < transDur * 0.5) {
    const u = (transDur * 0.5 - (sc.durationSec - localT)) / transDur;
    drawSceneTransitionOverlay(ctx, sc.transition, u);
  } else if (idx > 0 && localT < transDur * 0.5) {
    const u = 0.5 + localT / transDur;
    drawSceneTransitionOverlay(ctx, scenes[idx - 1].transition, u);
  }

  // Global color grade & grain
  drawGlobalFinishing(ctx, totalT);
}

// ============================================================================
// 11. MULTI-WORKER RENDER PIPELINE & CLI RUNNER
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
    if (msg.stop) {
      process.exit(0);
    }
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
    const targetFrame = sc.startFrame + Math.round(sc.durationFrames * 0.62);
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
        const wk = idleWorkers.shift();
        wk.postMessage({ stop: true });
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
        workerData: {
          timelinePath: VIDEO_CONFIG.timelineFile,
        },
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
// 12. MODUL KALIGRAFI & ORNAMEN TAMBAHAN UNTUK ADEGAN SPESIFIK
// ============================================================================

export function drawHilalCrescent(ctx, cx, cy, radius, progress, t, glowColor = THEME.goldBright) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.35 + Math.sin(t * 0.7) * 0.04);
  ctx.scale(p, p);

  const aura = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 2.1);
  aura.addColorStop(0, rgba(glowColor, 0.38));
  aura.addColorStop(0.5, rgba(THEME.turqBright, 0.12));
  aura.addColorStop(1, rgba(THEME.bgObsidian, 0));
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.1, 0, TAU);
  ctx.fill();

  // Crescent via geometric intersection arc
  ctx.fillStyle = glowColor;
  ctx.shadowColor = rgba(glowColor, 0.65);
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0.55, TAU - 0.55, false);
  ctx.arc(radius * 0.36, 0, radius * 0.82, TAU - 0.72, 0.72, true);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Companion star inside crescent horn
  drawFourPointStar(ctx, radius * 0.65, -radius * 0.15, radius * 0.24, 0.95, '#FFFFFF', t * 0.8);
  ctx.restore();
}

export function drawOrbitalEquationRing(ctx, cx, cy, radius, labels, progress, t) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = p;

  ctx.strokeStyle = rgba(THEME.goldMedina, 0.45);
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.lineDashOffset = -t * 28;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  labels.forEach((lbl, idx) => {
    const a = t * 0.35 + (idx * TAU) / labels.length - Math.PI / 2;
    const lx = Math.cos(a) * radius;
    const ly = Math.sin(a) * radius;

    roundRectPath(ctx, lx - 72, ly - 32, 144, 64, 32);
    ctx.fillStyle = 'rgba(7, 26, 22, 0.9)';
    ctx.fill();
    ctx.strokeStyle = rgba(THEME.goldBright, 0.75);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '800 28px Cinzel';
    ctx.fillStyle = THEME.goldBright;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx, ly + 1);
  });

  ctx.restore();
}

export function drawPulseHeartShield(ctx, cx, cy, size, progress, t, mode = 'good') {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;

  const col = mode === 'shield' ? THEME.turqBright : THEME.goldBright;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p, p);

  // Expanding concentric ripples
  for (let r = 0; r < 3; r++) {
    const phase = (t * 0.7 + r * 0.33) % 1;
    const rr = size * (0.7 + phase * 1.15);
    ctx.strokeStyle = rgba(col, (1 - phase) * 0.45);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, TAU);
    ctx.stroke();
  }

  // Octagonal shield frame
  drawRubElHizb(ctx, 0, 0, size * 0.95, t * 0.18, col, 3.5, rgba(col, 0.14));

  // Center luminous core
  const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, size * 0.55);
  cg.addColorStop(0, '#FFFFFF');
  cg.addColorStop(0.45, col);
  cg.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.55, 0, TAU);
  ctx.fill();

  ctx.restore();
}

export function drawSplitArenaCards(ctx, cx, cy, leftCard, rightCard, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  const w = 540;
  const h = 420;
  const gap = 44;

  // Left card (worldly offer)
  drawGlassStatCard(
    ctx,
    cx - w - gap / 2,
    cy - h / 2,
    w,
    h,
    leftCard.title,
    leftCard.value,
    leftCard.sub,
    leftCard.accent || THEME.crimsonBright,
    p,
  );

  // Optional diagonal strike-through on left card
  if (leftCard.crossed && p > 0.55) {
    const cp = easeOutCubic(clamp01((p - 0.55) / 0.35));
    const x0 = cx - w - gap / 2 + 44;
    const y0 = cy - h / 2 + 65;
    const x1 = lerp(x0, x0 + w - 88, cp);
    const y1 = lerp(y0, y0 + h - 130, cp);
    drawGlowingLine(ctx, x0, y0, x1, y1, THEME.crimsonBright, 7, 16);
  }

  // Right card (Allah's promise)
  drawGlassStatCard(
    ctx,
    cx + gap / 2,
    cy - h / 2,
    w,
    h,
    rightCard.title,
    rightCard.value,
    rightCard.sub,
    rightCard.accent || THEME.goldBright,
    clamp01((p - 0.15) / 0.85),
  );

  // Floating VS medallion between cards
  ctx.save();
  ctx.globalAlpha = p;
  drawRubElHizb(ctx, cx, cy, 48, t * 0.4, THEME.goldBright, 2.5, 'rgba(6, 22, 18, 0.95)');
  ctx.font = '800 28px Cinzel';
  ctx.fillStyle = THEME.goldBright;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', cx, cy + 1);
  ctx.restore();
}

export function drawLailatulQadarArc(ctx, cx, cy, w, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;

  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -t * 36;
  ctx.beginPath();
  ctx.moveTo(x0, cy);
  ctx.quadraticCurveTo(cx, cy - 170 * p, x1, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  roundRectPath(ctx, cx - 260, cy - 135, 520, 74, 37);
  ctx.fillStyle = 'rgba(7, 25, 21, 0.92)';
  ctx.fill();
  ctx.strokeStyle = THEME.goldMedina;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '700 26px Jakarta';
  ctx.fillStyle = THEME.goldBright;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LAILATUL QADAR > 1.000 BULAN (83+ TAHUN)', cx, cy - 97);
  ctx.restore();
}

export function drawMandalaSynthesis(ctx, cx, cy, radius, labels, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;

  ctx.save();
  drawGirihRosette(ctx, cx, cy, radius * p, 12, t * 0.14, p, {
    strokeColor: THEME.goldMedina,
    accentColor: THEME.turqBright,
    alpha: 0.9,
    lineWidth: 2.6,
    glow: true,
    innerDetail: true,
  });

  labels.forEach((lbl, i) => {
    const a = t * 0.18 + (i * TAU) / labels.length - Math.PI / 2;
    const rx = cx + Math.cos(a) * radius * 0.96;
    const ry = cy + Math.sin(a) * radius * 0.96;

    const sp = easeOutBack(clamp01((p - i * 0.08) / 0.6));
    ctx.save();
    ctx.translate(rx, ry);
    ctx.scale(sp, sp);
    roundRectPath(ctx, -110, -34, 220, 68, 34);
    ctx.fillStyle = 'rgba(5, 19, 16, 0.92)';
    ctx.fill();
    ctx.strokeStyle = THEME.goldBright;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '800 24px Jakarta';
    ctx.fillStyle = THEME.goldBright;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lbl, 0, 1);
    ctx.restore();
  });

  drawBigNumberCounter(ctx, cx, cy, '700×+', 'SEDEKAH · NIAT · SABAR', p, {
    fontSize: 132,
    echoTrails: false,
  });
  ctx.restore();
}

export function drawCommentCTA(ctx, cx, cy, promptText, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  const pulse = 1 + 0.018 * Math.sin(t * 3.5);
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);

  const w = 1040;
  const h = 136;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 32);
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, 'rgba(18, 52, 43, 0.92)');
  g.addColorStop(1, 'rgba(9, 28, 24, 0.95)');
  ctx.fillStyle = g;
  ctx.shadowColor = rgba(THEME.goldMedina, 0.35);
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = THEME.goldBright;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.font = '700 24px JetBrains';
  ctx.fillStyle = THEME.turqBright;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TULIS DI KOMENTAR', 0, -28);

  ctx.font = '800 33px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText(promptText, 0, 22, w - 64);

  ctx.restore();
}

// ============================================================================
// 13. PEMBANTU GEOMETRI MIKRO & PEMANGGILAN CLI
// ============================================================================

export function drawFloatingVerseTag(ctx, cx, cy, tagText, progress) {
  const p = easeOutCubic(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.font = '700 26px JetBrains';
  const tw = ctx.measureText(tagText).width + 52;
  roundRectPath(ctx, cx - tw / 2, cy - 26, tw, 52, 26);
  ctx.fillStyle = rgba(THEME.goldMedina, 0.16);
  ctx.fill();
  ctx.strokeStyle = rgba(THEME.goldBright, 0.65);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = THEME.goldBright;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, cx, cy + 1);
  ctx.restore();
}

export function drawRadialProgressHalo(ctx, cx, cy, radius, ratio, color, lineWidth = 10) {
  ctx.save();
  ctx.strokeStyle = rgba(color, 0.18);
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.shadowColor = rgba(color, 0.55);
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + TAU * clamp01(ratio));
  ctx.stroke();
  ctx.restore();
}

export function drawSparkBurst(ctx, cx, cy, seed, count, maxR, progress, color = THEME.goldBright) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01 || p >= 0.99) return;
  const rnd = mulberry32(seed);
  ctx.save();
  const fade = Math.sin(p * Math.PI);
  for (let i = 0; i < count; i++) {
    const a = rnd() * TAU;
    const r = (0.25 + 0.75 * rnd()) * maxR * p;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const sz = 2.5 + rnd() * 4.5;
    ctx.fillStyle = rgba(color, fade * 0.85);
    ctx.beginPath();
    ctx.arc(x, y, sz * (1 - p * 0.4), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCornerFiligree(ctx, x, y, size, corner = 'tl', color = THEME.goldMedina, alpha = 0.5) {
  ctx.save();
  ctx.translate(x, y);
  const sx = corner.includes('r') ? -1 : 1;
  const sy = corner.includes('b') ? -1 : 1;
  ctx.scale(sx, sy);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(size * 0.25, size * 0.25, size * 0.14, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

export function drawFramedCalloutPill(ctx, cx, cy, label, value, color = THEME.turqBright, progress = 1) {
  const p = easeOutBack(clamp01(progress), 1.25);
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p, p);
  const w = 480;
  const h = 112;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 24);
  ctx.fillStyle = 'rgba(6, 23, 19, 0.9)';
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 22px JetBrains';
  ctx.fillStyle = color;
  ctx.fillText(label, 0, -22);
  ctx.font = '800 34px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText(value, 0, 20);
  ctx.restore();
}

export function drawVerticalDividerBeam(ctx, cx, y0, y1, color = THEME.goldMedina, alpha = 0.45) {
  ctx.save();
  const g = ctx.createLinearGradient(cx, y0, cx, y1);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.5, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.strokeStyle = g;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, y0);
  ctx.lineTo(cx, y1);
  ctx.stroke();
  ctx.restore();
}

export function drawAnimatedArrow(ctx, x0, y0, x1, y1, progress, color = THEME.goldBright, width = 4) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.02) return;
  const cx = lerp(x0, x1, p);
  const cy = lerp(y0, y1, p);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.shadowColor = rgba(color, 0.5);
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  if (p > 0.25) {
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const headLen = 18;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - headLen * Math.cos(angle - 0.45), cy - headLen * Math.sin(angle - 0.45));
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - headLen * Math.cos(angle + 0.45), cy - headLen * Math.sin(angle + 0.45));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTimelineTicks(ctx, cx, cy, w, labels, activeIndex, progress) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  drawGlowingLine(ctx, x0, cy, lerp(x0, x1, p), cy, rgba(THEME.goldMedina, 0.6), 3, 8);

  labels.forEach((lbl, idx) => {
    const tx = lerp(x0, x1, idx / Math.max(1, labels.length - 1));
    const active = idx <= activeIndex;
    ctx.fillStyle = active ? THEME.goldBright : THEME.bgEmeraldMid;
    ctx.beginPath();
    ctx.arc(tx, cy, active ? 13 : 9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = THEME.goldMedina;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = active ? '800 24px JetBrains' : '600 22px JetBrains';
    ctx.fillStyle = active ? THEME.goldBright : THEME.slateText;
    ctx.textAlign = 'center';
    ctx.fillText(lbl, tx, cy + 40);
  });
  ctx.restore();
}

export function drawDataBadgeRow(ctx, cx, cy, badges, progress) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  const w = 330;
  const gap = 30;
  const totalW = badges.length * w + (badges.length - 1) * gap;
  const sx = cx - totalW / 2;

  badges.forEach((b, i) => {
    const bp = clamp01((p - i * 0.12) / 0.6);
    drawGlassStatCard(ctx, sx + i * (w + gap), cy - 75, w, 150, b.tag, b.val, b.sub, b.color || THEME.goldMedina, bp);
  });
}

export function drawCrescentSkylineAura(ctx, cx, cy, progress, t) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  for (let i = 0; i < 4; i++) {
    const r = 140 + i * 95 + Math.sin(t * 1.1 + i) * 8;
    ctx.strokeStyle = rgba(i % 2 === 0 ? THEME.goldMedina : THEME.turqBright, 0.24 - i * 0.04);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMetricPill(ctx, cx, cy, title, val, accent, progress) {
  const p = easeOutBack(clamp01(progress), 1.2);
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p, p);
  ctx.font = '800 34px Jakarta';
  const w = Math.max(780, Math.min(1240, ctx.measureText(val).width + 120));
  const h = 112;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 56);
  ctx.fillStyle = 'rgba(7, 25, 21, 0.94)';
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.75);
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 23px JetBrains';
  ctx.fillStyle = accent;
  ctx.fillText(title, 0, -22);
  ctx.font = '800 34px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText(val, 0, 20);
  ctx.restore();
}

export function drawShatterParticles(ctx, cx, cy, progress, t, color = THEME.goldBright) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  const rnd = mulberry32(4049);
  ctx.save();
  for (let i = 0; i < 36; i++) {
    const a = rnd() * TAU;
    const dist = (40 + rnd() * 320) * easeOutExpo(p);
    const px = cx + Math.cos(a) * dist;
    const py = cy + Math.sin(a) * dist - p * 90;
    const sz = 6 + rnd() * 14;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(t * 2 + i);
    ctx.globalAlpha = (1 - p * 0.65) * 0.85;
    ctx.fillStyle = i % 3 === 0 ? THEME.turqBright : color;
    ctx.beginPath();
    ctx.moveTo(0, -sz);
    ctx.lineTo(sz * 0.7, 0);
    ctx.lineTo(0, sz);
    ctx.lineTo(-sz * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawGoldenRippleRings(ctx, cx, cy, t, color = THEME.goldMedina, maxR = 460) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.45 + i * 0.25) % 1;
    const r = lerp(70, maxR, easeOutCubic(u));
    const a = (1 - u) * 0.42;
    ctx.strokeStyle = rgba(color, a);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStarConstellation(ctx, cx, cy, spreadW, spreadH, progress, t) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  const pts = [
    [-0.42, -0.22],
    [-0.18, -0.35],
    [0.05, -0.14],
    [0.28, -0.32],
    [0.44, -0.08],
    [0.18, 0.2],
    [-0.14, 0.24],
    [-0.36, 0.08],
  ].map(([nx, ny], i) => ({
    x: cx + nx * spreadW + Math.sin(t + i) * 6,
    y: cy + ny * spreadH + Math.cos(t * 0.8 + i) * 6,
  }));

  ctx.save();
  ctx.globalAlpha = p;
  ctx.strokeStyle = rgba(THEME.turqBright, 0.35);
  ctx.lineWidth = 1.6;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  pts.forEach((pt, i) => {
    drawFourPointStar(ctx, pt.x, pt.y, 12 + (i % 3) * 4, 0.9, THEME.goldBright, t * 0.6 + i);
  });
  ctx.restore();
}

export function drawStackedCoinsTower(ctx, cx, baseY, count, coinW, progress, color = THEME.goldMedina) {
  const p = easeOutExpo(clamp01(progress));
  const visible = Math.floor(count * p);
  ctx.save();
  for (let i = 0; i < visible; i++) {
    const cy = baseY - i * 16;
    roundRectPath(ctx, cx - coinW / 2, cy - 12, coinW, 13, 6);
    const g = ctx.createLinearGradient(cx - coinW / 2, cy, cx + coinW / 2, cy);
    g.addColorStop(0, THEME.goldDeep);
    g.addColorStop(0.5, color);
    g.addColorStop(1, THEME.goldDeep);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLightEnvelopeBeam(ctx, x0, y0, x1, y1, width, progress, color = THEME.goldBright) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  const ex = lerp(x0, x1, easeOutExpo(p));
  const ey = lerp(y0, y1, easeOutExpo(p));
  ctx.save();
  const g = ctx.createLinearGradient(x0, y0, ex, ey);
  g.addColorStop(0, rgba(color, 0.1));
  g.addColorStop(0.65, rgba(color, 0.65));
  g.addColorStop(1, '#FFFFFF');
  ctx.strokeStyle = g;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  drawFourPointStar(ctx, ex, ey, width * 2.4, 0.95, '#FFFFFF');
  ctx.restore();
}

export function drawHaloArchText(ctx, cx, cy, topText, bottomText, progress, color = THEME.goldBright) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 44px Jakarta';
  ctx.fillStyle = color;
  ctx.fillText(topText, cx, cy - 28);
  ctx.font = '600 28px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText(bottomText, cx, cy + 26);
  ctx.restore();
}

export function drawRotatingAstrolabe(ctx, cx, cy, radius, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p, p);
  ctx.globalAlpha = 0.85 * p;

  // Outer degree bezel
  ctx.strokeStyle = rgba(THEME.goldMedina, 0.7);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();

  for (let d = 0; d < 72; d++) {
    const a = (d * TAU) / 72;
    const len = d % 6 === 0 ? 16 : 8;
    ctx.strokeStyle = d % 6 === 0 ? THEME.goldBright : rgba(THEME.goldMedina, 0.45);
    ctx.lineWidth = d % 6 === 0 ? 2.4 : 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (radius - len), Math.sin(a) * (radius - len));
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    ctx.stroke();
  }

  // Rotating rete ring
  ctx.save();
  ctx.rotate(t * 0.25);
  ctx.strokeStyle = rgba(THEME.turqBright, 0.65);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, -radius * 0.16, radius * 0.62, 0, TAU);
  ctx.stroke();
  drawRubElHizb(ctx, 0, 0, radius * 0.48, -t * 0.4, THEME.goldBright, 2);
  ctx.restore();

  // Alidade pointer bar
  ctx.save();
  ctx.rotate(-t * 0.18);
  drawGlowingLine(ctx, -radius * 0.92, 0, radius * 0.92, 0, THEME.goldMedina, 2.5, 10);
  ctx.restore();

  ctx.restore();
}

export function drawGlowingDividerPill(ctx, cx, cy, text, accent = THEME.turqBright, progress = 1) {
  const p = easeOutCubic(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.font = '700 24px JetBrains';
  const w = ctx.measureText(text).width + 60;
  roundRectPath(ctx, cx - w / 2, cy - 25, w, 50, 25);
  ctx.fillStyle = 'rgba(5, 19, 16, 0.92)';
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.72);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

export function drawDualMetricSplit(ctx, cx, cy, left, right, progress) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  const w = 520;
  const h = 210;
  const gap = 46;
  drawGlassStatCard(ctx, cx - w - gap / 2, cy - h / 2, w, h, left.tag, left.val, left.sub, left.color, p);
  drawGlassStatCard(ctx, cx + gap / 2, cy - h / 2, w, h, right.tag, right.val, right.sub, right.color, clamp01((p - 0.12) / 0.88));
}

export function drawKineticBadgeCluster(ctx, cx, cy, items, progress, t) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  items.forEach((item, i) => {
    const ip = easeOutBack(clamp01((p - i * 0.12) / 0.55));
    if (ip <= 0.01) return;
    const x = cx + item.dx;
    const y = cy + item.dy + Math.sin(t * 1.6 + i) * 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(ip, ip);
    roundRectPath(ctx, -185, -48, 370, 96, 24);
    ctx.fillStyle = 'rgba(7, 25, 21, 0.9)';
    ctx.fill();
    ctx.strokeStyle = rgba(item.color || THEME.goldMedina, 0.65);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 30px Cinzel';
    ctx.fillStyle = item.color || THEME.goldBright;
    ctx.fillText(item.val, 0, -14);
    ctx.font = '600 22px Jakarta';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(item.label, 0, 22);
    ctx.restore();
  });
}

export function drawScrollBanner(ctx, cx, cy, w, h, title, body, progress) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  const cw = w * p;
  roundRectPath(ctx, cx - cw / 2, cy - h / 2, cw, h, 26);
  ctx.fillStyle = 'rgba(10, 32, 26, 0.88)';
  ctx.fill();
  ctx.strokeStyle = THEME.goldMedina;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (p > 0.45) {
    ctx.globalAlpha = clamp01((p - 0.45) / 0.55);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 25px JetBrains';
    ctx.fillStyle = THEME.turqBright;
    ctx.fillText(title, cx, cy - 24);
    ctx.font = '700 32px Jakarta';
    ctx.fillStyle = THEME.ivory;
    ctx.fillText(body, cx, cy + 20, w - 60);
  }
  ctx.restore();
}

export function drawOrbitalParticleStream(ctx, cx, cy, radiusX, radiusY, count, t, color = THEME.goldBright) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const a = t * 0.9 + (i * TAU) / count;
    const x = cx + Math.cos(a) * radiusX;
    const y = cy + Math.sin(a) * radiusY;
    const alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(a));
    ctx.fillStyle = rgba(color, alpha);
    ctx.beginPath();
    ctx.arc(x, y, 3.2 + (i % 3), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawMultiRingHalo(ctx, cx, cy, baseR, rings, progress, t) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < rings; i++) {
    const r = (baseR + i * 54) * p;
    ctx.save();
    ctx.rotate(t * (i % 2 === 0 ? 0.25 : -0.2) + i);
    ctx.strokeStyle = rgba(i % 2 === 0 ? THEME.goldMedina : THEME.turqBright, 0.35 - i * 0.05);
    ctx.lineWidth = 2;
    ctx.setLineDash([28, 16]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawVerticalBeamPillar(ctx, cx, topY, botY, w, progress, color = THEME.goldBright, label = '') {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  const h = (botY - topY) * p;
  const g = ctx.createLinearGradient(cx, botY - h, cx, botY);
  g.addColorStop(0, rgba(color, 0.85));
  g.addColorStop(0.6, rgba(color, 0.28));
  g.addColorStop(1, rgba(color, 0.04));
  roundRectPath(ctx, cx - w / 2, botY - h, w, h, 28);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.7);
  ctx.lineWidth = 2.2;
  ctx.stroke();

  if (label && p > 0.5) {
    ctx.globalAlpha = clamp01((p - 0.5) / 0.5);
    ctx.font = '800 32px Cinzel';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, botY - h + 44);
  }
  ctx.restore();
}

export function drawEquationTransform(ctx, cx, cy, leftEq, rightEq, progress, t) {
  const p = clamp01(progress);
  if (p <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);

  const leftExit = clamp01(invLerp(0.32, 0.55, p));
  const rightEnter = easeOutBack(clamp01(invLerp(0.38, 0.72, p)), 1.3);

  // Left equation (Human math)
  if (leftExit < 0.99) {
    ctx.save();
    ctx.globalAlpha = 1 - leftExit;
    ctx.translate(0, -leftExit * 60);
    ctx.scale(1 - leftExit * 0.25, 1 - leftExit * 0.25);
    roundRectPath(ctx, -340, -105, 680, 210, 32);
    ctx.fillStyle = 'rgba(12, 28, 25, 0.85)';
    ctx.fill();
    ctx.strokeStyle = rgba(THEME.slateText, 0.45);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 24px JetBrains';
    ctx.fillStyle = THEME.slateText;
    ctx.fillText('MATEMATIKA MANUSIA', 0, -56);

    ctx.font = '800 84px Cinzel';
    ctx.fillStyle = THEME.ivoryMuted;
    ctx.fillText(leftEq, 0, 20);
    ctx.restore();
  }

  // Right equation (Islamic math 1 -> 700x -> ∞)
  if (rightEnter > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp01(rightEnter);
    ctx.scale(rightEnter, rightEnter);

    drawMultiRingHalo(ctx, 0, 0, 220, 3, clamp01(rightEnter), t);
    drawBigNumberCounter(ctx, 0, -10, rightEq, 'PAHALA DILIPATGANDAKAN', clamp01(rightEnter), {
      fontSize: 168,
      echoTrails: true,
    });
    ctx.restore();
  }

  ctx.restore();
}

export function drawGoldenStarburst(ctx, cx, cy, rays, minR, maxR, t, color = THEME.goldBright, alpha = 0.35) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.08);
  ctx.globalAlpha = alpha;
  for (let i = 0; i < rays; i++) {
    const a = (i * TAU) / rays;
    const len = maxR * (0.75 + 0.25 * Math.sin(t * 1.5 + i));
    const g = ctx.createLinearGradient(Math.cos(a) * minR, Math.sin(a) * minR, Math.cos(a) * len, Math.sin(a) * len);
    g.addColorStop(0, color);
    g.addColorStop(1, rgba(color, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * minR, Math.sin(a) * minR);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawVerticalStepCard(ctx, cx, cy, w, h, stepNum, heading, detail, accent, progress) {
  const p = easeOutExpo(clamp01(progress));
  if (p <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 28;
  roundRectPath(ctx, cx - w / 2, cy - h / 2 + dy, w, h, 26);
  ctx.fillStyle = 'rgba(7, 26, 21, 0.9)';
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.65);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Step number medallion
  roundRectPath(ctx, cx - w / 2 + 28, cy - 36 + dy, 72, 72, 20);
  ctx.fillStyle = rgba(accent, 0.2);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '800 32px Cinzel';
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stepNum, cx - w / 2 + 64, cy + 1 + dy);

  ctx.textAlign = 'left';
  ctx.font = '800 30px Jakarta';
  ctx.fillStyle = THEME.ivory;
  ctx.fillText(heading, cx - w / 2 + 124, cy - 18 + dy);

  ctx.font = '500 24px Jakarta';
  ctx.fillStyle = THEME.ivoryMuted;
  ctx.fillText(detail, cx - w / 2 + 124, cy + 20 + dy);
  ctx.restore();
}

export function drawShimmerSweepRect(ctx, x, y, w, h, r, t, color = '#FFFFFF') {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  const sx = x - 180 + ((t * 280) % (w + 360));
  const g = ctx.createLinearGradient(sx - 90, y, sx + 90, y + h);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.5, rgba(color, 0.14));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ============================================================================
// 14. ENTRYPOINT CLI
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
      renderSingleFrame(ctx, timeline, sceneRenderers, helpers, sc.startFrame + Math.round(sc.durationFrames * 0.55));
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
