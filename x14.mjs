export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.022,
    zoomEnd: 1.0,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'finale');
  h.drawDominoImpactChain(ctx, h.WIDTH / 2, 1060, localT);
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1780, 1100, localT, {
    delay: 0.9,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
