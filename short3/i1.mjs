export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawSocialBroadcastCard,
    drawCalloutBox,
    drawCard,
    drawVerdictStamp,
    PALETTE,
  } = H;

  // Hook: Viral Broadcast Cards + "3 Hadits Populer Ternyata Palsu"
  const c1 = beat(localSec, 0.25, 0.6, easeOutBack);
  const c2 = beat(localSec, 2.8, 0.6, easeOutBack);
  const c3 = beat(localSec, 4.8, 0.6, easeOutBack);
  const stampP = beat(localSec, 7.2, 0.55, easeOutBack);
  const hookNote = beat(localSec, 11.2, 0.65, easeOutCubic);

  // 3 Stacked Popular Viral Phrases (y = 565..1480)
  const items = [
    {
      y: 565,
      quote: '1. "Tuntutlah ilmu walau sampai ke negeri Cina."',
      cap: 'Sering dikutip di ceramah & poster motivasi',
      p: c1,
    },
    {
      y: 865,
      quote: '2. "Cinta tanah air adalah sebagian dari iman."',
      cap: 'Populer di status media sosial & spanduk',
      p: c2,
    },
    {
      y: 1165,
      quote: '3. "Perbedaan pendapat umatku adalah rahmat."',
      cap: 'Sering disebut hadits tanpa rujukan kitab',
      p: c3,
    },
  ];

  items.forEach((it) => {
    drawSocialBroadcastCard(ctx, 88, it.y, WIDTH - 176, 272, {
      quote: it.quote,
      caption: it.cap,
      accent: PALETTE.crimson,
      reveal: it.p,
      stampReveal: stampP,
    });
  });

  // Dramatic verdict banner at bottom (y = 1480..1815)
  ctx.save();
  ctx.globalAlpha = clamp01(hookNote);
  drawCard(ctx, 88, 1480 + (1 - hookNote) * 20, WIDTH - 176, 330, {
    radius: 28,
    fill: 'rgba(127, 29, 29, 0.28)',
    stroke: PALETTE.crimson,
    lineWidth: 3,
  });

  drawCalloutBox(
    ctx,
    112,
    1508,
    WIDTH - 224,
    270,
    'CEK FAKTA SANAD ULAMA HADITS:',
    'Para ahli hadits dari zaman klasik hingga modern membuktikan ketiga kalimat di atas TIDAK SAH dinisbatkan kepada Nabi Muhammad SAW. Mari bedah satu per satu!',
    {
      accent: PALETTE.gold,
      bg: 'rgba(13, 28, 24, 0.96)',
      textColor: '#FEF3C7',
      subColor: '#FDE68A',
      reveal: hookNote,
    },
  );
  ctx.restore();
}
