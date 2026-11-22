export default function renderK4(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, springPop, stagger,
    drawText, drawDiamondBadge, drawDamascusSword, drawTacticalPlaque,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, 'SHAHIH AL-BUKHARI NO. 4266', 'bronze', badgeP);

  // Fan of 9 Damascus Swords snapping sequentially!
  const cx = WIDTH / 2;
  const cy = 960;
  let brokenCount = 0;

  for (let i = 0; i < 9; i++) {
    const tNorm = (i - 4) / 4; // -1 to +1
    const angle = tNorm * 1.15;
    const appear = easeOutCubic(stagger(localSec, 0.5 + i * 0.12, 0.35));
    const snapStart = 3.2 + i * 0.55;
    const snapP = clamp01((localSec - snapStart) / 0.65);
    if (snapP > 0.25) brokenCount++;

    const sx = cx + Math.sin(angle) * 340;
    const sy = cy - Math.cos(angle) * 160 + 180;
    drawDamascusSword(ctx, sx, sy, 330, angle * 0.72, snapP, appear);
  }

  // Central heroic counter
  const countPop = springPop(localSec - 2.6, 12, 0.72);
  if (countPop > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp01(countPop);
    drawText(ctx, `${brokenCount}`, cx, 985, {
      font: '900 164px Cinzel',
      color: brokenCount >= 9 ? PALETTE.crimsonBright : PALETTE.bronzeLight,
      glow: brokenCount >= 9 ? 'rgba(224,79,79,0.55)' : 'rgba(243,199,120,0.4)',
      glowBlur: 28,
    });
    drawText(ctx, 'PEDANG PATAH DI TANGAN KHALID', cx, 1110, {
      font: '800 24px JetMono',
      color: PALETTE.sandstone,
    });
    ctx.restore();
  }

  // Remaining 10th sword: Shafihah Yamaniyah (Intact Golden Broadsword above plaque)
  const remP = springPop(localSec - 8.2, 13, 0.72);
  if (remP > 0.01) {
    // Gleaming intact golden broadsword centered cleanly above the plaque
    drawDamascusSword(ctx, WIDTH / 2 - 190, 1280, 420, Math.PI / 2, 0, clamp01(remP), true);

    ctx.save();
    ctx.translate(WIDTH / 2, 1520 + (1 - clamp01(remP)) * 35);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      1060,
      230,
      'TERSISA SEBILAH PEDANG UTUH',
      'SHAFIHAH YAMANIYAH (PEDANG YAMAN)',
      'KESAKSIAN KHALID: "DI TANGANKU PATAH 9 PEDANG"',
      'bronze',
      clamp01(remP),
    );
    ctx.restore();
  }
}
