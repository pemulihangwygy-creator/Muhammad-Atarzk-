export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.024,
    zoomEnd: 1.0,
    pushAt: 4.5,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'emerald');
  h.drawHumanVsIslamicMath(ctx, h.WIDTH / 2, 1080, localT, totalT);
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1815, 1120, localT, {
    delay: 2.0,
    arabicSize: 50,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
