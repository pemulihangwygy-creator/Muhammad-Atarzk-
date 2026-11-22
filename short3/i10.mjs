export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawChecklistStepRow,
    drawCard,
    drawTagPill,
    PALETTE,
  } = H;

  // World A: Forensic Vault Dark — Recap 3 Hadits + CTA Komentar & Share
  const r1 = beat(localSec, 0.25, 0.55, easeOutCubic);
  const r2 = beat(localSec, 0.85, 0.55, easeOutCubic);
  const r3 = beat(localSec, 1.45, 0.55, easeOutCubic);
  const ctaP = beat(localSec, 4.4, 0.75, easeOutBack);

  // 1. Recap 3 Cases (y = 560..1210)
  drawChecklistStepRow(ctx, 88, 560, WIDTH - 176, 196, {
    num: '01',
    title: '“TUNTUT ILMU KE NEGERI CINA” — PALSU',
    desc: 'Ganti dengan HR. Ibnu Majah 224: Menuntut ilmu wajib bagi setiap muslim.',
    accent: PALETTE.crimson,
    isLight: false,
    reveal: r1,
  });

  drawChecklistStepRow(ctx, 88, 776, WIDTH - 176, 196, {
    num: '02',
    title: '“CINTA TANAH AIR SEBAGIAN IMAN” — PALSU',
    desc: 'Tidak ada asal sanadnya. Cinta negeri adalah fitrah, bukan lafaz hadits.',
    accent: PALETTE.gold,
    isLight: false,
    reveal: r2,
  });

  drawChecklistStepRow(ctx, 88, 992, WIDTH - 176, 196, {
    num: '03',
    title: '“PERBEDAAN UMATKU RAHMAT” — TIDAK SAH',
    desc: 'Sanadnya tidak bersambung ke Nabi SAW (Al-Iraqi & Al-Albani).',
    accent: PALETTE.emeraldBright,
    isLight: false,
    reveal: r3,
  });

  // 2. High-Engagement Islamic CTA Card (y = 1230..1815)
  ctx.save();
  ctx.globalAlpha = clamp01(ctaP);
  const sc = 0.94 + 0.06 * ctaP;
  ctx.translate(WIDTH / 2, 1520);
  ctx.scale(sc, sc);
  ctx.translate(-WIDTH / 2, -1520);

  drawCard(ctx, 88, 1230, WIDTH - 176, 580, {
    radius: 34,
    fill: 'rgba(13, 32, 26, 0.96)',
    stroke: PALETTE.gold,
    lineWidth: 3.5,
    shadowColor: 'rgba(234, 179, 8, 0.25)',
    shadowBlur: 30,
  });

  drawTagPill(ctx, WIDTH / 2, 1304, 'DISKUSI & SEBARKAN ILMU', {
    font: '800 25px JetMono',
    fill: 'rgba(234, 179, 8, 0.16)',
    stroke: PALETTE.gold,
    textColor: PALETTE.goldSoft,
    padX: 32,
    height: 52,
  });

  ctx.font = '800 45px PlusJakarta';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  H.drawWrappedText(
    ctx,
    'Mana dari 3 kalimat tadi yang baru kamu tahu ternyata bukan hadits Nabi SAW?',
    WIDTH / 2,
    1374,
    WIDTH - 270,
    56,
    { align: 'center', maxLines: 3 },
  );

  // CTA Pill
  drawCard(ctx, 210, 1548, WIDTH - 420, 108, {
    radius: 54,
    fill: PALETTE.emeraldBright,
    stroke: '#A7F3D0',
    lineWidth: 3,
    shadowColor: 'rgba(52, 211, 153, 0.35)',
    shadowBlur: 24,
  });
  ctx.font = '800 33px PlusJakarta';
  ctx.fillStyle = '#042F2E';
  ctx.textBaseline = 'middle';
  ctx.fillText('TULIS DI KOMENTAR & BAGIKAN KE KELUARGA', WIDTH / 2, 1602);

  ctx.font = '600 26px JetMono';
  ctx.fillStyle = '#A7C4BA';
  ctx.fillText('@MuhammadAtarzk · Takhrij Hadits & Edukasi Islam', WIDTH / 2, 1734);

  ctx.restore();
}
