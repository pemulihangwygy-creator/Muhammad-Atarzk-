export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawVoiceNoteCard,
    drawAcousticWaveform,
    drawCalloutBox,
    drawArrow,
    PALETTE,
  } = H;

  // 1. WhatsApp Voice Note UI Card (0.2s -> 3.8s)
  const cardIn = beat(localSec, 0.15, 0.6, easeOutBack);
  const playProg = clamp01((localSec - 0.8) / 8.5);
  ctx.save();
  ctx.globalAlpha = clamp01(cardIn);
  const dy = (1 - cardIn) * 32;
  drawVoiceNoteCard(ctx, 110, 565 + dy, WIDTH - 220, 345, {
    playProgress: playProg,
    durationLabel: `0:${String(Math.min(14, Math.floor(localSec * 1.4))).padStart(2, '0')} / 0:14`,
    sender: 'Kamu · Voice Note WhatsApp',
    wavePhase: localSec,
    isPlaying: localSec > 0.7,
  });
  ctx.restore();

  // 2.Tension arrow down into perception split (3.5s)
  const arrP = beat(localSec, 3.4, 0.7, easeOutCubic);
  drawArrow(ctx, WIDTH / 2, 926, WIDTH / 2, 1004, {
    color: PALETTE.amber,
    width: 6,
    headLen: 22,
    progress: arrP,
  });

  // 3. Left vs Right Perception Comparison Cards (4.2s)
  const leftIn = beat(localSec, 4.1, 0.65, easeOutCubic);
  const rightIn = beat(localSec, 5.2, 0.65, easeOutCubic);

  // Left card: Suara di Kepalamu
  ctx.save();
  ctx.globalAlpha = leftIn;
  drawCard(ctx, 90, 1020 + (1 - leftIn) * 24, 590, 470, {
    radius: 28,
    fill: 'rgba(15, 25, 44, 0.94)',
    stroke: 'rgba(251, 191, 36, 0.55)',
    lineWidth: 3,
  });
  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.amber;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('PERSEPSI DI KEPALA', 385, 1052);

  ctx.font = '800 36px PlusJakarta';
  ctx.fillStyle = PALETTE.inkLight;
  ctx.fillText('Dalam · Tebal · Hangat', 385, 1096);

  drawAcousticWaveform(ctx, 130, 1175, 510, 145, {
    color: PALETTE.amber,
    lineWidth: 6,
    freq: 3.5,
    phase: localSec * 3.5,
    amp: 0.85,
    harmonics: 0.25,
    fillUnder: true,
    progress: leftIn,
  });

  ctx.font = '600 26px PlusJakarta';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.fillText('Udara + Getaran Tulang', 385, 1368);
  ctx.font = '700 26px JetMono';
  ctx.fillStyle = PALETTE.amber;
  ctx.fillText('BAS TENGKORAK DOMINAN', 385, 1412);
  ctx.restore();

  // Right card: Suara di Rekaman HP
  ctx.save();
  ctx.globalAlpha = rightIn;
  drawCard(ctx, 760, 1020 + (1 - rightIn) * 24, 590, 470, {
    radius: 28,
    fill: 'rgba(15, 25, 44, 0.94)',
    stroke: 'rgba(56, 189, 248, 0.55)',
    lineWidth: 3,
  });
  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.cyan;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('REKAMAN VOICE NOTE', 1055, 1052);

  ctx.font = '800 36px PlusJakarta';
  ctx.fillStyle = PALETTE.inkLight;
  ctx.fillText('Tipis · Tinggi · Canggung', 1055, 1096);

  drawAcousticWaveform(ctx, 800, 1175, 510, 145, {
    color: PALETTE.cyan,
    lineWidth: 4.5,
    freq: 8.5,
    phase: localSec * 5.2,
    amp: 0.62,
    harmonics: 0.45,
    fillUnder: true,
    progress: rightIn,
  });

  ctx.font = '600 26px PlusJakarta';
  ctx.fillStyle = PALETTE.inkMuted;
  ctx.fillText('Hanya Gelombang Udara', 1055, 1368);
  ctx.font = '700 26px JetMono';
  ctx.fillStyle = PALETTE.coral;
  ctx.fillText('TANPA RESONANSI TULANG', 1055, 1412);
  ctx.restore();

  // 4. Shock Reveal Callout at 7.4s -> "suara di kepalamu tidak pernah ada di luar tengkorakmu"
  const shockIn = beat(localSec, 7.4, 0.65, easeOutBack);
  drawCalloutBox(
    ctx,
    90,
    1545,
    WIDTH - 180,
    225,
    'FAKTA MENGEJUTKAN: SUARA ITU HANYA ADA DI KEPALAMU',
    'Orang lain di luar tengkorakmu tidak pernah mendengar getaran tulangmu — artinya versi "merdu di kepala" itu tidak pernah eksis di udara.',
    {
      accent: PALETTE.coral,
      bg: 'rgba(24, 15, 32, 0.95)',
      textColor: '#FFF1F2',
      subColor: '#FECDD3',
      reveal: shockIn,
    },
  );
}
