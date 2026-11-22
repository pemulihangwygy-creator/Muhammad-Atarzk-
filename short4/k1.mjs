export default function renderK1(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, springPop, stagger,
    roundRectPath, drawText, drawDiamondBadge, drawSandTableSlab, drawTacticalUnit, drawTacticalPlaque,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, "PERANG MU'TAH · 8 HIJRIAH", 'bronze', badgeP);

  // Hero monumental force ratio: 3.000 vs 200.000
  const leftP = springPop(localSec - 0.35, 12, 0.72);
  const rightP = springPop(localSec - 0.9, 12, 0.72);
  const vsP = easeOutCubic(stagger(localSec, 0.65, 0.4));

  ctx.save();
  ctx.translate(360, 445);
  ctx.scale(0.85 + 0.15 * clamp01(leftP), 0.85 + 0.15 * clamp01(leftP));
  drawText(ctx, '3.000', 0, 0, {
    font: '900 112px Cinzel',
    color: PALETTE.muslimTealBright,
    alpha: clamp01(leftP),
    glow: 'rgba(69,184,176,0.45)',
    glowBlur: 24,
  });
  drawText(ctx, 'PASUKAN MUSLIM', 0, 74, {
    font: '700 22px JetMono',
    color: '#A7F3D0',
    alpha: clamp01(leftP),
  });
  ctx.restore();

  drawText(ctx, 'VS', WIDTH / 2, 445, {
    font: '900 44px Cinzel',
    color: PALETTE.bronzeLight,
    alpha: vsP,
  });
  drawDiamondBadge(ctx, WIDTH / 2, 520, 'RASIO 1 : 66', 'crimson', easeOutCubic(stagger(localSec, 1.3, 0.45)));

  ctx.save();
  ctx.translate(1065, 445);
  ctx.scale(0.85 + 0.15 * clamp01(rightP), 0.85 + 0.15 * clamp01(rightP));
  drawText(ctx, '200.000', 0, 0, {
    font: '900 96px Cinzel',
    color: PALETTE.crimsonBright,
    alpha: clamp01(rightP),
    glow: 'rgba(224,79,79,0.45)',
    glowBlur: 24,
  });
  drawText(ctx, 'ROMAWI & SEKUTU', 0, 74, {
    font: '700 22px JetMono',
    color: '#FCA5A5',
    alpha: clamp01(rightP),
  });
  ctx.restore();

  // 2.5D Sand-Table visual showing overwhelming scale difference
  const tableP = easeOutCubic(stagger(localSec, 1.4, 0.65));
  drawSandTableSlab(ctx, WIDTH / 2, 1020, 1180, 680, tableP, {
    title: 'MEDAN PERANG · PERBANDINGAN KEKUATAN',
  });

  if (tableP > 0.2) {
    // 3 Muslim vanguard blocks on the left ridge
    const musPositions = [
      [280, 910],
      [310, 1030],
      [280, 1150],
    ];
    for (let i = 0; i < musPositions.length; i++) {
      const up = springPop(localSec - (2.0 + i * 0.18), 14, 0.7);
      const [ux, uy] = musPositions[i];
      drawTacticalUnit(ctx, ux, uy, 74, 48, 'muslim', i === 1 ? '3.000' : '', clamp01(up));
    }

    // 48 densely packed crimson Roman battalion blocks flooding the eastern half
    const waveStart = 2.6;
    const cols = 8;
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = c * rows + r;
        const delay = waveStart + (cols - 1 - c) * 0.16 + r * 0.04;
        const rp = easeOutCubic(stagger(localSec, delay, 0.35));
        if (rp <= 0.02) continue;
        const rx = 560 + c * 82 + (1 - rp) * 60;
        const ry = 800 + r * 86;
        drawTacticalUnit(ctx, rx, ry, 66, 44, 'roman', '', rp * 0.94);
      }
    }

    // Encirclement pressure arcs from Roman army
    const arcP = easeOutCubic(stagger(localSec, 4.4, 0.9));
    if (arcP > 0.02) {
      ctx.save();
      ctx.globalAlpha = arcP * (0.45 + 0.25 * Math.sin(localSec * 4));
      ctx.strokeStyle = PALETTE.crimsonBright;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.arc(310, 1030, 195, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // Bottom Khalid verdict plaque
  const plP = springPop(localSec - 7.4, 12, 0.72);
  if (plP > 0.01) {
    ctx.save();
    ctx.translate(WIDTH / 2, 1550 + (1 - clamp01(plP)) * 40);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      1060,
      195,
      'STRATEGI MUSTAHIL · TITIK BALIK',
      'KHALID BIN WALID MEMBALIKKAN TAKDIR',
      'BUKAN KALAH JUMLAH — MENANG TAKTIK PSIKOLOGIS',
      'bronze',
      clamp01(plP),
    );
    ctx.restore();
  }
}
