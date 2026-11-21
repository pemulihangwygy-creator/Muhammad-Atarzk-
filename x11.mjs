import {
  drawDataBadgeRow,
  drawRotatingAstrolabe,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.03,
    zoomEnd: 1.0,
    driftX: 10,
    driftY: 10,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#16211A',
    accentGlow: h.THEME.goldMedina,
    turqGlow: h.THEME.turqMid,
    rayIntensity: 0.22,
    rosetteAlpha: 0.11,
  });

  // Distant celestial astrolabe in twilight sky
  drawRotatingAstrolabe(ctx, h.WIDTH / 2, 860, 260, h.clamp01(localT / 1.0), totalT);

  // Big counter 1.000 UNTA
  h.drawBigNumberCounter(ctx, h.WIDTH / 2, 855, '1.000', 'UNTA MUATAN GANDUM & MINYAK', h.clamp01((localT - 0.5) / 0.9), {
    fontSize: 174,
    echoTrails: true,
  });

  // Animated desert twilight caravan crossing from Syam to Madinah
  h.drawCaravanTwilight(ctx, h.WIDTH / 2, 1375, h.clamp01(localT / 0.9), totalT);

  // Context badges
  drawDataBadgeRow(
    ctx,
    h.WIDTH / 2,
    1810,
    [
      { tag: 'SAHABAT', val: 'UTSMAN RA', sub: 'Dzun Nurain', color: h.THEME.goldBright },
      { tag: 'MASA KHALIFAH', val: 'ABU BAKAR', sub: 'Paceklik Madinah', color: h.THEME.turqBright },
      { tag: 'ASAL KAFILAH', val: 'SYAM', sub: '1.000 Kafilah', color: h.THEME.goldMedina },
    ],
    h.clamp01((localT - 1.2) / 1.0),
  );

  ctx.restore();
  ctx.restore();
}
