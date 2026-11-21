import {
  drawFramedCalloutPill,
  drawSparkBurst,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.04,
    zoomEnd: 1.0,
    driftX: 10,
    driftY: 12,
    shake: 6,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#0E2D23',
    accentGlow: h.THEME.goldBright,
    turqGlow: h.THEME.turqMid,
    rayIntensity: 0.3,
    rosetteAlpha: 0.16,
  });

  // Full 7-stalk tree with sparkling 100-grain blooms per stalk
  const grainBurstP = h.clamp01((localT - 0.5) / 1.5);
  h.drawBotanicalSeedTree(ctx, h.WIDTH / 2, 1465, 1, 1, grainBurstP, totalT);

  // Equation breakdown 7 x 100 = 700
  drawFramedCalloutPill(ctx, h.WIDTH / 2 - 270, 1600, '7 TANGKAI × 100 BIJI', '700× LIPAT', h.THEME.turqBright, h.clamp01((localT - 1.4) / 0.7));
  drawFramedCalloutPill(ctx, h.WIDTH / 2 + 270, 1600, 'JANJI TAMBAHAN', 'TANPA BATAS', h.THEME.goldBright, h.clamp01((localT - 2.4) / 0.7));

  if (localT > 2.2 && localT < 4.5) {
    drawSparkBurst(ctx, h.WIDTH / 2, 920, 808, 44, 520, (localT - 2.2) / 2.3, h.THEME.goldBright);
  }

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1835, 1120, localT, {
    delay: 1.0,
    arabicSize: 52,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
