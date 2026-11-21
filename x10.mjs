import {
  drawVerticalBeamPillar,
  drawInfinityRibbon,
  drawStarConstellation,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.03,
    zoomEnd: 1.0,
    driftX: 9,
    driftY: 12,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#07241F',
    accentGlow: h.THEME.goldBright,
    turqGlow: h.THEME.turqBright,
    rayIntensity: 0.28,
    rosetteAlpha: 0.15,
  });

  drawStarConstellation(ctx, h.WIDTH / 2, 960, 1100, 620, h.clamp01(localT / 1.0), totalT);

  // Twin Radiant Pillars: PUASA & SABAR ascending into infinite ribbon
  drawVerticalBeamPillar(ctx, h.WIDTH / 2 - 260, 740, 1520, 290, h.clamp01(localT / 1.1), h.THEME.turqBright, 'PUASA');
  drawVerticalBeamPillar(ctx, h.WIDTH / 2 + 260, 740, 1520, 290, h.clamp01((localT - 0.5) / 1.1), h.THEME.goldBright, 'SABAR');

  // Infinity Lemniscate Ribbon bridging both pillars
  drawInfinityRibbon(ctx, h.WIDTH / 2, 1080, 960, 460, h.clamp01((localT - 1.1) / 1.5), totalT, h.THEME.goldBright);

  h.drawBigNumberCounter(ctx, h.WIDTH / 2, 1475, '∞', 'BIGHAIRI HISAB — TANPA BATAS', h.clamp01((localT - 1.8) / 0.8), {
    fontSize: 185,
    echoTrails: true,
  });

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1825, 1140, localT, {
    delay: 1.4,
    arabicSize: 44,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
