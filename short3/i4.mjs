export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawPhysicalSanadChain,
    drawScholarDeskWithCandle,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Physical Chain Snapping at Turbaned Portrait of Abu 'Atikah + Kritikus Ledger
  const chainP = beat(localSec, 0.4, 2.8, easeOutCubic);
  const deskP = beat(localSec, 6.8, 0.85, easeOutCubic);
  const noteP = beat(localSec, 11.8, 0.65, easeOutBack);

  // 1. Physical Chain of Narrators with Snapped Link at Abu 'Atikah
  drawPhysicalSanadChain(ctx, WIDTH / 2, 575, 188, [
    {
      name: 'Anas bin Malik RA (Sahabat)',
      note: 'Sahabat Nabi SAW yang mulia dan terpercaya.',
      status: 'valid',
    },
    {
      name: 'Abu ‘Atikah Tarif bin Sulaiman',
      note: 'TITIK PATAH! Dituduh memalsukan hadits — rantai sanad langsung terputus di sini.',
      status: 'broken',
    },
    {
      name: 'Al-Hasan bin ‘Athiyyah → Kitab Tarikh',
      note: 'Seluruh jalur setelah perawi pendusta ikut tertolak & tidak sah.',
      status: 'broken',
    },
  ], {
    progress: chainP,
    isLight: true,
  });

  // 2. Scholar's Desk Ledger Crossing Out Abu 'Atikah
  drawScholarDeskWithCandle(ctx, 88, 1175, WIDTH - 176, 305, {
    eyebrow: 'KITAB AL-JARH WA AT-TA’DIL (KRITIK PERAWI)',
    author: 'Al-Bukhari · An-Nasa’i · Abu Hatim',
    quote: 'Sepakat menyatakan Abu ‘Atikah adalah perawi tertolak (Matruk / Muttaham bil-Kadzib) dan riwayatnya tidak dapat dipercaya.',
    flicker: localSec,
    reveal: deskP,
  });

  // 3. Why Other Weak Chains Fail Too (snug fit)
  drawCalloutBox(
    ctx,
    88,
    1515,
    WIDTH - 176,
    205,
    'RANTAI PUTUS TIDAK BISA DISAMBUNG PAKSA:',
    'Jalur riwayat lain untuk kalimat ini juga memuat perawi pemalsu hadits (Al-Juwaiybir), sehingga tetap divonis palsu.',
    {
      accent: PALETTE.kitabCrimson,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
