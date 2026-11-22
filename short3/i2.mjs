export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawSanadVsMatanDiagram,
    drawIsnadChainDiagram,
    drawCalloutBox,
    PALETTE,
  } = H;

  // Metodologi: Sanad vs Matan + Contoh Rantai Perawi Sah
  const sanadP = beat(localSec, 0.4, 0.8, easeOutCubic);
  const matanP = beat(localSec, 2.2, 0.8, easeOutCubic);
  const chainP = beat(localSec, 5.2, 1.8, easeOutCubic);
  const noteP = beat(localSec, 11.4, 0.65, easeOutBack);

  // 1. Anatomy of Hadith: Sanad + Matan (y = 560..940)
  drawSanadVsMatanDiagram(ctx, 88, 560, WIDTH - 176, 385, {
    sanadProg: sanadP,
    matanProg: matanP,
  });

  // 2. Authentic Isnad Flow Example (y = 975..1525)
  drawIsnadChainDiagram(
    ctx,
    88,
    975,
    WIDTH - 176,
    545,
    [
      {
        name: 'Rasulullah SAW',
        note: 'Sumber wahyu & sabda asli',
        tag: 'SUMBER UTAMA',
        badge: ' SAW',
        status: 'target',
      },
      {
        name: 'Sahabat → Tabi’in → Imam Kitab',
        note: 'Rantai perawi jujur (tsiqah) & bersambung tanpa putus',
        tag: '✓ BERSAMBUNG',
        badge: '✓',
        status: 'valid',
      },
      {
        name: 'Tanpa Sanad = Bukan Hadits',
        note: 'Walau maknanya indah, hanya terhitung kata mutiara / hikmah',
        tag: '✕ DITOLAK',
        status: 'broken',
      },
    ],
    {
      title: 'SYARAT MUTLAK PENELUSURAN (TAKHRIJ)',
      isLight: false,
      progress: chainP,
    },
  );

  // 3. Key Principle Callout (y = 1550..1825)
  drawCalloutBox(
    ctx,
    88,
    1550,
    WIDTH - 176,
    260,
    'KAIDAH EMAS IBNU AL-MUBARAK:',
    '"Sanad adalah bagian dari agama. Seandainya tidak ada sanad, maka siapa saja akan berkata sesuka hatinya." (Muqaddimah Shahih Muslim)',
    {
      accent: PALETTE.emeraldBright,
      bg: 'rgba(13, 28, 24, 0.96)',
      textColor: '#ECFDF5',
      subColor: '#A7F3D0',
      reveal: noteP,
    },
  );
}
