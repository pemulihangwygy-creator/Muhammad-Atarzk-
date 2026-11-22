export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawIsnadChainDiagram,
    drawScholarVerdictTable,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Bedah Sanad Kasus #01 — Abu 'Atikah Tarif bin Sulaiman
  const chainP = beat(localSec, 0.4, 2.4, easeOutCubic);
  const verdictP = beat(localSec, 7.0, 1.8, easeOutCubic);
  const noteP = beat(localSec, 11.4, 0.65, easeOutBack);

  // 1. Isnad Chain Showing Exact Breakpoint at Abu 'Atikah (y = 560..1160)
  drawIsnadChainDiagram(
    ctx,
    88,
    560,
    WIDTH - 176,
    600,
    [
      {
        name: 'Anas bin Malik radhiyallahu ‘anhu',
        note: 'Sahabat Nabi SAW (perawi terpercaya)',
        tag: 'SAHABAT',
        badge: '01',
        status: 'valid',
      },
      {
        name: 'Abu ‘Atikah Tarif bin Sulaiman',
        note: 'Titik cacat! Dituduh memalsukan hadits oleh para ulama Jarh wa Ta’dil',
        tag: 'TERTOLAK / DUSTA',
        status: 'broken',
      },
      {
        name: 'Al-Hasan bin ‘Athiyyah → Kitab Tarikh',
        note: 'Riwayat setelahnya ikut gugur karena sanad cacat di atasnya',
        tag: 'TIDAK SAH',
        badge: '03',
        status: 'broken',
      },
    ],
    {
      title: 'BEDAH RANTAI SANAD RIWAYAT "NEGERI CINA"',
      isLight: true,
      progress: chainP,
    },
  );

  // 2. Verdict of Bukhari, An-Nasa'i, Abu Hatim (y = 1190..1575)
  drawScholarVerdictTable(
    ctx,
    88,
    1190,
    WIDTH - 176,
    385,
    [
      {
        imam: 'Imam Al-Bukhari & An-Nasa’i',
        kitab: 'Munkarul Hadits / Muttaham bil-Kadzib',
        verdict: 'TIDAK DIPERCAYA',
      },
      {
        imam: 'Imam Abu Hatim & Al-‘Uqaili',
        kitab: 'Al-Jarh wa At-Ta’dil',
        verdict: 'MATRUK (DITINGGALKAN)',
      },
    ],
    {
      title: 'VONIS KRITIKUS PERAWI ATAS ABU ‘ATIKAH',
      isLight: true,
      progress: verdictP,
    },
  );

  // 3. Why Multiple Weak Chains Cannot Lift a Fabricated Hadith (y = 1605..1825)
  drawCalloutBox(
    ctx,
    88,
    1605,
    WIDTH - 176,
    215,
    'KENAPA TIDAK BISA NAIK DERAJAT JADI HASAN?',
    'Jalur lain juga bermasalah (ada perawi pendusta seperti Al-Juwaiybir), sehingga kepalsuannya tidak bisa saling menguatkan.',
    {
      accent: PALETTE.kitabCrimson,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
