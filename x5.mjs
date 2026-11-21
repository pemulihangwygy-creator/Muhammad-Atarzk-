import { drawStepFlowPill } from './utama.mjs';

export default function renderScene(ctx, { scene, localT, totalT, durationSec, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.022,
    zoomEnd: 1.0,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawArchitecturalStage(ctx, totalT, 'justice');
  h.drawInterceptGateDiagram(ctx, h.WIDTH / 2, 1080, localT);

  drawStepFlowPill(
    ctx,
    h.WIDTH / 2,
    1545,
    '+1',
    'MENGURUNGKAN MAKSIAT KARENA ALLAH',
    'Bukan sekadar bebas dari dosa, penolakan itu berubah menjadi satu pahala sempurna',
    h.THEME.goldBright,
    h.clamp01((localT - 2.0) / 0.7),
  );

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1815, 1120, localT, {
    delay: 1.3,
    arabicSize: 50,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
