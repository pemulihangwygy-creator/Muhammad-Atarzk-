export default function renderK3(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, springPop, stagger,
    roundRectPath, drawText, drawDiamondBadge, drawBattleBanner,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, 'ESTAFET PANJI RASULULLAH SAW', 'bronze', badgeP);

  const commanders = [
    {
      num: '01',
      name: 'ZAID BIN HARITSAH RA',
      role: 'PANGLIMA PERTAMA · PEMEGANG PANJI AWAL',
      status: 'SYAHID DI GARIS DEPAN',
      start: 1.8,
      y: 495,
      extra: null,
    },
    {
      num: '02',
      name: "JA'FAR BIN ABI THALIB RA",
      role: 'PANGLIMA KEDUA · MEMELUK PANJI HINGGA GUGUR',
      status: 'DZUL JANAHAIN (PEMILIK DUA SAYAP)',
      start: 5.0,
      y: 830,
      extra: 'ذُو الْجَنَاحَيْنِ',
    },
    {
      num: '03',
      name: 'ABDULLAH BIN RAWAHAH RA',
      role: 'PANGLIMA KETIGA · MAJU DENGAN SYAIR KETEGUHAN',
      status: 'SYAHID MENYUSUL REKANNYA',
      start: 9.2,
      y: 1165,
      extra: null,
    },
  ];

  // Vertical bronze relay line connecting the 3 commanders
  const relayP = easeOutCubic(stagger(localSec, 1.8, 8.2));
  if (relayP > 0.02) {
    ctx.save();
    ctx.strokeStyle = PALETTE.bronzeLight;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(235, 495);
    ctx.lineTo(235, 495 + (1165 - 495) * relayP);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  for (let i = 0; i < commanders.length; i++) {
    const c = commanders[i];
    const pop = springPop(localSec - c.start, 13, 0.72);
    if (pop <= 0.01) continue;
    const isActive = localSec >= c.start && (i === 2 || localSec < commanders[i + 1].start);
    const a = clamp01(pop);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(WIDTH / 2 + (1 - a) * 50, c.y);

    // Card frame
    roundRectPath(ctx, -540, -125, 1080, 250, 18);
    const bg = ctx.createLinearGradient(-540, -125, 540, 125);
    bg.addColorStop(0, isActive ? '#292016' : '#1B1611');
    bg.addColorStop(1, '#120F0B');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = isActive ? PALETTE.bronzeLight : 'rgba(201,138,58,0.42)';
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.stroke();

    // Order medallion on left
    ctx.fillStyle = isActive ? PALETTE.bronze : '#332619';
    ctx.beginPath();
    ctx.arc(-430, 0, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.bronzeLight;
    ctx.lineWidth = 3;
    ctx.stroke();
    drawText(ctx, c.num, -430, 2, { font: '900 38px Cinzel', color: PALETTE.sandstone });

    drawText(ctx, c.role, -340, -56, {
      font: '700 20px JetMono',
      color: PALETTE.bronzeLight,
      align: 'left',
      maxWidth: 740,
    });
    drawText(ctx, c.name, -340, 0, {
      font: '900 40px Cinzel',
      color: PALETTE.sandstone,
      align: 'left',
      maxWidth: 740,
    });
    drawText(ctx, c.status, -340, 58, {
      font: '700 22px JetMono',
      color: '#FCA5A5',
      align: 'left',
      maxWidth: 700,
    });

    if (c.extra) {
      drawText(ctx, c.extra, 480, 48, {
        font: '700 34px Amiri',
        color: PALETTE.bronzeLight,
        align: 'right',
      });
    }
    ctx.restore();
  }

  // Waving Liwa banner at bottom left + summary badge
  const banP = easeOutCubic(stagger(localSec, 2.2, 0.8));
  drawBattleBanner(ctx, 215, 1625, 215, 'PANJI ISLAM', PALETTE.muslimTeal, banP, localSec * 4.5);
  drawDiamondBadge(ctx, 835, 1515, '3 PANGLIMA GUGUR · PANJI TETAP TEGAK', 'teal', easeOutCubic(stagger(localSec, 11.2, 0.55)));
  drawText(ctx, 'ESTAFET KOMANDO BERJALAN TANPA JATUH KE TANAH', 835, 1575, {
    font: '600 20px JetMono',
    color: PALETTE.sandMuted,
    alpha: easeOutCubic(stagger(localSec, 11.5, 0.55)),
  });
}
