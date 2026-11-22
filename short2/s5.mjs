export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawLowPassFilterGraph,
    drawFrequencySpectrum,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Medical Atlas — Skull Low-Pass Filter + Subwoofer Effect
  const curveProg = beat(localSec, 1.2, 2.2, easeOutCubic);
  const specProg = beat(localSec, 5.2, 1.6, easeOutCubic);
  const noteLeft = beat(localSec, 4.4, 0.6, easeOutBack);
  const noteRight = beat(localSec, 9.8, 0.6, easeOutBack);

  // 1. Top Bode Frequency Response Graph (y = 560..1080)
  drawLowPassFilterGraph(ctx, 86, 560, WIDTH - 172, 520, {
    progress: curveProg,
    phase: localSec,
    isLight: true,
  });

  // Legend overlay top-right inside graph
  ctx.save();
  ctx.globalAlpha = beat(localSec, 1.5, 0.6, easeOutCubic);
  ctx.font = '700 22px JetMono';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#D97706';
  ctx.fillText('━━ Konduksi Tulang (Subwoofer)', WIDTH - 135, 594);
  ctx.fillStyle = '#0369A1';
  ctx.fillText('╌╌ Konduksi Udara (Referensi)', WIDTH - 135, 624);
  ctx.restore();

  // 2. Live Equalizer Bars showing Bass < 1,000 Hz dominance (y = 1115..1510)
  drawFrequencySpectrum(ctx, 86, 1115, WIDTH - 172, 395, {
    bars: 26,
    mode: 'lowpass',
    phase: localSec * 1.1,
    reveal: specProg,
    isLight: true,
    title: 'SPEKTRUM SUARA DI DALAM TENGKORAK (EFEK SUBWOOFER)',
    accentLow: '#D97706',
    accentHigh: '#94A3B8',
  });

  // 3. Two Explanatory Takeaway Boxes (y = 1545..1825)
  drawCalloutBox(
    ctx,
    86,
    1545,
    615,
    275,
    'BASS < 1.000 Hz LOLOS KUAT',
    'Struktur padat tulang menghantarkan frekuensi rendah sangat efisien langsung ke cairan koklea.',
    {
      accent: PALETTE.atlasAmber,
      bg: '#FFFDF8',
      textColor: PALETTE.atlasInk,
      subColor: PALETTE.atlasMuted,
      reveal: noteLeft,
    },
  );

  drawCalloutBox(
    ctx,
    739,
    1545,
    615,
    275,
    'HASIL: LEBIH TEBAL & MERDU',
    'Suaramu di kepala mendapat "bonus bass" gratis sehingga terasa lebih dalam, hangat, dan berwibawa.',
    {
      accent: PALETTE.atlasTeal,
      bg: '#FFFDF8',
      textColor: PALETTE.atlasInk,
      subColor: PALETTE.atlasMuted,
      reveal: noteRight,
    },
  );
}
