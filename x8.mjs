export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.024,
    zoomEnd: 1.0,
    pushAt: 2.2,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'botanical');
  h.drawWheatEarLoupe(ctx, h.WIDTH / 2, 1100, localT);
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1805, 1120, localT, {
    delay: 1.0,
    arabicSize: 50,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
