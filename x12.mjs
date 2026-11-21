export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.025,
    zoomEnd: 1.0,
    pushAt: 2.2,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'desert');
  h.drawAuctionOfferSequence(ctx, h.WIDTH / 2, 1065, localT);
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1785, 1140, localT, {
    delay: 1.5,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
