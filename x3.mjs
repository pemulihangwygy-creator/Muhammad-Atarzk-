import {
  drawDualMetricSplit,
  drawGlowingDividerPill,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.025,
    zoomEnd: 1.0,
    driftX: 10,
    driftY: 10,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#0E2421',
    accentGlow: h.THEME.goldMedina,
    turqGlow: h.THEME.crimsonDeep,
    rayIntensity: 0.18,
    rosetteAlpha: 0.12,
  });

  // Mizan Balance Scale oscillating slightly, heavily favoring Kebaikan (right pan down)
  const scaleP = h.clamp01(localT / 0.9);
  const targetTilt = h.lerp(0.0, 0.24, h.easeOutElastic(h.clamp01((localT - 0.8) / 1.8))) + Math.sin(totalT * 1.4) * 0.025;

  h.drawMizanScale(
    ctx,
    h.WIDTH / 2,
    975,
    780,
    targetTilt,
    {
      label: 'KEBURUKAN',
      value: '1×',
      orbs: 1,
      orbColor: h.THEME.crimsonBright,
    },
    {
      label: 'KEBAIKAN',
      value: '10× — 700×',
      orbs: 8,
      orbColor: h.THEME.goldBright,
    },
    scaleP,
    totalT,
  );

  // Imam Al-Qurthubi contrast strip
  drawGlowingDividerPill(ctx, h.WIDTH / 2, 1445, 'TAFSIR IMAM AL-QURTHUBI', h.THEME.goldBright, h.clamp01((localT - 1.5) / 0.6));

  drawDualMetricSplit(
    ctx,
    h.WIDTH / 2,
    1625,
    {
      tag: 'KEADILAN ALLAH',
      val: '1 DOSA = 1',
      sub: 'Tidak pernah dilebihkan',
      color: h.THEME.crimsonBright,
    },
    {
      tag: 'RAHMAT ALLAH',
      val: '1 AMAL = 10×+',
      sub: 'Dilipatgandakan tanpa ragu',
      color: h.THEME.goldBright,
    },
    h.clamp01((localT - 2.2) / 0.8),
  );

  // Arabic plaque below
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1855, 1140, localT, {
    delay: 0.6,
    arabicSize: 44,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
