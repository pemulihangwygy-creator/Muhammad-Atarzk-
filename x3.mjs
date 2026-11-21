export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.02,
    zoomEnd: 1.0,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'justice');
  h.drawPrecisionMizan(ctx, h.WIDTH / 2, 1110, localT, totalT);
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1815, 1140, localT, {
    delay: 0.9,
    arabicSize: 44,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
