export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawBookArchiveCard,
    drawArabicManuscriptBox,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World C: Peringatan Keras — Yahya bin Mu'adz Ar-Razi + Hadits Mutawatir Bukhari 110 & Muslim 3
  const bonusP = beat(localSec, 0.3, 0.7, easeOutCubic);
  const verdictP = beat(localSec, 5.2, 0.65, easeOutCubic);
  const hadithP = beat(localSec, 11.4, 0.75, easeOutCubic);
  const stampP = beat(localSec, 13.4, 0.55, easeOutBack);
  const warnP = beat(localSec, 16.5, 0.65, easeOutBack);

  // 1. Bonus Clarification: "Man Arafa Nafsahu Faqad Arafa Rabbahu" (y = 560..815)
  drawBookArchiveCard(ctx, 88, 560, WIDTH - 176, 255, {
    title: 'BONUS KLARIFIKASI POPULER: “MAN ‘ARAFA NAFSAHU...”',
    author: 'Perkataan Ulama: Yahya bin Mu’adz Ar-Razi',
    book: 'Bukan Hadits (Imam An-Nawawi, Ibnu Taimiyah & As-Suyuthi, Al-Hawi 2/288)',
    verdict: 'BUKAN SABDA NABI',
    color: PALETTE.kitabCrimson,
    reveal: bonusP,
  });

  // 2. Scholar Consensus Pill Note (y = 838..1015)
  drawCalloutBox(
    ctx,
    88,
    838,
    WIDTH - 176,
    182,
    'IMAM AN-NAWAWI & IBNU TAIMIYAH:',
    'Ungkapan “Barangsiapa mengenal dirinya maka mengenal Tuhannya” tidak tsabit (tidak sah) sebagai hadits Nabi SAW.',
    {
      accent: PALETTE.sunnahGold,
      bg: '#FFFFFF',
      textColor: PALETTE.sunnahInk,
      subColor: PALETTE.sunnahMuted,
      reveal: verdictP,
    },
  );

  // 3. Authentic Mutawatir Warning Hadith: Bukhari 110 & Muslim 3 (y = 1045..1525)
  drawArabicManuscriptBox(ctx, 88, 1045, WIDTH - 176, 470, {
    kitabLabel: 'HADITS MUTAWATIR · HR. BUKHARI NO. 110 & MUSLIM NO. 3',
    arabic: 'مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ',
    arabicSize: 50,
    translit: '“Man kadzaba ‘alayya muta’ammidan falyatabawwa’ maq’adahu minan-nar”',
    meaning:
      '“Barangsiapa berdusta atas namaku secara sengaja, hendaklah ia menyiapkan tempat duduknya di neraka.”',
    isLight: true,
    accent: PALETTE.kitabCrimson,
    stampLabel: 'MUTAWATIR',
    stampSub: 'BUKHARI & MUSLIM',
    stampPos: 'bottomRight',
    stampReveal: stampP,
    reveal: hadithP,
  });

  // 4. Takeaway Warning Box (y = 1545..1820)
  drawCalloutBox(
    ctx,
    88,
    1545,
    WIDTH - 176,
    265,
    'JANGAN ASAL TEMPEL LABEL “HR.” ATAU “NABI BERSABDA”!',
    'Menyebarkan hadits palsu tanpa mengecek kebenarannya termasuk ancaman berat — cek sanad dulu sebelum menekan tombol Share.',
    {
      accent: PALETTE.kitabCrimson,
      bg: '#FEF2F2',
      textColor: '#7F1D1D',
      subColor: '#991B1B',
      reveal: warnP,
    },
  );
}
