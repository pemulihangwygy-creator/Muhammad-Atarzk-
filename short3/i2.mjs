export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawPhysicalSanadChain,
    drawAntiqueParchmentScroll,
    drawBrassBalanceScale,
    PALETTE,
  } = H;

  // Metodologi: Golden Chain of Narrators (Sanad) + Unfurling Scroll (Matan) + Balance Scale
  const chainP = beat(localSec, 0.5, 2.2, easeOutCubic);
  const scrollP = beat(localSec, 5.2, 0.9, easeOutCubic);
  const scaleP = beat(localSec, 10.6, 0.85, easeOutBack);
  const tilt = -0.24 * clamp01((localSec - 11.2) / 1.2);

  // 1. Top Half: Physical Interlocking Golden Chain descending from Nabi SAW -> Sahabat -> Kitab
  drawPhysicalSanadChain(ctx, WIDTH / 2, 570, 168, [
    {
      name: 'Rasulullah SAW (Sumber Sabda)',
      note: 'Setiap hadits sah wajib bersumber langsung dari lisan atau ketetapan Nabi SAW.',
      status: 'target',
    },
    {
      name: 'Rantai Perawi Bersambung (Sanad)',
      note: 'Sahabat → Tabi’in → Imam Kitab tersambung jujur tanpa perawi pendusta.',
      status: 'valid',
    },
    {
      name: 'Tanpa Rantai = Rantai Putus!',
      note: 'Kalimat indah tanpa sanad hanyalah kata mutiara, bukan hadits Nabi.',
      status: 'broken',
    },
  ], {
    progress: chainP,
    isLight: false,
  });

  // 2. Center: Physical Rolled Parchment Scroll representing Matan (tall enough for 2-line meaning)
  drawAntiqueParchmentScroll(ctx, 100, 1105, WIDTH - 200, 325, {
    header: 'MATAN (REDAKSI HADITS) HARUS PUNYA RANTAI SANAD',
    arabic: 'الإِسْنَادُ مِنَ الدِّينِ',
    arabicSize: 56,
    translit: '“Al-Isnadu minad-din” — Ibnu Al-Mubarak',
    meaning: '“Sanad adalah bagian dari agama; tanpanya orang bisa berkata sesuka hati.”',
    accent: PALETTE.emeraldBright,
    unroll: scrollP,
  });

  // 3. Bottom: Physical Brass Balance Scale separating Petuah Bijak vs Sabda Nabi
  drawBrassBalanceScale(ctx, WIDTH / 2, 1625, 1.15, {
    tilt,
    leftLabel: 'KATA MUTIARA',
    rightLabel: 'HADITS SHAHIH',
    reveal: scaleP,
  });
}
