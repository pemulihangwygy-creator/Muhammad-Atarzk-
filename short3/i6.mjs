export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    drawSpotlightStageBackdrop,
    drawRehalLanternAndLoupe,
    drawIvoryPaperSlip,
    drawMicroPill,
  } = H;

  // Overhead Spotlight Stage + Carved Wooden Rehal + Hanging Brass Lantern + Sweeping Loupe
  drawSpotlightStageBackdrop(ctx, localSec, {
    coneColor: 'rgba(245, 158, 11, 0.12)',
    floorY: 1620,
  });

  const slipP = beat(localSec, 0.25, 0.7, easeOutBack);
  const stampP = beat(localSec, 6.2, 0.55, easeOutBack);
  const rehalP = beat(localSec, 3.0, 0.85, easeOutCubic);
  const loupeP = beat(localSec, 5.0, 0.75, easeOutBack);
  const pill1 = beat(localSec, 8.2, 0.55, easeOutCubic);
  const pill2 = beat(localSec, 11.4, 0.55, easeOutCubic);

  // Top Floating Ivory Kitab Verification Slip
  drawIvoryPaperSlip(ctx, WIDTH / 2, 470, 1080, 290, {
    eyebrow: 'KASUS #03 · اِخْتِلَافُ أُمَّتِي رَحْمَةٌ',
    headline: '“Perbedaan umatku adalah rahmat”',
    struckClaim: 'DISANDARKAN KE NABI SAW',
    verdict: 'TIDAK ADA SANADNYA',
    metaRightTop: 'AL-IRAQI',
    metaRightBot: 'AL-ALBANI',
    barcode: true,
    stampText: 'SANAD NIHIL',
    stampReveal: stampP,
    tilt: 0.012,
    reveal: slipP,
  });

  // Detailed 2D Carved Wooden Rehal + Hanging Brass Fanoos + Sweeping Loupe
  drawRehalLanternAndLoupe(ctx, WIDTH / 2, 1040, 1.32, {
    openProg: rehalP,
    loupeReveal: loupeP,
    localSec,
  });

  // Clarification Micro-Pills below Rehal
  drawMicroPill(ctx, WIDTH / 2, 1385, 'AL-IRAQI · AL-ALBANI: TIDAK DITEMUKAN SANADNYA', {
    dotColor: PALETTE.crimson,
    reveal: pill1,
  });
  drawMicroPill(ctx, WIDTH / 2, 1465, 'FIKIH BOLEH BEDA · AKIDAH WAJIB BERSATU', {
    dotColor: PALETTE.amber,
    bg: 'rgba(26, 20, 12, 0.94)',
    stroke: 'rgba(245, 158, 11, 0.45)',
    reveal: pill2,
  });
}
