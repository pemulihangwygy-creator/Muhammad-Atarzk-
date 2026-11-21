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

  h.drawArchitecturalStage(ctx, totalT, 'emerald');
  h.drawHeartToScrollSystem(ctx, h.WIDTH / 2, 1055, localT, totalT);

  drawStepFlowPill(
    ctx,
    h.WIDTH / 2,
    1470,
    '01',
    'NIAT BAIK YANG TERHALANG UZUR',
    'Meskipun amal belum terlaksana, Allah tetap mencatat 1 pahala utuh di sisi-Nya',
    h.THEME.turqBright,
    h.clamp01((localT - 1.6) / 0.7),
  );

  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1790, 1140, localT, {
    delay: 1.1,
    arabicSize: 42,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
