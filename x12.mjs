import {
  drawSplitArenaCards,
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
    driftY: 11,
    shake: 6,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: '#0F2A22',
    accentGlow: h.THEME.goldBright,
    turqGlow: h.THEME.turqMid,
    rayIntensity: 0.28,
    rosetteAlpha: 0.14,
  });

  // Split Arena Comparison: Pedagang 2x->5x (crossed) vs Janji Allah 10x-700x+
  drawSplitArenaCards(
    ctx,
    h.WIDTH / 2,
    920,
    {
      title: 'TAWARAN PEDAGANG',
      value: '2× → 5×',
      sub: 'Keuntungan Dunia',
      accent: h.THEME.crimsonBright,
      crossed: true,
    },
    {
      title: 'TAWARAN ALLAH',
      value: '10× — 700×',
      sub: 'Balasan Abadi',
      accent: h.THEME.goldBright,
    },
    h.clamp01((localT - 0.3) / 1.8),
    totalT,
  );

  // Punchline Pill: 100% Sedekah Gratis
  drawMetricPill(
    ctx,
    h.WIDTH / 2,
    1360,
    'KEPUTUSAN UTSMAN BIN AFFAN RA',
    'SELURUH 1.000 UNTA DISEDEKAHKAN GRATIS',
    h.THEME.turqBright,
    h.clamp01((localT - 2.3) / 0.8),
  );

  if (localT > 2.4 && localT < 4.5) {
    drawSparkBurst(ctx, h.WIDTH / 2 + 290, 920, 1212, 34, 340, (localT - 2.4) / 2.1, h.THEME.goldBright);
  }

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1730, 1140, localT, {
    delay: 1.4,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
