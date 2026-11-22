export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    springPop,
    roundRectPath,
    drawIslamicArchiveBackdrop,
    drawManuscriptSlip,
    drawMicroPill,
  } = H;

  // Warm Deep Editorial Backdrop with Subtle Topographic Archipelago Contours
  drawIslamicArchiveBackdrop(ctx, localSec, { warmth: 1.15 });

  // Left-Top Hero: 2.5D Brass Compass & Spinning Globe + Waving Flag + Beating Heart
  const compP = beat(localSec, 0.25, 0.85, easeOutBack);
  const fitrahLock = beat(localSec, 9.3, 0.85, springPop);

  if (compP > 0.02) {
    ctx.save();
    ctx.globalAlpha *= compP;
    ctx.translate(WIDTH / 2 - 220, 560 + (1 - compP) * 24);

    // Outer brass compass ring
    const rg = ctx.createRadialGradient(0, 0, 20, 0, 0, 210);
    rg.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
    rg.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(0, 0, 210, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#0F2B3D';
    ctx.beginPath(); ctx.arc(0, 0, 146, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Archipelago continents
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(-45, -18, 46, 20, 0.25, 0, Math.PI * 2);
    ctx.ellipse(28, 32, 52, 18, -0.22, 0, Math.PI * 2);
    ctx.ellipse(54, -34, 26, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Waving Red-White Flag on top of Globe
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -125); ctx.lineTo(-4, -260); ctx.stroke();

    const w1 = Math.sin(localSec * 4.2) * 10;
    const w2 = Math.cos(localSec * 4.2) * 10;
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(-2, -260);
    ctx.quadraticCurveTo(58, -272 + w1, 120, -256 + w2);
    ctx.lineTo(120, -216 + w2);
    ctx.quadraticCurveTo(58, -232 + w1, -2, -220);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-2, -220);
    ctx.quadraticCurveTo(58, -232 + w1, 120, -216 + w2);
    ctx.lineTo(120, -176 + w2);
    ctx.quadraticCurveTo(58, -192 + w1, -2, -180);
    ctx.closePath();
    ctx.fill();

    // Living Beating Heart Emblem beside Globe
    const hb = 1 + Math.sin(localSec * 4.5) * 0.08;
    ctx.save();
    ctx.translate(220, -22);
    ctx.scale(hb * 1.45, hb * 1.45);
    ctx.fillStyle = '#F43F5E';
    ctx.shadowColor = 'rgba(244, 63, 94, 0.45)';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.bezierCurveTo(-38, -2, -38, -32, -16, -32);
    ctx.bezierCurveTo(-4, -32, 0, -18, 0, -14);
    ctx.bezierCurveTo(0, -18, 4, -32, 16, -32);
    ctx.bezierCurveTo(38, -32, 38, -2, 0, 26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // Right-Top Classical Leather Book Card (`AL-MASHNU' 106` · Ash-Shaghani & Ali Al-Qari)
  const bookP = beat(localSec, 3.55, 0.65, easeOutBack);
  if (bookP > 0.02) {
    ctx.save();
    ctx.globalAlpha *= bookP;
    const bx = WIDTH / 2 + 85;
    const by = 405 + (1 - bookP) * 20;
    roundRectPath(ctx, bx, by, 520, 290, 20);
    ctx.fillStyle = 'rgba(18, 16, 22, 0.94)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 76, 61, 0.45)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.font = '700 19px JetMono';
    ctx.fillStyle = PALETTE.gold;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('KITAB TAKHRIJ · AL-MASHNU\' 106', bx + 32, by + 30);

    ctx.font = '800 32px PlusJakarta';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText('Imam Ash-Shaghani', bx + 32, by + 76);
    ctx.fillText('& Syekh Ali Al-Qari', bx + 32, by + 118);

    ctx.font = '800 22px JetMono';
    ctx.fillStyle = PALETTE.crimson;
    ctx.fillText('✕ PALSU (MAUDHU\') · TANPA SANAD', bx + 32, by + 215);
    ctx.restore();
  }

  // Center Manuscript Slip (`Hubbul Wathan`)
  const slipP = beat(localSec, 0.85, 0.7, easeOutBack);
  const sealP = beat(localSec, 6.8, 0.5, easeOutBack);
  drawManuscriptSlip(ctx, WIDTH / 2, 1020, 1100, 320, {
    indexTag: '02',
    eyebrow: 'KASUS #02 · HUKUM RIWAYAT',
    arabic: 'حُبُّ الْوَطَنِ مِنَ الْإِيمَانِ',
    headline: '“Cinta tanah air sebagian dari iman”',
    struckClaim: 'KLAIM: SABDA NABI SAW',
    verdict: 'LA ASHLA LAHU (TIDAK ADA SANAD)',
    sealText: 'PALSU',
    sealReveal: sealP,
    tilt: -0.015,
    reveal: slipP,
  });

  // Fitrah Clarification Banner (locks cleanly when VO says "fitrah manusia, bukan hadits Nabi")
  drawMicroPill(ctx, WIDTH / 2, 1345, 'CINTA NEGERI = FITRAH MANUSIA (BUKAN HADITS NABI)', {
    dotColor: PALETTE.teal,
    bg: 'rgba(10, 26, 22, 0.95)',
    stroke: PALETTE.teal,
    checkIcon: true,
    height: 58,
    font: '800 23px JetMono',
    reveal: fitrahLock,
  });
}
