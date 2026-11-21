import {
  drawEquationTransform,
  drawOrbitalEquationRing,
  drawGoldenStarburst,
  drawSparkBurst,
} from './utama.mjs';

export default function renderScene(ctx, { scene, sceneIndex, localT, totalT, durationSec, progress, sceneAlpha, h }) {
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  const cam = h.createCameraState(localT, durationSec, {
    zoomStart: 1.04,
    zoomEnd: 1.0,
    driftX: 12,
    driftY: 14,
    shake: 7,
  });

  ctx.save();
  h.applyCamera(ctx, cam);

  h.drawCosmicBackdrop(ctx, totalT, sceneIndex, {
    accentTop: h.THEME.bgEmeraldMid,
    accentGlow: h.THEME.goldMedina,
    turqGlow: h.THEME.turqMid,
    rayIntensity: 0.25,
    rosetteAlpha: 0.16,
  });

  // Rotating sacred starburst behind central equation transformation
  drawGoldenStarburst(ctx, h.WIDTH / 2, 1140, 24, 130, 560, totalT, h.THEME.goldBright, 0.28);

  // Orbiting formula badges around central transformation
  const ringP = h.clamp01((localT - 3.2) / 1.4);
  drawOrbitalEquationRing(ctx, h.WIDTH / 2, 1140, 445, ['1×', '10×', '100×', '700×', '∞'], ringP, totalT);

  // Main dramatic transformation: 1 + 1 = 2 -> 1 -> 700x -> ∞
  drawEquationTransform(ctx, h.WIDTH / 2, 1140, '1 + 1 = 2', '700×', progress, totalT);

  // Impact spark burst right when Islamic math reveals
  if (progress > 0.38 && progress < 0.75) {
    drawSparkBurst(ctx, h.WIDTH / 2, 1140, 101, 42, 460, (progress - 0.38) / 0.37, h.THEME.goldBright);
  }

  // Arabic Plaque at lower stage
  h.drawArabicPlaque(ctx, scene, h.WIDTH / 2, 1805, 1120, localT, {
    delay: 2.2,
    arabicSize: 52,
    showTrans: true,
  });

  ctx.restore();
  ctx.restore();
}
