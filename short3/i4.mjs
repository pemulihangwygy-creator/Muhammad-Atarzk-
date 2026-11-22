export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    drawSpotlightStageBackdrop,
    drawHangingSpotlightPlaque,
    drawBrokenGoldenChainArtifact,
    drawMicroPill,
  } = H;

  // Theatrical Overhead Spotlight Stage + Hanging Plaque + Snapped Golden Chain (ref_44s & ref_50s!)
  drawSpotlightStageBackdrop(ctx, localSec, {
    coneColor: 'rgba(217, 179, 130, 0.14)',
    floorY: 1620,
  });

  const plaqueP = beat(localSec, 0.2, 0.7, easeOutBack);
  const stickerP = beat(localSec, 5.2, 0.55, easeOutBack);
  const chainP = beat(localSec, 2.2, 0.8, easeOutCubic);
  const snapP = beat(localSec, 7.2, 0.8, easeOutBack);
  const pillP = beat(localSec, 8.6, 0.6, easeOutCubic);

  // Hanging Plaque in Upper Spotlight Cone
  drawHangingSpotlightPlaque(ctx, WIDTH / 2, 620, 760, 310, {
    eyebrow: 'PERAWI CACAT SANAD',
    mainTitle: 'ABU ‘ATIKAH',
    subNote: 'TARIF BIN SULAIMAN · HADITS PALSU',
    sticker: 'MATRUK / TERTOLAK',
    stickerReveal: stickerP,
    swingPhase: localSec,
    reveal: plaqueP,
  });

  // Detailed Broken Golden Chain & Turbaned Scholar Medallions inside Lit Floor Pool
  drawBrokenGoldenChainArtifact(ctx, WIDTH / 2, 1205, {
    snapProg: snapP,
    localSec,
    reveal: chainP,
  });

  // Scholar Verdict Micro-Pill at Floor Stage
  drawMicroPill(ctx, WIDTH / 2, 1495, 'AL-BUKHARI · AN-NASA’I · ABU HATIM: RIWAYAT TERTOLAK', {
    dotColor: PALETTE.crimson,
    bg: 'rgba(24, 14, 14, 0.94)',
    stroke: 'rgba(232, 76, 61, 0.45)',
    reveal: pillP,
  });
}
