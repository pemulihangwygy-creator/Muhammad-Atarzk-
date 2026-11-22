export function renderScene(ctx, scene, localSec, H) {
  const {
    beat,
    easeOutCubic,
    easeOutBack,
    drawSilkRoadTerrainBackdrop,
    drawSilkRoadCaravanAndPin,
  } = H;

  // Illustrated Vector Silk Road Map + Walking Camels + Fracture Flare + Telemetry Card (ref_26s & ref_32s!)
  drawSilkRoadTerrainBackdrop(ctx, localSec);

  const caravanP = beat(localSec, 0.25, 3.8, easeOutCubic);
  const flareP = beat(localSec, 3.2, 0.75, easeOutCubic);
  const cardP = beat(localSec, 4.4, 0.7, easeOutBack);
  const badgeP = beat(localSec, 7.6, 0.65, easeOutCubic);

  drawSilkRoadCaravanAndPin(ctx, {
    caravanProg: caravanP,
    flareReveal: flareP,
    cardReveal: cardP,
    badgeReveal: badgeP,
    localSec,
  });
}
