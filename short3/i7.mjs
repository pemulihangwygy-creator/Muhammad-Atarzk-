export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawScholarDeskWithCandle,
    drawAntiqueParchmentScroll,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B -> Dramatic Warning: Scholar's Study Desk (Yahya bin Mu'adz) + Mutawatir Warning Scroll
  const deskP = beat(localSec, 0.25, 0.85, easeOutCubic);
  const warnScrollP = beat(localSec, 11.2, 0.9, easeOutCubic);
  const stampP = beat(localSec, 14.5, 0.65, easeOutBack);
  const noteP = beat(localSec, 15.2, 0.65, easeOutCubic);

  // 1. Scholar's Wooden Desk with Candle, Inkwell & Open Ledger: Yahya bin Mu'adz Ar-Razi
  drawScholarDeskWithCandle(ctx, 88, 560, WIDTH - 176, 330, {
    eyebrow: 'CATATAN HIKMAH ULAMA (BUKAN HADITS NABI)',
    author: 'BONUS: “Siapa mengenal dirinya…”',
    quote: 'Imam An-Nawawi, Ibnu Taimiyah & As-Suyuthi (Al-Hawi 2/288) menegaskan ini BUKAN sabda Nabi, melainkan petuah ulama Yahya bin Mu’adz Ar-Razi.',
    flicker: localSec,
    reveal: deskP,
  });

  // 2. Dark Crimson/Gold Mutawatir Warning Scroll (tall enough for 2-line meaning)
  drawAntiqueParchmentScroll(ctx, 88, 925, WIDTH - 176, 425, {
    header: 'PERINGATAN KERAS MUTAWATIR (HR. BUKHARI 110 & MUSLIM 3)',
    arabic: 'مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ',
    arabicSize: 52,
    translit: '“Man kadzaba ‘alayya muta’ammidan falyatabawwa’ maq’adahu minan-nar”',
    meaning: '“Barangsiapa berdusta atas namaku dengan sengaja, hendaklah ia menyiapkan tempat duduknya di neraka.”',
    accent: PALETTE.kitabCrimson,
    unroll: warnScrollP,
    stampLabel: 'MUTAWATIR',
    stampSub: 'BUKHARI & MUSLIM',
    stampReveal: stampP,
  });

  // 3. Moral Takeaway (compact, snug fit)
  drawCalloutBox(
    ctx,
    88,
    1385,
    WIDTH - 176,
    225,
    'JANGAN ASAL MENYANDARKAN KATA KE LISAN NABI:',
    'Walau isinya terasa bijak atau memotivasi, mengklaimnya sebagai sabda Rasulullah SAW tanpa ilmu sanad berisiko terjatuh dalam ancaman besar ini.',
    {
      accent: PALETTE.kitabCrimson,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
