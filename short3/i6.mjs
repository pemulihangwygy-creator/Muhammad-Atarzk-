export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    drawArchiveSpotlightStage,
    drawManuscriptSlip,
    drawBrassBalanceScale,
    drawMicroPill,
  } = H;

  // Overhead Spotlight Archive Stage
  drawArchiveSpotlightStage(ctx, localSec, {
    beamColor: 'rgba(245, 158, 11, 0.13)',
    floorY: 1620,
  });

  // Top Hanging Brass Fanoos Lantern casting warm ambient cone
  ctx.save();
  ctx.translate(WIDTH / 2, 185);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -185); ctx.lineTo(0, -24); ctx.stroke();
  const lg = ctx.createRadialGradient(0, 24, 6, 0, 24, 150 + Math.sin(localSec * 4) * 10);
  lg.addColorStop(0, 'rgba(251, 191, 36, 0.38)');
  lg.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.arc(0, 24, 150, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#B45309';
  ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(0, -24); ctx.lineTo(24, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-18, 0, 36, 42);
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-22, 42, 44, 8);
  ctx.restore();

  // Manuscript Slip (`Ikhtilafu Ummati Rahmah`)
  const slipP = beat(localSec, 0.25, 0.7, easeOutBack);
  const sealP = beat(localSec, 7.1, 0.55, easeOutBack);

  drawManuscriptSlip(ctx, WIDTH / 2, 520, 1100, 310, {
    indexTag: '03',
    eyebrow: 'KASUS #03 · KLAIM POPULER',
    arabic: 'اِخْتِلَافُ أُمَّتِي رَحْمَةٌ',
    headline: '“Perbedaan pendapat umatku adalah rahmat”',
    struckClaim: 'DISANDARKAN KE NABI SAW',
    verdict: 'SANADNYA TIDAK DITEMUKAN',
    sealText: 'BUKAN HADITS',
    sealReveal: sealP,
    tilt: 0.012,
    reveal: slipP,
  });

  // Twin Scholar Verdict Pills (`Al-Iraqi` & `Al-Albani`)
  const p1 = beat(localSec, 4.3, 0.55, easeOutCubic);
  const p2 = beat(localSec, 5.4, 0.55, easeOutCubic);
  drawMicroPill(ctx, WIDTH / 2 - 260, 745, 'AL-IRAQI: TIDAK DITEMUKAN SANAD', {
    dotColor: PALETTE.crimson,
    bg: 'rgba(26, 14, 14, 0.94)',
    stroke: 'rgba(232, 76, 61, 0.45)',
    font: '700 19px JetMono',
    reveal: p1,
  });
  drawMicroPill(ctx, WIDTH / 2 + 265, 745, 'AL-ALBANI: LA ASHLA LAHU', {
    dotColor: PALETTE.crimson,
    bg: 'rgba(26, 14, 14, 0.94)',
    stroke: 'rgba(232, 76, 61, 0.45)',
    font: '700 19px JetMono',
    reveal: p2,
  });

  // Detailed 2.5D Brass Scholar's Balance Scale (`Mizan`) explaining Fiqh vs Akidah
  const scaleP = beat(localSec, 9.2, 0.8, easeOutBack);
  drawBrassBalanceScale(ctx, WIDTH / 2, 1085, {
    reveal: scaleP,
    tiltPhase: localSec,
  });

  const endP = beat(localSec, 12.2, 0.6, easeOutCubic);
  drawMicroPill(ctx, WIDTH / 2, 1445, 'PERBEDAAN FIKIH DIBAHAS ULAMA · BUKAN SABDA NABI', {
    dotColor: PALETTE.gold,
    bg: 'rgba(24, 18, 12, 0.94)',
    stroke: 'rgba(245, 158, 11, 0.45)',
    reveal: endP,
  });
}
