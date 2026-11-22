#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Canvas, FontLibrary } from 'skia-canvas';
import {
  FPS,
  HEIGHT,
  ROOT,
  SHORT3_DIR,
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
  reg('Amiri', '@fontsource/amiri/files/amiri-arabic-400-normal.woff2');
  reg('Amiri', '@fontsource/amiri/files/amiri-arabic-700-normal.woff2');
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
// 2. EASING, TIMING & WORLDS PALETTE
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
  return 1 - Math.exp(-6.5 * x) * Math.cos(9 * x);
};
export const beat = (localSec, startSec, durSec = 0.55, ease = easeOutCubic) =>
  ease(invLerp(startSec, startSec + durSec, localSec));

export const PALETTE = {
  // World A: Forensic Studio Dark (i01, i02, i10)
  vaultBgTop: '#060D0B',
  vaultBgBot: '#0C1B17',
  gold: '#EAB308',
  goldBright: '#FDE047',
  goldDark: '#A16207',
  emerald: '#10B981',
  emeraldBright: '#34D399',
  emeraldDeep: '#064E3B',
  crimson: '#EF4444',
  crimsonDeep: '#991B1B',
  inkLight: '#F8FAFC',
  inkMuted: '#94A3B8',

  // World B: Antique Manuscript & Silk Road Parchment (i03, i04, i05, i06)
  kitabBgTop: '#F5EFE0',
  kitabBgBot: '#E6D8BA',
  kitabCard: '#FFFDF6',
  kitabBorder: '#9A8460',
  kitabInk: '#1C1917',
  kitabMuted: '#57534E',
  kitabCrimson: '#991B1B',
  kitabGold: '#92400E',
  kitabTeal: '#0F766E',

  // World C: Sunnah Dawn Ivory & Pure Light (i07, i08, i09)
  sunnahBgTop: '#FCF9F0',
  sunnahBgBot: '#EFE5CA',
  sunnahInk: '#14261E',
  sunnahMuted: '#475569',
  sunnahEmerald: '#065F46',
  sunnahGold: '#B45309',
  waterBlue: '#0284C7',
  waterLight: '#BAE6FD',
};

export function worldThemeForScene(sceneId) {
  if (sceneId === 'i03' || sceneId === 'i04' || sceneId === 'i05' || sceneId === 'i06') {
    return {
      mode: 'kitab',
      isLight: true,
      bgTop: PALETTE.kitabBgTop,
      bgBot: PALETTE.kitabBgBot,
      cardBg: PALETTE.kitabCard,
      cardBorder: 'rgba(154, 132, 96, 0.50)',
      textPrimary: PALETTE.kitabInk,
      textSecondary: PALETTE.kitabMuted,
      accent: sceneId === 'i06' ? PALETTE.kitabGold : PALETTE.kitabCrimson,
      pillBg: sceneId === 'i06' ? 'rgba(146, 64, 14, 0.12)' : 'rgba(153, 27, 27, 0.11)',
      pillBorder: sceneId === 'i06' ? 'rgba(146, 64, 14, 0.38)' : 'rgba(153, 27, 27, 0.38)',
      subBg: 'rgba(28, 25, 23, 0.92)',
      subText: '#FAF5E8',
      subHighlight: '#FBBF24',
    };
  }
  if (sceneId === 'i07' || sceneId === 'i08' || sceneId === 'i09') {
    const isWarn = sceneId === 'i07';
    return {
      mode: 'sunnah',
      isLight: true,
      bgTop: PALETTE.sunnahBgTop,
      bgBot: PALETTE.sunnahBgBot,
      cardBg: '#FFFFFF',
      cardBorder: isWarn ? 'rgba(153, 27, 27, 0.42)' : 'rgba(6, 95, 70, 0.40)',
      textPrimary: PALETTE.sunnahInk,
      textSecondary: PALETTE.sunnahMuted,
      accent: isWarn ? PALETTE.kitabCrimson : PALETTE.sunnahEmerald,
      pillBg: isWarn ? 'rgba(153, 27, 27, 0.11)' : 'rgba(6, 95, 70, 0.11)',
      pillBorder: isWarn ? 'rgba(153, 27, 27, 0.38)' : 'rgba(6, 95, 70, 0.38)',
      subBg: 'rgba(15, 32, 25, 0.92)',
      subText: '#F8FAFC',
      subHighlight: isWarn ? '#FCA5A5' : '#34D399',
    };
  }
  return {
    mode: 'forensic',
    isLight: false,
    bgTop: PALETTE.vaultBgTop,
    bgBot: PALETTE.vaultBgBot,
    cardBg: 'rgba(13, 28, 24, 0.94)',
    cardBorder: 'rgba(234, 179, 8, 0.36)',
    textPrimary: PALETTE.inkLight,
    textSecondary: '#A7C4BA',
    accent: sceneId === 'i01' ? PALETTE.crimson : PALETTE.emeraldBright,
    pillBg: sceneId === 'i01' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.16)',
    pillBorder: sceneId === 'i01' ? 'rgba(239, 68, 68, 0.48)' : 'rgba(52, 211, 153, 0.48)',
    subBg: 'rgba(6, 14, 12, 0.92)',
    subText: '#F8FAFC',
    subHighlight: sceneId === 'i01' ? '#FDE047' : '#34D399',
  };
}

// ============================================================================
// 3. BASIC GEOMETRY & TEXT HELPERS
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
    radius = 26,
    fill = 'rgba(13, 28, 24, 0.92)',
    stroke = 'rgba(234, 179, 8, 0.35)',
    lineWidth = 2.5,
    shadowColor = 'rgba(0, 0, 0, 0.25)',
    shadowBlur = 22,
    shadowOffsetY = 8,
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

export function drawRubElHizbEmblem(ctx, cx, cy, r, color, lineWidth = 2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  const s = r * 1.414;
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawTagPill(ctx, cx, cy, text, opts = {}) {
  const {
    font = '700 25px JetMono',
    fill = 'rgba(16, 185, 129, 0.16)',
    stroke = 'rgba(16, 185, 129, 0.45)',
    textColor = '#34D399',
    padX = 26,
    height = 50,
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

export function drawArrow(ctx, x1, y1, x2, y2, opts = {}) {
  const {
    color = '#EAB308',
    width = 5,
    headLen = 18,
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
  if (dashed) ctx.setLineDash([12, 10]);
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

// ============================================================================
// 4. WORLD BACKGROUNDS & EDITORIAL CHROME
// ============================================================================
export function drawWorldBackground(ctx, scene) {
  const theme = worldThemeForScene(scene.id);
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  if (theme.mode === 'forensic') {
    const spot = ctx.createRadialGradient(WIDTH / 2, 1120, 80, WIDTH / 2, 1120, 960);
    spot.addColorStop(0, scene.id === 'i01' ? 'rgba(239, 68, 68, 0.13)' : 'rgba(16, 185, 129, 0.13)');
    spot.addColorStop(0.6, 'rgba(234, 179, 8, 0.05)');
    spot.addColorStop(1, 'rgba(6, 13, 11, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = 'rgba(234, 179, 8, 0.22)';
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, 44, 150, WIDTH - 88, HEIGHT - 330, 28);
    ctx.stroke();

    for (const [rx, ry] of [[92, 198], [WIDTH - 92, 198], [92, HEIGHT - 228], [WIDTH - 92, HEIGHT - 228]]) {
      drawRubElHizbEmblem(ctx, rx, ry, 20, 'rgba(234, 179, 8, 0.28)', 2);
    }
  } else if (theme.mode === 'kitab') {
    // Manuscript double border
    ctx.strokeStyle = 'rgba(153, 27, 27, 0.30)';
    ctx.lineWidth = 3.5;
    roundRectPath(ctx, 44, 152, WIDTH - 88, HEIGHT - 334, 22);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(146, 64, 14, 0.34)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 56, 164, WIDTH - 112, HEIGHT - 358, 16);
    ctx.stroke();

    for (const [rx, ry] of [[100, 208], [WIDTH - 100, 208], [100, HEIGHT - 238], [WIDTH - 100, HEIGHT - 238]]) {
      drawRubElHizbEmblem(ctx, rx, ry, 18, 'rgba(146, 64, 14, 0.32)', 2);
    }
  } else {
    const glow = ctx.createRadialGradient(WIDTH / 2, 1080, 60, WIDTH / 2, 1080, 960);
    glow.addColorStop(0, 'rgba(234, 179, 8, 0.14)');
    glow.addColorStop(1, 'rgba(252, 249, 240, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = scene.id === 'i07' ? 'rgba(153, 27, 27, 0.26)' : 'rgba(6, 95, 70, 0.26)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 44, 152, WIDTH - 88, HEIGHT - 334, 28);
    ctx.stroke();

    for (const [rx, ry] of [[96, 204], [WIDTH - 96, 204], [96, HEIGHT - 232], [WIDTH - 96, HEIGHT - 232]]) {
      drawRubElHizbEmblem(
        ctx,
        rx,
        ry,
        18,
        scene.id === 'i07' ? 'rgba(153, 27, 27, 0.30)' : 'rgba(6, 95, 70, 0.30)',
        2,
      );
    }
  }
  ctx.restore();
}

export function drawHeaderAndHeadline(ctx, scene, sceneIdx, totalScenes, localSec, globalSec, totalDurSec) {
  const theme = worldThemeForScene(scene.id);
  const enter = beat(localSec, 0.0, 0.42, easeOutCubic);

  ctx.save();
  ctx.globalAlpha = enter;

  const barX = 96;
  const barY = 182;
  const barW = WIDTH - 192;
  ctx.fillStyle = theme.isLight ? 'rgba(28, 25, 23, 0.12)' : 'rgba(248, 250, 252, 0.14)';
  roundRectPath(ctx, barX, barY, barW, 8, 4);
  ctx.fill();

  const overallP = clamp01(globalSec / Math.max(0.1, totalDurSec));
  ctx.fillStyle = theme.accent;
  roundRectPath(ctx, barX, barY, Math.max(14, barW * overallP), 8, 4);
  ctx.fill();

  drawTagPill(ctx, barX, 236, `${scene.chapter} · ${scene.badge}`, {
    align: 'left',
    font: '700 24px JetMono',
    fill: theme.pillBg,
    stroke: theme.pillBorder,
    textColor: theme.accent,
    padX: 22,
    height: 46,
  });

  ctx.font = '700 25px JetMono';
  ctx.fillStyle = theme.textSecondary;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${String(sceneIdx + 1).padStart(2, '0')} / ${String(totalScenes).padStart(2, '0')}`, WIDTH - 96, 236);

  const slideY = (1 - enter) * 16;
  const maxW = WIDTH - 170;
  ctx.font = '800 58px PlusJakarta';
  const words = scene.headline.split(/\s+/);
  const hlSet = new Set(
    (scene.highlightWords || []).flatMap((ph) => ph.toUpperCase().split(/\s+/)),
  );

  const lines = [];
  let curLine = [];
  let curWidth = 0;
  const spaceW = ctx.measureText(' ').width;
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    const nextW = curLine.length === 0 ? ww : curWidth + spaceW + ww;
    if (nextW > maxW && curLine.length > 0) {
      lines.push({ words: curLine, width: curWidth });
      curLine = [{ text: w, width: ww, highlight: hlSet.has(w.replace(/[^A-Z0-9‘’'-]/gi, '').toUpperCase()) }];
      curWidth = ww;
    } else {
      curLine.push({ text: w, width: ww, highlight: hlSet.has(w.replace(/[^A-Z0-9‘’'-]/gi, '').toUpperCase()) });
      curWidth = nextW;
    }
  }
  if (curLine.length > 0) lines.push({ words: curLine, width: curWidth });

  const startY = (lines.length >= 3 ? 286 : 300) + slideY;
  const lineH = 70;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  lines.forEach((ln, li) => {
    let x = (WIDTH - ln.width) / 2;
    const y = startY + li * lineH;
    ln.words.forEach((wd) => {
      if (wd.highlight) {
        ctx.fillStyle = theme.pillBg;
        roundRectPath(ctx, x - 8, y - 3, wd.width + 16, 64, 12);
        ctx.fill();
        ctx.fillStyle = theme.accent;
      } else {
        ctx.fillStyle = theme.textPrimary;
      }
      ctx.fillText(wd.text, x, y);
      x += wd.width + spaceW;
    });
  });

  const divY = startY + lines.length * lineH + 14;
  ctx.strokeStyle = theme.isLight ? 'rgba(28, 25, 23, 0.14)' : 'rgba(234, 179, 8, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, divY);
  ctx.lineTo(WIDTH - 150, divY);
  ctx.stroke();

  ctx.restore();
}

export function drawFooterFactAndSubtitles(ctx, scene, localSec) {
  const theme = worldThemeForScene(scene.id);
  const pillAppear = beat(localSec, 0.35, 0.5, easeOutCubic);

  ctx.save();
  ctx.globalAlpha = pillAppear;
  drawCard(ctx, 84, 1862, WIDTH - 168, 102, {
    radius: 22,
    fill: theme.cardBg,
    stroke: theme.cardBorder,
    lineWidth: 2,
    shadowBlur: 12,
  });

  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(124, 1898, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 30px PlusJakarta';
  ctx.fillStyle = theme.textPrimary;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(scene.factPill, 148, 1898);

  ctx.font = '500 22px JetMono';
  ctx.fillStyle = theme.textSecondary;
  ctx.fillText(`Rujukan: ${scene.source}`, 148, 1938);
  ctx.restore();

  const words = scene.words || [];
  if (words.length === 0) return;

  let activeIdx = 0;
  for (let i = 0; i < words.length; i++) {
    if (localSec >= words[i].start) activeIdx = i;
  }

  const chunkSize = 6;
  const chunkIdx = Math.floor(activeIdx / chunkSize);
  const slice = words.slice(chunkIdx * chunkSize, chunkIdx * chunkSize + chunkSize);
  if (slice.length === 0) return;

  ctx.save();
  ctx.font = '700 41px PlusJakarta';
  const maxSubW = WIDTH - 210;
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

  const boxH = lines.length === 1 ? 92 : 150;
  const boxW = Math.min(WIDTH - 130, Math.max(...lines.map((l) => l.width)) + 76);
  const boxX = (WIDTH - boxW) / 2;
  const boxY = 2002;

  drawCard(ctx, boxX, boxY, boxW, boxH, {
    radius: 26,
    fill: theme.subBg,
    stroke: theme.isLight ? 'rgba(255,255,255,0.20)' : theme.cardBorder,
    lineWidth: 2,
    shadowColor: 'rgba(0,0,0,0.35)',
    shadowBlur: 22,
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  lines.forEach((ln, li) => {
    let x = (WIDTH - ln.width) / 2;
    const cy = boxY + (lines.length === 1 ? boxH / 2 : 45 + li * 58);
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
// 5. TANGIBLE ILLUSTRATED OBJECTS, CREATURES, INSTRUMENTS & SCROLLS
// ============================================================================

/**
 * 3D-shaded Wax Verdict Seal Stamp (slams down on falsified quotes or verifies Sahih).
 */
export function drawWaxSealStamp(ctx, cx, cy, label, subLabel, color, angle = -0.10, reveal = 1) {
  const p = clamp01(reveal);
  if (p <= 0.02) return;
  const scale = 1.4 - 0.4 * p;

  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Outer wax irregular edge (12-scallop badge)
  ctx.beginPath();
  const pts = 24;
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rad = i % 2 === 0 ? 106 : 94;
    const px = Math.cos(a) * rad * 1.45;
    const py = Math.sin(a) * rad * 0.62;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color === '#065F46' || color === '#10B981' ? 'rgba(6, 95, 70, 0.92)' : 'rgba(153, 27, 27, 0.94)';
  ctx.shadowColor = 'rgba(0,0,0,0.32)';
  ctx.shadowBlur = 14;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '800 32px JetMono';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, subLabel ? -13 : 0);

  if (subLabel) {
    ctx.font = '700 18px JetMono';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillText(subLabel, 0, 20);
  }
  ctx.restore();
}

/**
 * Illustrated Ancient Rolled Wooden-Rod Parchment Scroll with Arabic Amiri Calligraphy.
 */
export function drawAntiqueParchmentScroll(ctx, x, y, w, h, opts = {}) {
  const {
    arabic = '',
    arabicSize = 58,
    translit = '',
    meaning = '',
    header = 'NASKAH RIWAYAT',
    accent = '#991B1B',
    unroll = 1,
    stampLabel = '',
    stampSub = '',
    stampReveal = 0,
  } = opts;
  const p = clamp01(unroll);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  const curW = Math.max(140, w * (0.25 + 0.75 * p));
  const curX = x + (w - curW) / 2;

  // Main aged parchment sheet
  const grad = ctx.createLinearGradient(curX, y, curX, y + h);
  grad.addColorStop(0, '#FDF8EC');
  grad.addColorStop(0.5, '#FAF0D7');
  grad.addColorStop(1, '#F1DFB6');

  ctx.shadowColor = 'rgba(28, 25, 23, 0.25)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRectPath(ctx, curX + 24, y + 12, curW - 48, h - 24, 12);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = '#B4925A';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Left and Right Wooden Scroll Rollers with Brass Caps
  for (const rx of [curX + 14, curX + curW - 34]) {
    const rodGrad = ctx.createLinearGradient(rx, y, rx + 20, y);
    rodGrad.addColorStop(0, '#5C3A21');
    rodGrad.addColorStop(0.5, '#9A6B43');
    rodGrad.addColorStop(1, '#4A2E1A');
    roundRectPath(ctx, rx, y, 22, h, 10);
    ctx.fillStyle = rodGrad;
    ctx.fill();

    // Brass finials top & bottom
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(rx + 11, y - 6, 14, 0, Math.PI * 2);
    ctx.arc(rx + 11, y + h + 6, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p > 0.55) {
    ctx.save();
    ctx.globalAlpha = clamp01((p - 0.55) / 0.45);
    ctx.font = '700 22px JetMono';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(header, x + w / 2, y + 28);

    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = `700 ${arabicSize}px Amiri`;
    ctx.fillStyle = '#1C1917';
    ctx.textBaseline = 'middle';
    ctx.fillText(arabic, x + w / 2, y + 112);
    ctx.restore();

    if (translit) {
      ctx.font = '600 24px Playfair';
      ctx.fillStyle = '#92400E';
      const maxTrW = curW - 150;
      if (ctx.measureText(translit).width > maxTrW) {
        ctx.font = '600 21px Playfair';
      }
      ctx.fillText(translit, x + w / 2, y + 174, maxTrW);
    }

    if (meaning) {
      ctx.font = '700 29px PlusJakarta';
      ctx.fillStyle = '#1C1917';
      drawWrappedText(ctx, meaning, x + w / 2, y + 216, curW - 160, 38, { align: 'center', maxLines: 3 });
    }
    ctx.restore();
  }

  if (stampLabel && stampReveal > 0.02) {
    drawWaxSealStamp(ctx, x + w - 190, y + h - 76, stampLabel, stampSub, accent, -0.09, stampReveal);
  }
  ctx.restore();
}

/**
 * Illustrated Smartphone Screen showing viral status quotes + Brass Magnifying Loupe.
 */
export function drawSmartphoneWithLoupe(ctx, cx, cy, w, h, opts = {}) {
  const {
    posts = [],
    loupeX = cx,
    loupeY = cy,
    loupeProgress = 0,
    stampReveal = 0,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  const x = cx - w / 2;
  const y = cy - h / 2 + (1 - p) * 32;

  // Outer sleek phone chassis
  drawCard(ctx, x, y, w, h, {
    radius: 54,
    fill: '#0F172A',
    stroke: '#475569',
    lineWidth: 6,
    shadowColor: 'rgba(0, 0, 0, 0.55)',
    shadowBlur: 38,
  });

  // Inner glass screen
  roundRectPath(ctx, x + 20, y + 24, w - 40, h - 48, 38);
  ctx.fillStyle = '#09111E';
  ctx.fill();

  // Dynamic Island notch
  roundRectPath(ctx, cx - 90, y + 38, 180, 32, 16);
  ctx.fillStyle = '#020617';
  ctx.fill();

  // App header inside screen
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#FDE047';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('GRUP & STATUS MEDIA SOSIAL', x + 54, y + 92);

  // Render viral message bubbles on phone screen
  posts.forEach((ps, idx) => {
    const bp = clamp01(ps.reveal);
    if (bp <= 0.02) return;
    const by = y + 142 + idx * 176;
    ctx.save();
    ctx.globalAlpha = bp;
    drawCard(ctx, x + 44, by + (1 - bp) * 18, w - 88, 152, {
      radius: 24,
      fill: '#132238',
      stroke: bp > 0.8 && stampReveal > 0.3 ? '#EF4444' : 'rgba(56, 189, 248, 0.32)',
      lineWidth: 2.5,
      shadowBlur: 10,
    });

    // Forwarded tag
    ctx.font = '700 19px JetMono';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('↪ DITERUSKAN BERKALI-KALI', x + 72, by + (1 - bp) * 18 + 20);

    ctx.font = '700 29px PlusJakarta';
    ctx.fillStyle = '#F8FAFC';
    drawWrappedText(ctx, ps.text, x + 72, by + (1 - bp) * 18 + 54, w - 144, 38, {
      align: 'left',
      maxLines: 2,
    });
    ctx.restore();
  });

  // Animated Brass Magnifying Loupe scanning the phone screen
  if (loupeProgress > 0.02) {
    ctx.save();
    ctx.globalAlpha = clamp01(loupeProgress * 2);
    const lx = loupeX;
    const ly = loupeY;

    // Handle
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lx + 72, ly + 72);
    ctx.lineTo(lx + 158, ly + 158);
    ctx.stroke();

    // Lens glass tint
    ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
    ctx.beginPath();
    ctx.arc(lx, ly, 102, 0, Math.PI * 2);
    ctx.fill();

    // Brass rim
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Crosshair & Question mark inside lens
    ctx.font = '800 32px JetMono';
    ctx.fillStyle = '#FDE047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SANAD ?', lx, ly);
    ctx.restore();
  }

  if (stampReveal > 0.02) {
    drawWaxSealStamp(ctx, cx + 145, y + h - 98, 'BUKAN HADITS', 'CEK SANADNYA!', '#991B1B', -0.12, stampReveal);
  }
  ctx.restore();
}

/**
 * Draws a Physical Interlocking Metallic Chain of Narrators (Sanad) with optional
 * fractured broken link & scholar turbaned portrait silhouettes.
 */
export function drawPhysicalSanadChain(ctx, cx, topY, linkHeight, links, opts = {}) {
  const { progress = 1, isLight = false } = opts;

  links.forEach((lk, i) => {
    const p = clamp01(progress * links.length - i * 0.65);
    if (p <= 0.02) return;

    const ly = topY + i * linkHeight;
    const isBroken = lk.status === 'broken';
    const isValid = lk.status === 'valid' || lk.status === 'target';

    ctx.save();
    ctx.globalAlpha = p;

    // Metallic chain link oval between nodes
    const mx = cx - 355;
    if (i > 0) {
      const prevBottomY = ly - linkHeight + 96;
      const midY = (prevBottomY + ly) / 2;
      if (isBroken) {
        // Snapped / Fractured Rusted Link cleanly centered in gap!
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(mx - 4, midY - 12, 16, Math.PI * 0.9, Math.PI * 1.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx + 4, midY + 12, 16, 0, Math.PI * 1.1);
        ctx.stroke();

        // Red lightning break lines
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(mx - 26, midY - 2);
        ctx.lineTo(mx - 6, midY + 2);
        ctx.moveTo(mx + 26, midY - 4);
        ctx.lineTo(mx + 8, midY + 2);
        ctx.stroke();
      } else {
        // Solid golden interlocking chain links
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 9;
        roundRectPath(ctx, mx - 11, midY - 26, 22, 52, 11);
        ctx.stroke();
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 3.5;
        roundRectPath(ctx, mx - 7, midY - 20, 14, 40, 7);
        ctx.stroke();
      }
    }

    // Turbaned Scholar Silhouette Medallion (left of text)
    const my = ly + 48;
    ctx.fillStyle = isBroken ? '#7F1D1D' : isValid ? '#065F46' : '#92400E';
    ctx.beginPath();
    ctx.arc(mx, my, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isBroken ? '#EF4444' : '#EAB308';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Stylized turbaned head & shoulders silhouette inside medallion
    ctx.fillStyle = '#FEF3C7';
    // Shoulders
    ctx.beginPath();
    ctx.arc(mx, my + 32, 24, Math.PI, 0);
    ctx.fill();
    // Face
    ctx.beginPath();
    ctx.arc(mx, my + 2, 13, 0, Math.PI * 2);
    ctx.fill();
    // Turban folds
    ctx.fillStyle = isBroken ? '#FCA5A5' : '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(mx, my - 11, 18, 11, -0.1, 0, Math.PI * 2);
    ctx.fill();

    if (isBroken) {
      // Bold red X across broken scholar medallion
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(mx - 28, my - 28);
      ctx.lineTo(mx + 28, my + 28);
      ctx.moveTo(mx + 28, my - 28);
      ctx.lineTo(mx - 28, my + 28);
      ctx.stroke();
    }

    // Floating Name & Verdict Strip (clean, NOT heavy nested box)
    const tx = mx + 72;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '800 32px PlusJakarta';
    ctx.fillStyle = isBroken
      ? (isLight ? '#991B1B' : '#FCA5A5')
      : (isLight ? '#1C1917' : '#F8FAFC');
    ctx.fillText(lk.name, tx, ly + 8);

    ctx.font = '600 25px PlusJakarta';
    ctx.fillStyle = isLight ? '#57534E' : '#A7C4BA';
    drawWrappedText(ctx, lk.note, tx, ly + 48, 760, 33, { align: 'left', maxLines: 2 });

    ctx.restore();
  });
}

/**
 * Illustrated Silk Road Parchment Map: Arabia -> Walking Camels -> Mountain Range -> Chinese Pagoda.
 */
export function drawSilkRoadMapScene(ctx, x, y, w, h, opts = {}) {
  const { caravanProg = 1, gavelSlam = 0 } = opts;
  ctx.save();

  // Map frame
  drawCard(ctx, x, y, w, h, {
    radius: 28,
    fill: '#F9F1DC',
    stroke: '#9A8460',
    lineWidth: 3.5,
  });

  // Subtle latitude/longitude compass lines
  ctx.strokeStyle = 'rgba(154, 132, 96, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.52, 210, 0, Math.PI * 2);
  ctx.moveTo(x + 40, y + h * 0.52);
  ctx.lineTo(x + w - 40, y + h * 0.52);
  ctx.stroke();

  // Left: Arabian Desert Dunes & Crescent Dome (Madinah)
  ctx.fillStyle = '#E6C896';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + h - 30);
  ctx.quadraticCurveTo(x + 150, y + h - 120, x + 310, y + h - 30);
  ctx.closePath();
  ctx.fill();

  // Mosque Dome & Minaret left
  ctx.fillStyle = '#0F766E';
  ctx.beginPath();
  ctx.arc(x + 120, y + h - 108, 34, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x + 86, y + h - 108, 68, 42);
  ctx.fillRect(x + 170, y + h - 165, 16, 100);
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#0F766E';
  ctx.textAlign = 'center';
  ctx.fillText('MADINAH', x + 130, y + h - 42);

  // Center: Mountain Peaks along Silk Road
  ctx.fillStyle = '#C7B28E';
  for (const [mx, mh] of [[x + w * 0.42, 95], [x + w * 0.52, 125], [x + w * 0.61, 88]]) {
    ctx.beginPath();
    ctx.moveTo(mx - 65, y + h - 55);
    ctx.lineTo(mx, y + h - 55 - mh);
    ctx.lineTo(mx + 65, y + h - 55);
    ctx.closePath();
    ctx.fill();
  }

  // Right: Illustrated Multi-Tiered Chinese Pagoda
  const px = x + w - 150;
  const py = y + h - 58;
  ctx.fillStyle = '#991B1B';
  for (let tier = 0; tier < 3; tier++) {
    const ty = py - tier * 42;
    const tw = 96 - tier * 20;
    ctx.fillRect(px - tw * 0.35, ty - 28, tw * 0.7, 28);
    // Curved eaves roof
    ctx.beginPath();
    ctx.moveTo(px - tw * 0.72, ty - 26);
    ctx.quadraticCurveTo(px, ty - 48, px + tw * 0.72, ty - 26);
    ctx.lineTo(px + tw * 0.5, ty - 18);
    ctx.lineTo(px - tw * 0.5, ty - 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#991B1B';
  ctx.fillText('NEGERI CINA', px, y + h - 42);

  // Dotted Silk Road route curve + Animated Camel Caravan silhouettes!
  const p = clamp01(caravanProg);
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(x + 190, y + 145);
  ctx.bezierCurveTo(x + w * 0.4, y + 70, x + w * 0.65, y + 185, px - 55, y + 120);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw 2 Camel silhouettes walking along path
  for (const offset of [0, -0.14]) {
    const t = clamp01(p + offset);
    if (t <= 0.02) continue;
    const mt = 1 - t;
    const cx =
      mt * mt * mt * (x + 190) +
      3 * mt * mt * t * (x + w * 0.4) +
      3 * mt * t * t * (x + w * 0.65) +
      t * t * t * (px - 55);
    const cy =
      mt * mt * mt * (y + 145) +
      3 * mt * mt * t * (y + 70) +
      3 * mt * t * t * (y + 185) +
      t * t * t * (y + 120);

    ctx.save();
    ctx.translate(cx, cy - 18);
    ctx.fillStyle = '#78350F';
    // Camel body + hump + neck + legs
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
    ctx.arc(0, -10, 10, Math.PI, 0);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#78350F';
    ctx.beginPath();
    // Legs
    ctx.moveTo(-12, 8); ctx.lineTo(-14, 24);
    ctx.moveTo(-4, 8); ctx.lineTo(-2, 24);
    ctx.moveTo(8, 8); ctx.lineTo(10, 24);
    ctx.moveTo(14, 8); ctx.lineTo(16, 24);
    // Neck & head
    ctx.moveTo(16, -2); ctx.quadraticCurveTo(26, -12, 28, -22);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(31, -22, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Judge's Wooden Gavel slamming at verdict time
  if (gavelSlam > 0.02) {
    const slam = clamp01(gavelSlam);
    const angle = lerp(-0.65, 0.05, easeOutBack(slam));
    ctx.save();
    ctx.translate(x + w * 0.52, y + h * 0.48);
    ctx.rotate(angle);

    // Gavel handle
    ctx.fillStyle = '#5C3A21';
    roundRectPath(ctx, -18, -10, 130, 18, 8);
    ctx.fill();
    // Gavel mallet head
    ctx.fillStyle = '#78350F';
    roundRectPath(ctx, -46, -42, 48, 84, 12);
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Illustrated Carved Wooden Rehal Stand with Open Kitab & Glowing Brass Lantern (Fanoos).
 */
export function drawRehalKitabAndLantern(ctx, cx, cy, scale, opts = {}) {
  const { openProg = 1, glowPulse = 0 } = opts;
  const p = clamp01(openProg);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Hanging Brass Lantern (top center)
  ctx.save();
  ctx.translate(0, -195);
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -55);
  ctx.lineTo(0, -24);
  ctx.stroke();

  const lanternGlow = ctx.createRadialGradient(0, 24, 6, 0, 24, 135 + Math.sin(glowPulse * 4) * 10);
  lanternGlow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
  lanternGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = lanternGlow;
  ctx.beginPath();
  ctx.arc(0, 24, 145, 0, Math.PI * 2);
  ctx.fill();

  // Lantern body
  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(0, -26);
  ctx.lineTo(26, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FEF08A';
  roundRectPath(ctx, -22, 0, 44, 52, 8);
  ctx.fill();
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.fillStyle = '#78350F';
  ctx.fillRect(-26, 52, 52, 10);
  ctx.restore();

  // Carved Wooden Rehal (X-stand)
  ctx.strokeStyle = '#5C3A21';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-165, 130);
  ctx.lineTo(130, 12);
  ctx.moveTo(165, 130);
  ctx.lineTo(-130, 12);
  ctx.stroke();

  // Open Classical Kitab Pages resting on Rehal
  const spread = 185 * (0.3 + 0.7 * p);
  // Left Page
  ctx.fillStyle = '#FFFDF5';
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.quadraticCurveTo(-spread * 0.5, 12, -spread, 28);
  ctx.lineTo(-spread - 12, -108);
  ctx.quadraticCurveTo(-spread * 0.5, -124, 0, -96);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Page
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.quadraticCurveTo(spread * 0.5, 12, spread, 28);
  ctx.lineTo(spread + 12, -108);
  ctx.quadraticCurveTo(spread * 0.5, -124, 0, -96);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Calligraphy lines on pages
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.35)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 5; row++) {
    const ry = -78 + row * 20;
    ctx.beginPath();
    ctx.moveTo(-spread + 26, ry);
    ctx.lineTo(-24, ry + 8);
    ctx.moveTo(24, ry + 8);
    ctx.lineTo(spread - 26, ry);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Illustrated Brass Balance Scale (Mizan) weighing Kata Mutiara vs Sabda Nabi.
 */
export function drawBrassBalanceScale(ctx, cx, cy, scale, opts = {}) {
  const { tilt = -0.18, leftLabel = 'PETUAH BIJAK', rightLabel = 'SABDA NABI SAW', reveal = 1 } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Pillar & Base
  ctx.fillStyle = '#92400E';
  roundRectPath(ctx, -78, 126, 156, 22, 10);
  ctx.fill();
  ctx.fillRect(-10, -105, 20, 235);
  ctx.fillStyle = '#EAB308';
  ctx.beginPath();
  ctx.arc(0, -112, 16, 0, Math.PI * 2);
  ctx.fill();

  // Tilting Beam
  ctx.save();
  ctx.translate(0, -95);
  ctx.rotate(tilt);

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-195, 0);
  ctx.lineTo(195, 0);
  ctx.stroke();

  // Left Pan & Right Pan hanging vertically
  for (const [sideX, lbl, col] of [[-190, leftLabel, '#D97706'], [190, rightLabel, '#065F46']]) {
    ctx.save();
    ctx.translate(sideX, 0);
    ctx.rotate(-tilt); // keep pans level with gravity!
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-56, 98);
    ctx.moveTo(0, 0); ctx.lineTo(56, 98);
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 98, 66, 0, Math.PI);
    ctx.fill();

    drawTagPill(ctx, 0, 68, lbl, {
      font: '800 20px JetMono',
      fill: '#FFFFFF',
      stroke: col,
      textColor: col,
      padX: 16,
      height: 38,
    });
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Illustrated Brass & Crystal Magnifying Glass over an Arabic Scroll.
 */
export function drawMagnifyingGlassTool(ctx, cx, cy, scale, phase = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Small scroll beneath lens
  roundRectPath(ctx, -140, -68, 280, 136, 16);
  ctx.fillStyle = '#FAF0D7';
  ctx.fill();
  ctx.strokeStyle = '#9A8460';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = '700 40px Amiri';
  ctx.fillStyle = '#1C1917';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('سَنَدُ الْحَدِيثِ', 0, -4);
  ctx.restore();

  // Animated sweeping magnifying lens
  const sweepX = Math.sin(phase * 2.2) * 32;
  ctx.translate(sweepX, -6);
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(56, 56);
  ctx.lineTo(122, 122);
  ctx.stroke();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 11;
  ctx.stroke();

  ctx.restore();
}

/**
 * Illustrated Crystal Water Pitcher (Ibrik) & Rippling Pure Water Droplets (Ath-Thuhur).
 */
export function drawPureWaterPitcherScene(ctx, cx, cy, scale, phase = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Clean Water Ripples Basin at bottom
  for (let r = 0; r < 3; r++) {
    const rp = (phase * 0.7 + r * 0.33) % 1;
    ctx.strokeStyle = `rgba(2, 132, 199, ${0.65 * (1 - rp)})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(25, 108, 45 + rp * 110, 14 + rp * 26, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Tilted Pure Brass/Ceramic Pitcher (Ibrik)
  ctx.save();
  ctx.translate(-55, -24);
  ctx.rotate(0.28);

  const bodyGrad = ctx.createLinearGradient(-45, -60, 45, 60);
  bodyGrad.addColorStop(0, '#0EA5E9');
  bodyGrad.addColorStop(1, '#0369A1');

  // Pitcher belly
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 14, 48, 56, 0, 0, Math.PI * 2);
  ctx.fill();
  // Neck
  ctx.fillRect(-18, -72, 36, 44);
  // Spout
  ctx.beginPath();
  ctx.moveTo(32, -16);
  ctx.quadraticCurveTo(78, -42, 86, -64);
  ctx.lineWidth = 11;
  ctx.strokeStyle = '#0284C7';
  ctx.lineCap = 'round';
  ctx.stroke();
  // Handle
  ctx.beginPath();
  ctx.arc(-44, -10, 32, Math.PI * 0.5, Math.PI * 1.5);
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.restore();

  // Falling Crystal Water Stream + Droplets
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(42, -46);
  ctx.quadraticCurveTo(54, 24, 28, 102);
  ctx.stroke();

  // Sparkling water droplet
  const dropY = -10 + ((phase * 90) % 105);
  ctx.fillStyle = '#7DD3FC';
  ctx.beginPath();
  ctx.arc(38, dropY, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Illustrated Twin Heavy Leather-Bound Sahih Books (Bukhari & Muslim) with Golden Spine.
 */
export function drawTwinSahihBooks(ctx, cx, cy, scale, opts = {}) {
  const { reveal = 1, glowColor = '#10B981', badgeText = 'SHAHIH' } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(cx, cy + (1 - p) * 20);
  ctx.scale(scale, scale);

  const books = [
    { x: -135, title: 'SHAHIH', sub: 'AL-BUKHARI', col: '#7F1D1D', spine: '#EAB308' },
    { x: 15, title: 'SHAHIH', sub: 'MUSLIM', col: '#064E3B', spine: '#EAB308' },
  ];

  books.forEach((bk, idx) => {
    ctx.save();
    ctx.translate(bk.x, idx === 1 ? -14 : 0);
    // Cover
    drawCard(ctx, 0, -90, 145, 188, {
      radius: 14,
      fill: bk.col,
      stroke: bk.spine,
      lineWidth: 4,
      shadowBlur: 18,
    });
    // Spine gold bands
    ctx.fillStyle = bk.spine;
    ctx.fillRect(10, -70, 12, 148);
    // Ornamental center oval
    ctx.strokeStyle = bk.spine;
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, 36, -64, 92, 136, 10);
    ctx.stroke();

    ctx.font = '800 17px JetMono';
    ctx.fillStyle = '#FEF3C7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bk.title, 83, -16);
    ctx.font = '800 14.5px JetMono';
    ctx.fillText(bk.sub, 83, 14);
    ctx.restore();
  });

  if (badgeText) {
    drawTagPill(ctx, 10, 118, `✓ ${badgeText}`, {
      font: '800 22px JetMono',
      fill: glowColor,
      stroke: '#FFFFFF',
      textColor: '#FFFFFF',
      padX: 24,
      height: 44,
    });
  }
  ctx.restore();
}

/**
 * Illustrated Homeland Archipelago, Waving Flag & Living Heart + Olive Branch (i05 Fitrah).
 */
export function drawHomelandFitrahScene(ctx, x, y, w, h, opts = {}) {
  const { reveal = 1, wavePhase = 0 } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  drawCard(ctx, x, y, w, h, {
    radius: 26,
    fill: '#ECFDF5',
    stroke: '#0F766E',
    lineWidth: 2.5,
  });

  // Top label
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#0F766E';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('FITRAH MANUSIA (ALAMI & BAIK)', x + 34, y + 26);

  // Left: Stylized Globe + Archipelago Islands
  const gx = x + 175;
  const gy = y + h * 0.56;
  ctx.fillStyle = '#BAE6FD';
  ctx.beginPath();
  ctx.arc(gx, gy, 88, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Green islands inside globe
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.ellipse(gx - 28, gy - 12, 26, 16, -0.3, 0, Math.PI * 2);
  ctx.ellipse(gx + 16, gy + 14, 34, 14, 0.2, 0, Math.PI * 2);
  ctx.ellipse(gx + 36, gy - 26, 16, 12, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Waving Flag planted on globe
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(gx, gy - 88);
  ctx.lineTo(gx, gy - 146);
  ctx.stroke();

  const wave = Math.sin(wavePhase * 4) * 5;
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(gx + 2, gy - 146);
  ctx.quadraticCurveTo(gx + 34, gy - 152 + wave, gx + 62, gy - 142);
  ctx.lineTo(gx + 62, gy - 122);
  ctx.quadraticCurveTo(gx + 34, gy - 130 + wave, gx + 2, gy - 124);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(gx + 2, gy - 124);
  ctx.quadraticCurveTo(gx + 34, gy - 130 + wave, gx + 62, gy - 122);
  ctx.lineTo(gx + 62, gy - 104);
  ctx.quadraticCurveTo(gx + 34, gy - 110 + wave, gx + 2, gy - 106);
  ctx.closePath();
  ctx.fill();

  // Center: Living Heart Icon beating gently
  const hx = x + 365;
  const hy = gy - 4;
  const beatScale = 1 + Math.sin(wavePhase * 4) * 0.06;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(beatScale, beatScale);
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.bezierCurveTo(-44, -6, -42, -40, -18, -40);
  ctx.bezierCurveTo(-4, -40, 0, -24, 0, -20);
  ctx.bezierCurveTo(0, -24, 4, -40, 18, -40);
  ctx.bezierCurveTo(42, -40, 44, -6, 0, 26);
  ctx.fill();
  ctx.restore();

  // Right text explaining Fitrah vs Sabda Nabi
  ctx.font = '800 30px PlusJakarta';
  ctx.fillStyle = '#064E3B';
  ctx.fillText('Mencintai Negeri = Fitrah', x + 445, y + 86);
  ctx.font = '500 26px PlusJakarta';
  ctx.fillStyle = '#1E293B';
  drawWrappedText(
    ctx,
    'Wajar & mulia menjaga tanah air (Nabi SAW pun mencintai Makkah), namun kalimat ini BUKAN hadits yang boleh disandarkan ke lisan Nabi SAW.',
    x + 445,
    y + 132,
    w - 485,
    36,
    { align: 'left', maxLines: 4 },
  );

  ctx.restore();
}

/**
 * Illustrated Dawn Masjid Silhouette (Madinah Green Dome + Minarets) for Finale i10.
 */
export function drawDawnMasjidSilhouette(ctx, cx, bottomY, w, h, glowPhase = 0) {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, bottomY - h * 0.45, 20, cx, bottomY - h * 0.45, w * 0.55);
  glow.addColorStop(0, `rgba(16, 185, 129, ${0.32 + Math.sin(glowPhase * 2) * 0.05})`);
  glow.addColorStop(0.5, 'rgba(234, 179, 8, 0.14)');
  glow.addColorStop(1, 'rgba(6, 13, 11, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - w / 2, bottomY - h, w, h);

  // Green Dome (Qubbah Khadhra silhouette)
  ctx.fillStyle = '#065F46';
  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, bottomY - 96, 86, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden Finial Crescent on Dome
  ctx.fillStyle = '#EAB308';
  ctx.fillRect(cx - 3, bottomY - 216, 6, 36);
  ctx.beginPath();
  ctx.arc(cx, bottomY - 222, 13, 0, Math.PI * 2);
  ctx.fill();

  // Side Minarets
  for (const mx of [cx - 250, cx + 250]) {
    ctx.fillStyle = '#0D2922';
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 2.5;
    ctx.fillRect(mx - 18, bottomY - 220, 36, 220);
    ctx.strokeRect(mx - 18, bottomY - 220, 36, 220);
    ctx.beginPath();
    ctx.moveTo(mx - 22, bottomY - 220);
    ctx.lineTo(mx, bottomY - 270);
    ctx.lineTo(mx + 22, bottomY - 220);
    ctx.closePath();
    ctx.fillStyle = '#EAB308';
    ctx.fill();
  }

  // Main Masjid Arcade Base with Glowing Archways
  ctx.fillStyle = '#0B1F1A';
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.fillRect(cx - 320, bottomY - 96, 640, 96);
  ctx.strokeRect(cx - 320, bottomY - 96, 640, 96);

  ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
  for (let ax = -220; ax <= 220; ax += 110) {
    ctx.beginPath();
    ctx.arc(cx + ax, bottomY - 46, 24, Math.PI, 0);
    ctx.lineTo(cx + ax + 24, bottomY);
    ctx.lineTo(cx + ax - 24, bottomY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws a crisp Scholar Study Desk with Candle, Inkwell (Dawat), Quill (Qalam), & Note Sheet.
 */
export function drawScholarDeskWithCandle(ctx, x, y, w, h, opts = {}) {
  const {
    eyebrow = 'CATATAN HIKMAH ULAMA (BUKAN HADITS NABI)',
    author = 'Yahya bin Mu’adz Ar-Razi',
    quote = '',
    flicker = 0,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  drawCard(ctx, x, y + (1 - p) * 18, w, h, {
    radius: 26,
    fill: '#FAF3DF',
    stroke: '#9A8460',
    lineWidth: 2.5,
  });

  // Left: Flickering Brass Candle + Inkwell (Dawat)
  const cx = x + 130;
  const baseY = y + h - 38;
  // Candle glow
  const cg = ctx.createRadialGradient(cx, baseY - 125, 4, cx, baseY - 125, 85 + Math.sin(flicker * 11) * 6);
  cg.addColorStop(0, 'rgba(251, 191, 36, 0.50)');
  cg.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(cx, baseY - 125, 90, 0, Math.PI * 2);
  ctx.fill();

  // Brass candlestick & wax
  ctx.fillStyle = '#92400E';
  ctx.fillRect(cx - 28, baseY - 14, 56, 14);
  ctx.fillStyle = '#FFFBEB';
  ctx.fillRect(cx - 14, baseY - 102, 28, 88);
  // Flame
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.ellipse(cx + Math.sin(flicker * 9) * 2, baseY - 122, 10, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inkwell & Quill beside candle
  ctx.fillStyle = '#1E293B';
  roundRectPath(ctx, cx + 48, baseY - 38, 44, 38, 10);
  ctx.fill();
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx + 70, baseY - 32);
  ctx.quadraticCurveTo(cx + 98, baseY - 92, cx + 118, baseY - 122);
  ctx.stroke();

  // Right: Handwritten Treatise Header & Attribution
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#991B1B';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(eyebrow, x + 280, y + 32);

  ctx.font = '800 34px PlusJakarta';
  ctx.fillStyle = '#1C1917';
  ctx.fillText(author, x + 280, y + 68);

  ctx.font = '600 26px PlusJakarta';
  ctx.fillStyle = '#57534E';
  drawWrappedText(ctx, quote, x + 280, y + 120, w - 320, 36, { align: 'left', maxLines: 3 });

  ctx.restore();
}

export function drawCalloutBox(ctx, x, y, w, h, title, detail, opts = {}) {
  const {
    accent = '#EAB308',
    bg = 'rgba(13, 28, 24, 0.94)',
    textColor = '#F8FAFC',
    subColor = '#CBD5E1',
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 16;
  drawCard(ctx, x, y + dy, w, h, {
    radius: 22,
    fill: bg,
    stroke: accent,
    lineWidth: 2.5,
    shadowBlur: 14,
  });

  ctx.fillStyle = accent;
  roundRectPath(ctx, x + 18, y + dy + 18, 8, h - 36, 4);
  ctx.fill();

  ctx.font = '800 29px PlusJakarta';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + 42, y + dy + 22);

  ctx.font = '500 27px PlusJakarta';
  ctx.fillStyle = subColor;
  drawWrappedText(ctx, detail, x + 42, y + dy + 64, w - 68, 37, { align: 'left', maxLines: 5 });
  ctx.restore();
}

// ============================================================================
// 6. SCENE TRANSITIONS & RENDER ENGINE
// ============================================================================
export function drawTransitionOverlay(ctx, transitionType, progress) {
  const p = clamp01(progress);
  if (p <= 0 || p >= 1 || transitionType === 'none') return;

  ctx.save();
  if (transitionType === 'seal_crimson' || transitionType === 'seal_gold') {
    const col = transitionType === 'seal_crimson' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(234, 179, 8, 0.35)';
    const r = Math.hypot(WIDTH, HEIGHT) * 0.55 * Math.sin(p * Math.PI);
    drawRubElHizbEmblem(ctx, WIDTH / 2, HEIGHT / 2, Math.max(40, r * 0.65), col, 8);
  } else {
    const barColor =
      transitionType === 'wipe_gold'
        ? 'rgba(234, 179, 8, 0.28)'
        : transitionType === 'wipe_emerald'
          ? 'rgba(16, 185, 129, 0.26)'
          : 'rgba(154, 132, 96, 0.28)';
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

export async function loadSceneModules() {
  const loaded = {};
  const { SCENES_DATA } = await import('./script.mjs');
  for (const sc of SCENES_DATA) {
    const mod = await import(join(SHORT3_DIR, sc.module));
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
  drawWorldBackground(ctx, scene);
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
      drawRubElHizbEmblem,
      drawTagPill,
      drawArrow,
      drawWrappedText,
      drawWaxSealStamp,
      drawAntiqueParchmentScroll,
      drawSmartphoneWithLoupe,
      drawPhysicalSanadChain,
      drawSilkRoadMapScene,
      drawRehalKitabAndLantern,
      drawBrassBalanceScale,
      drawMagnifyingGlassTool,
      drawPureWaterPitcherScene,
      drawTwinSahihBooks,
      drawHomelandFitrahScene,
      drawDawnMasjidSilhouette,
      drawScholarDeskWithCandle,
      drawCalloutBox,
      PALETTE,
      worldThemeForScene,
    });
  }

  drawFooterFactAndSubtitles(ctx, scene, localSec);

  const remSec = scene.endSec - globalSec;
  if (remSec < 0.28 && scene.transition && scene.transition !== 'none') {
    drawTransitionOverlay(ctx, scene.transition, 1 - remSec / 0.28);
  }
}

// ============================================================================
// 7. CLI ENTRYPOINT: --scene=i01:0.85 PREVIEW OR FULL 2K 90FPS MP4 RENDER
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
