export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.022,
    zoomEnd: 1.0,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'botanical');
  h.drawBotanicalCrossSection(ctx, h.WIDTH / 2, 1100, localT, totalT);
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1805, 1120, localT, {
    delay: 1.0,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
