export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawAcousticWaveform,
    drawArrow,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World D: Neural Insight — Reality Flip (Internal Illusion vs True External Voice)
  const topIn = beat(localSec, 0.25, 0.65, easeOutCubic);
  const flipIn = beat(localSec, 4.8, 0.75, easeOutBack);
  const netIn = beat(localSec, 8.2, 0.7, easeOutCubic);

  // 1. Top Card: Dimmed "Versi Kepala" (Ilusi Internal) (y = 560..930)
  ctx.save();
  ctx.globalAlpha = topIn * (1 - flipIn * 0.32);
  drawCard(ctx, 88, 560, WIDTH - 176, 360, {
    radius: 28,
    fill: 'rgba(15, 23, 42, 0.78)',
    stroke: 'rgba(148, 163, 184, 0.35)',
    lineWidth: 2,
  });

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('VERSI DI KEPALA (UDARA + TULANG TENGKORAK)', 132, 598);

  ctx.font = '800 38px PlusJakarta';
  ctx.fillStyle = '#CBD5E1';
  ctx.fillText('Hanya Terdengar Oleh Dirimu Sendiri', 132, 642);

  drawAcousticWaveform(ctx, 132, 725, WIDTH - 264, 110, {
    color: '#64748B',
    lineWidth: 5,
    freq: 4,
    phase: localSec * 2.5,
    amp: 0.75,
    progress: topIn,
  });

  ctx.font = '600 24px JetMono';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('STATUS: TIDAK PERNAH KELUAR KE TELINGA ORANG LAIN', 132, 862);
  ctx.restore();

  // Reality Arrow down
  drawArrow(ctx, WIDTH / 2, 938, WIDTH / 2, 1020, {
    color: PALETTE.mint,
    width: 7,
    headLen: 24,
    progress: flipIn,
  });

  // 2. Hero Card: True External Recorded Voice (y = 1035..1815)
  ctx.save();
  ctx.globalAlpha = clamp01(flipIn);
  drawCard(ctx, 88, 1035 + (1 - flipIn) * 24, WIDTH - 176, 780, {
    radius: 32,
    fill: 'rgba(8, 32, 42, 0.95)',
    stroke: PALETTE.mint,
    lineWidth: 3.5,
    shadowColor: 'rgba(52, 211, 153, 0.25)',
    shadowBlur: 32,
  });

  ctx.font = '700 25px JetMono';
  ctx.fillStyle = PALETTE.mint;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('REALITAS AKUSTIK · KONDUKSI UDARA MURNI', WIDTH / 2, 1076);

  ctx.font = '800 44px PlusJakarta';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('INILAH SUARA ASLIMU YANG SEBENARNYA', WIDTH / 2, 1120);

  drawAcousticWaveform(ctx, 140, 1200, WIDTH - 280, 150, {
    color: PALETTE.mint,
    lineWidth: 6,
    freq: 6.5,
    phase: localSec * 4.5,
    amp: 0.85,
    harmonics: 0.35,
    fillUnder: true,
    progress: flipIn,
  });

  // 3 Listener Nodes connected to True Voice (Teman, Keluarga, Mikrofon)
  const nodes = [
    { title: 'TEMAN & REKAN', sub: 'Mendengar jalur udara ini setiap hari saat berbicara langsung.' },
    { title: 'KELUARGA', sub: 'Sudah mengenalinya sebagai suaramu sejak dulu.' },
    { title: 'VOICE NOTE & MIC', sub: 'Menangkap versi nyata yang sama persis.' },
  ];
  const nw = 370;
  nodes.forEach((nd, i) => {
    const p = clamp01((netIn * 3) - i * 0.45);
    const nx = 128 + i * (nw + 37);
    drawCalloutBox(ctx, nx, 1410, nw, 330, nd.title, nd.sub, {
      accent: i === 2 ? PALETTE.cyan : PALETTE.mint,
      bg: 'rgba(12, 42, 52, 0.95)',
      textColor: '#F8FAFC',
      subColor: '#A5C4D4',
      reveal: p,
    });
  });

  ctx.restore();
}
