export default function renderK8(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, easeInOutCubic, springPop, stagger,
    drawText, drawDiamondBadge, drawSandTableSlab, drawTacticalUnit, drawTacticalArrow, drawTacticalPlaque,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, 'INSHIHAB MUNAZZHAM · MUNDUR TERKENDALI', 'teal', badgeP);

  const tableP = easeOutCubic(stagger(localSec, 0.35, 0.55));
  drawSandTableSlab(ctx, WIDTH / 2, 860, 1180, 740, tableP, {
    title: 'FASE AKHIR · SERANGAN KEJUTAN & PENARIKAN RAPI',
  });

  if (tableP > 0.2) {
    // Beat 1: Opening shock strike (1.8s..4.5s)
    const strikeP = easeOutCubic(stagger(localSec, 1.9, 1.8));
    // Beat 2: Orderly withdrawal toward Madinah corridor (4.8s..8.5s)
    const retreatP = easeInOutCubic(stagger(localSec, 4.8, 3.2));

    // Desert Ambush Fear Line
    const trapP = easeOutCubic(stagger(localSec, 6.2, 1.0));
    if (trapP > 0.02) {
      ctx.save();
      ctx.globalAlpha = trapP;
      ctx.strokeStyle = PALETTE.crimsonBright;
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 12]);
      ctx.beginPath();
      ctx.moveTo(640, 520);
      ctx.lineTo(640, 1200);
      ctx.stroke();
      ctx.setLineDash([]);
      drawText(ctx, 'BATAS DUGAAN JEBAKAN', 640, 560, {
        font: '700 18px JetMono',
        color: '#FCA5A5',
      });
      ctx.restore();
    }

    // Roman frontline (hesitates and stops at ambush line)
    for (let r = 0; r < 4; r++) {
      const pushBack = strikeP * 48;
      drawTacticalUnit(ctx, 970 + pushBack, 670 + r * 125, 110, 62, 'roman', '', tableP);
    }

    // Muslim shield-wall units withdrawing cleanly leftwards
    const shiftX = strikeP * 110 - retreatP * 310;
    for (let m = 0; m < 3; m++) {
      drawTacticalUnit(ctx, 490 + shiftX, 725 + m * 135, 115, 64, 'muslim', m === 1 ? 'UTUH' : '', tableP);
    }

    // Opening shock vector -> Orderly withdrawal vector (cleanly below Muslim shield-wall)
    if (strikeP > 0.05 && retreatP < 0.85) {
      drawTacticalArrow(ctx, 560, 860, 895, 860, strikeP, PALETTE.bronzeLight, 7, {
        glow: true,
      });
    }
    if (retreatP > 0.05) {
      drawTacticalArrow(ctx, 560, 1110, 220, 1110, retreatP, PALETTE.muslimTealBright, 7, {
        dashed: true,
      });
      drawText(ctx, 'KORIDOR MADINAH ←', 390, 1160, {
        font: '800 20px JetMono',
        color: '#A7F3D0',
        alpha: retreatP,
      });
    }
  }

  // Verdict plaque
  const plP = springPop(localSec - 6.8, 13, 0.72);
  if (plP > 0.01) {
    ctx.save();
    ctx.translate(WIDTH / 2, 1495 + (1 - clamp01(plP)) * 35);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      1060,
      235,
      'KEJENIUSAN KHALID BIN WALID RA',
      '200.000 TENTARA TAK BERANI MENGEJAR',
      'TAKUT TERJEBAK PENYERGAPAN DI PADANG PASIR',
      'teal',
      clamp01(plP),
    );
    ctx.restore();
  }
}
