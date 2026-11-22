export default function renderK5(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, springPop, stagger,
    roundRectPath, drawText, drawDiamondBadge, drawSandTableSlab, drawTacticalUnit, drawTacticalPlaque,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, "MALAM HARI · KRISIS MEDAN MU'TAH", 'steel', badgeP);

  // Night-mode Tactical Sand-Table showing closing encirclement
  const tableP = easeOutCubic(stagger(localSec, 0.4, 0.65));
  drawSandTableSlab(ctx, WIDTH / 2, 860, 1180, 720, tableP, {
    nightMode: true,
    title: 'ANALISIS KEPUNGAN MALAM · FAJAR HARI KE-2',
  });

  if (tableP > 0.2) {
    // 3 small Muslim tokens huddled in defensive center-left
    const musP = springPop(localSec - 0.9, 13, 0.7);
    drawTacticalUnit(ctx, 520, 840, 76, 48, 'muslim', '', clamp01(musP));
    drawTacticalUnit(ctx, 560, 910, 76, 48, 'muslim', '3.000', clamp01(musP));
    drawTacticalUnit(ctx, 480, 910, 76, 48, 'muslim', '', clamp01(musP));

    // Closing ring of Roman units around 270 degrees
    const ringP = easeOutCubic(stagger(localSec, 1.8, 3.2));
    const totalEnc = 14;
    for (let i = 0; i < totalEnc; i++) {
      const ang = -Math.PI * 0.78 + (i / (totalEnc - 1)) * Math.PI * 1.56;
      const rad = 340 - ringP * 75;
      const rx = 520 + Math.cos(ang) * rad * 1.25;
      const ry = 880 + Math.sin(ang) * rad * 0.85;
      const up = clamp01(ringP * 1.4 - i * 0.04);
      drawTacticalUnit(ctx, rx, ry, 58, 38, 'roman', '', up, ang + Math.PI / 2);
    }

    // Tactical crosshair caliper locking onto psychology
    const calP = easeOutCubic(stagger(localSec, 6.8, 1.2));
    if (calP > 0.02) {
      ctx.save();
      ctx.globalAlpha = calP;
      ctx.strokeStyle = PALETTE.bronzeLight;
      ctx.lineWidth = 2.6;
      const r = 135 - 15 * Math.sin(localSec * 3);
      ctx.beginPath();
      ctx.arc(520, 880, r, 0, Math.PI * 2);
      ctx.stroke();
      // Target ticks
      for (let t = 0; t < 4; t++) {
        const a = (t * Math.PI) / 2 + localSec * 0.4;
        ctx.beginPath();
        ctx.moveTo(520 + Math.cos(a) * (r - 16), 880 + Math.sin(a) * (r - 16));
        ctx.lineTo(520 + Math.cos(a) * (r + 18), 880 + Math.sin(a) * (r + 18));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Two contrasting tactical doctrine cards at bottom
  const c1 = springPop(localSec - 5.2, 13, 0.72);
  const c2 = springPop(localSec - 8.6, 13, 0.72);

  if (c1 > 0.01) {
    ctx.save();
    ctx.translate(405, 1485 + (1 - clamp01(c1)) * 30);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      540,
      235,
      '✕ OPSI BUNUH DIRI',
      'MENANG NEKAT TERBUKA',
      'TERKEPUNG TOTAL & HABIS',
      'crimson',
      clamp01(c1) * 0.85,
    );
    ctx.restore();
  }

  if (c2 > 0.01) {
    ctx.save();
    ctx.translate(1035, 1485 + (1 - clamp01(c2)) * 30);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      540,
      235,
      '◆ DOKTRIN KHALID RA',
      'JEBAKAN PSIKOLOGIS',
      'REKAYASA PERSEPSI MUSUH',
      'teal',
      clamp01(c2),
    );
    ctx.restore();
  }
}
