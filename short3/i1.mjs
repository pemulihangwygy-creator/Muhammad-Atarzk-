export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    springPop,
    drawIslamicArchiveBackdrop,
    drawManuscriptSlip,
    drawDescendingTakhrijStamp,
    drawMicroPill,
  } = H;

  // Midnight Islamic Library & Mihrab Arches + Drifting Gold Ink Motes
  drawIslamicArchiveBackdrop(ctx, localSec, { warmth: 1.05 });

  // Top Minimal Context Header Pill
  const topP = beat(localSec, 0.1, 0.55, easeOutCubic);
  drawMicroPill(ctx, WIDTH / 2, 260, 'AUDIT TAKHRIJ · 3 KALIMAT VIRAL', {
    dotColor: PALETTE.gold,
    bg: 'rgba(18, 16, 14, 0.92)',
    stroke: 'rgba(245, 158, 11, 0.35)',
    reveal: topP,
  });

  // 3 Aged Classical Manuscript Slips cascading in sync with VO #1
  const c1 = beat(localSec, 0.65, 0.65, springPop);
  const c2 = beat(localSec, 1.55, 0.65, springPop);
  const c3 = beat(localSec, 2.45, 0.65, springPop);

  // Heavy Takhrij Seal Stamp slams down right as VO says "padahal bukan sabda Nabi..." (~4.5s)
  const seal1 = beat(localSec, 4.95, 0.45, easeOutBack);
  const seal2 = beat(localSec, 5.45, 0.45, easeOutBack);
  const seal3 = beat(localSec, 5.95, 0.45, easeOutBack);
  const stampHeadProg = beat(localSec, 4.45, 1.35, easeOutCubic);

  drawManuscriptSlip(ctx, WIDTH / 2, 530, 1100, 290, {
    indexTag: '01',
    eyebrow: 'KLAIM POPULER #01',
    arabic: 'اُطْلُبُوا الْعِلْمَ وَلَوْ بِالصِّينِ',
    headline: '“Tuntutlah ilmu walau ke negeri Cina”',
    struckClaim: 'DISANDARKAN KE NABI SAW',
    verdict: 'BATIL · PERAWI MATRUK',
    sealText: 'BUKAN HADITS',
    sealReveal: seal1,
    tilt: -0.015 * (1 - beat(localSec, 3.8, 0.8)),
    reveal: c1,
  });

  drawManuscriptSlip(ctx, WIDTH / 2, 885, 1100, 290, {
    indexTag: '02',
    eyebrow: 'KLAIM POPULER #02',
    arabic: 'حُبُّ الْوَطَنِ مِنَ الْإِيمَانِ',
    headline: '“Cinta tanah air sebagian dari iman”',
    struckClaim: 'DISANDARKAN KE NABI SAW',
    verdict: 'MAUDHU\' · TANPA SANAD',
    sealText: 'BUKAN HADITS',
    sealReveal: seal2,
    tilt: 0.012 * (1 - beat(localSec, 4.0, 0.8)),
    reveal: c2,
  });

  drawManuscriptSlip(ctx, WIDTH / 2, 1240, 1100, 290, {
    indexTag: '03',
    eyebrow: 'KLAIM POPULER #03',
    arabic: 'اِخْتِلَافُ أُمَّتِي رَحْمَةٌ',
    headline: '“Perbedaan umatku adalah rahmat”',
    struckClaim: 'DISANDARKAN KE NABI SAW',
    verdict: 'SANAD TIDAK DITEMUKAN',
    sealText: 'BUKAN HADITS',
    sealReveal: seal3,
    tilt: -0.01 * (1 - beat(localSec, 4.2, 0.8)),
    reveal: c3,
  });

  // 2.5D Descending Brass & Mahogany Stamp Head (peaks during seal impact)
  drawDescendingTakhrijStamp(ctx, WIDTH / 2 + 240, 860, {
    impactProg: stampHeadProg,
    localSec,
  });

  // Closing Prompt Pill at "Apa saja? Mari kita cek!"
  const ctaP = beat(localSec, 8.35, 0.65, easeOutCubic);
  drawMicroPill(ctx, WIDTH / 2, 1495, 'BEDAH SANAD & KITAB ULAMA →', {
    dotColor: PALETTE.teal,
    bg: 'rgba(10, 26, 22, 0.94)',
    stroke: 'rgba(45, 212, 191, 0.45)',
    reveal: ctaP,
  });
}
