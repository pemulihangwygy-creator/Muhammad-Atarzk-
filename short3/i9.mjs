export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    clamp01,
    beat,
    easeOutCubic,
    easeOutBack,
    roundRectPath,
    drawArchiveSpotlightStage,
    drawMicroPill,
  } = H;

  // Serene Dawn Green Dome of Masjid Nabawi Spotlight Stage
  drawArchiveSpotlightStage(ctx, localSec, {
    beamColor: 'rgba(16, 185, 129, 0.14)',
    floorY: 1620,
    emeraldTint: true,
  });

  // Madinah Green Dome Architectural Silhouette + Soft Dawn Glow
  const domeP = beat(localSec, 0.15, 0.8, easeOutCubic);
  ctx.save();
  ctx.globalAlpha *= domeP;
  const cx = WIDTH / 2;
  const domeY = 670;

  const dg = ctx.createRadialGradient(cx, domeY - 60, 15, cx, domeY - 60, 390);
  dg.addColorStop(0, `rgba(16, 185, 129, ${0.28 + Math.sin(localSec * 2.2) * 0.05})`);
  dg.addColorStop(0.55, 'rgba(245, 158, 11, 0.10)');
  dg.addColorStop(1, 'rgba(9, 9, 11, 0)');
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(cx, domeY - 60, 390, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(6, 95, 70, 0.45)';
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.50)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, domeY - 25, 135, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();

  // Twin Gold-Embossed Hardcover Volumes (`SHAHIH AL-BUKHARI` & `SHAHIH MUSLIM`)
  const books = [
    { x: -185, title: 'SHAHIH', sub: 'AL-BUKHARI', col: '#7F1D1D', spine: '#EAB308' },
    { x: 18, title: 'SHAHIH', sub: 'MUSLIM', col: '#064E3B', spine: '#EAB308' },
  ];
  books.forEach((bk, idx) => {
    const bp = beat(localSec, 0.35 + idx * 0.25, 0.75, easeOutBack);
    if (bp <= 0.02) return;
    ctx.save();
    ctx.globalAlpha *= bp;
    ctx.translate(cx + bk.x, domeY + (idx === 1 ? -14 : 0) + (1 - bp) * 24);

    roundRectPath(ctx, 0, -110, 170, 224, 14);
    ctx.fillStyle = bk.col;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 26;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.strokeStyle = bk.spine;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = bk.spine;
    ctx.fillRect(14, -86, 12, 176);
    ctx.strokeStyle = bk.spine;
    ctx.lineWidth = 2;
    roundRectPath(ctx, 40, -78, 110, 160, 10);
    ctx.stroke();

    ctx.font = '800 20px JetMono';
    ctx.fillStyle = '#FEF3C7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bk.title, 95, -18);
    ctx.font = '800 17px JetMono';
    ctx.fillText(bk.sub, 95, 18);
    ctx.restore();
  });
  ctx.restore();

  // 3 Animated Verification Checklist Cards ticking sequentially (`01`, `02`, `03`)
  const steps = [
    { label: '01 · CEK PERAWI & JALUR SANADNYA', col: PALETTE.gold, start: 1.6 },
    { label: '02 · PASTIKAN KITAB SUMBER ASLINYA', col: PALETTE.teal, start: 2.9 },
    { label: '03 · VERIFIKASI SHAHIH BARU BAGIKAN', col: PALETTE.sky, start: 4.1 },
  ];

  steps.forEach((st, idx) => {
    const sp = beat(localSec, st.start, 0.55, easeOutCubic);
    drawMicroPill(ctx, cx, 985 + idx * 82, st.label, {
      dotColor: st.col,
      checkIcon: sp > 0.75,
      bg: 'rgba(14, 18, 24, 0.95)',
      stroke: sp > 0.75 ? st.col : 'rgba(255, 255, 255, 0.14)',
      font: '700 24px JetMono',
      height: 60,
      reveal: sp,
    });
  });

  // Closing Interactive CTA Pill ("Tulis di komentar & bagikan ke orang terdekatmu!")
  const ctaP = beat(localSec, 7.6, 0.75, easeOutBack);
  drawMicroPill(ctx, cx, 1345, 'TULIS DI KOMENTAR · BAGIKAN KE ORANG TERDEKATMU!', {
    dotColor: PALETTE.goldLight,
    bg: 'rgba(245, 158, 11, 0.18)',
    stroke: PALETTE.gold,
    textColor: PALETTE.goldLight,
    font: '800 23px JetMono',
    height: 60,
    reveal: ctaP,
  });
}
