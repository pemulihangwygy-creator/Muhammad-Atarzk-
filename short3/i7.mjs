export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawBlueprintGridBackdrop,
    drawKineticClimaxTypography,
  } = H;

  // Obsidian Blueprint Grid + Crimson Climax Glow (EXACT ref_72s Kinetic Typography Climax!)
  drawBlueprintGridBackdrop(ctx, localSec, {
    glowColor: 'rgba(232, 76, 61, 0.16)',
    gridAlpha: 0.04,
  });

  const yahyaP = beat(localSec, 0.4, 0.65, easeOutCubic);
  const strikeP = beat(localSec, 7.6, 0.55, easeOutCubic);
  const mainP = beat(localSec, 8.2, 0.65, easeOutBack);
  const arabicP = beat(localSec, 10.6, 0.75, easeOutCubic);

  drawKineticClimaxTypography(ctx, WIDTH / 2, 920, {
    yahyaReveal: yahyaP,
    strikeProgress: strikeP,
    mainReveal: mainP,
    arabicReveal: arabicP,
    localSec,
  });
}
