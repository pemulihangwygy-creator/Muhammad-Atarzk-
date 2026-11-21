import {
  drawMetricPill,
  drawSparkBurst,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.04,
    zoomEnd: 1.0,
    driftX: 11,
    driftY: 13,
    shake: 5,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#0C2B23',
    accentGlow: h.THEME.goldBright,
    turqGlow: h.THEME.turqBright,
    rayIntensity: 0.28,
    rosetteAlpha: 0.16,
  });

  // Top Metric Pill
  drawMetricPill(
    ctx,
    h.WIDTH / 2,
    645,
    'SAAT NIAT DIAMALKAN',
    'LONJAKAN 10×  →  700×  →  ∞',
    h.THEME.goldBright,
    h.clamp01(localT / 0.7),
  );

  // 5-tier exponential staircase rising cleanly
  h.drawExponentialStaircase(ctx, h.WIDTH / 2, 1590, h.clamp01((localT - 0.5) / 2.8), totalT);

  if (localT > 2.2 && localT < 4.5) {
    drawSparkBurst(ctx, h.WIDTH / 2 + 200, 890, 606, 36, 340, (localT - 2.2) / 2.3, h.THEME.goldBright);
  }

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1825, 1120, localT, {
    delay: 1.4,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
