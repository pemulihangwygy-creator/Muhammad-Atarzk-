#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Canvas, FontLibrary } from 'skia-canvas';
import {
  FPS,
  HEIGHT,
  ROOT,
  SHORT2_DIR,
  VIDEO_CONFIG,
  WIDTH,
  buildAudioAndTimeline,
  findFfmpeg,
} from './script.mjs';

// ============================================================================
// 1. FONT REGISTRATION
// ============================================================================
let FONTS_LOADED = false;
export function ensureFonts() {
  if (FONTS_LOADED) return;
  const reg = (family, relPath) => {
    const abs = join(ROOT, 'node_modules', relPath);
    if (existsSync(abs)) {
      FontLibrary.use(family, [abs]);
    }
  };
  reg('PlusJakarta', '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2');
  reg('PlusJakarta', '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2');
  reg('PlusJakarta', '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2');
  reg('PlusJakarta', '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2');
  reg('PlusJakarta', '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2');
  reg('Playfair', '@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2');
  reg('Playfair', '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2');
  reg('Playfair', '@fontsource/playfair-display/files/playfair-display-latin-800-normal.woff2');
  reg('Cinzel', '@fontsource/cinzel/files/cinzel-latin-700-normal.woff2');
  reg('JetMono', '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2');
  reg('JetMono', '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2');
  reg('JetMono', '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2');
  FONTS_LOADED = true;
}

// ============================================================================
// 2. EASING, TIMING & COLOR PALETTES
// ============================================================================
export const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : clamp01((v - a) / (b - a)));
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOutCubic = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutQuart = (t) => 1 - Math.pow(1 - clamp01(t), 4);
export const easeOutBack = (t) => {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const easeSpring = (t) => {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  return 1 - Math.exp(-7 * x) * Math.cos(10 * x);
};
export const beat = (localSec, startSec, durSec = 0.55, ease = easeOutCubic) =>
  ease(invLerp(startSec, startSec + durSec, localSec));

export const PALETTE = {
  // World A: Studio Acoustic Dark
  darkBgTop: '#060A12',
  darkBgBot: '#0D1729',
  darkSurface: 'rgba(15, 25, 44, 0.88)',
  darkBorder: 'rgba(56, 189, 248, 0.28)',
  cyan: '#38BDF8',
  cyanBright: '#7DD3FC',
  mint: '#34D399',
  amber: '#FBBF24',
  coral: '#FB7185',
  violet: '#A78BFA',
  inkLight: '#F8FAFC',
  inkMuted: '#94A3B8',

  // World B: Medical / Anatomical Atlas Light
  atlasBgTop: '#F8F4EA',
  atlasBgBot: '#EAE1CE',
  atlasCard: '#FFFDF8',
  atlasBorder: '#C7B89B',
  atlasInk: '#111827',
  atlasMuted: '#475569',
  atlasBlue: '#0369A1',
  atlasTeal: '#0F766E',
  atlasAmber: '#B45309',
  atlasRed: '#BE123C',

  // World C: 1966 Psychology Dossier Paper
  archiveBgTop: '#EFE7D4',
  archiveBgBot: '#DECFA9',
  archiveCard: '#FAF5E8',
  archiveBorder: '#8D7B5A',
  archiveInk: '#1F1B16',
  archiveMuted: '#5C5040',
  archiveStamp: '#991B1B',
  archiveAccent: '#0F4C81',

  // World D: Neural Insight Dark Emerald-Indigo
  neuralBgTop: '#050E13',
  neuralBgBot: '#0B1F29',
  neuralCard: 'rgba(10, 29, 39, 0.90)',
  neuralBorder: 'rgba(52, 211, 153, 0.32)',
};

export function worldThemeForScene(sceneId) {
  if (sceneId === 's03' || sceneId === 's04' || sceneId === 's05') {
    return {
      mode: 'atlas',
      isLight: true,
      bgTop: PALETTE.atlasBgTop,
      bgBot: PALETTE.atlasBgBot,
      cardBg: 'rgba(255, 253, 248, 0.94)',
      cardBorder: 'rgba(148, 127, 94, 0.45)',
      textPrimary: PALETTE.atlasInk,
      textSecondary: PALETTE.atlasMuted,
      accent: sceneId === 's04' ? PALETTE.atlasAmber : PALETTE.atlasBlue,
      accentAlt: PALETTE.atlasTeal,
      pillBg: 'rgba(3, 105, 161, 0.11)',
      pillBorder: 'rgba(3, 105, 161, 0.35)',
      subBg: 'rgba(15, 23, 42, 0.90)',
      subText: '#F8FAFC',
      subHighlight: '#FBBF24',
    };
  }
  if (sceneId === 's07' || sceneId === 's08') {
    return {
      mode: 'archive',
      isLight: true,
      bgTop: PALETTE.archiveBgTop,
      bgBot: PALETTE.archiveBgBot,
      cardBg: 'rgba(250, 245, 232, 0.96)',
      cardBorder: 'rgba(115, 96, 66, 0.50)',
      textPrimary: PALETTE.archiveInk,
      textSecondary: PALETTE.archiveMuted,
      accent: PALETTE.archiveStamp,
      accentAlt: PALETTE.archiveAccent,
      pillBg: 'rgba(153, 27, 27, 0.10)',
      pillBorder: 'rgba(153, 27, 27, 0.38)',
      subBg: 'rgba(24, 20, 16, 0.92)',
      subText: '#FAF5E8',
      subHighlight: '#FBBF24',
    };
  }
  if (sceneId === 's09' || sceneId === 's10') {
    return {
      mode: 'neural',
      isLight: false,
      bgTop: PALETTE.neuralBgTop,
      bgBot: PALETTE.neuralBgBot,
      cardBg: PALETTE.neuralCard,
      cardBorder: PALETTE.neuralBorder,
      textPrimary: PALETTE.inkLight,
      textSecondary: '#A5C4D4',
      accent: PALETTE.mint,
      accentAlt: PALETTE.cyan,
      pillBg: 'rgba(52, 211, 153, 0.14)',
      pillBorder: 'rgba(52, 211, 153, 0.45)',
      subBg: 'rgba(5, 12, 18, 0.90)',
      subText: '#F8FAFC',
      subHighlight: '#34D399',
    };
  }
  return {
    mode: 'studio',
    isLight: false,
    bgTop: PALETTE.darkBgTop,
    bgBot: PALETTE.darkBgBot,
    cardBg: PALETTE.darkSurface,
    cardBorder: PALETTE.darkBorder,
    textPrimary: PALETTE.inkLight,
    textSecondary: PALETTE.inkMuted,
    accent: PALETTE.cyan,
    accentAlt: PALETTE.amber,
    pillBg: 'rgba(56, 189, 248, 0.14)',
    pillBorder: 'rgba(56, 189, 248, 0.45)',
    subBg: 'rgba(6, 10, 18, 0.90)',
    subText: '#F8FAFC',
    subHighlight: '#38BDF8',
  };
}

// ============================================================================
// 3. GEOMETRY & SHAPE HELPERS
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

export function drawCard(ctx, x, y, w, h, opts = {}) {
  const {
    radius = 28,
    fill = 'rgba(15, 25, 44, 0.9)',
    stroke = 'rgba(56, 189, 248, 0.3)',
    lineWidth = 2.5,
    shadowColor = 'rgba(0, 0, 0, 0.25)',
    shadowBlur = 24,
    shadowOffsetY = 10,
  } = opts;
  ctx.save();
  if (shadowBlur > 0) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = shadowOffsetY;
  }
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  if (stroke && lineWidth > 0) {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }
}

export function drawTagPill(ctx, cx, cy, text, opts = {}) {
  const {
    font = '700 28px PlusJakarta',
    fill = 'rgba(56, 189, 248, 0.16)',
    stroke = 'rgba(56, 189, 248, 0.5)',
    textColor = '#38BDF8',
    padX = 28,
    height = 54,
    align = 'center',
  } = opts;
  ctx.save();
  ctx.font = font;
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  const x = align === 'left' ? cx : align === 'right' ? cx - w : cx - w / 2;
  const y = cy - height / 2;
  drawCard(ctx, x, y, w, height, {
    radius: height / 2,
    fill,
    stroke,
    lineWidth: 2,
    shadowBlur: 0,
  });
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, cy + 1);
  ctx.restore();
  return { x, y, w, h: height };
}

export function drawArrow(ctx, x1, y1, x2, y2, opts = {}) {
  const {
    color = '#38BDF8',
    width = 5,
    headLen = 20,
    progress = 1,
    dashed = false,
  } = opts;
  const p = clamp01(progress);
  if (p <= 0.01) return;
  const ex = lerp(x1, x2, p);
  const ey = lerp(y1, y2, p);
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  if (p > 0.25) {
    ctx.setLineDash([]);
    const hl = headLen * clamp01((p - 0.25) / 0.35);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl * Math.cos(angle - Math.PI / 6), ey - hl * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(ex - hl * Math.cos(angle + Math.PI / 6), ey - hl * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawCurvedArrow(ctx, x1, y1, cx, cy, x2, y2, opts = {}) {
  const {
    color = '#FBBF24',
    width = 5,
    headLen = 22,
    progress = 1,
    dashed = false,
  } = opts;
  const p = clamp01(progress);
  if (p <= 0.01) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([16, 12]);

  const steps = Math.max(8, Math.round(48 * p));
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * p;
    const mt = 1 - t;
    const px = mt * mt * x1 + 2 * mt * t * cx + t * t * x2;
    const py = mt * mt * y1 + 2 * mt * t * cy + t * t * y2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  if (p > 0.3) {
    ctx.setLineDash([]);
    const t = p;
    const mt = 1 - t;
    const ex = mt * mt * x1 + 2 * mt * t * cx + t * t * x2;
    const ey = mt * mt * y1 + 2 * mt * t * cy + t * t * y2;
    const dx = 2 * mt * (cx - x1) + 2 * t * (x2 - cx);
    const dy = 2 * mt * (cy - y1) + 2 * t * (y2 - cy);
    const angle = Math.atan2(dy, dx);
    const hl = headLen * clamp01((p - 0.3) / 0.3);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl * Math.cos(angle - Math.PI / 6), ey - hl * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(ex - hl * Math.cos(angle + Math.PI / 6), ey - hl * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawWrappedText(ctx, text, cx, y, maxW, lineHeight, opts = {}) {
  const { align = 'center', maxLines = 10 } = opts;
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
    ctx.fillText(ln, cx, y + idx * lineHeight);
  });
  ctx.restore();
  return lines.length * lineHeight;
}

// ============================================================================
// 4. WORLD BACKGROUNDS (CLEAN EDITORIAL GRIDS — ZERO USELESS PARTICLES)
// ============================================================================
export function drawWorldBackground(ctx, scene, localSec) {
  const theme = worldThemeForScene(scene.id);
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  if (theme.mode === 'studio') {
    // Acoustic Studio Blueprint Grid + Radial Spotlight
    const spot = ctx.createRadialGradient(WIDTH / 2, 1140, 80, WIDTH / 2, 1140, 980);
    spot.addColorStop(0, 'rgba(56, 189, 248, 0.11)');
    spot.addColorStop(0.6, 'rgba(14, 116, 144, 0.04)');
    spot.addColorStop(1, 'rgba(6, 10, 18, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.055)';
    ctx.lineWidth = 1.5;
    const step = 90;
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
    // Precision calibration crosshairs
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 2;
    for (const [cx, cy] of [[180, 560], [1260, 560], [180, 1800], [1260, 1800]]) {
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy);
      ctx.lineTo(cx + 18, cy);
      ctx.moveTo(cx, cy - 18);
      ctx.lineTo(cx, cy + 18);
      ctx.stroke();
    }
  } else if (theme.mode === 'atlas') {
    // Anatomical Medical Atlas ruled grid & border frame
    ctx.strokeStyle = 'rgba(148, 127, 94, 0.13)';
    ctx.lineWidth = 1.5;
    for (let x = 60; x < WIDTH; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 120);
      ctx.lineTo(x, HEIGHT - 160);
      ctx.stroke();
    }
    for (let y = 120; y < HEIGHT - 160; y += 60) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(WIDTH - 60, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(148, 127, 94, 0.35)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 44, 150, WIDTH - 88, HEIGHT - 330, 32);
    ctx.stroke();
  } else if (theme.mode === 'archive') {
    // 1966 Psychology Dossier lined paper + double archive margin
    ctx.strokeStyle = 'rgba(141, 123, 90, 0.14)';
    ctx.lineWidth = 1.5;
    for (let y = 200; y < HEIGHT - 200; y += 56) {
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.lineTo(WIDTH - 64, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(153, 27, 27, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(116, 160);
    ctx.lineTo(116, HEIGHT - 200);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(115, 96, 66, 0.42)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 48, 155, WIDTH - 96, HEIGHT - 340, 18);
    ctx.stroke();
  } else {
    // Neural Emerald-Indigo insight world with gentle acoustic horizon
    const glow = ctx.createRadialGradient(WIDTH / 2, 1100, 60, WIDTH / 2, 1100, 920);
    glow.addColorStop(0, 'rgba(52, 211, 153, 0.13)');
    glow.addColorStop(0.55, 'rgba(56, 189, 248, 0.05)');
    glow.addColorStop(1, 'rgba(5, 14, 19, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle concentric calibration arcs centered on stage
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.075)';
    ctx.lineWidth = 2;
    const pulse = Math.sin(localSec * 1.2) * 8;
    for (let r = 240; r <= 720; r += 160) {
      ctx.beginPath();
      ctx.arc(WIDTH / 2, 1160, r + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ============================================================================
// 5. SHARED CHROME: HEADER, HEADLINE, FACT PILL, SUBTITLE KARAOKE
// ============================================================================
export function drawHeaderAndHeadline(ctx, scene, sceneIdx, totalScenes, localSec, globalSec, totalDurSec) {
  const theme = worldThemeForScene(scene.id);
  const enter = beat(localSec, 0.0, 0.42, easeOutCubic);

  ctx.save();
  ctx.globalAlpha = enter;

  // Top progress bar across entire Short
  const barX = 80;
  const barY = 178;
  const barW = WIDTH - 160;
  ctx.fillStyle = theme.isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(248, 250, 252, 0.12)';
  roundRectPath(ctx, barX, barY, barW, 8, 4);
  ctx.fill();

  const overallP = clamp01(globalSec / Math.max(0.1, totalDurSec));
  ctx.fillStyle = theme.accent;
  roundRectPath(ctx, barX, barY, Math.max(12, barW * overallP), 8, 4);
  ctx.fill();

  // Chapter pill + Counter pill
  drawTagPill(ctx, barX, 232, `${scene.chapter} · ${scene.badge}`, {
    align: 'left',
    font: '700 25px JetMono',
    fill: theme.pillBg,
    stroke: theme.pillBorder,
    textColor: theme.accent,
    padX: 24,
    height: 48,
  });

  ctx.font = '700 26px JetMono';
  ctx.fillStyle = theme.textSecondary;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${String(sceneIdx + 1).padStart(2, '0')} / ${String(totalScenes).padStart(2, '0')}`, WIDTH - 80, 232);

  // Editorial Headline (supports highlight word coloring)
  const slideY = (1 - enter) * 18;
  const maxW = WIDTH - 150;
  ctx.font = '800 60px PlusJakarta';
  const words = scene.headline.split(/\s+/);
  const hlSet = new Set(
    (scene.highlightWords || []).flatMap((ph) => ph.toUpperCase().split(/\s+/)),
  );

  // Word-wrap into lines with per-word color tracking
  const lines = [];
  let curLine = [];
  let curWidth = 0;
  const spaceW = ctx.measureText(' ').width;
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    const nextW = curLine.length === 0 ? ww : curWidth + spaceW + ww;
    if (nextW > maxW && curLine.length > 0) {
      lines.push({ words: curLine, width: curWidth });
      curLine = [{ text: w, width: ww, highlight: hlSet.has(w.replace(/[^A-Z0-9.%/-]/gi, '').toUpperCase()) }];
      curWidth = ww;
    } else {
      curLine.push({ text: w, width: ww, highlight: hlSet.has(w.replace(/[^A-Z0-9.%/-]/gi, '').toUpperCase()) });
      curWidth = nextW;
    }
  }
  if (curLine.length > 0) lines.push({ words: curLine, width: curWidth });

  const startY = (lines.length >= 3 ? 286 : 302) + slideY;
  const lineH = 72;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  lines.forEach((ln, li) => {
    let x = (WIDTH - ln.width) / 2;
    const y = startY + li * lineH;
    ln.words.forEach((wd) => {
      if (wd.highlight) {
        ctx.fillStyle = theme.isLight
          ? (scene.id === 's07' || scene.id === 's08' ? 'rgba(153, 27, 27, 0.13)' : 'rgba(3, 105, 161, 0.13)')
          : 'rgba(56, 189, 248, 0.16)';
        roundRectPath(ctx, x - 8, y - 3, wd.width + 16, 66, 12);
        ctx.fill();
        ctx.fillStyle = theme.accent;
      } else {
        ctx.fillStyle = theme.textPrimary;
      }
      ctx.fillText(wd.text, x, y);
      x += wd.width + spaceW;
    });
  });

  // Thin editorial divider below headline
  const divY = startY + lines.length * lineH + 14;
  ctx.strokeStyle = theme.isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(248, 250, 252, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, divY);
  ctx.lineTo(WIDTH - 140, divY);
  ctx.stroke();

  ctx.restore();
}

export function drawFooterFactAndSubtitles(ctx, scene, localSec) {
  const theme = worldThemeForScene(scene.id);
  const pillAppear = beat(localSec, 0.35, 0.5, easeOutCubic);

  // Fact Pill + Academic Citation strip at y = 1865..1965
  ctx.save();
  ctx.globalAlpha = pillAppear;
  drawCard(ctx, 80, 1862, WIDTH - 160, 102, {
    radius: 22,
    fill: theme.cardBg,
    stroke: theme.cardBorder,
    lineWidth: 2,
    shadowBlur: 14,
    shadowOffsetY: 6,
  });

  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(122, 1898, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 31px PlusJakarta';
  ctx.fillStyle = theme.textPrimary;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(scene.factPill, 148, 1898);

  ctx.font = '500 22px JetMono';
  ctx.fillStyle = theme.textSecondary;
  ctx.fillText(`Sumber: ${scene.source}`, 148, 1938);
  ctx.restore();

  // Karaoke Word-Synced Subtitle Strip at y = 1990..2220 (above bottom 340px safe zone)
  const words = scene.words || [];
  if (words.length === 0) return;

  let activeIdx = 0;
  for (let i = 0; i < words.length; i++) {
    if (localSec >= words[i].start) activeIdx = i;
  }

  // Group into balanced 6-word visual windows
  const chunkSize = 6;
  const chunkIdx = Math.floor(activeIdx / chunkSize);
  const slice = words.slice(chunkIdx * chunkSize, chunkIdx * chunkSize + chunkSize);
  if (slice.length === 0) return;

  ctx.save();
  ctx.font = '700 42px PlusJakarta';
  const maxSubW = WIDTH - 200;
  const spaceW = ctx.measureText(' ').width;

  const lines = [];
  let line = [];
  let lw = 0;
  for (const w of slice) {
    const ww = ctx.measureText(w.word).width;
    const nw = line.length === 0 ? ww : lw + spaceW + ww;
    if (nw > maxSubW && line.length > 0) {
      lines.push({ items: line, width: lw });
      line = [{ ...w, ww }];
      lw = ww;
    } else {
      line.push({ ...w, ww });
      lw = nw;
    }
  }
  if (line.length > 0) lines.push({ items: line, width: lw });

  const boxH = lines.length === 1 ? 94 : 154;
  const boxW = Math.min(WIDTH - 120, Math.max(...lines.map((l) => l.width)) + 76);
  const boxX = (WIDTH - boxW) / 2;
  const boxY = 2000;

  drawCard(ctx, boxX, boxY, boxW, boxH, {
    radius: 26,
    fill: theme.subBg,
    stroke: theme.isLight ? 'rgba(255,255,255,0.18)' : theme.cardBorder,
    lineWidth: 2,
    shadowColor: 'rgba(0,0,0,0.35)',
    shadowBlur: 22,
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  lines.forEach((ln, li) => {
    let x = (WIDTH - ln.width) / 2;
    const cy = boxY + (lines.length === 1 ? boxH / 2 : 46 + li * 60);
    for (const item of ln.items) {
      const isActive = localSec >= item.start && localSec <= item.end + 0.14;
      const isSpoken = localSec > item.end + 0.14;
      if (isActive) {
        ctx.fillStyle = theme.subHighlight;
      } else if (isSpoken) {
        ctx.fillStyle = theme.subText;
      } else {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.52)';
      }
      ctx.fillText(item.word, x, cy);
      x += item.ww + spaceW;
    }
  });
  ctx.restore();
}

// ============================================================================
// 6. DOMAIN-SPECIFIC EXPLANATORY SCIENTIFIC VECTOR PRIMITIVES
// ============================================================================

/**
 * Draws a crisp anatomical human head & neck sagittal silhouette with jawbone,
 * skull cranium, vocal tract/larynx, outer ear canal, eardrum, ossicles, & spiral cochlea.
 */
export function drawHeadEarAnatomy(ctx, cx, cy, scale, opts = {}) {
  const {
    skullHighlight = 0,
    airWaveHighlight = 0,
    boneWaveHighlight = 0,
    cochleaPulse = 0,
    isLight = true,
    showInnerEar = true,
  } = opts;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const strokeMain = isLight ? '#1E293B' : '#CBD5E1';
  const skullFill = isLight
    ? `rgba(226, 214, 189, ${0.55 + skullHighlight * 0.35})`
    : `rgba(30, 41, 59, ${0.72 + skullHighlight * 0.25})`;
  const boneStroke = skullHighlight > 0.2
    ? (isLight ? '#B45309' : '#FBBF24')
    : (isLight ? '#78716C' : '#64748B');

  // Cranium + Face Profile (facing LEFT, ear positioned right-of-center)
  ctx.beginPath();
  ctx.moveTo(-40, 220); // neck front
  ctx.lineTo(-42, 145);
  ctx.quadraticCurveTo(-110, 140, -140, 108); // jaw chin
  ctx.lineTo(-148, 72); // lower lip
  ctx.lineTo(-125, 62); // mouth gap
  ctx.lineTo(-152, 48); // upper lip
  ctx.lineTo(-174, 10); // nose tip
  ctx.lineTo(-146, -40); // nose bridge
  ctx.quadraticCurveTo(-158, -110, -120, -170); // forehead
  ctx.bezierCurveTo(-60, -255, 130, -250, 185, -135); // top & back cranium
  ctx.bezierCurveTo(222, -45, 198, 75, 128, 135); // occiput & neck back
  ctx.lineTo(116, 220);
  ctx.closePath();

  ctx.fillStyle = skullFill;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = strokeMain;
  ctx.stroke();

  // Inner Cranial Vault (Skull Bone Ring)
  ctx.beginPath();
  ctx.ellipse(24, -76, 138, 120, -0.1, 0, Math.PI * 2);
  ctx.lineWidth = 10 + skullHighlight * 6;
  ctx.strokeStyle = boneStroke;
  ctx.stroke();

  // Mandible / Jawbone connecting vocal region toward temporal bone
  ctx.beginPath();
  ctx.moveTo(-125, 102);
  ctx.quadraticCurveTo(-30, 118, 22, 62);
  ctx.lineTo(48, 8);
  ctx.lineWidth = 11 + boneWaveHighlight * 6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = boneWaveHighlight > 0.1
    ? (isLight ? '#D97706' : '#FBBF24')
    : (isLight ? '#94A3B8' : '#475569');
  ctx.stroke();

  // Vocal Cords / Larynx inside throat
  ctx.save();
  ctx.translate(-22, 162);
  const vib = Math.sin(cochleaPulse * 12) * 4;
  ctx.fillStyle = isLight ? '#BE123C' : '#FB7185';
  roundRectPath(ctx, -22, -14, 44, 28, 10);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-12, -4 - vib * 0.4);
  ctx.lineTo(12, -4 + vib * 0.4);
  ctx.moveTo(-12, 4 + vib * 0.4);
  ctx.lineTo(12, 4 - vib * 0.4);
  ctx.stroke();
  ctx.restore();

  if (showInnerEar) {
    // Outer Ear Canal (Pinna -> Meatus -> Eardrum)
    const earX = 95;
    const earY = 12;

    // Ear Canal tube
    ctx.beginPath();
    ctx.moveTo(earX + 26, earY - 12);
    ctx.lineTo(earX - 24, earY - 9);
    ctx.lineTo(earX - 24, earY + 11);
    ctx.lineTo(earX + 26, earY + 14);
    ctx.fillStyle = isLight ? '#F1F5F9' : '#0F172A';
    ctx.fill();
    ctx.strokeStyle = airWaveHighlight > 0.2 ? '#0284C7' : strokeMain;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Eardrum (Tympanic Membrane)
    ctx.save();
    ctx.translate(earX - 25, earY + 1);
    ctx.rotate(-0.2);
    ctx.fillStyle = airWaveHighlight > 0.2 ? '#38BDF8' : '#FDA4AF';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ossicles (3 tiny middle-ear bones: Malleus, Incus, Stapes)
    ctx.strokeStyle = isLight ? '#475569' : '#E2E8F0';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(earX - 28, earY);
    ctx.lineTo(earX - 42, earY - 10);
    ctx.lineTo(earX - 54, earY + 2);
    ctx.stroke();

    // Spiral Cochlea (snail-shell inner ear organ)
    ctx.save();
    ctx.translate(earX - 72, earY - 2);
    if (cochleaPulse > 0) {
      const rPulse = 22 + Math.sin(cochleaPulse * 6) * 4;
      ctx.fillStyle = isLight ? 'rgba(15, 118, 110, 0.22)' : 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, rPulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = isLight ? '#0F766E' : '#34D399';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 4.2; a += 0.2) {
      const rr = 2 + (a / (Math.PI * 4.2)) * 18;
      const sx = Math.cos(a) * rr;
      const sy = Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws an animated frequency spectrum / equalizer bars chart for scientific comparisons.
 */
export function drawFrequencySpectrum(ctx, x, y, w, h, opts = {}) {
  const {
    bars = 24,
    mode = 'head', // 'head' (bass boosted) | 'mic' (flat/thin) | 'lowpass'
    phase = 0,
    reveal = 1,
    isLight = false,
    title = '',
    accentLow = '#FBBF24',
    accentHigh = '#38BDF8',
  } = opts;

  ctx.save();
  drawCard(ctx, x, y, w, h, {
    radius: 24,
    fill: isLight ? '#FFFFFF' : 'rgba(12, 21, 38, 0.92)',
    stroke: isLight ? 'rgba(148, 127, 94, 0.45)' : 'rgba(56, 189, 248, 0.28)',
    lineWidth: 2,
    shadowBlur: 12,
  });

  if (title) {
    ctx.font = '700 26px JetMono';
    ctx.fillStyle = isLight ? '#1E293B' : '#E2E8F0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, x + 28, y + 22);
  }

  const plotX = x + 32;
  const plotY = y + 66;
  const plotW = w - 64;
  const plotH = h - 114;
  const gap = 8;
  const barW = (plotW - gap * (bars - 1)) / bars;

  // Baseline axis
  ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(248, 250, 252, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  for (let i = 0; i < bars; i++) {
    const norm = i / (bars - 1);
    const wave = 0.82 + 0.18 * Math.sin(phase * 5 + i * 0.65);
    let amp = 0.5;
    if (mode === 'head') {
      // Strong bass below 1,000 Hz (first ~40% of bars)
      amp = norm < 0.42 ? 0.92 - norm * 0.45 : Math.max(0.18, 0.62 - (norm - 0.42) * 0.72);
    } else if (mode === 'mic') {
      // No skull bass boost: weaker lows, prominent mids/highs
      amp = norm < 0.3 ? 0.28 + norm * 0.5 : 0.68 - Math.abs(norm - 0.58) * 0.45;
    } else {
      // Low-pass filter steep dropoff
      amp = norm < 0.36 ? 0.90 : Math.max(0.12, 0.90 * Math.exp(-(norm - 0.36) * 4.5));
    }

    const barReveal = clamp01((reveal * bars - i * 0.4) / 3);
    const bh = Math.max(10, plotH * amp * wave * barReveal);
    const bx = plotX + i * (barW + gap);
    const by = plotY + plotH - bh;

    ctx.fillStyle = norm < 0.38 ? accentLow : accentHigh;
    roundRectPath(ctx, bx, by, barW, bh, Math.min(6, barW / 2));
    ctx.fill();
  }

  // Frequency labels
  ctx.font = '600 20px JetMono';
  ctx.fillStyle = isLight ? '#64748B' : '#94A3B8';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('80 Hz (Bass)', plotX, plotY + plotH + 10);
  ctx.textAlign = 'center';
  ctx.fillText('1.000 Hz', plotX + plotW * 0.38, plotY + plotH + 10);
  ctx.textAlign = 'right';
  ctx.fillText('4.000+ Hz (Tinggi)', plotX + plotW, plotY + plotH + 10);

  ctx.restore();
}

/**
 * Draws a crisp continuous sine/modulated acoustic waveform inside any bounding box.
 */
export function drawAcousticWaveform(ctx, x, y, w, h, opts = {}) {
  const {
    color = '#38BDF8',
    lineWidth = 4,
    freq = 6,
    phase = 0,
    amp = 0.75,
    harmonics = 0.3,
    progress = 1,
    fillUnder = false,
  } = opts;
  const p = clamp01(progress);
  if (p <= 0.01) return;

  ctx.save();
  const midY = y + h / 2;
  const maxAmp = (h / 2) * amp;
  const steps = Math.max(32, Math.round(140 * p));

  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * p;
    const px = x + t * w;
    const env = Math.sin(t * Math.PI);
    const s =
      Math.sin(t * Math.PI * 2 * freq - phase) +
      harmonics * Math.sin(t * Math.PI * 2 * freq * 2.3 - phase * 1.4);
    const py = midY + s * (maxAmp / (1 + harmonics)) * (0.35 + 0.65 * env);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  if (fillUnder) {
    ctx.lineTo(x + w * p, midY);
    ctx.lineTo(x, midY);
    ctx.closePath();
    ctx.globalAlpha *= 0.16;
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws a clean Studio Condenser / Smartphone Microphone vector schematic.
 */
export function drawMicrophoneVector(ctx, cx, cy, scale, opts = {}) {
  const { color = '#38BDF8', isLight = false, pulse = 0 } = opts;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Subtle capture cone
  if (pulse > 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (let r = 1; r <= 3; r++) {
      const prog = (pulse + r * 0.33) % 1;
      ctx.globalAlpha = (1 - prog) * 0.55;
      ctx.beginPath();
      ctx.arc(0, -34, 42 + prog * 68, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Mic capsule head
  roundRectPath(ctx, -30, -86, 60, 88, 30);
  ctx.fillStyle = isLight ? '#1E293B' : '#1E293B';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();

  // Grille lines
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.38)';
  ctx.lineWidth = 2.5;
  for (let gy = -62; gy <= -18; gy += 11) {
    ctx.beginPath();
    ctx.moveTo(-20, gy);
    ctx.lineTo(20, gy);
    ctx.stroke();
  }

  // U-mount yoke & stand
  ctx.strokeStyle = isLight ? '#334155' : '#94A3B8';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -18, 44, 0, Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.lineTo(0, 72);
  ctx.moveTo(-36, 72);
  ctx.lineTo(36, 72);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a crisp Donut / Ring Gauge for percentages (e.g., 38% vs 62%).
 */
export function drawRingGauge(ctx, cx, cy, radius, pct, opts = {}) {
  const {
    thickness = 28,
    fillColor = '#991B1B',
    trackColor = 'rgba(15, 23, 42, 0.12)',
    label = '',
    subLabel = '',
    textColor = '#1F1B16',
    progress = 1,
  } = opts;
  const p = clamp01(progress);
  const shownPct = pct * p;

  ctx.save();
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';

  ctx.strokeStyle = trackColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = fillColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (shownPct / 100));
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 72px PlusJakarta';
  ctx.fillText(`${Math.round(shownPct)}%`, cx, cy - 12);

  if (label) {
    ctx.font = '700 24px JetMono';
    ctx.fillStyle = fillColor;
    ctx.fillText(label, cx, cy + 44);
  }
  if (subLabel) {
    ctx.font = '600 24px PlusJakarta';
    ctx.fillStyle = textColor;
    ctx.fillText(subLabel, cx, cy + radius + 44);
  }
  ctx.restore();
}

/**
 * Draws a Smartphone WhatsApp Voice-Note UI Card (used in s01 hook & s06 comparison).
 */
export function drawVoiceNoteCard(ctx, x, y, w, h, opts = {}) {
  const {
    playProgress = 0.5,
    durationLabel = '0:14',
    sender = 'Kamu · Voice Note',
    accent = '#25D366',
    wavePhase = 0,
    isPlaying = true,
  } = opts;

  ctx.save();
  // Phone frame
  drawCard(ctx, x, y, w, h, {
    radius: 44,
    fill: '#0B141A',
    stroke: 'rgba(148, 163, 184, 0.45)',
    lineWidth: 4,
    shadowColor: 'rgba(0,0,0,0.45)',
    shadowBlur: 34,
  });

  // Top WhatsApp header bar
  roundRectPath(ctx, x + 16, y + 16, w - 32, 94, 30);
  ctx.fillStyle = '#1F2C34';
  ctx.fill();

  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.arc(x + 76, y + 63, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 24px PlusJakarta';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VN', x + 76, y + 64);

  ctx.textAlign = 'left';
  ctx.font = '700 28px PlusJakarta';
  ctx.fillStyle = '#E9EDEF';
  ctx.fillText(sender, x + 118, y + 52);

  ctx.font = '500 22px JetMono';
  ctx.fillStyle = '#8696A0';
  ctx.fillText(isPlaying ? 'Memutar rekaman suara...' : 'Terkirim · 19:42', x + 118, y + 84);

  // Outgoing green Voice Note bubble
  const bubX = x + 46;
  const bubY = y + 150;
  const bubW = w - 92;
  const bubH = 148;
  drawCard(ctx, bubX, bubY, bubW, bubH, {
    radius: 26,
    fill: '#005C4B',
    stroke: 'rgba(52, 211, 153, 0.35)',
    lineWidth: 2,
    shadowBlur: 10,
  });

  // Play / Pause circle button
  const btnX = bubX + 58;
  const btnY = bubY + bubH / 2;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(btnX, btnY, 32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#062019';
  if (isPlaying) {
    ctx.fillRect(btnX - 10, btnY - 12, 7, 24);
    ctx.fillRect(btnX + 3, btnY - 12, 7, 24);
  } else {
    ctx.beginPath();
    ctx.moveTo(btnX - 7, btnY - 13);
    ctx.lineTo(btnX + 15, btnY);
    ctx.lineTo(btnX - 7, btnY + 13);
    ctx.closePath();
    ctx.fill();
  }

  // Interactive Voice-Note Bars
  const barCount = 30;
  const barStartX = bubX + 116;
  const barAreaW = bubW - 150;
  const step = barAreaW / barCount;
  for (let i = 0; i < barCount; i++) {
    const frac = i / barCount;
    const hBase = 16 + ((Math.sin(i * 1.9) * 0.5 + 0.5) * 44);
    const live = isPlaying && Math.abs(frac - playProgress) < 0.08 ? Math.sin(wavePhase * 10 + i) * 8 : 0;
    const bh = Math.max(10, hBase + live);
    const active = frac <= playProgress;
    ctx.fillStyle = active ? '#53BDEB' : 'rgba(233, 237, 239, 0.36)';
    roundRectPath(ctx, barStartX + i * step, btnY - bh / 2, step * 0.56, bh, 3);
    ctx.fill();
  }

  ctx.font = '600 22px JetMono';
  ctx.fillStyle = 'rgba(233, 237, 239, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(durationLabel, barStartX, bubY + bubH - 22);

  ctx.restore();
}

/**
 * Draws an archival 1966 APA Monograph / Study Dossier card.
 */
export function drawResearchPaperCard(ctx, x, y, w, h, opts = {}) {
  const {
    year = '1966',
    authors = 'Philip S. Holzman & Clyde Rousey',
    journal = 'Journal of Personality and Social Psychology',
    term = 'VOICE CONFRONTATION',
    summary = 'Reaksi terkejut & penolakan psikologis saat mendengar suara sendiri dari luar kepala.',
    reveal = 1,
  } = opts;

  ctx.save();
  ctx.globalAlpha = clamp01(reveal);
  drawCard(ctx, x, y, w, h, {
    radius: 18,
    fill: '#FAF5E8',
    stroke: '#8D7B5A',
    lineWidth: 3,
    shadowColor: 'rgba(31, 27, 22, 0.22)',
    shadowBlur: 24,
  });

  // Top classification header
  ctx.fillStyle = '#1F1B16';
  ctx.fillRect(x + 36, y + 34, w - 72, 4);

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#5C5040';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`ARSIP STUDI PSIKOLOGI · TAHUN ${year}`, x + 36, y + 52);

  // Red archive stamp
  ctx.save();
  ctx.translate(x + w - 135, y + 96);
  ctx.rotate(-0.09);
  ctx.strokeStyle = '#991B1B';
  ctx.lineWidth = 4;
  roundRectPath(ctx, -108, -28, 216, 56, 8);
  ctx.stroke();
  ctx.font = '800 24px JetMono';
  ctx.fillStyle = '#991B1B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TERVERIFIKASI', 0, 1);
  ctx.restore();

  // Paper Title
  ctx.font = '700 44px Playfair';
  ctx.fillStyle = '#1F1B16';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`"${term}"`, x + 36, y + 106);

  ctx.font = '700 30px PlusJakarta';
  ctx.fillStyle = '#0F4C81';
  ctx.fillText(authors, x + 36, y + 174);

  ctx.font = '600 24px JetMono';
  ctx.fillStyle = '#5C5040';
  ctx.fillText(journal, x + 36, y + 218);

  ctx.strokeStyle = 'rgba(141, 123, 90, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 36, y + 264);
  ctx.lineTo(x + w - 36, y + 264);
  ctx.stroke();

  ctx.font = '500 30px PlusJakarta';
  ctx.fillStyle = '#2D2720';
  drawWrappedText(ctx, summary, x + 36, y + 286, w - 72, 42, { align: 'left', maxLines: 4 });

  ctx.restore();
}

/**
 * Draws a crisp Reel-to-Reel 1966 Analog Tape Recorder vector graphic.
 */
export function drawReelToReelRecorder(ctx, cx, cy, scale, spinSec) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  drawCard(ctx, -230, -145, 460, 290, {
    radius: 22,
    fill: '#2C2621',
    stroke: '#8D7B5A',
    lineWidth: 4,
    shadowBlur: 18,
  });

  // Two spinning tape reels
  for (const rx of [-106, 106]) {
    ctx.save();
    ctx.translate(rx, -20);
    ctx.rotate(spinSec * 2.2);

    ctx.fillStyle = '#D6C7A9';
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1F1B16';
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fill();

    // 3 spool cutouts
    ctx.fillStyle = '#2C2621';
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 65, Math.sin(a) * 65, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Tape ribbon passing across playhead
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-165, 36);
  ctx.lineTo(-90, 96);
  ctx.lineTo(90, 96);
  ctx.lineTo(165, 36);
  ctx.stroke();

  // Magnetic Playhead & VU meter bar
  roundRectPath(ctx, -64, 78, 128, 42, 8);
  ctx.fillStyle = '#EFE7D4';
  ctx.fill();
  ctx.strokeStyle = '#5C5040';
  ctx.lineWidth = 2;
  ctx.stroke();

  const needleA = -0.35 + Math.sin(spinSec * 7) * 0.28;
  ctx.strokeStyle = '#991B1B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 114);
  ctx.lineTo(Math.sin(needleA) * 30, 114 - Math.cos(needleA) * 30);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws an animated Bode / Low-Pass Filter Response Curve (showing bone resonance < 1000 Hz).
 */
export function drawLowPassFilterGraph(ctx, x, y, w, h, opts = {}) {
  const { progress = 1, phase = 0, isLight = true } = opts;
  const p = clamp01(progress);

  ctx.save();
  drawCard(ctx, x, y, w, h, {
    radius: 26,
    fill: isLight ? '#FFFDF8' : '#0E1726',
    stroke: isLight ? 'rgba(148, 127, 94, 0.5)' : 'rgba(56, 189, 248, 0.3)',
    lineWidth: 2.5,
    shadowBlur: 16,
  });

  const gx = x + 90;
  const gy = y + 78;
  const gw = w - 135;
  const gh = h - 154;

  // Grid lines
  ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.10)' : 'rgba(248, 250, 252, 0.10)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 4; i++) {
    const yy = gy + (gh * i) / 4;
    ctx.beginPath();
    ctx.moveTo(gx, yy);
    ctx.lineTo(gx + gw, yy);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const xx = gx + (gw * i) / 4;
    ctx.beginPath();
    ctx.moveTo(xx, gy);
    ctx.lineTo(xx, gy + gh);
    ctx.stroke();
  }

  // Highlighted Bass Zone (< 1000 Hz = left 42%)
  const cutoffX = gx + gw * 0.42;
  ctx.fillStyle = 'rgba(217, 119, 6, 0.13)';
  ctx.fillRect(gx, gy, cutoffX - gx, gh);

  // Cutoff dashed vertical line at 1,000 Hz
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(cutoffX, gy);
  ctx.lineTo(cutoffX, gy + gh);
  ctx.stroke();
  ctx.setLineDash([]);

  // Air Conduction flat reference curve (dashed blue)
  ctx.strokeStyle = '#0369A1';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * p;
    const px = gx + t * gw;
    const normY = 0.56 - 0.12 * Math.sin(t * Math.PI);
    const py = gy + normY * gh;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Bone Conduction Low-Pass Curve (thick amber)
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * p;
    const px = gx + t * gw;
    const boost = t < 0.42
      ? 0.14 + 0.04 * Math.sin(phase * 4 + t * 8)
      : 0.14 + 0.68 * (1 - Math.exp(-(t - 0.42) * 5.2));
    const py = gy + boost * gh;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Labels
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#B45309';
  ctx.textAlign = 'center';
  ctx.fillText('ZONA BASS (< 1.000 Hz)', (gx + cutoffX) / 2, gy + 26);

  ctx.fillStyle = '#0369A1';
  ctx.fillText('1.000 Hz CUTOFF', cutoffX, gy - 18);

  ctx.font = '600 21px JetMono';
  ctx.fillStyle = isLight ? '#475569' : '#94A3B8';
  ctx.textAlign = 'left';
  ctx.fillText('100 Hz', gx, gy + gh + 26);
  ctx.textAlign = 'center';
  ctx.fillText('1.000 Hz', cutoffX, gy + gh + 26);
  ctx.textAlign = 'right';
  ctx.fillText('8.000 Hz', gx + gw, gy + gh + 26);

  ctx.save();
  ctx.translate(x + 36, gy + gh / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('ENERGI SUARA (dB)', 0, 0);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws a clean dual-node speed race bar comparing 340 m/s Air vs 3,000 m/s Bone.
 */
export function drawSpeedComparisonTrack(ctx, x, y, w, h, opts = {}) {
  const { airProgress = 1, boneProgress = 1, isLight = true } = opts;
  ctx.save();
  drawCard(ctx, x, y, w, h, {
    radius: 24,
    fill: isLight ? '#FFFDF8' : '#0E1726',
    stroke: isLight ? 'rgba(148, 127, 94, 0.45)' : 'rgba(56, 189, 248, 0.32)',
    lineWidth: 2,
    shadowBlur: 12,
  });

  const padX = 36;
  const trackX = x + padX;
  const trackW = w - padX * 2;

  // Track 1: Air (340 m/s) -> ~11.3% of 3000 scale, shown clearly as slower reference
  ctx.font = '700 24px JetMono';
  ctx.fillStyle = '#0369A1';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('JALUR UDARA (AIR CONDUCTION) — 340 m/detik', trackX, y + 26);

  roundRectPath(ctx, trackX, y + 62, trackW, 30, 15);
  ctx.fillStyle = isLight ? 'rgba(3, 105, 161, 0.12)' : 'rgba(56, 189, 248, 0.14)';
  ctx.fill();

  const airFillW = Math.max(36, trackW * 0.24 * clamp01(airProgress));
  roundRectPath(ctx, trackX, y + 62, airFillW, 30, 15);
  ctx.fillStyle = '#0284C7';
  ctx.fill();

  // Track 2: Bone (3,000 m/s) -> ~9x faster
  ctx.fillStyle = '#B45309';
  ctx.fillText('JALUR TULANG (BONE CONDUCTION) — ~3.000 m/detik (8.8× LEBIH CEPAT)', trackX, y + 114);

  roundRectPath(ctx, trackX, y + 150, trackW, 30, 15);
  ctx.fillStyle = isLight ? 'rgba(180, 83, 9, 0.12)' : 'rgba(251, 191, 36, 0.14)';
  ctx.fill();

  const boneFillW = Math.max(36, trackW * 0.96 * clamp01(boneProgress));
  roundRectPath(ctx, trackX, y + 150, boneFillW, 30, 15);
  ctx.fillStyle = '#D97706';
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a crisp Callout Badge Box with connector dot.
 */
export function drawCalloutBox(ctx, x, y, w, h, title, detail, opts = {}) {
  const {
    accent = '#38BDF8',
    bg = 'rgba(15, 25, 44, 0.94)',
    textColor = '#F8FAFC',
    subColor = '#94A3B8',
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 16;
  drawCard(ctx, x, y + dy, w, h, {
    radius: 20,
    fill: bg,
    stroke: accent,
    lineWidth: 2.5,
    shadowBlur: 14,
  });

  ctx.fillStyle = accent;
  roundRectPath(ctx, x + 16, y + dy + 16, 8, h - 32, 4);
  ctx.fill();

  ctx.font = '800 28px PlusJakarta';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + 38, y + dy + 22);

  ctx.font = '500 27px PlusJakarta';
  ctx.fillStyle = subColor;
  drawWrappedText(ctx, detail, x + 38, y + dy + 64, w - 64, 37, { align: 'left', maxLines: 5 });

  ctx.restore();
}

// ============================================================================
// 7. SCENE TRANSITIONS (SMOOTH WIPE / IRIS CROSS-WORLD CUTS)
// ============================================================================
export function drawTransitionOverlay(ctx, transitionType, progress) {
  const p = clamp01(progress);
  if (p <= 0 || p >= 1 || transitionType === 'none') return;

  ctx.save();
  if (transitionType === 'iris_cyan') {
    const r = Math.hypot(WIDTH, HEIGHT) * 0.6 * Math.sin(p * Math.PI);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, Math.max(20, r), 0, Math.PI * 2);
    ctx.stroke();
  } else if (transitionType === 'wipe_gold' || transitionType === 'wipe_cyan') {
    const barColor = transitionType === 'wipe_gold' ? 'rgba(251, 191, 36, 0.30)' : 'rgba(56, 189, 248, 0.28)';
    const x = lerp(-240, WIDTH + 240, p);
    const grad = ctx.createLinearGradient(x - 180, 0, x + 180, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, barColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

// ============================================================================
// 8. MASTER FRAME RENDERER & DYNAMIC SCENE LOADER
// ============================================================================
export async function loadSceneModules() {
  const loaded = {};
  const { SCENES_DATA } = await import('./script.mjs');
  for (const sc of SCENES_DATA) {
    const mod = await import(join(SHORT2_DIR, sc.module));
    loaded[sc.id] = mod.renderScene;
  }
  return loaded;
}

export function renderFrameToCanvas(ctx, timeline, sceneRenderers, frameIdx) {
  const globalSec = frameIdx / FPS;
  let sceneIdx = timeline.scenes.length - 1;
  for (let i = 0; i < timeline.scenes.length; i++) {
    const sc = timeline.scenes[i];
    if (frameIdx >= sc.startFrame && frameIdx < sc.endFrame) {
      sceneIdx = i;
      break;
    }
  }
  const scene = timeline.scenes[sceneIdx];
  const localSec = Math.max(0, globalSec - scene.startSec);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawWorldBackground(ctx, scene, localSec);
  drawHeaderAndHeadline(ctx, scene, sceneIdx, timeline.scenes.length, localSec, globalSec, timeline.totalDurationSec);

  const fn = sceneRenderers[scene.id];
  if (fn) {
    fn(ctx, scene, localSec, {
      FPS,
      WIDTH,
      HEIGHT,
      beat,
      clamp01,
      lerp,
      invLerp,
      easeOutCubic,
      easeInOutCubic,
      easeOutQuart,
      easeOutBack,
      easeSpring,
      roundRectPath,
      drawCard,
      drawTagPill,
      drawArrow,
      drawCurvedArrow,
      drawWrappedText,
      drawHeadEarAnatomy,
      drawFrequencySpectrum,
      drawAcousticWaveform,
      drawMicrophoneVector,
      drawRingGauge,
      drawVoiceNoteCard,
      drawResearchPaperCard,
      drawReelToReelRecorder,
      drawLowPassFilterGraph,
      drawSpeedComparisonTrack,
      drawCalloutBox,
      PALETTE,
      worldThemeForScene,
    });
  }

  drawFooterFactAndSubtitles(ctx, scene, localSec);

  // Smooth transition shimmer near end of scene
  const remSec = scene.endSec - globalSec;
  if (remSec < 0.28 && scene.transition && scene.transition !== 'none') {
    drawTransitionOverlay(ctx, scene.transition, 1 - remSec / 0.28);
  }
}

// ============================================================================
// 9. CLI ENTRYPOINT: --scene=s01:0.5 PREVIEW OR FULL 2K 90FPS MP4 RENDER
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
    const frac = fracStr !== undefined ? Number(fracStr) : 0.65;
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

    const previewDir = join(ROOT, 'out', 'short2_previews');
    mkdirSync(previewDir, { recursive: true });
    const outPng = join(previewDir, `${sid}.png`);
    await canvas.toFile(outPng, { format: 'png' });
    console.log(`Preview saved: ${outPng} (frame ${targetFrame} / ${(targetFrame / FPS).toFixed(2)}s)`);
    return;
  }

  // Full 2K 90 FPS render piped as raw RGBA directly to FFmpeg
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

  // Verify full decode integrity
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
