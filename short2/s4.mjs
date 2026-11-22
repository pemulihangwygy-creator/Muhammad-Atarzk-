export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawHeadEarAnatomy,
    drawArrow,
    drawSpeedComparisonTrack,
    drawCalloutBox,
    PALETTE,
  } = H;

  const stageIn = beat(localSec, 0.15, 0.6, easeOutCubic);
  const boneP = beat(localSec, 3.6, 1.2, easeOutCubic);
  const speedRaceP = beat(localSec, 7.2, 1.3, easeOutCubic);
  const bypassCalloutP = beat(localSec, 10.1, 0.65, easeOutBack);

  // 1. Top Anatomical Bone Conduction Plate (y = 560..1180)
  ctx.save();
  ctx.globalAlpha = stageIn;
  drawCard(ctx, 86, 560, WIDTH - 172, 620, {
    radius: 30,
    fill: '#FFFDF8',
    stroke: 'rgba(180, 83, 9, 0.45)',
    lineWidth: 3,
  });

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.atlasAmber;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('PLAT ANATOMI 02 · JALUR KONDUKSI TULANG (BYPASS)', 124, 594);

  drawHeadEarAnatomy(ctx, 810, 910, 1.14, {
    isLight: true,
    skullHighlight: boneP,
    airWaveHighlight: 0,
    boneWaveHighlight: boneP,
    cochleaPulse: boneP > 0.3 ? localSec : 0,
  });

  // Internal Direct Vibration Vectors (Pita Suara -> Rahang -> Koklea)
  if (boneP > 0.02) {
    drawArrow(ctx, 778, 1082, 712, 1015, {
      color: '#D97706',
      width: 8,
      headLen: 20,
      progress: boneP,
    });
    drawArrow(ctx, 712, 1015, 826, 920, {
      color: '#D97706',
      width: 9,
      headLen: 24,
      progress: clamp01((boneP - 0.3) / 0.7),
    });

    // Skull resonance rings centered on temporal bone
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 4;
    for (let r = 0; r < 3; r++) {
      const rp = ((localSec * 1.4) + r * 0.33) % 1;
      ctx.globalAlpha = (1 - rp) * 0.65;
      ctx.beginPath();
      ctx.arc(826, 920, 24 + rp * 100, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = stageIn;
  }

  // Highlighted Speed Badge (~3,000 m/s)
  const badgeP = beat(localSec, 7.6, 0.55, easeOutBack);
  if (badgeP > 0.02) {
    ctx.save();
    ctx.globalAlpha = badgeP;
    drawCard(ctx, 124, 652, 372, 138, {
      radius: 22,
      fill: '#B45309',
      stroke: '#78350F',
      lineWidth: 2,
    });
    ctx.font = '700 22px JetMono';
    ctx.fillStyle = '#FDE68A';
    ctx.textAlign = 'left';
    ctx.fillText('KECEPATAN DI TULANG', 150, 676);
    ctx.font = '800 50px PlusJakarta';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('~3.000 m/s', 150, 712);
    ctx.restore();
  }
  ctx.restore();

  // 2. Speed Race Comparison Bar (y = 1220..1435)
  drawSpeedComparisonTrack(ctx, 86, 1220, WIDTH - 172, 215, {
    airProgress: clamp01(speedRaceP * 1.2),
    boneProgress: speedRaceP,
    isLight: true,
  });

  // 3. Key Anatomical Bypass Insight Cards (y = 1475..1815)
  drawCalloutBox(
    ctx,
    86,
    1475,
    615,
    330,
    'MELEWATI TELINGA LUAR',
    'Getaran dari pita suara langsung menembus tulang rahang & tengkorak ke koklea tanpa perlu lewat daun telinga atau gendang telinga.',
    {
      accent: PALETTE.atlasAmber,
      bg: '#FFFDF8',
      textColor: PALETTE.atlasInk,
      subColor: PALETTE.atlasMuted,
      reveal: beat(localSec, 5.2, 0.6, easeOutCubic),
    },
  );

  drawCalloutBox(
    ctx,
    739,
    1475,
    615,
    330,
    'SUARA TIBA LEBIH CEPAT',
    'Media padat tulang menghantarkan bunyi hingga ~8,8× lebih cepat daripada udara, memicu sensasi suara "dari dalam".',
    {
      accent: PALETTE.atlasTeal,
      bg: '#FFFDF8',
      textColor: PALETTE.atlasInk,
      subColor: PALETTE.atlasMuted,
      reveal: bypassCalloutP,
    },
  );
}
