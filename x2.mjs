import {
  drawFloatingVerseTag,
  drawShimmerSweepRect,
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
    accentTop: '#082721',
    accentGlow: h.THEME.goldMedina,
    turqGlow: h.THEME.turqMid,
    rayIntensity: 0.22,
    rosetteAlpha: 0.14,
  });

  // Illuminated Surah Al-An'am 6:160 tag
  drawFloatingVerseTag(ctx, h.WIDTH / 2, 650, 'SURAH AL-AN\'AM  ·  AYAT 160', h.clamp01(localT / 0.6));

  // Open Illuminated Manuscript behind Arabic verse
  h.drawIlluminatedManuscript(ctx, h.WIDTH / 2, 1010, 1180, 440, h.clamp01(localT / 0.9), totalT);

  // Arabic verse plaque centered inside manuscript aura
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1010, 1060, localT, {
    delay: 0.35,
    arabicSize: 50,
    showTrans: true,
  });

  // Giant rolling multiplier counter 1 -> 10x
  const countP = h.easeOutExpo(h.clamp01((localT - 1.6) / 1.8));
  const val = Math.max(1, Math.round(h.lerp(1, 10, countP)));
  h.drawBigNumberCounter(ctx, h.WIDTH / 2, 1465, `${val}×`, 'BALASAN MINIMAL SATU KEBAIKAN', h.clamp01((localT - 1.2) / 0.7), {
    fontSize: 196,
    echoTrails: true,
  });

  // Bottom stat strip
  h.drawGlassStatCard(
    ctx,
    180,
    1720,
    1080,
    185,
    'KAIDAH AL-QUR\'AN',
    '1 KEBAIKAN  →  10 PAHALA',
    'Berlaku otomatis sebagai batas bawah rahmat Allah',
    h.THEME.turqBright,
    h.clamp01((localT - 2.4) / 0.8),
  );
  drawShimmerSweepRect(ctx, 180, 1720, 1080, 185, 28, totalT, h.THEME.goldBright);

  ctx.restore();
  ctx.restore();
}
