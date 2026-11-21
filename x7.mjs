import {
  drawFloatingVerseTag,
  drawGoldenRippleRings,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.03,
    zoomEnd: 1.0,
    driftX: 8,
    driftY: 12,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#072A21',
    accentGlow: h.THEME.goldMedina,
    turqGlow: h.THEME.turqBright,
    rayIntensity: 0.25,
    rosetteAlpha: 0.13,
  });

  drawFloatingVerseTag(ctx, h.WIDTH / 2, 620, 'SURAH AL-BAQARAH  ·  AYAT 261', h.clamp01(localT / 0.6));

  // Botanical growth: 1 seed drops -> sprouts 7 golden stalks
  const seedDropP = h.clamp01(localT / 1.1);
  const branchP = h.clamp01((localT - 0.9) / 2.6);

  drawGoldenRippleRings(ctx, h.WIDTH / 2, 1520, totalT, h.THEME.goldMedina, 340);
  h.drawBotanicalSeedTree(ctx, h.WIDTH / 2, 1530, seedDropP, branchP, 0, totalT);

  // Floating callout pill
  h.drawGlassStatCard(
    ctx,
    240,
    1575,
    960,
    144,
    'PERUMPAMAAN AL-QUR\'AN',
    '1 BENIH  →  7 TANGKAI',
    '',
    h.THEME.goldBright,
    h.clamp01((localT - 1.8) / 0.7),
  );

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1845, 1120, localT, {
    delay: 1.0,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
