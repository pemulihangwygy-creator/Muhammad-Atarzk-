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
// 1. EDITORIAL PALETTE & DETERMINISTIC EASING
// ============================================================================
export const PALETTE = {
  bgObsidian: '#0A0B0E',
  bgCharcoal: '#121318',
  bgPanel: '#16181F',
  bgCardDark: '#12141B',
  cream: '#F4EFE6',
  ivory: '#EFECE6',
  ivoryDark: '#DDD8CD',
  inkDark: '#15161A',
  inkMuted: '#686A72',
  amber: '#F59E0B',
  amberGlow: '#FBBF24',
  amberSoft: '#FCD34D',
  crimson: '#E84C3D',
  crimsonDeep: '#B91C1C',
  teal: '#2DD4BF',
  emerald: '#10B981',
  sky: '#38BDF8',
  mutedText: 'rgba(244, 239, 230, 0.42)',
  subtleBorder: 'rgba(255, 255, 255, 0.08)',
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

export function drawMicroPill(ctx, cx, cy, label, opts = {}) {
  const {
    dotColor = PALETTE.amber,
    bg = 'rgba(18, 20, 26, 0.92)',
    stroke = 'rgba(255, 255, 255, 0.14)',
    textColor = PALETTE.cream,
    font = '700 22px JetMono',
    padX = 24,
    height = 50,
    reveal = 1,
    align = 'center',
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return null;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.font = font;
  const tw = ctx.measureText(label).width;
  const dotSpace = dotColor ? 22 : 0;
  const w = tw + padX * 2 + dotSpace;
  const x = align === 'left' ? cx : align === 'right' ? cx - w : cx - w / 2;
  const y = cy - height / 2 + (1 - p) * 12;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  roundRectPath(ctx, x, y, w, height, 10);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  let textStart = x + padX;
  if (dotColor) {
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(x + padX + 5, y + height / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    textStart += dotSpace;
  }

  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, textStart, y + height / 2 + 1);
  ctx.restore();
  return { x, y, w, h: height };
}

export function drawCornerBadge(ctx, x, y, label, opts = {}) {
  const {
    bg = PALETTE.crimson,
    textColor = '#FFFFFF',
    font = '800 24px JetMono',
    padX = 18,
    height = 44,
    radius = 8,
  } = opts;
  ctx.save();
  ctx.font = font;
  const tw = ctx.measureText(label).width;
  const w = tw + padX * 2;
  roundRectPath(ctx, x - w, y, w, height, radius);
  ctx.fillStyle = bg;
  ctx.shadowColor = 'rgba(232, 76, 61, 0.35)';
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x - w / 2, y + height / 2 + 1);
  ctx.restore();
}

export function drawRectRubberStamp(ctx, cx, cy, label, opts = {}) {
  const {
    color = PALETTE.crimson,
    angle = -0.14,
    reveal = 1,
    font = '800 34px PlusJakarta',
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;
  const scale = 1.42 - 0.42 * p;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  ctx.font = font;
  const tw = ctx.measureText(label).width;
  const w = tw + 44;
  const h = 68;

  roundRectPath(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fillStyle = 'rgba(232, 76, 61, 0.09)';
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
// 2. ATMOSPHERIC BACKDROPS (MATCHING CPI - NAYSI REFERENCE)
// ============================================================================

/**
 * Dusk Cityscape & Mosque Domes Silhouette with Warm Amber Haze & Diagonal Rain Streaks.
 */
export function drawTwilightSkylineBackdrop(ctx, localSec = 0, opts = {}) {
  const { rainIntensity = 1, horizonGlow = 1 } = opts;
  ctx.save();

  // Deep atmospheric twilight sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#09090C');
  sky.addColorStop(0.32, '#131116');
  sky.addColorStop(0.56, '#2A1D18');
  sky.addColorStop(0.70, '#0C0B0E');
  sky.addColorStop(1, '#08080A');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Warm ambient horizon haze
  const haze = ctx.createRadialGradient(WIDTH / 2, 1180, 40, WIDTH / 2, 1180, 820);
  haze.addColorStop(0, `rgba(217, 119, 6, ${0.26 * horizonGlow})`);
  haze.addColorStop(0.55, `rgba(120, 53, 15, ${0.14 * horizonGlow})`);
  haze.addColorStop(1, 'rgba(8, 8, 10, 0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 540, WIDTH, 1150);

  // Distant Skyline Silhouette (Buildings + Minaret Domes)
  const baseY = 1660;
  const buildings = [
    { x: -20, w: 120, h: 460 },
    { x: 105, w: 110, h: 380 },
    { x: 220, w: 145, h: 520, dome: true },
    { x: 375, w: 105, h: 410 },
    { x: 488, w: 165, h: 490 },
    { x: 660, w: 150, h: 560, minaret: true },
    { x: 818, w: 140, h: 455 },
    { x: 965, w: 135, h: 510, dome: true },
    { x: 1108, w: 118, h: 390 },
    { x: 1232, w: 140, h: 485 },
    { x: 1378, w: 95, h: 430 },
  ];

  // Silhouette layer 1 (distant haze)
  buildings.forEach((b, bi) => {
    ctx.fillStyle = '#181414';
    ctx.fillRect(b.x, baseY - b.h, b.w, b.h + 120);
    if (b.dome) {
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, baseY - b.h, b.w * 0.38, Math.PI, 0);
      ctx.fill();
    }
    if (b.minaret) {
      ctx.fillRect(b.x + b.w * 0.42, baseY - b.h - 110, 22, 110);
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.42 - 6, baseY - b.h - 110);
      ctx.lineTo(b.x + b.w * 0.42 + 11, baseY - b.h - 148);
      ctx.lineTo(b.x + b.w * 0.42 + 28, baseY - b.h - 110);
      ctx.closePath();
      ctx.fill();
    }

    // Tiny lit amber windows
    for (let wy = baseY - b.h + 38; wy < baseY - 120; wy += 36) {
      for (let wx = b.x + 18; wx < b.x + b.w - 22; wx += 26) {
        const hash = ((bi * 31 + wx * 17 + wy * 13) % 19);
        if (hash < 4) {
          const flicker = 0.45 + 0.35 * Math.sin(localSec * 1.8 + hash);
          ctx.fillStyle = hash === 0
            ? `rgba(251, 146, 60, ${0.75 * flicker})`
            : `rgba(253, 224, 71, ${0.42 * flicker})`;
          ctx.fillRect(wx, wy, 10, 12);
        }
      }
    }
  });

  // Elevated overpass bridge silhouette (exact moody cinematic depth)
  ctx.fillStyle = '#0D0C0E';
  ctx.fillRect(0, 1340, WIDTH, 36);
  for (let px = 140; px < WIDTH; px += 340) {
    ctx.fillRect(px, 1376, 26, 280);
  }

  // Bottom dark fade floor for crisp captions
  const floor = ctx.createLinearGradient(0, 1440, 0, HEIGHT);
  floor.addColorStop(0, 'rgba(8, 8, 10, 0)');
  floor.addColorStop(0.45, 'rgba(8, 8, 10, 0.88)');
  floor.addColorStop(1, '#08080A');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 1440, WIDTH, HEIGHT - 1440);

  // Diagonal falling rain streaks
  if (rainIntensity > 0.05) {
    ctx.strokeStyle = `rgba(244, 239, 230, ${0.09 * rainIntensity})`;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 95; i++) {
      const seedX = ((i * 197 + 41) % WIDTH);
      const speed = 640 + (i % 7) * 90;
      const len = 65 + (i % 5) * 32;
      const y = ((i * 251 + localSec * speed) % (HEIGHT + 200)) - 100;
      const x = (seedX - y * 0.14 + WIDTH * 2) % WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * 0.14, y + len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Obsidian Blueprint Grid Backdrop with Subtle Center Warmth & Floating Motes.
 */
export function drawBlueprintGridBackdrop(ctx, localSec = 0, opts = {}) {
  const { glowColor = 'rgba(245, 158, 11, 0.14)', gridAlpha = 0.045 } = opts;
  ctx.save();
  ctx.fillStyle = '#090A0D';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle blueprint grid
  ctx.strokeStyle = `rgba(255, 255, 255, ${gridAlpha})`;
  ctx.lineWidth = 1.5;
  const step = 72;
  for (let x = 0; x <= WIDTH; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // Center radial glow
  const rg = ctx.createRadialGradient(WIDTH / 2, 1040, 30, WIDTH / 2, 1040, 740);
  rg.addColorStop(0, glowColor);
  rg.addColorStop(0.55, 'rgba(20, 22, 28, 0.30)');
  rg.addColorStop(1, 'rgba(9, 10, 13, 0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Fine drifting dust motes
  for (let i = 0; i < 28; i++) {
    const mx = ((i * 233 + Math.sin(localSec * 0.4 + i) * 35) % WIDTH + WIDTH) % WIDTH;
    const my = ((i * 191 - localSec * (12 + (i % 4) * 5)) % HEIGHT + HEIGHT) % HEIGHT;
    ctx.fillStyle = `rgba(244, 239, 230, ${0.10 + (i % 3) * 0.04})`;
    ctx.beginPath();
    ctx.arc(mx, my, 1.8 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Illustrated Vector Geography Backdrop (Ochre Landmasses, Deep Strait Channel, Mountain Peaks).
 */
export function drawSilkRoadTerrainBackdrop(ctx, localSec = 0) {
  ctx.save();
  // Deep ocean / strait background
  const sea = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sea.addColorStop(0, '#0B2330');
  sea.addColorStop(0.5, '#0F3344');
  sea.addColorStop(1, '#090A0D');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle horizontal sea contour lines
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.06)';
  ctx.lineWidth = 2;
  for (let y = 420; y < 1760; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(localSec * 0.7 + y * 0.03) * 4);
    ctx.lineTo(WIDTH, y - Math.sin(localSec * 0.7 + y * 0.03) * 4);
    ctx.stroke();
  }

  // Top-Left Arabia / Madinah Landmass (warm desert ochre)
  ctx.fillStyle = '#9F7A48';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(WIDTH, 0);
  ctx.lineTo(WIDTH, 560);
  ctx.lineTo(1180, 620);
  ctx.lineTo(880, 520);
  ctx.lineTo(540, 645);
  ctx.lineTo(240, 595);
  ctx.lineTo(0, 680);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#C9A063';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 680);
  ctx.lineTo(240, 595);
  ctx.lineTo(540, 645);
  ctx.lineTo(880, 520);
  ctx.lineTo(1180, 620);
  ctx.lineTo(WIDTH, 560);
  ctx.stroke();

  // Bottom-Right Daratan Cina Landmass
  ctx.fillStyle = '#A8824E';
  ctx.beginPath();
  ctx.moveTo(0, 1490);
  ctx.lineTo(310, 1410);
  ctx.lineTo(660, 1445);
  ctx.lineTo(960, 1340);
  ctx.lineTo(1230, 1295);
  ctx.lineTo(WIDTH, 1320);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#D1A96E';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 1490);
  ctx.lineTo(310, 1410);
  ctx.lineTo(660, 1445);
  ctx.lineTo(960, 1340);
  ctx.lineTo(1230, 1295);
  ctx.lineTo(WIDTH, 1320);
  ctx.stroke();

  // Geometric Vector Mountain Peaks on Landmasses
  const peaks = [
    { x: 430, y: 420, w: 170, h: 165, a: 0.22 },
    { x: 560, y: 430, w: 210, h: 190, a: 0.30 },
    { x: 740, y: 405, w: 145, h: 140, a: 0.20 },
    { x: 140, y: 1680, w: 220, h: 195, a: 0.26 },
    { x: 310, y: 1710, w: 160, h: 145, a: 0.18 },
    { x: 960, y: 1580, w: 190, h: 170, a: 0.24 },
  ];
  peaks.forEach((pk) => {
    ctx.fillStyle = `rgba(38, 26, 12, ${pk.a})`;
    ctx.beginPath();
    ctx.moveTo(pk.x - pk.w / 2, pk.y);
    ctx.lineTo(pk.x, pk.y - pk.h);
    ctx.lineTo(pk.x + pk.w / 2, pk.y);
    ctx.closePath();
    ctx.fill();
  });

  // Top & Bottom Cinematic Vignettes
  const topFade = ctx.createLinearGradient(0, 0, 0, 380);
  topFade.addColorStop(0, 'rgba(9, 10, 13, 0.92)');
  topFade.addColorStop(1, 'rgba(9, 10, 13, 0)');
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, WIDTH, 380);

  const botFade = ctx.createLinearGradient(0, 1520, 0, HEIGHT);
  botFade.addColorStop(0, 'rgba(9, 10, 13, 0)');
  botFade.addColorStop(0.45, 'rgba(9, 10, 13, 0.90)');
  botFade.addColorStop(1, '#090A0D');
  ctx.fillStyle = botFade;
  ctx.fillRect(0, 1520, WIDTH, HEIGHT - 1520);

  // Subtle region labels
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = 'rgba(28, 22, 14, 0.65)';
  ctx.textAlign = 'left';
  ctx.fillText('MADINAH · JAZIRAH ARAB', 130, 320);
  ctx.textAlign = 'right';
  ctx.fillText('JALUR SUTRA · DARATAN CINA', WIDTH - 130, 1560);
  ctx.restore();
}

/**
 * Theatrical Overhead Spotlight Cone on Dark Textured Stage Backdrop (ref_44s & ref_50s).
 */
export function drawSpotlightStageBackdrop(ctx, localSec = 0, opts = {}) {
  const { coneColor = 'rgba(217, 179, 130, 0.13)', floorY = 1660 } = opts;
  ctx.save();
  ctx.fillStyle = '#0A0908';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle vertical stage drapery/wall lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 2;
  for (let x = 60; x < WIDTH; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, floorY);
    ctx.stroke();
  }

  // Conical overhead spotlight beam
  const coneGrad = ctx.createLinearGradient(WIDTH / 2, 0, WIDTH / 2, floorY);
  coneGrad.addColorStop(0, 'rgba(244, 239, 230, 0.17)');
  coneGrad.addColorStop(0.45, coneColor);
  coneGrad.addColorStop(1, 'rgba(217, 179, 130, 0.03)');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 190, 0);
  ctx.lineTo(WIDTH / 2 + 190, 0);
  ctx.lineTo(WIDTH / 2 + 640, floorY);
  ctx.lineTo(WIDTH / 2 - 640, floorY);
  ctx.closePath();
  ctx.fill();

  // Stage horizon line + elliptical lit floor pool
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(WIDTH, floorY);
  ctx.stroke();

  const pool = ctx.createRadialGradient(WIDTH / 2, floorY + 20, 20, WIDTH / 2, floorY + 20, 560);
  pool.addColorStop(0, 'rgba(245, 200, 140, 0.16)');
  pool.addColorStop(0.6, 'rgba(245, 200, 140, 0.05)');
  pool.addColorStop(1, 'rgba(10, 9, 8, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(WIDTH / 2, floorY + 20, 560, 110, 0, 0, Math.PI * 2);
  ctx.fill();

  // Floating dust specks inside beam
  for (let i = 0; i < 24; i++) {
    const t = (localSec * 0.25 + i * 0.13) % 1;
    const dx = WIDTH / 2 + Math.sin(i * 7 + localSec * 0.6) * (140 + t * 280);
    const dy = 120 + t * (floorY - 180);
    ctx.fillStyle = `rgba(253, 230, 138, ${0.18 * Math.sin(t * Math.PI)})`;
    ctx.beginPath();
    ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Sunset Sky Gradient + Layered Bokeh Clouds Backdrop (ref_38s).
 */
export function drawSunsetHorizonCloudsBackdrop(ctx, localSec = 0) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#0E0A14');
  sky.addColorStop(0.28, '#2C1528');
  sky.addColorStop(0.56, '#7C3626');
  sky.addColorStop(0.76, '#B4692B');
  sky.addColorStop(0.88, '#211812');
  sky.addColorStop(1, '#090A0D');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Soft layered bokeh vector clouds
  const clouds = [
    { x: 240, y: 540, s: 1.0, speed: 12 },
    { x: 1180, y: 660, s: 1.15, speed: -9 },
    { x: 420, y: 1120, s: 1.45, speed: 16 },
    { x: 1060, y: 1320, s: 1.10, speed: -14 },
  ];
  clouds.forEach((c) => {
    const cx = c.x + Math.sin(localSec * 0.4) * c.speed;
    const puffs = [
      [-65, 10, 42], [-25, -18, 56], [30, -14, 52], [75, 14, 38], [0, 22, 48],
    ];
    puffs.forEach(([px, py, pr]) => {
      ctx.fillStyle = 'rgba(255, 240, 225, 0.14)';
      ctx.beginPath();
      ctx.arc(cx + px * c.s, c.y + py * c.s, pr * c.s, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Lower dark caption floor
  const floor = ctx.createLinearGradient(0, 1520, 0, HEIGHT);
  floor.addColorStop(0, 'rgba(9, 10, 13, 0)');
  floor.addColorStop(0.45, 'rgba(9, 10, 13, 0.88)');
  floor.addColorStop(1, '#090A0D');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 1520, WIDTH, HEIGHT - 1520);
  ctx.restore();
}

// ============================================================================
// 3. TANGIBLE 2D OBJECT & MOTION-GRAPHICS RENDERERS
// ============================================================================

/**
 * Sleek Dark LED Quote Board (like the gas price LED board in ref_02s / ref_08s).
 */
export function drawDigitalQuoteBoard(ctx, cx, cy, w, h, opts = {}) {
  const {
    tag = 'VIRAL · MEDIA SOSIAL',
    quote = '"Tuntutlah ilmu ke negeri Cina"',
    sub = 'TANPA SANAD SHAHIH',
    badge = 'PALSU',
    tilt = -0.025,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy + (1 - p) * 28);
  ctx.rotate(tilt);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 16;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 22);
  const bg = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  bg.addColorStop(0, '#161920');
  bg.addColorStop(1, '#0D0F14');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Top-left dot + tag
  ctx.fillStyle = PALETTE.amber;
  ctx.beginPath();
  ctx.arc(-w / 2 + 46, -h / 2 + 48, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.65)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, -w / 2 + 66, -h / 2 + 49);

  if (badge) {
    drawCornerBadge(ctx, w / 2 - 28, -h / 2 + 26, badge, { bg: PALETTE.crimson });
  }

  // Glowing Amber LED Quote
  ctx.save();
  ctx.shadowColor = 'rgba(245, 158, 11, 0.42)';
  ctx.shadowBlur = 22;
  ctx.font = '800 48px PlusJakarta';
  ctx.fillStyle = PALETTE.amberGlow;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  drawWrappedText(ctx, quote, -w / 2 + 44, -h / 2 + 88, w - 88, 58, { align: 'left', maxLines: 2 });
  ctx.restore();

  // Sub label
  ctx.font = '600 22px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.48)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(sub, -w / 2 + 44, h / 2 - 24);
  ctx.restore();
}

/**
 * Crisp Ivory Paper Slip / Boarding Pass / Kitab Card with Perforation, Barcode & Stamp (ref_08s & ref_38s).
 */
export function drawIvoryPaperSlip(ctx, cx, cy, w, h, opts = {}) {
  const {
    eyebrow = 'KUTIPAN POPULER',
    headline = '"Cinta tanah air sebagian dari iman"',
    struckClaim = 'DIKLAIM HADITS',
    verdict = 'TIDAK ADA SANAD',
    badge = 'PALSU',
    metaRightTop = 'NO. 02',
    metaRightBot = 'AL-MASHNU\' 106',
    barcode = true,
    stampText = '',
    stampReveal = 0,
    tilt = 0,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy + (1 - p) * 28);
  ctx.rotate(tilt);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 14;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 20);
  const paper = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  paper.addColorStop(0, '#F5F2EB');
  paper.addColorStop(1, '#E6E1D5');
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Perforated vertical stub divider on the right if barcode is enabled
  const stubX = barcode ? w / 2 - 255 : w / 2 - 44;
  if (barcode) {
    ctx.save();
    ctx.setLineDash([7, 8]);
    ctx.strokeStyle = 'rgba(21, 22, 26, 0.22)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(stubX, -h / 2 + 22);
    ctx.lineTo(stubX, h / 2 - 22);
    ctx.stroke();
    ctx.restore();

    // Right stub metadata + crisp vector barcode
    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(metaRightTop, stubX + 127, -h / 2 + 32);

    const barStartX = stubX + 34;
    const barY = -h / 2 + 76;
    const barH = 74;
    ctx.fillStyle = '#1E1F24';
    for (let bx = 0; bx < 186; bx += 7) {
      const bw = ((bx * 13) % 4) + 1.8;
      if ((bx * 7) % 11 !== 0) {
        ctx.fillRect(barStartX + bx, barY, bw, barH);
      }
    }

    ctx.font = '700 18px JetMono';
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textBaseline = 'bottom';
    ctx.fillText(metaRightBot, stubX + 127, h / 2 - 26);
  } else if (badge) {
    drawCornerBadge(ctx, w / 2 - 26, -h / 2 + 24, badge, { bg: PALETTE.crimson });
  }

  // Left main ticket body
  const leftX = -w / 2 + 42;
  const maxContentW = (barcode ? stubX : w / 2 - 160) - leftX - 24;

  ctx.font = '700 21px JetMono';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(eyebrow, leftX, -h / 2 + 30);

  ctx.font = '800 35px PlusJakarta';
  ctx.fillStyle = PALETTE.inkDark;
  drawWrappedText(ctx, headline, leftX, -h / 2 + 66, maxContentW, 44, { align: 'left', maxLines: 2 });

  // Strikethrough false claim + crisp verdict
  if (struckClaim) {
    ctx.font = '700 24px JetMono';
    ctx.fillStyle = '#7C7E86';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    const sy = h / 2 - 66;
    ctx.fillText(struckClaim, leftX, sy);
    const sw = ctx.measureText(struckClaim).width;
    ctx.strokeStyle = PALETTE.crimson;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(leftX - 4, sy - 13);
    ctx.lineTo(leftX + sw + 4, sy - 13);
    ctx.stroke();
  }

  ctx.font = '800 32px PlusJakarta';
  ctx.fillStyle = PALETTE.crimsonDeep;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(verdict, leftX, h / 2 - 24);

  if (stampText && stampReveal > 0.02) {
    drawRectRubberStamp(ctx, stubX - 185, 58, stampText, {
      reveal: stampReveal,
      angle: -0.10,
      font: '800 28px PlusJakarta',
    });
  }
  ctx.restore();
}

/**
 * Precision Rotating Tick-Dial Hero Display (`SANAD` — matching `CPI` in ref_14s & ref_20s).
 */
export function drawPrecisionDialHero(ctx, cx, cy, opts = {}) {
  const {
    heroText = 'SANAD',
    subtitle = 'RANTAI PERAWI BERSAMBUNG',
    arabic = 'الإِسْنَادُ مِنَ الدِّينِ',
    orbitPills = [],
    formulaLabel = '',
    formulaLeft = '',
    formulaNum = '',
    formulaDen = '',
    formulaRight = '',
    formulaReveal = 0,
    phase = 0,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;

  // Rotating concentric tick-dial rings
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(phase * 0.15);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 325, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(0, 0, 265, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const r1 = isMajor ? 286 : 298;
    const r2 = 318;
    ctx.strokeStyle = isMajor ? 'rgba(245, 158, 11, 0.65)' : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = isMajor ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();

  // Huge Vertical Gradient Hero Typography (`SANAD`)
  ctx.save();
  const textGrad = ctx.createLinearGradient(0, cy - 120, 0, cy + 75);
  textGrad.addColorStop(0, '#FFFDF9');
  textGrad.addColorStop(0.55, '#F9E6C4');
  textGrad.addColorStop(1, '#F59E0B');

  ctx.shadowColor = 'rgba(245, 158, 11, 0.30)';
  ctx.shadowBlur = 42;
  ctx.font = '800 185px PlusJakarta';
  ctx.fillStyle = textGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(heroText, cx, cy - 22);
  ctx.restore();

  // Horizontal amber hairline divider
  ctx.strokeStyle = PALETTE.amber;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx - 250, cy + 72);
  ctx.lineTo(cx + 250, cy + 72);
  ctx.stroke();

  // Crisp spaced subtitle
  ctx.font = '700 26px JetMono';
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(subtitle, cx, cy + 92);

  if (arabic) {
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 44px Amiri';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.90)';
    ctx.textBaseline = 'top';
    ctx.fillText(arabic, cx, cy + 132);
    ctx.restore();
  }

  // Orbiting micro-pills
  orbitPills.forEach((op) => {
    drawMicroPill(ctx, op.x, op.y, op.label, {
      dotColor: op.color || PALETTE.amber,
      reveal: op.reveal ?? 1,
    });
  });

  // Clean Equation / Formula Box below (exact ref_20s look!)
  const fp = clamp01(formulaReveal);
  if (fp > 0.02 && formulaLabel) {
    const fw = WIDTH - 200;
    const fh = 185;
    const fx = (WIDTH - fw) / 2;
    const fy = cy + 370 + (1 - fp) * 20;

    ctx.save();
    ctx.globalAlpha *= fp;
    roundRectPath(ctx, fx, fy, fw, fh, 18);
    ctx.fillStyle = 'rgba(16, 18, 24, 0.90)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.amber;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(formulaLabel, fx + 40, fy + 26);

    ctx.font = '800 44px PlusJakarta';
    ctx.fillStyle = PALETTE.cream;
    ctx.textBaseline = 'middle';
    ctx.fillText(formulaLeft, fx + 40, fy + 114);

    // Fraction numerator / denominator
    const fracCx = fx + 455;
    ctx.font = '600 28px PlusJakarta';
    ctx.fillStyle = '#F4EFE6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formulaNum, fracCx, fy + 105);

    ctx.strokeStyle = 'rgba(244, 239, 230, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fracCx - 235, fy + 114);
    ctx.lineTo(fracCx + 235, fy + 114);
    ctx.stroke();

    ctx.fillStyle = '#F87171';
    ctx.textBaseline = 'top';
    ctx.fillText(formulaDen, fracCx, fy + 123);

    ctx.font = '800 32px JetMono';
    ctx.fillStyle = PALETTE.amber;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(formulaRight, fx + fw - 40, fy + 114);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Illustrated 2D Camel Silhouette + Route + Fracture Flare + Telemetry Card (ref_26s & ref_32s).
 */
export function drawSilkRoadCaravanAndPin(ctx, opts = {}) {
  const {
    caravanProg = 1,
    flareReveal = 1,
    cardReveal = 1,
    badgeReveal = 1,
    localSec = 0,
  } = opts;

  ctx.save();

  // Route curve across the strait from Madinah (260, 620) -> Cina (1140, 1260)
  const pts = [
    [250, 620],
    [520, 740],
    [760, 910],
    [980, 1080],
    [1160, 1250],
  ];

  // Dashed sea/land silk road path
  ctx.save();
  ctx.setLineDash([14, 12]);
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();
  ctx.restore();

  // Stylized Madinah Mosque Dome Pin (Top-Left)
  ctx.save();
  ctx.translate(230, 585);
  ctx.fillStyle = '#065F46';
  ctx.beginPath();
  ctx.arc(0, 0, 34, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-34, 0, 68, 22);
  ctx.fillStyle = '#EAB308';
  ctx.fillRect(40, -34, 12, 56);
  ctx.restore();

  // Stylized Chinese Pagoda Silhouette (Bottom-Right)
  ctx.save();
  ctx.translate(1185, 1265);
  ctx.fillStyle = '#991B1B';
  for (let tier = 0; tier < 3; tier++) {
    const tw = 74 - tier * 16;
    const ty = -tier * 24;
    ctx.beginPath();
    ctx.moveTo(-tw / 2, ty);
    ctx.lineTo(0, ty - 18);
    ctx.lineTo(tw / 2, ty);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-tw * 0.28, ty, tw * 0.56, 12);
  }
  ctx.restore();

  // Glowing Fracture Flame / Conflict Point in the Strait (center-right, exact ref_26s flare vibe)
  const fp = clamp01(flareReveal);
  if (fp > 0.02) {
    const fx = 840;
    const fy = 960;
    const glow = ctx.createRadialGradient(fx, fy, 10, fx, fy, 150);
    glow.addColorStop(0, `rgba(251, 191, 36, ${0.42 * fp})`);
    glow.addColorStop(0.55, `rgba(232, 76, 61, ${0.18 * fp})`);
    glow.addColorStop(1, 'rgba(15, 51, 68, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, 150, 0, Math.PI * 2);
    ctx.fill();

    // Animated flame spikes at fracture point
    const spikes = [[-42, 6, 48], [-12, -16, 66], [22, -4, 54], [52, 18, 38]];
    spikes.forEach(([sx, sy, sh], idx) => {
      const pulse = 0.85 + 0.15 * Math.sin(localSec * 6 + idx * 1.4);
      ctx.fillStyle = 'rgba(253, 224, 71, 0.86)';
      ctx.beginPath();
      ctx.moveTo(fx + sx - 10, fy + sy);
      ctx.quadraticCurveTo(fx + sx, fy + sy - sh * pulse * fp, fx + sx + 10, fy + sy);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Animated 2D Camel Caravan Silhouettes along upper route
  const cp = clamp01(caravanProg);
  for (let c = 0; c < 2; c++) {
    const t = clamp01(cp * 0.65 - c * 0.14);
    const cx = lerp(290, 740, t);
    const cy = lerp(635, 885, t) - Math.sin(localSec * 5 + c) * 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(0.95, 0.95);
    ctx.fillStyle = '#3E2723';
    // Body + Hump
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, -14, 11, Math.PI, 0);
    ctx.fill();
    // Neck & Head
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#3E2723';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(18, -4);
    ctx.quadraticCurveTo(28, -22, 34, -22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(36, -22, 6, 0, Math.PI * 2);
    ctx.fill();
    // Walking legs
    const legSwing = Math.sin(localSec * 8 + c * 2) * 5;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, 10); ctx.lineTo(-14 - legSwing, 28);
    ctx.moveTo(-4, 10); ctx.lineTo(-4 + legSwing, 28);
    ctx.moveTo(10, 10); ctx.lineTo(10 - legSwing, 28);
    ctx.moveTo(16, 10); ctx.lineTo(18 + legSwing, 28);
    ctx.stroke();
    ctx.restore();
  }

  // Dotted leader pin (exact ref_26s style!)
  if (fp > 0.2) {
    ctx.save();
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = 'rgba(244, 239, 230, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(490, 1060);
    ctx.lineTo(665, 975);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.arc(665, 975, 7, 0, Math.PI * 2);
    ctx.fill();

    drawMicroPill(ctx, 305, 1060, 'JALUR SANAD PUTUS', {
      dotColor: '#EF4444',
      reveal: fp,
    });
  }

  // Dark Floating Telemetry Verdict Card (ref_32s style!)
  const crp = clamp01(cardReveal);
  if (crp > 0.02) {
    const cw = 720;
    const ch = 265;
    const cx = 120;
    const cy = 675 + (1 - crp) * 24;

    ctx.save();
    ctx.globalAlpha *= crp;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 14;
    roundRectPath(ctx, cx, cy, cw, ch, 20);
    ctx.fillStyle = 'rgba(13, 16, 22, 0.94)';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '700 20px JetMono';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.58)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('AL-MAUDHU\'AT · IBNUL JAUZI 1/215', cx + 34, cy + 28);

    ctx.font = '800 24px JetMono';
    ctx.fillStyle = PALETTE.crimson;
    ctx.textAlign = 'right';
    ctx.fillText('MAUDHU\' / PALSU', cx + cw - 34, cy + 28);

    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 54px Amiri';
    ctx.fillStyle = PALETTE.amberGlow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('اُطْلُبُوا الْعِلْمَ وَلَوْ بِالصِّينِ', cx + cw / 2, cy + 122);
    ctx.restore();

    ctx.font = '700 26px PlusJakarta';
    ctx.fillStyle = PALETTE.cream;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('“Tuntutlah ilmu walau sampai ke negeri Cina”', cx + cw / 2, cy + ch - 28);
    ctx.restore();
  }

  // Bottom micro-pill
  if (badgeReveal > 0.02) {
    drawMicroPill(ctx, WIDTH / 2, 1495, 'IBNU HIBBAN · AL-ALBANI: BATIL / TIDAK ADA ASAL', {
      dotColor: PALETTE.amber,
      bg: 'rgba(30, 20, 14, 0.92)',
      stroke: 'rgba(245, 158, 11, 0.45)',
      reveal: badgeReveal,
    });
  }

  ctx.restore();
}

/**
 * Hanging Ivory Plaque on Taut Strings inside Overhead Spotlight (ref_44s & ref_50s).
 */
export function drawHangingSpotlightPlaque(ctx, cx, cy, w, h, opts = {}) {
  const {
    eyebrow = 'PERAWI PENYEBAB CACAT',
    mainTitle = 'ABU ‘ATIKAH',
    subNote = 'TARIF BIN SULAIMAN · HADITS PALSU',
    sticker = 'MATRUK / TERTOLAK',
    stickerReveal = 0,
    swingPhase = 0,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;
  const tilt = Math.sin(swingPhase * 1.4) * 0.012 - 0.015;
  ctx.translate(cx, cy + (1 - p) * 24);
  ctx.rotate(tilt);

  // Two thin vertical hanging strings up to ceiling
  ctx.strokeStyle = 'rgba(244, 239, 230, 0.28)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 56, -h / 2 + 4);
  ctx.lineTo(-w / 2 + 56, -cy - 100);
  ctx.moveTo(w / 2 - 56, -h / 2 + 4);
  ctx.lineTo(w / 2 - 56, -cy - 100);
  ctx.stroke();

  // Plaque body
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 16;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 18);
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  bg.addColorStop(0, '#F5F2EB');
  bg.addColorStop(1, '#DFD9CA');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(eyebrow, 0, -h / 2 + 38);

  ctx.font = '800 68px PlusJakarta';
  ctx.fillStyle = PALETTE.inkDark;
  ctx.textBaseline = 'middle';
  ctx.fillText(mainTitle, 0, 2);

  ctx.font = '700 20px JetMono';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.textBaseline = 'bottom';
  ctx.fillText(subNote, 0, h / 2 - 32);

  // Angled Red Sticker (`MATRUK` like `HARGA BARU` in ref_50s!)
  const sp = clamp01(stickerReveal);
  if (sticker && sp > 0.02) {
    ctx.save();
    ctx.globalAlpha *= sp;
    ctx.translate(w / 2 - 48, -h / 2 - 8);
    ctx.rotate(-0.12);
    ctx.scale(1.18 - 0.18 * sp, 1.18 - 0.18 * sp);

    ctx.font = '800 24px JetMono';
    const sw = ctx.measureText(sticker).width + 36;
    roundRectPath(ctx, -sw / 2, -23, sw, 46, 6);
    ctx.fillStyle = PALETTE.crimson;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker, 0, 1);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Detailed 2D Metallic Golden Chain Snapping Inside Spotlight Pool (i04).
 */
export function drawBrokenGoldenChainArtifact(ctx, cx, cy, opts = {}) {
  const { snapProg = 1, localSec = 0, reveal = 1 } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;

  const nodes = [
    { x: cx - 340, y: cy, title: 'ANAS BIN MALIK RA', sub: 'SAHABAT NABI', status: 'valid' },
    { x: cx + 20, y: cy, title: 'ABU ‘ATIKAH', sub: 'TITIK PATAH', status: 'broken' },
    { x: cx + 360, y: cy, title: 'KITAB TARIKH', sub: 'TERTOLAK', status: 'rejected' },
  ];

  // Solid Golden Interlocking Link (Anas -> Abu Atikah approaching fracture)
  const sp = clamp01(snapProg);
  // Left chain links (solid gold)
  for (let lx = cx - 260; lx <= cx - 125; lx += 44) {
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 10;
    roundRectPath(ctx, lx - 18, cy - 11, 36, 22, 11);
    ctx.stroke();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3.5;
    roundRectPath(ctx, lx - 14, cy - 7, 28, 14, 7);
    ctx.stroke();
  }

  // Snapped/Fractured sparks between Anas and Abu 'Atikah
  const gapX = cx - 82;
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(gapX - 18, cy - 26 * sp);
  ctx.lineTo(gapX - 4, cy - 8 * sp);
  ctx.moveTo(gapX + 18, cy + 26 * sp);
  ctx.lineTo(gapX + 4, cy + 8 * sp);
  ctx.stroke();

  // Right severed chain links (Anas/Abu Atikah -> Kitab)
  for (let lx = cx + 115; lx <= cx + 265; lx += 44) {
    ctx.strokeStyle = 'rgba(232, 76, 61, 0.55)';
    ctx.lineWidth = 8;
    roundRectPath(ctx, lx - 18, cy - 10, 36, 20, 10);
    ctx.stroke();
  }

  // Turbaned Medallions
  nodes.forEach((nd) => {
    const isValid = nd.status === 'valid';
    const isBroken = nd.status === 'broken';
    const rad = isBroken ? 68 : 58;

    ctx.save();
    ctx.translate(nd.x, nd.y);

    // Glow
    if (isBroken) {
      const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
      g.addColorStop(0, `rgba(239, 68, 68, ${0.40 + 0.12 * Math.sin(localSec * 5)})`);
      g.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 120, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = isValid ? '#064E3B' : isBroken ? '#7F1D1D' : '#1F2937';
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isValid ? PALETTE.teal : isBroken ? '#EF4444' : '#6B7280';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Turbaned silhouette inside medallion
    ctx.fillStyle = isBroken ? '#FECACA' : '#FEF3C7';
    ctx.beginPath();
    ctx.arc(0, rad * 0.44, rad * 0.40, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 2, rad * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, -rad * 0.22, rad * 0.30, rad * 0.17, -0.08, 0, Math.PI * 2);
    ctx.fill();

    if (isBroken && sp > 0.2) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(-36, -36); ctx.lineTo(36, 36);
      ctx.moveTo(36, -36); ctx.lineTo(-36, 36);
      ctx.stroke();
    }

    // Labels below medallion
    ctx.font = '800 22px JetMono';
    ctx.fillStyle = isValid ? PALETTE.teal : isBroken ? '#FCA5A5' : '#9CA3AF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(nd.title, 0, rad + 20);

    ctx.font = '700 18px JetMono';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.55)';
    ctx.fillText(nd.sub, 0, rad + 52);

    ctx.restore();
  });

  ctx.restore();
}

/**
 * Illustrated 2D Homeland Globe, Waving Flag & Compass (i05, sunset clouds scene like ref_38s).
 */
export function drawHomelandCompassAndFlag(ctx, cx, cy, scale, opts = {}) {
  const { wavePhase = 0, reveal = 1 } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(cx, cy + (1 - p) * 20);
  ctx.scale(scale, scale);

  // Brass navigational compass / globe ring
  const rg = ctx.createRadialGradient(0, 0, 20, 0, 0, 145);
  rg.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
  rg.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(0, 0, 145, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0F2B3D';
  ctx.beginPath();
  ctx.arc(0, 0, 108, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.amber;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Archipelago continents inside globe
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.ellipse(-34, -14, 34, 15, 0.28, 0, Math.PI * 2);
  ctx.ellipse(22, 24, 38, 13, -0.22, 0, Math.PI * 2);
  ctx.ellipse(42, -26, 20, 14, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Waving homeland flag planted on globe
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -92);
  ctx.lineTo(-4, -205);
  ctx.stroke();

  const w1 = Math.sin(wavePhase * 4.2) * 8;
  const w2 = Math.cos(wavePhase * 4.2) * 8;
  // Red top half
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(-2, -205);
  ctx.quadraticCurveTo(46, -214 + w1, 96, -202 + w2);
  ctx.lineTo(96, -172 + w2);
  ctx.quadraticCurveTo(46, -184 + w1, -2, -175);
  ctx.closePath();
  ctx.fill();
  // White bottom half
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-2, -175);
  ctx.quadraticCurveTo(46, -184 + w1, 96, -172 + w2);
  ctx.lineTo(96, -142 + w2);
  ctx.quadraticCurveTo(46, -154 + w1, -2, -145);
  ctx.closePath();
  ctx.fill();

  // Living beating heart emblem beside globe
  const beatScale = 1 + Math.sin(wavePhase * 4.5) * 0.08;
  ctx.save();
  ctx.translate(185, -16);
  ctx.scale(beatScale * 1.35, beatScale * 1.35);
  ctx.fillStyle = '#F43F5E';
  ctx.shadowColor = 'rgba(244, 63, 94, 0.45)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.bezierCurveTo(-38, -2, -38, -32, -16, -32);
  ctx.bezierCurveTo(-4, -32, 0, -18, 0, -14);
  ctx.bezierCurveTo(0, -18, 4, -32, 16, -32);
  ctx.bezierCurveTo(38, -32, 38, -2, 0, 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Detailed 2D Carved Wooden Rehal + Open Kitab + Hanging Brass Lantern + Sweeping Loupe (i06).
 */
export function drawRehalLanternAndLoupe(ctx, cx, cy, scale, opts = {}) {
  const { openProg = 1, loupeReveal = 1, localSec = 0 } = opts;
  const p = clamp01(openProg);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Hanging Brass Lantern (Fanoos) above Rehal (tucked cleanly under top slip)
  ctx.save();
  ctx.translate(-170, -195);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -110);
  ctx.lineTo(0, -28);
  ctx.stroke();

  const lg = ctx.createRadialGradient(0, 24, 6, 0, 24, 165 + Math.sin(localSec * 4) * 10);
  lg.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
  lg.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(0, 24, 170, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.moveTo(-28, 0); ctx.lineTo(0, -30); ctx.lineTo(28, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FEF08A';
  roundRectPath(ctx, -23, 0, 46, 56, 8);
  ctx.fill();
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-28, 56, 56, 10);
  ctx.restore();

  // Carved Wooden Rehal Stand (Left)
  ctx.save();
  ctx.translate(-170, 40);
  ctx.strokeStyle = '#7C4A26';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-175, 145); ctx.lineTo(135, 16);
  ctx.moveTo(175, 145); ctx.lineTo(-135, 16);
  ctx.stroke();

  const spread = 195 * (0.35 + 0.65 * p);
  ctx.fillStyle = '#FAF5E8';
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 4;
  // Left Page
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.quadraticCurveTo(-spread * 0.5, 12, -spread, 28);
  ctx.lineTo(-spread - 12, -118);
  ctx.quadraticCurveTo(-spread * 0.5, -134, 0, -104);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Right Page
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.quadraticCurveTo(spread * 0.5, 12, spread, 28);
  ctx.lineTo(spread + 12, -118);
  ctx.quadraticCurveTo(spread * 0.5, -134, 0, -104);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Classical script lines on pages
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.34)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 5; row++) {
    const ry = -84 + row * 21;
    ctx.beginPath();
    ctx.moveTo(-spread + 26, ry);
    ctx.lineTo(-24, ry + 8);
    ctx.moveTo(24, ry + 8);
    ctx.lineTo(spread - 26, ry);
    ctx.stroke();
  }
  ctx.restore();

  // Right Side: Parchment Card + Sweeping Brass Magnifying Loupe checking Sanad
  const lp = clamp01(loupeReveal);
  if (lp > 0.02) {
    ctx.save();
    ctx.globalAlpha *= lp;
    ctx.translate(215, 0);

    roundRectPath(ctx, -170, -82, 340, 164, 18);
    ctx.fillStyle = '#F3EAD4';
    ctx.fill();
    ctx.strokeStyle = '#B4925A';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 42px Amiri';
    ctx.fillStyle = '#1C1917';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('سَنَدُ الْحَدِيثِ', 0, -14);
    ctx.restore();

    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.crimsonDeep;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SANAD: TIDAK ADA', 0, 62);

    // Sweeping loupe lens
    const sweepX = Math.sin(localSec * 2.0) * 44;
    ctx.translate(sweepX, -10);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(58, 58);
    ctx.lineTo(126, 126);
    ctx.stroke();

    ctx.fillStyle = 'rgba(232, 76, 61, 0.16)';
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.amber;
    ctx.lineWidth = 11;
    ctx.stroke();

    // Glass reflection arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 66, Math.PI * 1.15, Math.PI * 1.48);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Bold Kinetic Motion Typography Climax (EXACT ref_72s aesthetic!) + Mutawatir Seal (i07).
 */
export function drawKineticClimaxTypography(ctx, cx, cy, opts = {}) {
  const {
    yahyaReveal = 1,
    strikeProgress = 0,
    mainReveal = 1,
    arabicReveal = 1,
    localSec = 0,
  } = opts;

  ctx.save();

  // Faint scrolling data ticker background (matching ref_72s background ticker!)
  const scrollX = (localSec * 55) % 900;
  ctx.font = '700 28px JetMono';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const ticker1 = 'HR. BUKHARI NO. 110   ·   HR. MUSLIM NO. 3   ·   AL-HAWI 2/288   ·   YAHYA BIN MU\'ADZ   ·   ';
  ctx.fillText(ticker1 + ticker1 + ticker1, -scrollX, cy + 160);
  ctx.fillText(ticker1 + ticker1 + ticker1, -900 + scrollX * 0.7, cy + 215);

  // Top note: Yahya bin Mu'adz clarification pill
  if (yahyaReveal > 0.02) {
    drawMicroPill(ctx, cx, cy - 300, '“SIAPA MENGENAL DIRINYA...” = UCAPAN YAHYA BIN MU’ADZ AR-RAZI', {
      dotColor: PALETTE.amber,
      reveal: yahyaReveal,
    });
  }

  // Climax kinetic typography block
  ctx.font = '700 34px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BUKAN SEKADAR', cx, cy - 175);

  // "KATA BIJAK" with animated red strike-through line slashing across
  ctx.font = '800 94px PlusJakarta';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.34)';
  ctx.fillText('KATA BIJAK', cx, cy - 95);

  const mp = clamp01(mainReveal);
  if (mp > 0.02) {
    ctx.save();
    ctx.globalAlpha *= mp;
    ctx.font = '800 96px PlusJakarta';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText('ITU ANCAMAN', cx, cy - 10);

    ctx.shadowColor = 'rgba(245, 158, 11, 0.48)';
    ctx.shadowBlur = 32;
    ctx.font = '800 108px PlusJakarta';
    ctx.fillStyle = PALETTE.amberGlow;
    ctx.fillText('NERAKA.', cx, cy + 100);
    ctx.restore();
  }

  // Animated red slash line over "KATA BIJAK" (drawn on top, just like ref_72s)
  const sp = clamp01(strikeProgress);
  if (sp > 0.02) {
    ctx.strokeStyle = PALETTE.crimson;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 330, cy - 84);
    ctx.lineTo(lerp(cx - 330, cx + 330, sp), lerp(cy - 84, cy - 106, sp));
    ctx.stroke();
  }

  // Mutawatir Arabic Warning Strip below ticker
  const ap = clamp01(arabicReveal);
  if (ap > 0.02) {
    ctx.save();
    ctx.globalAlpha *= ap;
    const bx = 110;
    const by = cy + 285 + (1 - ap) * 18;
    const bw = WIDTH - 220;
    const bh = 215;

    roundRectPath(ctx, bx, by, bw, bh, 20);
    ctx.fillStyle = 'rgba(20, 14, 14, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 76, 61, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.crimson;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('HADITS MUTAWATIR · HR. BUKHARI 110 & MUSLIM 3', cx, by + 22);

    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 50px Amiri';
    ctx.fillStyle = PALETTE.cream;
    ctx.textBaseline = 'middle';
    ctx.fillText('مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ', cx, by + 106);
    ctx.restore();

    ctx.font = '600 24px PlusJakarta';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
    ctx.textBaseline = 'bottom';
    ctx.fillText('“Siapa berdusta atas namaku sengaja, siapkan tempat duduknya di neraka.”', cx, by + bh - 20);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Glowing 2-Column Editorial Comparison Chart + Crystal Water Pitcher & Sahih Quotes (ref_56s & ref_64s).
 */
export function drawEditorialBarAndPitcherScene(ctx, cx, cy, opts = {}) {
  const {
    barLeftProg = 1,
    barRightProg = 1,
    pitcherReveal = 1,
    quotesReveal = 1,
    localSec = 0,
  } = opts;

  ctx.save();

  // Top Header (matching ref_56s "PERTUMBUHAN 12 BULAN / Upah vs Harga")
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.45)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('KUALITAS SUMBER RIWAYAT', 120, 320);

  ctx.font = '800 56px PlusJakarta';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('Hadits Palsu vs Shahih', 120, 355);

  // Subtle horizontal chart grid lines
  const floorY = 1040;
  const maxBarH = 500;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const gy = floorY - (i / 4) * maxBarH;
    ctx.beginPath();
    ctx.moveTo(120, gy);
    ctx.lineTo(WIDTH - 120, gy);
    ctx.stroke();
  }

  // Left Bar (Hadits Palsu - low/broken crimson glow)
  const lp = clamp01(barLeftProg);
  const hLeft = 145 * lp;
  const xLeft = 220;
  const barW = 240;

  if (hLeft > 6) {
    const gL = ctx.createLinearGradient(0, floorY - hLeft, 0, floorY);
    gL.addColorStop(0, PALETTE.crimson);
    gL.addColorStop(1, 'rgba(232, 76, 61, 0.15)');
    ctx.save();
    ctx.shadowColor = 'rgba(232, 76, 61, 0.35)';
    ctx.shadowBlur = 24;
    roundRectPath(ctx, xLeft, floorY - hLeft, barW, hLeft, 10);
    ctx.fillStyle = gL;
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#FECACA';
    ctx.fillRect(xLeft, floorY - hLeft, barW, 5);

    ctx.font = '800 32px PlusJakarta';
    ctx.fillStyle = PALETTE.crimson;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('0 SANAD', xLeft + barW / 2, floorY - hLeft - 14);
  }

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('PALSU / MAUDHU\'', xLeft + barW / 2, floorY + 18);

  // Right Bar (Hadits Shahih - tall glowing emerald-teal!)
  const rp = clamp01(barRightProg);
  const hRight = 465 * rp;
  const xRight = 560;

  if (hRight > 6) {
    const gR = ctx.createLinearGradient(0, floorY - hRight, 0, floorY);
    gR.addColorStop(0, PALETTE.teal);
    gR.addColorStop(1, 'rgba(45, 212, 191, 0.12)');
    ctx.save();
    ctx.shadowColor = 'rgba(45, 212, 191, 0.35)';
    ctx.shadowBlur = 28;
    roundRectPath(ctx, xRight, floorY - hRight, barW, hRight, 10);
    ctx.fillStyle = gR;
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#CCFBF1';
    ctx.fillRect(xRight, floorY - hRight, barW, 5);

    ctx.font = '800 34px PlusJakarta';
    ctx.fillStyle = PALETTE.teal;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('100% SHAHIH', xRight + barW / 2, floorY - hRight - 14);
  }

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('BUKHARI & MUSLIM', xRight + barW / 2, floorY + 18);

  // Illustrated Crystal Water Pitcher (Ibrik) on the right side (x = 1120, y = 780)
  const pp = clamp01(pitcherReveal);
  if (pp > 0.02) {
    ctx.save();
    ctx.globalAlpha *= pp;
    ctx.translate(1110, 820);
    ctx.scale(1.55, 1.55);

    for (let r = 0; r < 3; r++) {
      const rprog = (localSec * 0.7 + r * 0.33) % 1;
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.60 * (1 - rprog)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(25, 108, 42 + rprog * 95, 12 + rprog * 22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(-42, -26);
    ctx.rotate(0.42);
    const bodyGrad = ctx.createLinearGradient(-45, -60, 45, 60);
    bodyGrad.addColorStop(0, '#7DD3FC');
    bodyGrad.addColorStop(0.45, '#38BDF8');
    bodyGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 14, 44, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck & rim
    ctx.fillRect(-15, -66, 30, 38);
    ctx.beginPath();
    ctx.ellipse(0, -66, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Curved pouring spout pointing downward-right into the water stream
    ctx.beginPath();
    ctx.moveTo(28, -4);
    ctx.quadraticCurveTo(64, -22, 86, -42);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineCap = 'round';
    ctx.stroke();
    // Glass specular highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-14, 12, 26, Math.PI * 0.75, Math.PI * 1.25);
    ctx.stroke();
    // Handle
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(-40, -10, 28, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();

    // Water stream pouring smoothly from rotated spout tip into ripples
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(36, -34);
    ctx.quadraticCurveTo(48, 28, 25, 102);
    ctx.stroke();
    ctx.restore();
  }

  // Two Sleek Sahih Replacement Cards below the chart
  const qp = clamp01(quotesReveal);
  if (qp > 0.02) {
    const cards = [
      {
        y: 1140,
        ref: 'PENGGANTI #01 · HR. IBNU MAJAH NO. 224 (SHAHIH)',
        arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
        meaning: '“Menuntut ilmu itu wajib atas setiap muslim.”',
        accent: PALETTE.amber,
      },
      {
        y: 1410,
        ref: 'PENGGANTI #02 · HR. MUSLIM NO. 223 (SHAHIH)',
        arabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ',
        meaning: '“Kesucian (thaharah) adalah separuh dari keimanan.”',
        accent: PALETTE.teal,
      },
    ];

    cards.forEach((cd, idx) => {
      const cp = clamp01(qp * 1.6 - idx * 0.4);
      if (cp <= 0.02) return;
      ctx.save();
      ctx.globalAlpha *= cp;
      const cw = WIDTH - 200;
      const ch = 235;
      const cx0 = 100;
      const cy0 = cd.y + (1 - cp) * 20;

      roundRectPath(ctx, cx0, cy0, cw, ch, 18);
      ctx.fillStyle = 'rgba(16, 20, 24, 0.94)';
      ctx.fill();
      ctx.strokeStyle = cd.accent;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.font = '700 20px JetMono';
      ctx.fillStyle = cd.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cd.ref, WIDTH / 2, cy0 + 24);

      ctx.save();
      ctx.direction = 'rtl';
      ctx.font = '700 54px Amiri';
      ctx.fillStyle = PALETTE.cream;
      ctx.textBaseline = 'middle';
      ctx.fillText(cd.arabic, WIDTH / 2, cy0 + 114);
      ctx.restore();

      ctx.font = '700 28px PlusJakarta';
      ctx.fillStyle = 'rgba(244, 239, 230, 0.84)';
      ctx.textBaseline = 'bottom';
      ctx.fillText(cd.meaning, WIDTH / 2, cy0 + ch - 24);
      ctx.restore();
    });
  }

  ctx.restore();
}

/**
 * Twin Leather-Bound Sahih Books + Madinah Dawn Dome + 3 Action Steps (i09).
 */
export function drawTwinSahihAndMasjidFinale(ctx, cx, cy, opts = {}) {
  const { booksReveal = 1, stepsReveal = 1, ctaReveal = 1, localSec = 0 } = opts;

  ctx.save();

  // Dawn Madinah Green Dome silhouette softly glowing behind books
  const domeY = cy - 110;
  const g = ctx.createRadialGradient(cx, domeY - 80, 15, cx, domeY - 80, 380);
  g.addColorStop(0, `rgba(16, 185, 129, ${0.26 + Math.sin(localSec * 2) * 0.04})`);
  g.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
  g.addColorStop(1, 'rgba(10, 9, 8, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, domeY - 80, 380, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(6, 95, 70, 0.45)';
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, domeY - 40, 110, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin Gold-Embossed Sahih Books
  const bp = clamp01(booksReveal);
  if (bp > 0.02) {
    ctx.save();
    ctx.globalAlpha *= bp;
    ctx.translate(cx, cy - 60 + (1 - bp) * 24);

    const books = [
      { x: -175, title: 'SHAHIH', sub: 'AL-BUKHARI', col: '#7F1D1D', spine: '#EAB308' },
      { x: 20, title: 'SHAHIH', sub: 'MUSLIM', col: '#064E3B', spine: '#EAB308' },
    ];
    books.forEach((bk, idx) => {
      ctx.save();
      ctx.translate(bk.x, idx === 1 ? -14 : 0);
      roundRectPath(ctx, 0, -110, 165, 220, 14);
      ctx.fillStyle = bk.col;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.strokeStyle = bk.spine;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = bk.spine;
      ctx.fillRect(14, -86, 12, 172);
      ctx.strokeStyle = bk.spine;
      ctx.lineWidth = 2;
      roundRectPath(ctx, 40, -78, 106, 156, 10);
      ctx.stroke();

      ctx.font = '800 20px JetMono';
      ctx.fillStyle = '#FEF3C7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bk.title, 93, -18);
      ctx.font = '800 16px JetMono';
      ctx.fillText(bk.sub, 93, 18);
      ctx.restore();
    });
    ctx.restore();
  }

  // Three Crisp Horizontal Micro-Steps
  const sp = clamp01(stepsReveal);
  const steps = [
    { label: '01 · CEK PERIWAYAT (BUKHARI, MUSLIM, DLL.)', col: PALETTE.amber },
    { label: '02 · PASTIKAN DERAJAT (SHAHIH / HASAN)', col: PALETTE.teal },
    { label: '03 · VERIFIKASI KITAB SEBELUM SHARE', col: PALETTE.sky },
  ];
  steps.forEach((st, i) => {
    const itemP = clamp01(sp * 2.1 - i * 0.45);
    drawMicroPill(ctx, cx, cy + 165 + i * 74, st.label, {
      dotColor: st.col,
      bg: 'rgba(16, 18, 24, 0.94)',
      stroke: 'rgba(255, 255, 255, 0.14)',
      font: '700 23px JetMono',
      height: 56,
      reveal: itemP,
    });
  });

  // Closing Interactive CTA Pill
  if (ctaReveal > 0.02) {
    drawMicroPill(ctx, cx, cy + 425, 'TULIS DI KOMENTAR · BAGIKAN AGAR MANFAAT', {
      dotColor: PALETTE.amberGlow,
      bg: 'rgba(245, 158, 11, 0.16)',
      stroke: PALETTE.amber,
      textColor: PALETTE.amberSoft,
      font: '800 22px JetMono',
      height: 54,
      reveal: ctaReveal,
    });
  }

  ctx.restore();
}

// ============================================================================
// 4. MINIMALIST CHROME & FLOATING KINETIC WORD CAPTIONS (EXACT REF STYLE)
// ============================================================================

export function drawMinimalCornerChrome(ctx, scene, sceneIdx, totalScenes, globalSec, totalDurSec) {
  ctx.save();

  // Top-left minimal handle (▪ MUHAMMAD ATARZK)
  ctx.fillStyle = PALETTE.amber;
  ctx.fillRect(68, 86, 12, 12);

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(VIDEO_CONFIG.channelHandle, 94, 93);

  // Top-right minimal category
  ctx.font = '600 20px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.42)';
  ctx.textAlign = 'right';
  ctx.fillText(VIDEO_CONFIG.categoryLabel, WIDTH - 68, 93);

  // Bottom-left chapter indicator (`01 — PEMBUKA`)
  ctx.font = '600 21px JetMono';
  ctx.fillStyle = 'rgba(244, 239, 230, 0.48)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(scene.chapter, 68, 2454);

  // Bottom-right chapter step dashes (`- - — - - - - - -`)
  const dashW = 24;
  const dashGap = 12;
  const totalDashW = totalScenes * dashW + (totalScenes - 1) * dashGap;
  const startX = WIDTH - 68 - totalDashW;
  for (let i = 0; i < totalScenes; i++) {
    const dx = startX + i * (dashW + dashGap);
    ctx.fillStyle = i === sceneIdx ? PALETTE.amber : 'rgba(244, 239, 230, 0.22)';
    roundRectPath(ctx, dx, 2451, dashW, 5, 2.5);
    ctx.fill();
  }

  // Razor-thin bottom edge global progress hairline
  const pct = clamp01(globalSec / Math.max(0.1, totalDurSec));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, HEIGHT - 7, WIDTH, 7);
  ctx.fillStyle = PALETTE.amber;
  ctx.fillRect(0, HEIGHT - 7, WIDTH * pct, 7);

  ctx.restore();
}

function displayCaptionWord(raw) {
  return raw
    .replace(/\bshalallahu\b/gi, 'shallallahu')
    .replace(/\bsalam([.,?!]*)$/i, 'sallam$1');
}

/**
 * Floating Kinetic Word-by-Word Captions (NO pill box! Exact ref_02s–ref_72s look).
 */
export function drawFloatingKineticCaptions(ctx, scene, localSec) {
  const words = (scene.words || []).map((w) => ({
    ...w,
    word: displayCaptionWord(w.word),
  }));
  if (words.length === 0) return;

  // Group into rhythmic phrases of max 10 words or sentence boundary
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

  // Break active chunk into up to 3 balanced centered lines
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
        ctx.fillStyle = PALETTE.amberGlow;
        ctx.translate(drawX + ww / 2, drawY);
        ctx.scale(1.04, 1.04);
        ctx.fillText(it.word, -ww / 2, 0);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
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
// 5. SCENE MODULE LOADER & RENDER DISPATCH
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
      easeOutBack,
      easeInOutCubic,
      beat,
      roundRectPath,
      drawWrappedText,
      drawMicroPill,
      drawCornerBadge,
      drawRectRubberStamp,
      drawTwilightSkylineBackdrop,
      drawBlueprintGridBackdrop,
      drawSilkRoadTerrainBackdrop,
      drawSpotlightStageBackdrop,
      drawSunsetHorizonCloudsBackdrop,
      drawDigitalQuoteBoard,
      drawIvoryPaperSlip,
      drawPrecisionDialHero,
      drawSilkRoadCaravanAndPin,
      drawHangingSpotlightPlaque,
      drawBrokenGoldenChainArtifact,
      drawHomelandCompassAndFlag,
      drawRehalLanternAndLoupe,
      drawKineticClimaxTypography,
      drawEditorialBarAndPitcherScene,
      drawTwinSahihAndMasjidFinale,
    });
  }

  drawMinimalCornerChrome(ctx, scene, sceneIdx, timeline.scenes.length, globalSec, timeline.totalDurationSec);
  drawFloatingKineticCaptions(ctx, scene, localSec);

  // Clean subtle cross-dissolve at scene ends
  const remSec = scene.endSec - globalSec;
  if (sceneIdx < timeline.scenes.length - 1 && remSec < 0.20) {
    const fade = clamp01(1 - remSec / 0.20) * 0.55;
    ctx.save();
    ctx.fillStyle = `rgba(9, 10, 13, ${fade})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }
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
    if (!sc) {
      throw new Error(`Unknown scene id: ${sid}`);
    }
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
  if (exitCode !== 0) {
    throw new Error(`FFmpeg failed with exit code ${exitCode}`);
  }

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
