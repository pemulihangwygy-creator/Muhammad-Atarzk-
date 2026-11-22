export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawRingGauge,
    roundRectPath,
    PALETTE,
  } = H;

  // World C: Archive Dossier — 38% 5-Second Blind Recognition & 2013 Attractiveness Paradox
  const topCardIn = beat(localSec, 0.25, 0.65, easeOutCubic);
  const gaugeProg = beat(localSec, 2.0, 1.6, easeOutCubic);
  const paradoxIn = beat(localSec, 8.2, 0.75, easeOutCubic);
  const barProg = beat(localSec, 9.2, 1.4, easeOutCubic);

  // 1. Top Panel: 5-Second Voice Recognition Test (y = 560..1150)
  ctx.save();
  ctx.globalAlpha = topCardIn;
  drawCard(ctx, 88, 560, WIDTH - 176, 585, {
    radius: 26,
    fill: '#FAF5E8',
    stroke: '#8D7B5A',
    lineWidth: 3,
  });

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.archiveAccent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('UJI PENGENALAN BUTA DALAM 5 DETIK', WIDTH / 2, 598);

  // Left Ring Gauge: 38% Recognize
  drawRingGauge(ctx, 430, 845, 138, 38, {
    thickness: 30,
    fillColor: '#0F4C81',
    trackColor: 'rgba(15, 76, 129, 0.14)',
    label: 'MENGENALI',
    subLabel: 'Sadar itu suaranya',
    textColor: PALETTE.archiveInk,
    progress: gaugeProg,
  });

  // Right Ring Gauge: 62% Fail
  drawRingGauge(ctx, 1010, 845, 138, 62, {
    thickness: 30,
    fillColor: '#991B1B',
    trackColor: 'rgba(153, 27, 27, 0.14)',
    label: 'GAGAL KENAL',
    subLabel: 'Mengira suara orang lain',
    textColor: PALETTE.archiveInk,
    progress: gaugeProg,
  });
  ctx.restore();

  // 2. Bottom Panel: 2013 Attractiveness Paradox (y = 1185..1820)
  ctx.save();
  ctx.globalAlpha = clamp01(paradoxIn);
  drawCard(ctx, 88, 1185 + (1 - paradoxIn) * 20, WIDTH - 176, 635, {
    radius: 26,
    fill: '#FAF5E8',
    stroke: '#991B1B',
    lineWidth: 3,
  });

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.archiveStamp;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('PARADOKS PENILAIAN (STUDI 2013)', 130, 1222);

  ctx.font = '800 36px PlusJakarta';
  ctx.fillStyle = PALETTE.archiveInk;
  ctx.fillText('Penilaian Daya Tarik Suara Rekaman Sendiri:', 130, 1264);

  // Comparison Bars
  const barX = 130;
  const barW = WIDTH - 260;

  // Case A: Aware it's own voice
  ctx.font = '700 27px PlusJakarta';
  ctx.fillStyle = PALETTE.archiveMuted;
  ctx.fillText('A. Saat SADAR itu suaranya sendiri (Self-Critique Bias)', barX, 1344);

  roundRectPath(ctx, barX, 1390, barW, 56, 16);
  ctx.fillStyle = 'rgba(141, 123, 90, 0.16)';
  ctx.fill();

  const wA = Math.max(40, barW * 0.42 * barProg);
  roundRectPath(ctx, barX, 1390, wA, 56, 16);
  ctx.fillStyle = '#991B1B';
  ctx.fill();

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  if (barProg > 0.35) ctx.fillText('Canggung / Kurang Suka', barX + 22, 1418);

  // Case B: Unaware it's own voice
  ctx.textBaseline = 'top';
  ctx.font = '700 27px PlusJakarta';
  ctx.fillStyle = PALETTE.archiveInk;
  ctx.fillText('B. Saat TIDAK TAHU itu suaranya sendiri (Blind Rating)', barX, 1482);

  roundRectPath(ctx, barX, 1528, barW, 56, 16);
  ctx.fillStyle = 'rgba(15, 76, 129, 0.14)';
  ctx.fill();

  const wB = Math.max(40, barW * 0.88 * barProg);
  roundRectPath(ctx, barX, 1528, wB, 56, 16);
  ctx.fillStyle = '#0F766E';
  ctx.fill();

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  if (barProg > 0.35) ctx.fillText('DINILAI JAUH LEBIH MENARIK!', barX + 22, 1556);

  // Bottom insight summary
  ctx.textBaseline = 'top';
  ctx.font = '600 28px PlusJakarta';
  ctx.fillStyle = '#3F372C';
  H.drawWrappedText(
    ctx,
    'Artinya: suaramu di rekaman sebenarnya terdengar bagus di telinga orang lain — kamu hanya belum terbiasa mendengarnya dari luar.',
    barX,
    1632,
    barW,
    40,
    { align: 'left', maxLines: 3 },
  );

  ctx.restore();
}
