export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, worldKey, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.02,
    zoomEnd: 1.0,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawEditorialStage(ctx, worldKey, totalT);
  h.renderScene14(ctx, scene, localT);

  ctx.restore();
  ctx.restore();
}
