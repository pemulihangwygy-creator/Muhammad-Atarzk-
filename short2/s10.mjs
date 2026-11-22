export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawTagPill,
    PALETTE,
  } = H;

  // World D: Recap + Interactive Comment CTA
  const r1 = beat(localSec, 0.2, 0.55, easeOutCubic);
  const r2 = beat(localSec, 0.75, 0.55, easeOutCubic);
  const r3 = beat(localSec, 1.3, 0.55, easeOutCubic);
  const ctaIn = beat(localSec, 2.3, 0.75, easeOutBack);

  // 1. 3-Line Scientific Recap Stack (y = 565..1170)
  const recaps = [
    {
      num: '01',
      title: 'DUA JALUR KECEPATAN BERBEDA',
      desc: 'Udara merambat 340 m/s · Tulang rahang & tengkorak melesat ~3.000 m/s.',
      color: PALETTE.cyan,
      p: r1,
    },
    {
      num: '02',
      title: 'TENGKORAK = FILTER BASS ALAMI',
      desc: 'Frekuensi < 1.000 Hz menguat di kepala, namun hilang saat direkam mikrofon.',
      color: PALETTE.amber,
      p: r2,
    },
    {
      num: '03',
      title: 'VOICE CONFRONTATION (1966)',
      desc: '62% gagal mengenali suara sendiri dalam 5 detik — padahal orang lain menyukainya.',
      color: PALETTE.mint,
      p: r3,
    },
  ];

  recaps.forEach((rc, idx) => {
    const p = clamp01(rc.p);
    if (p <= 0.02) return;
    const by = 565 + idx * 204;
    ctx.save();
    ctx.globalAlpha = p;
    drawCard(ctx, 88, by + (1 - p) * 20, WIDTH - 176, 178, {
      radius: 24,
      fill: 'rgba(10, 29, 39, 0.92)',
      stroke: rc.color,
      lineWidth: 2.5,
    });

    ctx.fillStyle = rc.color;
    ctx.beginPath();
    ctx.arc(154, by + (1 - p) * 20 + 89, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '800 28px JetMono';
    ctx.fillStyle = '#050E13';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rc.num, 154, by + (1 - p) * 20 + 90);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '800 32px PlusJakarta';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(rc.title, 214, by + (1 - p) * 20 + 34);

    ctx.font = '500 27px PlusJakarta';
    ctx.fillStyle = '#CBD5E1';
    H.drawWrappedText(ctx, rc.desc, 214, by + (1 - p) * 20 + 82, WIDTH - 328, 36, { align: 'left', maxLines: 2 });
    ctx.restore();
  });

  // 2. Clean High-Contrast Comment Engagement Prompt Card (y = 1225..1815)
  ctx.save();
  ctx.globalAlpha = clamp01(ctaIn);
  const scaleBounce = 0.94 + 0.06 * ctaIn;
  ctx.translate(WIDTH / 2, 1515);
  ctx.scale(scaleBounce, scaleBounce);
  ctx.translate(-WIDTH / 2, -1515);

  drawCard(ctx, 88, 1225, WIDTH - 176, 585, {
    radius: 34,
    fill: 'rgba(8, 36, 46, 0.96)',
    stroke: PALETTE.mint,
    lineWidth: 4,
    shadowColor: 'rgba(52, 211, 153, 0.25)',
    shadowBlur: 32,
  });

  drawTagPill(ctx, WIDTH / 2, 1298, 'GILIRAN KAMU BERBAGI', {
    font: '800 25px JetMono',
    fill: 'rgba(52, 211, 153, 0.16)',
    stroke: PALETTE.mint,
    textColor: PALETTE.mint,
    padX: 32,
    height: 52,
  });

  ctx.font = '800 46px PlusJakarta';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  H.drawWrappedText(
    ctx,
    'Pernah kaget atau malu saat dengar voice note suaramu sendiri?',
    WIDTH / 2,
    1368,
    WIDTH - 280,
    58,
    { align: 'center', maxLines: 3 },
  );

  // Interactive Comment Pill Button
  drawCard(ctx, 250, 1545, WIDTH - 500, 108, {
    radius: 54,
    fill: PALETTE.mint,
    stroke: '#A7F3D0',
    lineWidth: 3,
    shadowColor: 'rgba(52, 211, 153, 0.35)',
    shadowBlur: 24,
  });
  ctx.font = '800 34px PlusJakarta';
  ctx.fillStyle = '#042F2E';
  ctx.textBaseline = 'middle';
  ctx.fillText('TULIS PENGALAMANMU DI KOMENTAR', WIDTH / 2, 1599);

  ctx.font = '600 26px JetMono';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('@MuhammadAtarzk · Sains Tubuh & Psikologi', WIDTH / 2, 1732);

  ctx.restore();
}
