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
// 1. FONT REGISTRATION (INCLUDING ARABIC AMIRI RTL & EDITORIAL LATIN)
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
// 2. EASING, TIMING & ISLAMIC FORENSIC PALETTE
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
export const beat = (localSec, startSec, durSec = 0.55, ease = easeOutCubic) =>
  ease(invLerp(startSec, startSec + durSec, localSec));

export const PALETTE = {
  // World A: Forensic Manuscript Vault (Dark Charcoal-Emerald)
  vaultBgTop: '#060E0C',
  vaultBgBot: '#0D1E19',
  vaultCard: 'rgba(13, 28, 24, 0.94)',
  vaultBorder: 'rgba(212, 175, 55, 0.36)',
  gold: '#EAB308',
  goldSoft: '#FDE047',
  emerald: '#10B981',
  emeraldBright: '#34D399',
  crimson: '#EF4444',
  crimsonDeep: '#991B1B',
  inkLight: '#F8FAFC',
  inkMuted: '#94A3B8',

  // World B: Classical Kitab Parchment (Warm Sepia & Crimson Ink)
  kitabBgTop: '#F6F0E2',
  kitabBgBot: '#E6D9BE',
  kitabCard: '#FFFDF7',
  kitabBorder: '#9A8460',
  kitabInk: '#1C1917',
  kitabMuted: '#57534E',
  kitabCrimson: '#991B1B',
  kitabGold: '#92400E',
  kitabTeal: '#0F766E',

  // World C: Authentic Sunnah Dawn Ivory (Gold & Emerald)
  sunnahBgTop: '#FBF8EE',
  sunnahBgBot: '#EFE6CC',
  sunnahCard: '#FFFFFF',
  sunnahBorder: '#B7954E',
  sunnahInk: '#14261E',
  sunnahMuted: '#475569',
  sunnahEmerald: '#065F46',
  sunnahGold: '#B45309',
};

export function worldThemeForScene(sceneId) {
  if (sceneId === 'i03' || sceneId === 'i04' || sceneId === 'i05' || sceneId === 'i06') {
    return {
      mode: 'kitab',
      isLight: true,
      bgTop: PALETTE.kitabBgTop,
      bgBot: PALETTE.kitabBgBot,
      cardBg: PALETTE.kitabCard,
      cardBorder: 'rgba(154, 132, 96, 0.52)',
      textPrimary: PALETTE.kitabInk,
      textSecondary: PALETTE.kitabMuted,
      accent: PALETTE.kitabCrimson,
      accentAlt: PALETTE.kitabGold,
      pillBg: 'rgba(153, 27, 27, 0.11)',
      pillBorder: 'rgba(153, 27, 27, 0.38)',
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
      cardBg: PALETTE.sunnahCard,
      cardBorder: isWarn ? 'rgba(153, 27, 27, 0.44)' : 'rgba(6, 95, 70, 0.42)',
      textPrimary: PALETTE.sunnahInk,
      textSecondary: PALETTE.sunnahMuted,
      accent: isWarn ? PALETTE.kitabCrimson : PALETTE.sunnahEmerald,
      accentAlt: PALETTE.sunnahGold,
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
    cardBg: PALETTE.vaultCard,
    cardBorder: PALETTE.vaultBorder,
    textPrimary: PALETTE.inkLight,
    textSecondary: '#A7C4BA',
    accent: sceneId === 'i01' ? PALETTE.crimson : PALETTE.emeraldBright,
    accentAlt: PALETTE.gold,
    pillBg: sceneId === 'i01' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.16)',
    pillBorder: sceneId === 'i01' ? 'rgba(239, 68, 68, 0.48)' : 'rgba(52, 211, 153, 0.48)',
    subBg: 'rgba(6, 14, 12, 0.92)',
    subText: '#F8FAFC',
    subHighlight: sceneId === 'i01' ? '#FDE047' : '#34D399',
  };
}

// ============================================================================
// 3. GEOMETRY, ORNAMENTAL ISLAMIC MOTIFS & TYPOGRAPHY HELPERS
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
// 4. WORLD BACKGROUNDS (3 DISTINCT ISLAMIC EDITORIAL WORLDS)
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
    // Vault Spotlight + Subtle Islamic Geometric Corner Stars
    const spot = ctx.createRadialGradient(WIDTH / 2, 1100, 60, WIDTH / 2, 1100, 950);
    spot.addColorStop(0, scene.id === 'i01' ? 'rgba(239, 68, 68, 0.11)' : 'rgba(16, 185, 129, 0.12)');
    spot.addColorStop(0.65, 'rgba(234, 179, 8, 0.04)');
    spot.addColorStop(1, 'rgba(6, 14, 12, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Outer Vault Margin Frame
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.22)';
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, 44, 150, WIDTH - 88, HEIGHT - 330, 28);
    ctx.stroke();

    for (const [rx, ry] of [[92, 198], [WIDTH - 92, 198], [92, HEIGHT - 228], [WIDTH - 92, HEIGHT - 228]]) {
      drawRubElHizbEmblem(ctx, rx, ry, 20, 'rgba(234, 179, 8, 0.28)', 2);
    }
  } else if (theme.mode === 'kitab') {
    // Classical Kitab Manuscript Double-Rule Border + Subtle Horizontal Folio Rules
    ctx.strokeStyle = 'rgba(154, 132, 96, 0.14)';
    ctx.lineWidth = 1.5;
    for (let y = 210; y < HEIGHT - 200; y += 64) {
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(WIDTH - 70, y);
      ctx.stroke();
    }
    // Outer & inner manuscript double border (Jadwal kitab klasik)
    ctx.strokeStyle = 'rgba(153, 27, 27, 0.34)';
    ctx.lineWidth = 3.5;
    roundRectPath(ctx, 44, 152, WIDTH - 88, HEIGHT - 334, 20);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(146, 64, 14, 0.36)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 56, 164, WIDTH - 112, HEIGHT - 358, 14);
    ctx.stroke();

    for (const [rx, ry] of [[100, 208], [WIDTH - 100, 208], [100, HEIGHT - 238], [WIDTH - 100, HEIGHT - 238]]) {
      drawRubElHizbEmblem(ctx, rx, ry, 18, 'rgba(146, 64, 14, 0.34)', 2);
    }
  } else {
    // Authentic Sunnah Dawn Ivory: luminous gold & emerald border
    const glow = ctx.createRadialGradient(WIDTH / 2, 1080, 80, WIDTH / 2, 1080, 960);
    glow.addColorStop(0, 'rgba(234, 179, 8, 0.12)');
    glow.addColorStop(1, 'rgba(251, 248, 238, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = scene.id === 'i07' ? 'rgba(153, 27, 27, 0.28)' : 'rgba(6, 95, 70, 0.28)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 44, 152, WIDTH - 88, HEIGHT - 334, 28);
    ctx.stroke();

    for (const [rx, ry] of [[96, 204], [WIDTH - 96, 204], [96, HEIGHT - 232], [WIDTH - 96, HEIGHT - 232]]) {
      drawRubElHizbEmblem(
        ctx,
        rx,
        ry,
        18,
        scene.id === 'i07' ? 'rgba(153, 27, 27, 0.30)' : 'rgba(6, 95, 70, 0.32)',
        2,
      );
    }
  }
  ctx.restore();
}

// ============================================================================
// 5. SHARED CHROME: PROGRESS RULE, HEADER, HEADLINE, FACT PILL, SUBTITLES
// ============================================================================
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

  // Editorial Headline
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
// 6. ISLAMIC TAKHRIJ & FORENSIC SANAD VISUAL PRIMITIVES
// ============================================================================

/**
 * Draws an animated forensic verdict stamp (e.g. "PALSU / MAUDHU'", "TERTOLAK", "SHAHIH").
 */
export function drawVerdictStamp(ctx, cx, cy, label, subLabel, color, angle = -0.10, reveal = 1) {
  const p = clamp01(reveal);
  if (p <= 0.02) return;
  const scale = 1.35 - 0.35 * p;

  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  ctx.font = '800 32px JetMono';
  const tw = ctx.measureText(label).width;
  const w = Math.max(310, tw + 64);
  const h = subLabel ? 104 : 78;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 14);
  ctx.fillStyle = color === '#065F46' || color === '#10B981'
    ? 'rgba(6, 95, 70, 0.13)'
    : 'rgba(153, 27, 27, 0.13)';
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();

  roundRectPath(ctx, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 10);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '800 32px JetMono';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, subLabel ? -13 : 1);

  if (subLabel) {
    ctx.font = '700 20px JetMono';
    ctx.fillText(subLabel, 0, 24);
  }
  ctx.restore();
}

/**
 * Draws a classical Arabic Manuscript Box with Amiri RTL text, transliteration,
 * Indonesian translation, and optional animated verdict stamp.
 */
export function drawArabicManuscriptBox(ctx, x, y, w, h, opts = {}) {
  const {
    arabic = '',
    arabicSize = 56,
    translit = '',
    meaning = '',
    kitabLabel = 'TEKS MATAN YANG BEREDAR',
    isLight = true,
    accent = '#991B1B',
    stampLabel = '',
    stampSub = '',
    stampPos = 'topRight', // 'topRight' | 'bottomRight'
    stampReveal = 0,
    reveal = 1,
  } = opts;

  const p = clamp01(reveal);
  if (p <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 20;

  drawCard(ctx, x, y + dy, w, h, {
    radius: 26,
    fill: isLight ? '#FFFDF7' : 'rgba(13, 28, 24, 0.95)',
    stroke: accent,
    lineWidth: 3,
    shadowBlur: 18,
  });

  // Top label bar
  ctx.font = '700 23px JetMono';
  ctx.fillStyle = accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(kitabLabel, x + 36, y + dy + 28);

  // Ornamental rule
  ctx.strokeStyle = isLight ? 'rgba(154, 132, 96, 0.35)' : 'rgba(234, 179, 8, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 36, y + dy + 64);
  ctx.lineTo(x + w - 36, y + dy + 64);
  ctx.stroke();

  // Arabic RTL script using Amiri
  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = `700 ${arabicSize}px Amiri`;
  ctx.fillStyle = isLight ? '#1C1917' : '#FEF3C7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(arabic, x + w / 2, y + dy + 132);
  ctx.restore();

  if (translit) {
    ctx.font = '600 26px Playfair';
    ctx.fillStyle = isLight ? '#92400E' : '#FDE047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(translit, x + w / 2, y + dy + 194);
  }

  if (meaning) {
    ctx.font = '700 31px PlusJakarta';
    ctx.fillStyle = isLight ? '#1C1917' : '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, meaning, x + w / 2, y + dy + 236, w - 84, 42, {
      align: 'center',
      maxLines: 3,
    });
  }

  if (stampLabel && stampReveal > 0.02) {
    const sy = stampPos === 'bottomRight' ? y + dy + h - 72 : y + dy + 82;
    const sx = stampPos === 'bottomRight' ? x + w - 190 : x + w - 195;
    drawVerdictStamp(
      ctx,
      sx,
      sy,
      stampLabel,
      stampSub,
      accent,
      -0.09,
      stampReveal,
    );
  }
  ctx.restore();
}

/**
 * Draws a sequential Isnad (Sanad / Chain of Narrators) Graph showing exactly
 * where a chain holds (green/gold) or breaks (red X / Majruh / Munqathi').
 */
export function drawIsnadChainDiagram(ctx, x, y, w, h, nodes, opts = {}) {
  const {
    title = 'PETA RANTAI SANAD (PERAWI)',
    isLight = true,
    progress = 1,
  } = opts;

  ctx.save();
  drawCard(ctx, x, y, w, h, {
    radius: 26,
    fill: isLight ? '#FFFDF7' : 'rgba(13, 28, 24, 0.94)',
    stroke: isLight ? 'rgba(154, 132, 96, 0.5)' : 'rgba(234, 179, 8, 0.36)',
    lineWidth: 2.5,
  });

  ctx.font = '700 23px JetMono';
  ctx.fillStyle = isLight ? '#57534E' : '#FDE047';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + 34, y + 26);

  const nCount = nodes.length;
  const startY = y + 78;
  const availH = h - 104;
  const rowStep = availH / nCount;

  nodes.forEach((nd, i) => {
    const nodeP = clamp01(progress * nCount - i * 0.72);
    if (nodeP <= 0.02) return;

    const cy = startY + i * rowStep + rowStep * 0.44;
    const boxX = x + 36;
    const boxW = w - 72;
    const boxH = Math.min(118, rowStep - 32);
    const boxY = cy - boxH / 2;

    const statusColor = nd.status === 'broken'
      ? '#DC2626'
      : nd.status === 'target'
        ? '#B45309'
        : '#0F766E';

    // Connector arrow from previous node
    if (i > 0) {
      const prevCy = startY + (i - 1) * rowStep + rowStep * 0.44 + boxH / 2;
      drawArrow(ctx, x + 88, prevCy + 4, x + 88, boxY - 4, {
        color: nd.status === 'broken' || nodes[i - 1].status === 'broken' ? '#DC2626' : '#0F766E',
        width: 5,
        headLen: 14,
        progress: nodeP,
        dashed: nd.status === 'broken',
      });
    }

    ctx.save();
    ctx.globalAlpha = nodeP;
    drawCard(ctx, boxX, boxY, boxW, boxH, {
      radius: 18,
      fill: nd.status === 'broken'
        ? (isLight ? '#FEF2F2' : 'rgba(127, 29, 29, 0.38)')
        : (isLight ? '#F8FAFC' : 'rgba(15, 36, 30, 0.90)'),
      stroke: statusColor,
      lineWidth: nd.status === 'broken' ? 3.5 : 2,
      shadowBlur: 6,
    });

    // Status icon circle
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(boxX + 52, cy, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '800 24px JetMono';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nd.status === 'broken' ? '✕' : nd.badge || String(i + 1), boxX + 52, cy + 1);

    // Narrator Name & Role
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '800 30px PlusJakarta';
    ctx.fillStyle = isLight ? '#1C1917' : '#F8FAFC';
    ctx.fillText(nd.name, boxX + 94, boxY + 18);

    ctx.font = '600 23px PlusJakarta';
    ctx.fillStyle = nd.status === 'broken'
      ? (isLight ? '#991B1B' : '#FCA5A5')
      : (isLight ? '#57534E' : '#A7C4BA');
    ctx.fillText(nd.note, boxX + 94, boxY + 58);

    // Right status pill
    if (nd.tag) {
      drawTagPill(ctx, boxX + boxW - 22, cy, nd.tag, {
        align: 'right',
        font: '700 21px JetMono',
        fill: nd.status === 'broken' ? 'rgba(220, 38, 38, 0.14)' : 'rgba(15, 118, 110, 0.14)',
        stroke: statusColor,
        textColor: statusColor,
        padX: 18,
        height: 40,
      });
    }
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Draws a Classical Scholar Verdict Matrix (Al-Jarh wa At-Ta'dil).
 */
export function drawScholarVerdictTable(ctx, x, y, w, h, scholars, opts = {}) {
  const { title = 'PENILAIAN PARA IMAM AHLI HADITS', isLight = true, progress = 1 } = opts;

  ctx.save();
  drawCard(ctx, x, y, w, h, {
    radius: 26,
    fill: isLight ? '#FFFDF7' : 'rgba(13, 28, 24, 0.94)',
    stroke: isLight ? 'rgba(154, 132, 96, 0.5)' : 'rgba(234, 179, 8, 0.36)',
    lineWidth: 2.5,
  });

  ctx.font = '700 23px JetMono';
  ctx.fillStyle = isLight ? '#991B1B' : '#FDE047';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + 34, y + 26);

  const topY = y + 74;
  const rowH = (h - 96) / scholars.length;

  scholars.forEach((sc, idx) => {
    const p = clamp01(progress * scholars.length - idx * 0.55);
    if (p <= 0.02) return;
    const ry = topY + idx * rowH;

    ctx.save();
    ctx.globalAlpha = p;
    drawCard(ctx, x + 30, ry, w - 60, rowH - 16, {
      radius: 18,
      fill: isLight ? '#FAF5E8' : 'rgba(18, 38, 32, 0.88)',
      stroke: isLight ? 'rgba(154, 132, 96, 0.35)' : 'rgba(234, 179, 8, 0.24)',
      lineWidth: 1.5,
      shadowBlur: 0,
    });

    ctx.font = '800 29px PlusJakarta';
    ctx.fillStyle = isLight ? '#1C1917' : '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(sc.imam, x + 56, ry + 18);

    ctx.font = '600 23px JetMono';
    ctx.fillStyle = isLight ? '#57534E' : '#94A3B8';
    ctx.fillText(sc.kitab, x + 56, ry + 58);

    drawTagPill(ctx, x + w - 54, ry + (rowH - 16) / 2, sc.verdict, {
      align: 'right',
      font: '800 23px JetMono',
      fill: 'rgba(153, 27, 27, 0.13)',
      stroke: '#991B1B',
      textColor: isLight ? '#991B1B' : '#FCA5A5',
      padX: 20,
      height: 46,
    });
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Draws a Viral Social Media / Broadcast Card showing how unverified quotes spread.
 */
export function drawSocialBroadcastCard(ctx, x, y, w, h, opts = {}) {
  const {
    quote = '"Tuntutlah ilmu sampai ke negeri Cina" (HR. ...?)',
    caption = 'Diteruskan berkali-kali · Tanpa cek sanad & perawi',
    accent = '#EF4444',
    reveal = 1,
    stampReveal = 0,
  } = opts;

  const p = clamp01(reveal);
  if (p <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = p;
  drawCard(ctx, x, y + (1 - p) * 20, w, h, {
    radius: 26,
    fill: '#0F1E1B',
    stroke: 'rgba(234, 179, 8, 0.36)',
    lineWidth: 2.5,
  });

  // Top mock broadcast header
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(x + 56, y + (1 - p) * 20 + 50, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = '#FDE047';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('FORWARDED / STATUS MEDSOS', x + 90, y + (1 - p) * 20 + 50);

  ctx.font = '700 34px PlusJakarta';
  ctx.fillStyle = '#F8FAFC';
  ctx.textBaseline = 'top';
  drawWrappedText(ctx, quote, x + 42, y + (1 - p) * 20 + 96, w - 84, 46, {
    align: 'left',
    maxLines: 3,
  });

  ctx.font = '600 24px JetMono';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(caption, x + 42, y + (1 - p) * 20 + h - 50);

  if (stampReveal > 0.02) {
    drawVerdictStamp(
      ctx,
      x + w - 180,
      y + (1 - p) * 20 + h - 85,
      'PERLU CEK!',
      'BELUM TENTU HADITS',
      accent,
      -0.08,
      stampReveal,
    );
  }
  ctx.restore();
}

/**
 * Draws a crisp Callout Box for explanations & scholar notes.
 */
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

/**
 * Draws a side-by-side / stacked Palsu vs Shahih Replacement Card.
 */
export function drawFakeVsSahihCard(ctx, x, y, w, h, opts = {}) {
  const {
    fakeTitle = 'PALSU',
    fakeArabic = '',
    fakeText = '',
    sahihTitle = 'SHAHIH',
    sahihArabic = '',
    sahihText = '',
    sahihRef = '',
    reveal = 1,
  } = opts;

  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  drawCard(ctx, x, y + (1 - p) * 18, w, h, {
    radius: 26,
    fill: '#FFFFFF',
    stroke: 'rgba(6, 95, 70, 0.35)',
    lineWidth: 2.5,
  });

  const midX = x + w * 0.44;
  // Left Fake Zone
  drawCard(ctx, x + 20, y + (1 - p) * 18 + 20, midX - x - 34, h - 40, {
    radius: 18,
    fill: '#FEF2F2',
    stroke: '#DC2626',
    lineWidth: 2,
    shadowBlur: 0,
  });
  ctx.font = '800 22px JetMono';
  ctx.fillStyle = '#991B1B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`✕ ${fakeTitle}`, x + 20 + (midX - x - 34) / 2, y + (1 - p) * 18 + 38);

  if (fakeArabic) {
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 36px Amiri';
    ctx.fillStyle = '#7F1D1D';
    ctx.fillText(fakeArabic, x + 20 + (midX - x - 34) / 2, y + (1 - p) * 18 + 84);
    ctx.restore();
  }
  ctx.font = '600 25px PlusJakarta';
  ctx.fillStyle = '#7F1D1D';
  drawWrappedText(
    ctx,
    fakeText,
    x + 20 + (midX - x - 34) / 2,
    y + (1 - p) * 18 + 146,
    midX - x - 64,
    34,
    { align: 'center', maxLines: 4 },
  );

  // Right Sahih Zone
  const rightX = midX + 14;
  const rightW = x + w - 20 - rightX;
  drawCard(ctx, rightX, y + (1 - p) * 18 + 20, rightW, h - 40, {
    radius: 18,
    fill: '#ECFDF5',
    stroke: '#059669',
    lineWidth: 2.5,
    shadowBlur: 0,
  });

  ctx.font = '800 22px JetMono';
  ctx.fillStyle = '#065F46';
  ctx.textAlign = 'center';
  ctx.fillText(`✓ ${sahihTitle}`, rightX + rightW / 2, y + (1 - p) * 18 + 38);

  if (sahihArabic) {
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 42px Amiri';
    ctx.fillStyle = '#064E3B';
    ctx.fillText(sahihArabic, rightX + rightW / 2, y + (1 - p) * 18 + 80);
    ctx.restore();
  }
  ctx.font = '700 27px PlusJakarta';
  ctx.fillStyle = '#064E3B';
  drawWrappedText(
    ctx,
    sahihText,
    rightX + rightW / 2,
    y + (1 - p) * 18 + 144,
    rightW - 44,
    36,
    { align: 'center', maxLines: 4 },
  );

  if (sahihRef) {
    ctx.font = '700 21px JetMono';
    ctx.fillStyle = '#047857';
    ctx.fillText(sahihRef, rightX + rightW / 2, y + (1 - p) * 18 + h - 62);
  }
  ctx.restore();
}

/**
 * Draws a Split Anatomy Card comparing Sanad (Chain of Narrators) vs Matan (Text Content).
 */
export function drawSanadVsMatanDiagram(ctx, x, y, w, h, opts = {}) {
  const { sanadProg = 1, matanProg = 1 } = opts;
  ctx.save();
  drawCard(ctx, x, y, w, h, {
    radius: 28,
    fill: 'rgba(13, 28, 24, 0.94)',
    stroke: 'rgba(234, 179, 8, 0.38)',
    lineWidth: 2.5,
  });

  ctx.font = '700 23px JetMono';
  ctx.fillStyle = '#FDE047';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ANATOMI SEBUAH HADITS YANG SAH', x + w / 2, y + 24);

  const colW = (w - 96) / 2;
  // Left Box: SANAD
  ctx.save();
  ctx.globalAlpha = clamp01(sanadProg);
  drawCard(ctx, x + 32, y + 72, colW, h - 104, {
    radius: 20,
    fill: 'rgba(6, 78, 59, 0.42)',
    stroke: '#10B981',
    lineWidth: 2.5,
    shadowBlur: 0,
  });
  ctx.font = '800 32px PlusJakarta';
  ctx.fillStyle = '#34D399';
  ctx.textAlign = 'center';
  ctx.fillText('1. SANAD (RANTAI)', x + 32 + colW / 2, y + 96);

  ctx.font = '600 24px PlusJakarta';
  ctx.fillStyle = '#E2E8F0';
  drawWrappedText(
    ctx,
    'Silsilah perawi yang bersambung jujur & terpercaya hingga Rasulullah SAW.',
    x + 32 + colW / 2,
    y + 146,
    colW - 44,
    34,
    { align: 'center', maxLines: 3 },
  );

  // 3 mini linked nodes inside SANAD
  const nodeY = y + h - 86;
  const labels = ['Nabi SAW', 'Sahabat', 'Perawi'];
  labels.forEach((lb, idx) => {
    const nx = x + 32 + (colW / 6) * (idx * 2 + 1);
    drawCard(ctx, nx - 64, nodeY - 22, 128, 44, {
      radius: 12,
      fill: '#065F46',
      stroke: '#34D399',
      lineWidth: 2,
      shadowBlur: 0,
    });
    ctx.font = '700 20px JetMono';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(lb, nx, nodeY);
    ctx.textBaseline = 'top';
  });
  ctx.restore();

  // Right Box: MATAN
  ctx.save();
  ctx.globalAlpha = clamp01(matanProg);
  drawCard(ctx, x + 64 + colW, y + 72, colW, h - 104, {
    radius: 20,
    fill: 'rgba(66, 32, 6, 0.42)',
    stroke: '#EAB308',
    lineWidth: 2.5,
    shadowBlur: 0,
  });
  ctx.font = '800 32px PlusJakarta';
  ctx.fillStyle = '#FDE047';
  ctx.textAlign = 'center';
  ctx.fillText('2. MATAN (REDAKSI)', x + 64 + colW + colW / 2, y + 96);

  ctx.font = '600 24px PlusJakarta';
  ctx.fillStyle = '#E2E8F0';
  drawWrappedText(
    ctx,
    'Kalimat atau lafaz ucapan yang disandarkan kepada Nabi SAW. Wajib bebas dari kejanggalan.',
    x + 64 + colW + colW / 2,
    y + 146,
    colW - 44,
    34,
    { align: 'center', maxLines: 3 },
  );

  drawTagPill(ctx, x + 64 + colW + colW / 2, y + h - 86, 'TIDAK BOLEH DIKARANG', {
    font: '700 21px JetMono',
    fill: 'rgba(234, 179, 8, 0.16)',
    stroke: '#EAB308',
    textColor: '#FDE047',
    padX: 20,
    height: 44,
  });
  ctx.restore();

  ctx.restore();
}

/**
 * Draws a Classical Book / Kitab Monograph Reference Card.
 */
export function drawBookArchiveCard(ctx, x, y, w, h, opts = {}) {
  const {
    title = 'KITAB RUJUKAN KLASIK',
    author = 'Imam Ibnul Jauzi (w. 597 H)',
    book = 'Al-Maudhu’at (Jilid 1, Hal. 215)',
    verdict = 'BATIL / PALSU',
    color = '#991B1B',
    reveal = 1,
  } = opts;

  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  drawCard(ctx, x, y + (1 - p) * 16, w, h, {
    radius: 22,
    fill: '#FFFDF7',
    stroke: '#9A8460',
    lineWidth: 2.5,
  });

  // Left book spine stripe
  ctx.fillStyle = color;
  roundRectPath(ctx, x + 16, y + (1 - p) * 16 + 16, 18, h - 32, 9);
  ctx.fill();

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#57534E';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + 54, y + (1 - p) * 16 + 24);

  ctx.font = '800 32px PlusJakarta';
  ctx.fillStyle = '#1C1917';
  ctx.fillText(author, x + 54, y + (1 - p) * 16 + 58);

  ctx.font = '600 25px Playfair';
  ctx.fillStyle = '#92400E';
  ctx.fillText(book, x + 54, y + (1 - p) * 16 + 102);

  drawTagPill(ctx, x + w - 34, y + (1 - p) * 16 + h / 2, verdict, {
    align: 'right',
    font: '800 23px JetMono',
    fill: 'rgba(153, 27, 27, 0.13)',
    stroke: color,
    textColor: color,
    padX: 22,
    height: 48,
  });

  ctx.restore();
}

/**
 * Draws a Numbered Action Step Card (used in Practical Guide i09 & Summary i10).
 */
export function drawChecklistStepRow(ctx, x, y, w, h, opts = {}) {
  const {
    num = '01',
    title = '',
    desc = '',
    accent = '#065F46',
    isLight = true,
    reveal = 1,
  } = opts;
  const p = clamp01(reveal);
  if (p <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = p;
  const dy = (1 - p) * 18;
  drawCard(ctx, x, y + dy, w, h, {
    radius: 24,
    fill: isLight ? '#FFFFFF' : 'rgba(13, 28, 24, 0.94)',
    stroke: accent,
    lineWidth: 2.5,
    shadowBlur: 12,
  });

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + 68, y + dy + h / 2, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '800 30px JetMono';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num, x + 68, y + dy + h / 2 + 1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '800 33px PlusJakarta';
  ctx.fillStyle = isLight ? '#14261E' : '#F8FAFC';
  ctx.fillText(title, x + 126, y + dy + 32);

  ctx.font = '500 27px PlusJakarta';
  ctx.fillStyle = isLight ? '#475569' : '#CBD5E1';
  drawWrappedText(ctx, desc, x + 126, y + dy + 78, w - 160, 38, { align: 'left', maxLines: 3 });

  ctx.restore();
}

// ============================================================================
// 7. SCENE TRANSITIONS
// ============================================================================
export function drawTransitionOverlay(ctx, transitionType, progress) {
  const p = clamp01(progress);
  if (p <= 0 || p >= 1 || transitionType === 'none') return;

  ctx.save();
  if (transitionType === 'seal_crimson' || transitionType === 'seal_gold') {
    const col = transitionType === 'seal_crimson' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(234, 179, 8, 0.35)';
    ctx.strokeStyle = col;
    ctx.lineWidth = 10;
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

// ============================================================================
// 8. MASTER FRAME RENDERER & DYNAMIC SCENE LOADER
// ============================================================================
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
      roundRectPath,
      drawCard,
      drawRubElHizbEmblem,
      drawTagPill,
      drawArrow,
      drawWrappedText,
      drawVerdictStamp,
      drawArabicManuscriptBox,
      drawIsnadChainDiagram,
      drawScholarVerdictTable,
      drawSocialBroadcastCard,
      drawCalloutBox,
      drawFakeVsSahihCard,
      drawSanadVsMatanDiagram,
      drawBookArchiveCard,
      drawChecklistStepRow,
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
// 9. CLI ENTRYPOINT: --scene=i01:0.85 PREVIEW OR FULL 2K 90FPS MP4 RENDER
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
