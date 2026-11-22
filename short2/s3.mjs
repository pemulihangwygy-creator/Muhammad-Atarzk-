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
    PALETTE,
  } = H;

  // World B: Anatomical Medical Atlas Light
  const stageIn = beat(localSec, 0.15, 0.6, easeOutCubic);
  const waveOut = beat(localSec, 3.8, 1.3, easeOutCubic);
  const speedBadge = beat(localSec, 7.0, 0.6, easeOutBack);
  const step1 = beat(localSec, 4.1, 0.5, easeOutCubic);
  const step2 = beat(localSec, 6.2, 0.5, easeOutCubic);
  const step3 = beat(localSec, 8.8, 0.5, easeOutCubic);
  const step4 = beat(localSec, 10.4, 0.5, easeOutCubic);

  // 1. Top Anatomical Plate (y = 560..1180)
  ctx.save();
  ctx.globalAlpha = stageIn;
  drawCard(ctx, 86, 560, WIDTH - 172, 620, {
    radius: 30,
    fill: '#FFFDF8',
    stroke: 'rgba(148, 127, 94, 0.5)',
    lineWidth: 3,
  });

  ctx.font = '700 24px JetMono';
  ctx.fillStyle = PALETTE.atlasBlue;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('PLAT ANATOMI 01 · MEKANISME KONDUKSI UDARA', 124, 594);

  drawHeadEarAnatomy(ctx, 815, 908, 1.14, {
    isLight: true,
    skullHighlight: 0,
    airWaveHighlight: waveOut,
    boneWaveHighlight: 0,
    cochleaPulse: waveOut > 0.5 ? localSec : 0,
  });

  // Animated acoustic wave arcs traveling out of mouth toward ear canal
  if (waveOut > 0.02) {
    drawCurvedArrow(ctx, 616, 976, 455, 670, 914, 920, {
      color: PALETTE.atlasBlue,
      width: 7,
      headLen: 24,
      progress: waveOut,
      dashed: false,
    });

    // Expanding sound rings at mouth exit
    ctx.strokeStyle = 'rgba(3, 105, 161, 0.45)';
    ctx.lineWidth = 3.5;
    for (let r = 0; r < 3; r++) {
      const rp = ((localSec * 1.1) + r * 0.33) % 1;
      ctx.globalAlpha = (1 - rp) * 0.7;
      ctx.beginPath();
      ctx.arc(616, 976, 24 + rp * 82, Math.PI * 0.65, Math.PI * 1.45);
      ctx.stroke();
    }
    ctx.globalAlpha = stageIn;
  }

  // Speed Callout Badge (340 m/s)
  if (speedBadge > 0.02) {
    ctx.save();
    ctx.globalAlpha = clamp01(speedBadge);
    drawCard(ctx, 124, 652, 340, 134, {
      radius: 22,
      fill: '#0369A1',
      stroke: '#0C4A6E',
      lineWidth: 2,
    });
    ctx.font = '700 22px JetMono';
    ctx.fillStyle = '#BAE6FD';
    ctx.textAlign = 'left';
    ctx.fillText('KECEPATAN DI UDARA', 150, 676);
    ctx.font = '800 54px PlusJakarta';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('340 m/s', 150, 712);
    ctx.restore();
  }
  ctx.restore();

  // 2. Sequential 4-Step Relay Chain (y = 1220..1810)
  const steps = [
    { num: '01', title: 'MULUT → UDARA', sub: 'Gelombang suara merambat ke udara luar pada ~340–343 m/s.', p: step1, c: '#0369A1' },
    { num: '02', title: 'KANAL TELINGA', sub: 'Gelombang ditangkap daun telinga menuju liang telinga.', p: step2, c: '#0284C7' },
    { num: '03', title: 'GENDANG TELINGA', sub: 'Membran timpani bergetar dan menggerakkan 3 tulang osikula.', p: step3, c: '#0F766E' },
    { num: '04', title: 'KOKLEA (SARAF)', sub: 'Getaran diubah menjadi sinyal listrik ke otak.', p: step4, c: '#047857' },
  ];

  const cardW = (WIDTH - 208) / 2;
  const cardH = 265;
  steps.forEach((st, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 86 + col * (cardW + 36);
    const by = 1225 + row * (cardH + 34);
    const p = clamp01(st.p);
    if (p <= 0.02) return;

    ctx.save();
    ctx.globalAlpha = p;
    drawCard(ctx, bx, by + (1 - p) * 18, cardW, cardH, {
      radius: 24,
      fill: '#FFFDF8',
      stroke: st.c,
      lineWidth: 3,
      shadowBlur: 12,
    });

    ctx.fillStyle = st.c;
    ctx.beginPath();
    ctx.arc(bx + 54, by + (1 - p) * 18 + 54, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '800 26px JetMono';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.num, bx + 54, by + (1 - p) * 18 + 55);

    ctx.font = '800 30px PlusJakarta';
    ctx.fillStyle = PALETTE.atlasInk;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(st.title, bx + 100, by + (1 - p) * 18 + 38);

    ctx.font = '500 26px PlusJakarta';
    ctx.fillStyle = PALETTE.atlasMuted;
    H.drawWrappedText(ctx, st.sub, bx + 34, by + (1 - p) * 18 + 114, cardW - 68, 36, { align: 'left', maxLines: 3 });
    ctx.restore();
  });

  // Flow arrow between step 01 -> 02
  if (step2 > 0.2) {
    drawArrow(ctx, 86 + cardW + 4, 1358, 86 + cardW + 32, 1358, {
      color: '#0284C7',
      width: 5,
      headLen: 14,
      progress: step2,
    });
  }
}
