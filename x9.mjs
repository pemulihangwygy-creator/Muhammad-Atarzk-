import {
  drawHilalCrescent,
  drawShatterParticles,
  drawCrescentSkylineAura,
  drawGlowingDividerPill,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.04,
    zoomEnd: 1.0,
    driftX: 11,
    driftY: 13,
    shake: 7,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#061D22',
    accentGlow: h.THEME.turqBright,
    turqGlow: h.THEME.goldBright,
    rayIntensity: 0.26,
    rosetteAlpha: 0.16,
  });

  // Crescent Moon (Hilal) rising above the 700x ceiling
  drawCrescentSkylineAura(ctx, h.WIDTH / 2, 930, h.clamp01(localT / 0.9), totalT);
  drawHilalCrescent(ctx, h.WIDTH / 2, 875, 165, h.clamp01(localT / 0.85), totalT, h.THEME.goldBright);

  // Shattering 700x glass ceiling barrier
  const ceilY = 1235;
  const breakP = h.clamp01((localT - 1.6) / 1.4);
  if (breakP < 0.85) {
    ctx.save();
    ctx.globalAlpha = 1 - breakP;
    h.drawGlowingLine(ctx, 180, ceilY, 1260, ceilY, h.THEME.crimsonBright, 5, 14);
    ctx.restore();
  }
  drawShatterParticles(ctx, h.WIDTH / 2, ceilY, breakP, totalT, h.THEME.turqBright);

  drawGlowingDividerPill(ctx, h.WIDTH / 2, 1235, 'BATAS 700× DITEMBUS OLEH PUASA', h.THEME.turqBright, h.clamp01((localT - 1.1) / 0.7));

  h.drawBigNumberCounter(ctx, h.WIDTH / 2, 1485, '> 700×', 'ALLAH SENDIRI YANG MEMBALASNYA', h.clamp01((localT - 2.0) / 0.9), {
    fontSize: 158,
    colorTop: '#FFFFFF',
    colorBot: h.THEME.turqBright,
    glowColor: h.THEME.turqMid,
  });

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1820, 1140, localT, {
    delay: 1.5,
    arabicSize: 44,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
