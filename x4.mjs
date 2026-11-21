import {
  drawPulseHeartShield,
  drawGoldenRippleRings,
  drawAnimatedArrow,
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
    accentTop: '#072923',
    accentGlow: h.THEME.turqBright,
    turqGlow: h.THEME.goldMedina,
    rayIntensity: 0.24,
    rosetteAlpha: 0.14,
  });

  // Glowing Heart-Intention Core
  drawGoldenRippleRings(ctx, h.WIDTH / 2, 825, totalT, h.THEME.turqBright, 390);
  drawPulseHeartShield(ctx, h.WIDTH / 2, 825, 130, h.clamp01(localT / 0.8), totalT, 'good');

  // Floating +1 right inside core
  const plusP = h.easeOutBack(h.clamp01((localT - 0.5) / 0.6));
  ctx.save();
  ctx.translate(h.WIDTH / 2, 825);
  ctx.scale(plusP, plusP);
  ctx.font = '900 72px Cinzel';
  ctx.fillStyle = h.THEME.bgObsidian;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+1', 0, 2);
  ctx.restore();

  // Angel ledger checklist rows
  h.drawChecklistStamp(
    ctx,
    h.WIDTH / 2,
    1335,
    [
      {
        iconText: '01',
        title: 'NIAT BAIK MUNCUL DI HATI',
        desc: 'Tekad tulus untuk melakukan satu amal saleh',
        badge: 'TERCATAT',
        accent: h.THEME.turqBright,
      },
      {
        iconText: '02',
        title: 'BELUM SEMPAT TERLAKSANA',
        desc: 'Terhalang uzur atau kesempatan belum tiba',
        badge: '+1 PENUH',
        accent: h.THEME.goldBright,
      },
    ],
    h.clamp01((localT - 0.9) / 1.8),
  );

  drawAnimatedArrow(ctx, h.WIDTH / 2, 1525, h.WIDTH / 2, 1665, h.clamp01((localT - 2.4) / 0.6), h.THEME.goldBright, 5);

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1805, 1140, localT, {
    delay: 1.4,
    arabicSize: 42,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
