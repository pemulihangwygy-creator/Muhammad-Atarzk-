export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawHeadEarAnatomy,
    drawCurvedArrow,
    drawArrow,
    drawCalloutBox,
    PALETTE,
  } = H;

  // 1. Centerpiece Head Anatomy appearing smoothly (0.2s)
  const headIn = beat(localSec, 0.15, 0.7, easeOutCubic);
  const airActive = beat(localSec, 6.2, 0.8, easeOutCubic);
  const boneActive = beat(localSec, 8.6, 0.8, easeOutCubic);

  ctx.save();
  ctx.globalAlpha = headIn;
  drawCard(ctx, 90, 560, WIDTH - 180, 740, {
    radius: 32,
    fill: 'rgba(11, 19, 34, 0.92)',
    stroke: 'rgba(56, 189, 248, 0.30)',
    lineWidth: 2.5,
  });

  // Anatomical diagram shifted slightly right so air wave loops clearly on left
  drawHeadEarAnatomy(ctx, 790, 910, 1.38, {
    isLight: false,
    skullHighlight: boneActive * 0.9,
    airWaveHighlight: airActive,
    boneWaveHighlight: boneActive,
    cochleaPulse: (airActive + boneActive) > 0.2 ? localSec : 0,
  });

  // External Air Wave (Mouth -> outside air -> Ear Canal) at 6.2s
  if (airActive > 0.02) {
    drawCurvedArrow(ctx, 560, 990, 420, 620, 910, 920, {
      color: PALETTE.cyan,
      width: 8,
      headLen: 26,
      progress: airActive,
      dashed: true,
    });
    ctx.save();
    ctx.globalAlpha = airActive;
    ctx.font = '700 26px JetMono';
    ctx.fillStyle = PALETTE.cyan;
    ctx.textAlign = 'left';
    ctx.fillText('1. JALUR UDARA (LUAR)', 140, 635);
    ctx.restore();
  }

  // Internal Bone Vibration (Vocal cords -> Jaw -> Skull -> Cochlea) at 8.6s
  if (boneActive > 0.02) {
    drawArrow(ctx, 740, 1110, 818, 920, {
      color: PALETTE.amber,
      width: 9,
      headLen: 24,
      progress: boneActive,
    });
    ctx.save();
    ctx.globalAlpha = boneActive;
    ctx.font = '700 26px JetMono';
    ctx.fillStyle = PALETTE.amber;
    ctx.textAlign = 'right';
    ctx.fillText('2. GETARAN TULANG (DALAM)', WIDTH - 140, 1165);
    ctx.restore();
  }
  ctx.restore();

  // 2. Dual-Pathway Summary Cards (4.2s badge + 6.8s + 9.0s)
  const dualBadge = beat(localSec, 4.0, 0.55, easeOutBack);
  ctx.save();
  ctx.globalAlpha = dualBadge;
  drawCard(ctx, 410, 1265, 620, 68, {
    radius: 34,
    fill: '#0F172A',
    stroke: PALETTE.mint,
    lineWidth: 2.5,
  });
  ctx.font = '800 28px JetMono';
  ctx.fillStyle = PALETTE.mint;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DUA JALUR BERSAMAAN KE TELINGA', WIDTH / 2, 1299);
  ctx.restore();

  drawCalloutBox(
    ctx,
    90,
    1385,
    605,
    335,
    'JALUR 01 · KONDUKSI UDARA',
    'Gelombang suara keluar dari mulut, merambat lewat udara di luar kepala, lalu masuk ke saluran telinga luar.',
    {
      accent: PALETTE.cyan,
      bg: 'rgba(13, 25, 45, 0.94)',
      textColor: PALETTE.inkLight,
      subColor: '#CBD5E1',
      reveal: beat(localSec, 6.4, 0.6, easeOutCubic),
    },
  );

  drawCalloutBox(
    ctx,
    745,
    1385,
    605,
    335,
    'JALUR 02 · KONDUKSI TULANG',
    'Getaran pita suara merambat langsung lewat tulang rahang & tengkorak menuju organ pendengaran bagian dalam.',
    {
      accent: PALETTE.amber,
      bg: 'rgba(28, 22, 14, 0.94)',
      textColor: '#FEF3C7',
      subColor: '#FDE68A',
      reveal: beat(localSec, 8.8, 0.6, easeOutCubic),
    },
  );
}
