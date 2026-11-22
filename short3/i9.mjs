export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawTwinSahihBooks,
    drawMagnifyingGlassTool,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World C: Twin Gold-Embossed Sahih Books + Magnifying Glass (side-by-side) + 3-Step Verification
  const loupeP = beat(localSec, 0.25, 0.85, easeOutCubic);
  const booksP = beat(localSec, 1.8, 0.9, easeOutBack);
  const step1P = beat(localSec, 4.4, 0.6, easeOutCubic);
  const step2P = beat(localSec, 6.8, 0.6, easeOutCubic);
  const step3P = beat(localSec, 9.2, 0.6, easeOutCubic);

  // 1. Clean Side-by-Side Tools: Sweeping Brass Magnifying Loupe (Left) & Twin Sahih Volumes (Right)
  if (loupeP > 0.02) {
    ctx.save();
    ctx.globalAlpha = loupeP;
    drawMagnifyingGlassTool(ctx, WIDTH / 2 - 235, 795, 1.08, localSec);
    ctx.restore();
  }

  drawTwinSahihBooks(ctx, WIDTH / 2 + 215, 790, 1.15, {
    reveal: booksP,
  });

  // 2. Three Crisp Sequential Verification Strips (snug height, zero wasted empty box space)
  drawCalloutBox(
    ctx,
    88,
    1035,
    WIDTH - 176,
    190,
    'LANGKAH 01 · CEK PERIWAYAT (KITAB ASLI)',
    'Pastikan ada keterangan perawi yang jelas: HR. Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa’i, atau Ahmad.',
    {
      accent: PALETTE.sunnahGold,
      bg: '#0E241C',
      textColor: '#FEF3C7',
      subColor: '#D1FAE5',
      reveal: step1P,
    },
  );

  drawCalloutBox(
    ctx,
    88,
    1250,
    WIDTH - 176,
    190,
    'LANGKAH 02 · PERIKSA STATUS DERAJAT HADITS',
    'Jangan hanya terpukau kata-kata indah. Cek statusnya di ulama hadits: apakah Shahih, Hasan, Dha’if, atau Maudhu’.',
    {
      accent: PALETTE.emeraldBright,
      bg: '#0E241C',
      textColor: '#FEF3C7',
      subColor: '#D1FAE5',
      reveal: step2P,
    },
  );

  drawCalloutBox(
    ctx,
    88,
    1465,
    WIDTH - 176,
    190,
    'LANGKAH 03 · RUJUK APLIKASI & KITAB TERPERCAYA',
    'Gunakan Ensiklopedi Hadits Lidwa / Dorar / Sunnah.com sebelum menyalin dan membagikan ke media sosial.',
    {
      accent: PALETTE.sunnahCream,
      bg: '#0E241C',
      textColor: '#FEF3C7',
      subColor: '#D1FAE5',
      reveal: step3P,
    },
  );
}
