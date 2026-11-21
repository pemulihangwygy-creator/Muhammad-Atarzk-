import {
  drawPulseHeartShield,
  drawShatterParticles,
  drawVerticalStepCard,
  drawAnimatedArrow,
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
    accentTop: '#082522',
    accentGlow: h.THEME.turqMid,
    turqGlow: h.THEME.goldMedina,
    rayIntensity: 0.22,
    rosetteAlpha: 0.14,
  });

  // Protective Taqwa Shield dissolving negative impulse into light
  drawPulseHeartShield(ctx, h.WIDTH / 2, 830, 145, h.clamp01(localT / 0.75), totalT, 'shield');
  drawShatterParticles(ctx, h.WIDTH / 2, 830, h.clamp01((localT - 1.2) / 1.8), totalT, h.THEME.turqBright);

  // Transformation Step Cards
  drawVerticalStepCard(
    ctx,
    h.WIDTH / 2,
    1185,
    1060,
    142,
    '×',
    'NIAT BURUK MUNCUL',
    'Dorongan hati ingin berbuat dosa atau maksiat',
    h.THEME.crimsonBright,
    h.clamp01((localT - 0.6) / 0.7),
  );

  drawAnimatedArrow(ctx, h.WIDTH / 2, 1265, h.WIDTH / 2, 1365, h.clamp01((localT - 1.5) / 0.5), h.THEME.turqBright, 5);

  drawVerticalStepCard(
    ctx,
    h.WIDTH / 2,
    1465,
    1060,
    152,
    '+1',
    'DIURUNGKAN KARENA ALLAH',
    'Malaikat mencatatnya sebagai 1 kebaikan sempurna',
    h.THEME.goldBright,
    h.clamp01((localT - 1.9) / 0.8),
  );

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1800, 1100, localT, {
    delay: 1.2,
    arabicSize: 52,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
