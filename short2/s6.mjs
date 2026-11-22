export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawHeadEarAnatomy,
    drawMicrophoneVector,
    drawFrequencySpectrum,
    PALETTE,
  } = H;

  const leftIn = beat(localSec, 0.2, 0.65, easeOutCubic);
  const rightIn = beat(localSec, 1.0, 0.65, easeOutCubic);
  const crossOut = beat(localSec, 4.1, 0.6, easeOutBack);
  const specIn = beat(localSec, 6.2, 1.4, easeOutCubic);

  // 1. Top Side-by-Side Input Schematic (y = 560..1235)
  // Left Column: Telingamu (2 Jalur = Udara + Tulang)
  ctx.save();
  ctx.globalAlpha = leftIn;
  drawCard(ctx, 86, 560, 610, 670, {
    radius: 28,
    fill: 'rgba(15, 25, 44, 0.94)',
    stroke: 'rgba(251, 191, 36, 0.50)',
    lineWidth: 3,
  });

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.amber;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('PENDENGARANMU (2 JALUR)', 391, 594);

  drawHeadEarAnatomy(ctx, 391, 825, 0.72, {
    isLight: false,
    skullHighlight: 0.9,
    airWaveHighlight: 0.8,
    boneWaveHighlight: 0.95,
    cochleaPulse: localSec,
  });

  // Two checkmark pills
  drawCard(ctx, 126, 1020, 530, 74, {
    radius: 16,
    fill: 'rgba(56, 189, 248, 0.14)',
    stroke: 'rgba(56, 189, 248, 0.45)',
    lineWidth: 2,
    shadowBlur: 0,
  });
  ctx.font = '700 25px PlusJakarta';
  ctx.fillStyle = PALETTE.cyanBright;
  ctx.fillText('✓ Konduksi Udara (340 m/s)', 391, 1043);

  drawCard(ctx, 126, 1112, 530, 74, {
    radius: 16,
    fill: 'rgba(251, 191, 36, 0.16)',
    stroke: 'rgba(251, 191, 36, 0.55)',
    lineWidth: 2,
    shadowBlur: 0,
  });
  ctx.fillStyle = PALETTE.amber;
  ctx.fillText('✓ Bonus Bass Tulang Tengkorak', 391, 1135);
  ctx.restore();

  // Right Column: Mikrofon Ponsel (1 Jalur Saja)
  ctx.save();
  ctx.globalAlpha = rightIn;
  drawCard(ctx, 744, 560, 610, 670, {
    radius: 28,
    fill: 'rgba(15, 25, 44, 0.94)',
    stroke: 'rgba(56, 189, 248, 0.50)',
    lineWidth: 3,
  });

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.cyan;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('MIKROFON PONSEL (1 JALUR)', 1049, 594);

  drawMicrophoneVector(ctx, 1049, 845, 1.85, {
    color: PALETTE.cyan,
    isLight: false,
    pulse: (localSec * 0.65) % 1,
  });

  drawCard(ctx, 784, 1020, 530, 74, {
    radius: 16,
    fill: 'rgba(56, 189, 248, 0.14)',
    stroke: 'rgba(56, 189, 248, 0.45)',
    lineWidth: 2,
    shadowBlur: 0,
  });
  ctx.font = '700 25px PlusJakarta';
  ctx.fillStyle = PALETTE.cyanBright;
  ctx.fillText('✓ Hanya Menangkap Jalur Udara', 1049, 1043);

  // Red crossed-out bone bass pill appearing at 4.1s
  ctx.save();
  ctx.globalAlpha = clamp01(rightIn * (0.4 + 0.6 * crossOut));
  drawCard(ctx, 784, 1112, 530, 74, {
    radius: 16,
    fill: 'rgba(251, 113, 133, 0.14)',
    stroke: 'rgba(251, 113, 133, 0.60)',
    lineWidth: 2,
    shadowBlur: 0,
  });
  ctx.fillStyle = PALETTE.coral;
  ctx.fillText('✕ Tanpa Getaran Bass Tulang', 1049, 1135);
  ctx.restore();
  ctx.restore();

  // 2. Bottom Dual Frequency Spectrum Comparison (y = 1270..1800)
  drawFrequencySpectrum(ctx, 86, 1270, 610, 520, {
    bars: 14,
    mode: 'head',
    phase: localSec,
    reveal: specIn,
    isLight: false,
    title: 'SUARA DI KEPALA (HANGAT)',
    accentLow: PALETTE.amber,
    accentHigh: PALETTE.cyan,
  });

  drawFrequencySpectrum(ctx, 744, 1270, 610, 520, {
    bars: 14,
    mode: 'mic',
    phase: localSec * 1.15,
    reveal: specIn,
    isLight: false,
    title: 'HASIL MIKROFON (TIPIS)',
    accentLow: PALETTE.coral,
    accentHigh: PALETTE.cyan,
  });
}
