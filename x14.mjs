import {
  drawMandalaSynthesis,
  drawCommentCTA,
  drawGoldenStarburst,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.03,
    zoomEnd: 1.0,
    driftX: 8,
    driftY: 10,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#0A2B23',
    accentGlow: h.THEME.goldBright,
    turqGlow: h.THEME.turqBright,
    rayIntensity: 0.32,
    rosetteAlpha: 0.18,
  });

  drawGoldenStarburst(ctx, h.WIDTH / 2, 1020, 20, 110, 520, totalT, h.THEME.goldBright, 0.25);

  // Grand Synthesis Mandala
  drawMandalaSynthesis(
    ctx,
    h.WIDTH / 2,
    1020,
    375,
    ['NIAT BAIK', '10× MINIMAL', '700× BENIH', 'PUASA ∞', 'IKHLAS'],
    h.clamp01(localT / 1.2),
    totalT,
  );

  // Arabic Hadith Plaque
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1575, 1100, localT, {
    delay: 0.7,
    arabicSize: 48,
    showTrans: true,
  });

  // Organic Comment CTA Card
  drawCommentCTA(
    ctx,
    h.WIDTH / 2,
    1835,
    'Kebaikan kecil apa yang paling membekas di hidupmu?',
    h.clamp01((localT - 1.5) / 0.9),
    totalT,
  );

  ctx.restore();
  ctx.restore();
}
