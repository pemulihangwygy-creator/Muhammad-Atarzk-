export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawBlueprintGridBackdrop,
    drawEditorialBarAndPitcherScene,
  } = H;

  // Obsidian Grid + Glowing 2-Column Comparison Bars + Crystal Ibrik Pitcher + 2 Sahih Cards (ref_56s & ref_64s!)
  drawBlueprintGridBackdrop(ctx, localSec, {
    glowColor: 'rgba(45, 212, 191, 0.13)',
    gridAlpha: 0.04,
  });

  const barL = beat(localSec, 0.3, 0.75, easeOutCubic);
  const barR = beat(localSec, 1.0, 0.95, easeOutCubic);
  const pitcherP = beat(localSec, 2.6, 0.8, easeOutBack);
  const quotesP = beat(localSec, 3.6, 1.4, easeOutCubic);

  drawEditorialBarAndPitcherScene(ctx, WIDTH / 2, 860, {
    barLeftProg: barL,
    barRightProg: barR,
    pitcherReveal: pitcherP,
    quotesReveal: quotesP,
    localSec,
  });
}
