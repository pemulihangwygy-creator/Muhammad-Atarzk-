export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawSilkRoadMapScene,
    drawAntiqueParchmentScroll,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Silk Road Caravan Map + Pagoda + Wooden Gavel + Unfurling Scroll
  const mapIn = beat(localSec, 0.25, 0.7, easeOutCubic);
  const caravanP = beat(localSec, 0.9, 4.5, easeOutCubic);
  const scrollP = beat(localSec, 4.0, 0.9, easeOutCubic);
  const gavelSlam = beat(localSec, 10.3, 0.6, easeOutBack);
  const stampP = beat(localSec, 11.4, 0.6, easeOutBack);
  const noteP = beat(localSec, 12.6, 0.6, easeOutCubic);

  // 1. Illustrated Silk Road Map (Madinah -> Walking Camels -> Chinese Pagoda + Judge's Gavel)
  ctx.save();
  ctx.globalAlpha = mapIn;
  drawSilkRoadMapScene(ctx, 88, 565, WIDTH - 176, 515, {
    caravanProg: caravanP,
    gavelSlam,
  });
  ctx.restore();

  // 2. Unfurling Antique Hadith Scroll + Crimson Wax Seal
  drawAntiqueParchmentScroll(ctx, 88, 1115, WIDTH - 176, 355, {
    header: 'REDAKSI YANG BEREDAR DI MASYARAKAT',
    arabic: 'اُطْلُبُوا الْعِلْمَ وَلَوْ بِالصِّينِ',
    arabicSize: 60,
    translit: '“Uthlubul ‘ilma walau bish-Shin”',
    meaning: '“Tuntutlah ilmu walaupun sampai ke negeri Cina.”',
    accent: PALETTE.kitabCrimson,
    unroll: scrollP,
    stampLabel: 'MAUDHU’',
    stampSub: 'BATIL / PALSU',
    stampReveal: stampP,
  });

  // 3. Concise Verdict Strip (snug fit, zero dead space)
  drawCalloutBox(
    ctx,
    88,
    1505,
    WIDTH - 176,
    210,
    'VONIS ULAMA: BATIL & TIDAK ADA DASARNYA',
    'Imam Ibnu Hibban (Al-Majruhin), Imam Ibnul Jauzi (Al-Maudhu’at 1/215), dan Syaikh Al-Albani sepakat riwayat “ke negeri Cina” berstatus PALSU.',
    {
      accent: PALETTE.kitabCrimson,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
