export default function renderK6(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, easeInOutCubic, springPop, stagger,
    drawText, drawDiamondBadge, drawSandTableSlab, drawTacticalUnit, drawTacticalArrow, drawTacticalPlaque,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, 'MANUVER FAJAR · TUKAR FORMASI', 'bronze', badgeP);

  // Sand-table showing dynamic positional swap of the 4 Muslim divisions
  const tableP = easeOutCubic(stagger(localSec, 0.35, 0.55));
  drawSandTableSlab(ctx, WIDTH / 2, 870, 1180, 760, tableP, {
    title: 'ROKADE TOTAL FORMASI PASUKAN MUSLIM',
  });

  if (tableP > 0.2) {
    // Swap animations synchronized to VO:
    // "Sayap kanan ditukar ke kiri" (3.4s..6.2s), "barisan depan dipindah ke belakang" (6.2s..9.0s)
    const wingSwap = easeInOutCubic(stagger(localSec, 3.3, 2.2));
    const depthSwap = easeInOutCubic(stagger(localSec, 6.1, 2.2));

    // Left / Right wing positions (horiz swap)
    const leftPos = [340, 880];
    const rightPos = [1100, 880];
    // Front / Back positions (vertical swap)
    const frontPos = [720, 650];
    const backPos = [720, 1110];

    const lerp = (a, b, t) => a + (b - a) * t;

    // Wing arrows
    const arrowW = easeOutCubic(stagger(localSec, 3.0, 0.9));
    drawTacticalArrow(ctx, 1020, 855, 420, 855, arrowW, PALETTE.bronzeLight, 5, { curveOffset: -135 });
    drawTacticalArrow(ctx, 420, 905, 1020, 905, arrowW, PALETTE.muslimTealBright, 5, { curveOffset: 135 });

    // Depth arrows (clear of EX-BELAKANG label)
    const arrowD = easeOutCubic(stagger(localSec, 5.8, 0.9));
    drawTacticalArrow(ctx, 685, 745, 685, 1055, arrowD, PALETTE.bronzeLight, 5, { curveOffset: -85, dashed: true });
    drawTacticalArrow(ctx, 755, 1055, 755, 745, arrowD, PALETTE.muslimTealBright, 5, { curveOffset: 85, dashed: true });

    // 4 moving tactical divisions
    const w1x = lerp(rightPos[0], leftPos[0], wingSwap);
    const w1y = lerp(rightPos[1], leftPos[1], wingSwap) - Math.sin(wingSwap * Math.PI) * 75;
    const w2x = lerp(leftPos[0], rightPos[0], wingSwap);
    const w2y = lerp(leftPos[1], rightPos[1], wingSwap) + Math.sin(wingSwap * Math.PI) * 75;

    const d1x = lerp(frontPos[0], backPos[0], depthSwap) - Math.sin(depthSwap * Math.PI) * 85;
    const d1y = lerp(frontPos[1], backPos[1], depthSwap);
    const d2x = lerp(backPos[0], frontPos[0], depthSwap) + Math.sin(depthSwap * Math.PI) * 85;
    const d2y = lerp(backPos[1], frontPos[1], depthSwap);

    drawTacticalUnit(ctx, w1x, w1y, 128, 72, 'muslim', 'EX-KANAN', tableP);
    drawTacticalUnit(ctx, w2x, w2y, 128, 72, 'muslim', 'EX-KIRI', tableP);
    drawTacticalUnit(ctx, d1x, d1y, 146, 72, 'muslim', 'EX-DEPAN', tableP);
    drawTacticalUnit(ctx, d2x, d2y, 146, 72, 'muslim', 'EX-BELAKANG', tableP);
  }

  // Byzantine Scout detection alert below table
  const alertP = springPop(localSec - 8.6, 13, 0.72);
  if (alertP > 0.01) {
    ctx.save();
    ctx.translate(WIDTH / 2, 1510 + (1 - clamp01(alertP)) * 35);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      1060,
      235,
      'PERSEPSI PENGINTAI ROMAWI',
      'WAJAH & PANJI TERLIHAT SERBA BARU!',
      'EFEK PSIKOLOGIS: MUSUH RAGU SEBELUM BENTROK',
      'teal',
      clamp01(alertP),
    );
    ctx.restore();
  }
}
