export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.02,
    zoomEnd: 1.0,
    pushAt: 2.2,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'emerald');
  h.drawMushafAndTenBlocks(ctx, h.WIDTH / 2, 1135, localT, totalT);

  // Place Quranic Ayat plaque neatly below the 10-block grid
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1785, 1120, localT, {
    delay: 0.7,
    arabicSize: 48,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
