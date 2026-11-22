export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawTwilightSkylineBackdrop,
    drawDigitalQuoteBoard,
    drawIvoryPaperSlip,
  } = H;

  // Atmospheric Dusk Cityscape + Mosque Domes + Diagonal Rain (ref_02s / ref_08s aesthetic!)
  drawTwilightSkylineBackdrop(ctx, localSec, { rainIntensity: 1, horizonGlow: 1 });

  // Subtle top date/series line (exact ref_02s "- SEPTEMBER 2024 -" style)
  const hdrP = beat(localSec, 0.1, 0.5, easeOutCubic);
  ctx.save();
  ctx.globalAlpha = hdrP;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 240, 260);
  ctx.lineTo(WIDTH / 2 + 240, 260);
  ctx.stroke();

  ctx.fillStyle = '#0B0B0E';
  ctx.fillRect(WIDTH / 2 - 155, 244, 310, 32);
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = '#F59E0B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CEK FAKTA · HADITS', WIDTH / 2, 260);
  ctx.restore();

  // Three tangible physical cards revealing smoothly in sync with VO #1
  const c1 = beat(localSec, 0.35, 0.65, easeOutBack);
  const c2 = beat(localSec, 2.2, 0.65, easeOutBack);
  const c3 = beat(localSec, 4.4, 0.65, easeOutBack);
  const stampP = beat(localSec, 6.2, 0.55, easeOutBack);

  // Card 1: Dark LED Quote Board (tilted slightly on early reveal, straightens gently)
  drawDigitalQuoteBoard(ctx, WIDTH / 2, 540, 1080, 300, {
    tag: 'KALIMAT #01 · POPULER',
    quote: '“Tuntutlah ilmu walau ke negeri Cina”',
    sub: 'PERAWI MATRUK · ABU ‘ATIKAH',
    badge: 'PALSU',
    tilt: -0.02 * (1 - beat(localSec, 2.0, 0.8)),
    reveal: c1,
  });

  // Card 2: Ivory Paper Pass with Barcode
  drawIvoryPaperSlip(ctx, WIDTH / 2, 920, 1080, 290, {
    eyebrow: 'KALIMAT #02 · UNGKAPAN VIRAL',
    headline: '“Cinta tanah air sebagian dari iman”',
    struckClaim: 'SABDA NABI SAW',
    verdict: 'TIDAK ADA SANAD',
    metaRightTop: 'KASUS 02',
    metaRightBot: 'AL-MASHNU\' 106',
    barcode: true,
    tilt: 0,
    reveal: c2,
  });

  // Card 3: Ivory Paper Pass + Bold Tilted Red Stamp ("BUKAN HADITS")
  drawIvoryPaperSlip(ctx, WIDTH / 2, 1295, 1080, 290, {
    eyebrow: 'KALIMAT #03 · KLAIM POPULER',
    headline: '“Perbedaan umatku adalah rahmat”',
    struckClaim: 'HADITS MUTAWATIR',
    verdict: 'SANAD NIHIL',
    metaRightTop: 'KASUS 03',
    metaRightBot: 'AL-IRAQI 74',
    barcode: true,
    stampText: 'BUKAN HADITS',
    stampReveal: stampP,
    tilt: 0,
    reveal: c3,
  });
}
