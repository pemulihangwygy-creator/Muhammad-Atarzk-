export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    drawBlueprintGridBackdrop,
    drawPrecisionDialHero,
  } = H;

  // Blueprint Grid Backdrop + Rotating Precision Tick-Dial SANAD Hero (ref_14s & ref_20s!)
  drawBlueprintGridBackdrop(ctx, localSec, {
    glowColor: 'rgba(245, 158, 11, 0.16)',
    gridAlpha: 0.045,
  });

  const heroP = beat(localSec, 0.2, 0.75, easeOutBack);
  const p1 = beat(localSec, 1.8, 0.5, easeOutCubic);
  const p2 = beat(localSec, 2.8, 0.5, easeOutCubic);
  const p3 = beat(localSec, 3.8, 0.5, easeOutCubic);
  const p4 = beat(localSec, 4.8, 0.5, easeOutCubic);
  const p5 = beat(localSec, 5.8, 0.5, easeOutCubic);
  const p6 = beat(localSec, 6.8, 0.5, easeOutCubic);
  const formulaP = beat(localSec, 8.2, 0.75, easeOutCubic);

  drawPrecisionDialHero(ctx, WIDTH / 2, 760, {
    heroText: 'SANAD',
    subtitle: 'RANTAI PERAWI BERSAMBUNG',
    arabic: 'الإِسْنَادُ مِنَ الدِّينِ',
    phase: localSec,
    reveal: heroP,
    orbitPills: [
      { x: 255, y: 465, label: 'RASULULLAH SAW', color: PALETTE.amber, reveal: p1 },
      { x: 1170, y: 495, label: 'SAHABAT', color: PALETTE.teal, reveal: p2 },
      { x: 215, y: 780, label: 'TABI\'IN', color: PALETTE.sky, reveal: p3 },
      { x: 1215, y: 790, label: 'JUJUR', color: PALETTE.emerald, reveal: p4 },
      { x: 270, y: 1030, label: 'BERSAMBUNG', color: PALETTE.amber, reveal: p5 },
      { x: 1150, y: 1030, label: 'KITAB SHAHIH', color: PALETTE.teal, reveal: p6 },
    ],
    formulaLabel: 'KAIDAH PENENTU DERAJAT HADITS',
    formulaLeft: 'SAH =',
    formulaNum: 'Sanad Bersambung + Perawi Jujur',
    formulaDen: 'Tanpa Sanad = Sekadar Kata Mutiara',
    formulaRight: '✓ VALID',
    formulaReveal: formulaP,
  });
}
