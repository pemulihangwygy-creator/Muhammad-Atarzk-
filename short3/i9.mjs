export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawSpotlightStageBackdrop,
    drawTwinSahihAndMasjidFinale,
  } = H;

  // Dawn Spotlight Stage + Twin Gold-Embossed Sahih Books + Madinah Dome + 3 Action Steps
  drawSpotlightStageBackdrop(ctx, localSec, {
    coneColor: 'rgba(16, 185, 129, 0.12)',
    floorY: 1620,
  });

  const booksP = beat(localSec, 0.25, 0.85, easeOutBack);
  const stepsP = beat(localSec, 2.4, 1.4, easeOutCubic);
  const ctaP = beat(localSec, 6.2, 0.75, easeOutBack);

  drawTwinSahihAndMasjidFinale(ctx, WIDTH / 2, 840, {
    booksReveal: booksP,
    stepsReveal: stepsP,
    ctaReveal: ctaP,
    localSec,
  });
}
