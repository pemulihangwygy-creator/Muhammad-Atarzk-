import { drawComparisonSplitBadge } from './utama.mjs';

export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.02,
    zoomEnd: 1.0,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'desert');
  h.drawSyamMadinahMap(ctx, h.WIDTH / 2, 1085, localT, totalT);

  drawComparisonSplitBadge(
    ctx,
    h.WIDTH / 2,
    1775,
    'UTSMAN RA',
    'Sahabat Nabi · Pemilik Kafilah',
    'ABU BAKAR RA',
    'Khalifah · Saat Madinah Paceklik',
    h.clamp01((localT - 1.3) / 0.8),
  );

  ctx.restore();
  ctx.restore();
}
