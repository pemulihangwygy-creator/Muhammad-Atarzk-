export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawArabicManuscriptBox,
    drawBookArchiveCard,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Kasus #02 — "Hubbul Wathan Minal Iman" (Cinta Tanah Air Sebagian dari Iman)
  const boxP = beat(localSec, 0.25, 0.7, easeOutCubic);
  const stampP = beat(localSec, 11.4, 0.55, easeOutBack);
  const book1P = beat(localSec, 7.6, 0.65, easeOutCubic);
  const book2P = beat(localSec, 9.2, 0.65, easeOutCubic);
  const noteP = beat(localSec, 15.2, 0.65, easeOutCubic);

  // 1. Arabic Box + Maudhu Stamp (y = 560..950)
  drawArabicManuscriptBox(ctx, 88, 560, WIDTH - 176, 390, {
    kitabLabel: 'KASUS #02 · UNGKAPAN POPULER',
    arabic: 'حُبُّ الْوَطَنِ مِنَ الْإِيمَانِ',
    arabicSize: 64,
    translit: '“Hubbul wathan minal iman”',
    meaning: '“Cinta tanah air adalah sebagian dari iman.”',
    isLight: true,
    accent: PALETTE.kitabCrimson,
    stampLabel: 'MAUDHU’',
    stampSub: 'TIDAK ADA ASALNYA',
    stampReveal: stampP,
    reveal: boxP,
  });

  // 2. Two Classical Reference Cards (y = 980..1460)
  drawBookArchiveCard(ctx, 88, 980, WIDTH - 176, 220, {
    title: 'PENELUSURAN KITAB HADITS PALSU',
    author: 'Imam Ash-Shaghani & Ali Al-Qari',
    book: 'Al-Mashnu’ fi Ma’rifatil Hadits Al-Maudhu’ (No. 106)',
    verdict: 'LA ASHLA LAHU',
    color: PALETTE.kitabCrimson,
    reveal: book1P,
  });

  drawBookArchiveCard(ctx, 88, 1225, WIDTH - 176, 220, {
    title: 'PENELITIAN ULAMA KONTEMPORER',
    author: 'Syaikh Al-Albani & Ibnu Utsaimin',
    book: 'As-Silsilah Adh-Dha’ifah (Hal. 110) · Kasyful Khafa (1/345)',
    verdict: 'PALSU / MAUDHU’',
    color: PALETTE.kitabCrimson,
    reveal: book2P,
  });

  // 3. Nuanced Islamic Understanding (y = 1480..1825)
  drawCalloutBox(
    ctx,
    88,
    1480,
    WIDTH - 176,
    330,
    'FITRAH MANUSIA VS SABDA NABI SAW:',
    'Mencintai negeri dan menjaga tanah kelahiran adalah fitrah manusia yang wajar (bahkan Nabi SAW mencintai Makkah), namun TIDAK BOLEH menisbatkan kalimat "Hubbul wathan minal iman" sebagai hadits Nabi.',
    {
      accent: PALETTE.kitabTeal,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
