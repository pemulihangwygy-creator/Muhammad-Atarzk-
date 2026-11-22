export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    roundRectPath,
    drawArchiveSpotlightStage,
    drawBrassLoupeOverSanad,
    drawMicroPill,
  } = H;

  // Dramatic Overhead Museum Spotlight Stage
  drawArchiveSpotlightStage(ctx, localSec, {
    beamColor: 'rgba(232, 76, 61, 0.12)',
    floorY: 1620,
  });

  // Top Hanging Archive Specimen Plaque (`ABU 'ATIKAH`) inside spotlight beam
  const plaqueP = beat(localSec, 0.2, 0.7, easeOutBack);
  const stickerP = beat(localSec, 3.0, 0.5, easeOutBack);

  if (plaqueP > 0.02) {
    ctx.save();
    ctx.globalAlpha *= plaqueP;
    const tilt = Math.sin(localSec * 1.3) * 0.01 - 0.012;
    ctx.translate(WIDTH / 2, 540 + (1 - plaqueP) * 22);
    ctx.rotate(tilt);

    const w = 780;
    const h = 290;

    // Hanging taut strings
    ctx.strokeStyle = 'rgba(244, 239, 230, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 64, -h / 2 + 4); ctx.lineTo(-w / 2 + 64, -700);
    ctx.moveTo(w / 2 - 64, -h / 2 + 4); ctx.lineTo(w / 2 - 64, -700);
    ctx.stroke();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 16;
    roundRectPath(ctx, -w / 2, -h / 2, w, h, 20);
    const pg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    pg.addColorStop(0, '#F5F2EB');
    pg.addColorStop(1, '#DFD9CA');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = '700 21px JetMono';
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PERAWI PENYEBAB CACAT SANAD', 0, -h / 2 + 34);

    ctx.font = '800 66px PlusJakarta';
    ctx.fillStyle = PALETTE.inkDark;
    ctx.textBaseline = 'middle';
    ctx.fillText('ABU ‘ATIKAH', 0, 2);

    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textBaseline = 'bottom';
    ctx.fillText('TARIF BIN SULAIMAN · HADITS PALSU', 0, h / 2 - 30);

    // Angled Red Corner Sticker (`MATRUK`)
    if (stickerP > 0.02) {
      ctx.save();
      ctx.globalAlpha *= stickerP;
      ctx.translate(w / 2 - 42, -h / 2 - 8);
      ctx.rotate(-0.12);
      const sw = 240;
      roundRectPath(ctx, -sw / 2, -23, sw, 46, 8);
      ctx.fillStyle = PALETTE.crimson;
      ctx.fill();
      ctx.font = '800 22px JetMono';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MATRUK / TERTOLAK', 0, 1);
      ctx.restore();
    }
    ctx.restore();
  }

  // Brass Loupe Sweeping Across Chain & Snapping Link Physically at 9.8s+
  const chainP = beat(localSec, 1.2, 0.75, easeOutCubic);
  const loupeSweep = beat(localSec, 1.8, 2.2, easeOutCubic);
  const sealP = beat(localSec, 5.0, 0.75, easeOutCubic);
  const snapP = beat(localSec, 9.6, 0.9, easeOutBack);

  drawBrassLoupeOverSanad(ctx, WIDTH / 2, 1185, {
    chainReveal: chainP,
    loupeSweep,
    sealReveal: sealP,
    snapProg: snapP,
    localSec,
  });

  const bottomP = beat(localSec, 10.2, 0.6, easeOutCubic);
  drawMicroPill(ctx, WIDTH / 2, 1470, 'SANAD TERPUTUS TOTAL DI ABU ‘ATIKAH', {
    dotColor: PALETTE.crimson,
    bg: 'rgba(28, 12, 12, 0.95)',
    stroke: PALETTE.crimson,
    reveal: bottomP,
  });
}
