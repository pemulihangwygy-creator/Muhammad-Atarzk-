import {
  drawLailatulQadarArc,
  drawGlowingDividerPill,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.03,
    zoomEnd: 1.0,
    driftX: 9,
    driftY: 11,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#082620',
    accentGlow: h.THEME.goldMedina,
    turqGlow: h.THEME.turqBright,
    rayIntensity: 0.24,
    rosetteAlpha: 0.14,
  });

  // Lifespan Comparison Bars
  h.drawComparisonBars(
    ctx,
    150,
    635,
    1140,
    [
      {
        label: 'UMAT TERDAHULU',
        valueLabel: '±950 TAHUN',
        ratio: 0.94,
        color: h.THEME.turqMid,
      },
      {
        label: 'UMAT NABI MUHAMMAD SAW',
        valueLabel: '60 – 70 TAHUN',
        ratio: 0.14,
        color: h.THEME.goldBright,
      },
    ],
    h.clamp01(localT / 1.2),
    totalT,
  );

  // Lailatul Qadar / Multiplier Bridge Arc
  drawLailatulQadarArc(ctx, h.WIDTH / 2, 1165, 960, h.clamp01((localT - 1.0) / 1.0), totalT);

  // 1 Dirham vs 100.000 Dirham Scale
  drawGlowingDividerPill(ctx, h.WIDTH / 2, 1280, 'BERATNYA KEIKHLASAN DI HATI', h.THEME.turqBright, h.clamp01((localT - 1.8) / 0.6));
  h.drawDirhamScale(ctx, h.WIDTH / 2, 1525, h.clamp01((localT - 2.0) / 1.3), totalT);

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1855, 1120, localT, {
    delay: 2.2,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
