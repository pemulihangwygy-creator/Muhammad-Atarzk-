export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawArabicManuscriptBox,
    drawIsnadChainDiagram,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Kasus #03 — "Ikhtilafu Ummati Rahmah" (Perbedaan Umatku adalah Rahmat)
  const boxP = beat(localSec, 0.25, 0.7, easeOutCubic);
  const stampP = beat(localSec, 8.6, 0.55, easeOutBack);
  const chainP = beat(localSec, 4.6, 2.0, easeOutCubic);
  const noteP = beat(localSec, 13.4, 0.65, easeOutCubic);

  // 1. Arabic Manuscript Box (y = 560..950)
  drawArabicManuscriptBox(ctx, 88, 560, WIDTH - 176, 390, {
    kitabLabel: 'KASUS #03 · KALIMAT TANPA SANAD',
    arabic: 'اِخْتِلَافُ أُمَّتِي رَحْمَةٌ',
    arabicSize: 66,
    translit: '“Ikhtilafu ummati rahmah”',
    meaning: '“Perbedaan pendapat umatku adalah rahmat.”',
    isLight: true,
    accent: PALETTE.kitabCrimson,
    stampLabel: 'TIDAK ADA SANAD',
    stampSub: 'AL-ALBANI NO. 59: MAUDHU’',
    stampReveal: stampP,
    reveal: boxP,
  });

  // 2. Broken / Missing Sanad Evidence (y = 980..1505)
  drawIsnadChainDiagram(
    ctx,
    88,
    980,
    WIDTH - 176,
    520,
    [
      {
        name: 'Imam Al-‘Iraqi & As-Subki',
        note: 'Mencari jalur sanadnya namun tidak ditemukan yang bersambung ke Sahabat',
        tag: 'SANAD TERPUTUS',
        status: 'broken',
      },
      {
        name: 'Al-‘Ajluni & Syaikh Al-Albani',
        note: 'Tadzkiratul Maudhu’at (91) · As-Silsilah Adh-Dha’ifah (No. 59)',
        tag: 'LA ASHLA LAHU',
        status: 'broken',
      },
    ],
    {
      title: 'HASIL PENELUSURAN SANAD PARA MUHADDITSIN',
      isLight: true,
      progress: chainP,
    },
  );

  // 3. Fikih vs Hadits Distinction (y = 1535..1825)
  drawCalloutBox(
    ctx,
    88,
    1535,
    WIDTH - 176,
    285,
    'PERBEDAAN IJTIHAD ≠ HADITS NABI SAW:',
    'Para ulama memang membahas toleransi dalam perbedaan cabang fikih (furu’), namun kalimat di atas tetap tidak boleh disebut sebagai sabda Rasulullah SAW.',
    {
      accent: PALETTE.kitabGold,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
