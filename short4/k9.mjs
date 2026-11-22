export default function renderK9(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, springPop, stagger,
    roundRectPath, drawText, drawDiamondBadge, drawDamascusSword, drawTacticalPlaque,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, 'WAHYU RASULULLAH SAW · MADINAH', 'bronze', badgeP);

  // Illuminated bronze & golden halo behind the Unsheathed Sword of Allah
  const haloP = easeOutCubic(stagger(localSec, 0.5, 0.8));
  if (haloP > 0.01) {
    ctx.save();
    ctx.globalAlpha = haloP;
    const hg = ctx.createRadialGradient(WIDTH / 2, 690, 20, WIDTH / 2, 690, 390);
    hg.addColorStop(0, 'rgba(243, 199, 120, 0.34)');
    hg.addColorStop(0.55, 'rgba(201, 138, 58, 0.10)');
    hg.addColorStop(1, 'rgba(201, 138, 58, 0)');
    ctx.fillStyle = hg;
    ctx.fillRect(200, 280, 1040, 820);

    // Outer tactical ring
    ctx.strokeStyle = 'rgba(243,199,120,0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(WIDTH / 2, 680, 265, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Majestic Golden Sword unsheathing upward!
  const swordPop = springPop(localSec - 3.6, 11, 0.72);
  const swordY = 770 + (1 - clamp01(swordPop)) * 120;
  drawDamascusSword(ctx, WIDTH / 2, swordY, 470, 0, 0, clamp01(swordPop + 0.35), true);

  // Arabic & Latin Hero Title: SAIFULLAH AL-MASLUL
  const titleP = springPop(localSec - 4.2, 13, 0.74);
  if (titleP > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp01(titleP);
    drawText(ctx, 'سَيْفُ اللَّهِ الْمَسْلُولُ', WIDTH / 2, 960, {
      font: '700 66px Amiri',
      color: PALETTE.bronzeLight,
      glow: 'rgba(243,199,120,0.55)',
      glowBlur: 24,
    });
    drawText(ctx, 'SAIFULLAH AL-MASLUL', WIDTH / 2, 1045, {
      font: '900 56px Cinzel',
      color: PALETTE.sandstone,
    });
    drawText(ctx, 'PEDANG ALLAH YANG TERHUNUS', WIDTH / 2, 1105, {
      font: '700 24px JetMono',
      color: PALETTE.sandMuted,
    });
    ctx.restore();
  }

  // Final Battle Outcome Contrast Plaques
  const s1 = springPop(localSec - 0.9, 13, 0.72);
  const s2 = springPop(localSec - 1.8, 13, 0.72);

  if (s1 > 0.01) {
    ctx.save();
    ctx.translate(405, 1290 + (1 - clamp01(s1)) * 28);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      540,
      200,
      '✓ PASUKAN ISLAM',
      '3.000 SELAMAT',
      'HANYA 12 SAHABAT SYAHID',
      'teal',
      clamp01(s1),
    );
    ctx.restore();
  }

  if (s2 > 0.01) {
    ctx.save();
    ctx.translate(1035, 1290 + (1 - clamp01(s2)) * 28);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      540,
      200,
      '✕ KEKUATAN BIZANTIUM',
      '200.000 TERTAHAN',
      'GAGAL MENGEJAR KE GURUN',
      'bronze',
      clamp01(s2),
    );
    ctx.restore();
  }

  // Interactive CTA Pill
  const ctaP = springPop(localSec - 9.8, 13, 0.72);
  if (ctaP > 0.01) {
    const pulse = 1 + 0.02 * Math.sin(localSec * 5);
    ctx.save();
    ctx.globalAlpha = clamp01(ctaP);
    ctx.translate(WIDTH / 2, 1545);
    ctx.scale(pulse, pulse);
    roundRectPath(ctx, -430, -48, 860, 96, 16);
    const bg = ctx.createLinearGradient(-430, 0, 430, 0);
    bg.addColorStop(0, '#3D2710');
    bg.addColorStop(0.5, '#593A17');
    bg.addColorStop(1, '#3D2710');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = PALETTE.bronzeLight;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    drawText(ctx, '◆ TULIS PENDAPATMU DI KOMENTAR · BAGIKAN!', 0, 2, {
      font: '800 24px JetMono',
      color: PALETTE.bronzeLight,
    });
    ctx.restore();
  }
}
