export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawArabicManuscriptBox,
    drawScholarVerdictTable,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Kitab Parchment — Kasus #01: "Tuntutlah Ilmu ke Negeri Cina"
  const boxP = beat(localSec, 0.2, 0.7, easeOutCubic);
  const stampP = beat(localSec, 12.6, 0.55, easeOutBack);
  const tableP = beat(localSec, 6.4, 2.2, easeOutCubic);
  const noteP = beat(localSec, 13.4, 0.65, easeOutCubic);

  // 1. Arabic Manuscript Box with Amiri RTL & Stamp (y = 560..955)
  drawArabicManuscriptBox(ctx, 88, 560, WIDTH - 176, 395, {
    kitabLabel: 'KASUS #01 · REDAKSI YANG BEREDAR',
    arabic: 'اُطْلُبُوا الْعِلْمَ وَلَوْ بِالصِّينِ',
    arabicSize: 60,
    translit: '“Uthlubul ‘ilma walau bish-Shin”',
    meaning: '“Tuntutlah ilmu walaupun sampai ke negeri Cina.”',
    isLight: true,
    accent: PALETTE.kitabCrimson,
    stampLabel: 'MAUDHU’',
    stampSub: 'BATIL / PALSU',
    stampReveal: stampP,
    reveal: boxP,
  });

  // 2. Scholar Verdict Matrix (y = 985..1515)
  drawScholarVerdictTable(
    ctx,
    88,
    985,
    WIDTH - 176,
    525,
    [
      {
        imam: 'Imam Ibnu Hibban (w. 354 H)',
        kitab: 'Kitab Al-Majruhin',
        verdict: 'BATIL · LA ASHLA LAHU',
      },
      {
        imam: 'Imam Ibnul Jauzi (w. 597 H)',
        kitab: 'Al-Maudhu’at (Jilid 1, Hal. 215)',
        verdict: 'HADITS PALSU',
      },
      {
        imam: 'Syaikh Al-Albani & Al-Sakhawi',
        kitab: 'Al-Maqasid al-Hasanah (Hal. 63)',
        verdict: 'TIDAK SAH / MAUDHU’',
      },
    ],
    {
      title: 'KONSENSUS ULAMA HADITS KLASIK & KONTEMPORER',
      isLight: true,
      progress: tableP,
    },
  );

  // 3. Clarification Note (y = 1540..1825)
  drawCalloutBox(
    ctx,
    88,
    1540,
    WIDTH - 176,
    275,
    'CATATAN PENTING UNTUK PENUNTUT ILMU:',
    'Semangat mencari ilmu sejauh apa pun itu baik secara kata mutiara, tetapi penggalan “walau ke negeri Cina” BUKAN sabda Nabi SAW.',
    {
      accent: PALETTE.kitabGold,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
