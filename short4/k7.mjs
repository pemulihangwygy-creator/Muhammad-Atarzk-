export default function renderK7(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, springPop, stagger,
    roundRectPath, drawText, drawDiamondBadge, drawSandTableSlab, drawTacticalPlaque,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, 'OPERASI DEBU & GEMA TAKBIR', 'bronze', badgeP);

  // 2.5D Desert Ridge & Dust Plume Diorama
  const dioP = easeOutCubic(stagger(localSec, 0.35, 0.6));
  drawSandTableSlab(ctx, WIDTH / 2, 860, 1180, 740, dioP, {
    title: "DI BALIK BUKIT MU'TAH · ILUSI BALA BANTUAN",
  });

  if (dioP > 0.2) {
    ctx.save();
    roundRectPath(ctx, 130, 490, 1180, 740, 18);
    ctx.clip();

    // Sky horizon glow inside tactical viewport
    const skyG = ctx.createLinearGradient(0, 490, 0, 900);
    skyG.addColorStop(0, 'rgba(201,138,58,0.08)');
    skyG.addColorStop(1, 'rgba(201,138,58,0.22)');
    ctx.fillStyle = skyG;
    ctx.fillRect(130, 490, 1180, 460);

    // Rising golden dust cloud puffs kicked up behind the ridge
    const dustP = easeOutCubic(stagger(localSec, 2.2, 2.6));
    for (let i = 0; i < 16; i++) {
      const puffT = clamp01(dustP * 1.4 - i * 0.05);
      if (puffT <= 0.01) continue;
      const dx = 240 + i * 62 + Math.sin(localSec * 1.4 + i) * 14;
      const dy = 885 - puffT * (95 + (i % 4) * 38);
      const rad = (48 + (i % 3) * 24) * puffT;
      const dg = ctx.createRadialGradient(dx, dy, 4, dx, dy, rad);
      dg.addColorStop(0, `rgba(229, 200, 150, ${0.42 * puffT})`);
      dg.addColorStop(1, 'rgba(201, 138, 58, 0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(dx, dy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Concentric acoustic Takbir shockwaves
    const echoP = easeOutCubic(stagger(localSec, 4.2, 1.8));
    if (echoP > 0.02) {
      for (let w = 0; w < 3; w++) {
        const ringProg = (localSec * 0.75 + w * 0.33) % 1;
        const rx = 560;
        const ry = 840;
        const rr = 80 + ringProg * 420;
        ctx.strokeStyle = `rgba(243, 199, 120, ${(1 - ringProg) * 0.55 * echoP})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rx, ry, rr, -Math.PI * 0.85, -Math.PI * 0.15);
        ctx.stroke();
      }
      drawText(ctx, 'اَللّٰهُ أَكْبَرُ', 560, 640, {
        font: '700 66px Amiri',
        color: PALETTE.bronzeLight,
        alpha: echoP,
        glow: 'rgba(243,199,120,0.45)',
      });
    }

    // Back sand ridge silhouette
    ctx.fillStyle = '#573F22';
    ctx.beginPath();
    ctx.moveTo(130, 1020);
    ctx.quadraticCurveTo(420, 810, 740, 890);
    ctx.quadraticCurveTo(1060, 960, 1310, 830);
    ctx.lineTo(1310, 1230);
    ctx.lineTo(130, 1230);
    ctx.closePath();
    ctx.fill();

    // Galloping stylized cavalry silhouettes across ridge
    const cavP = easeOutCubic(stagger(localSec, 1.2, 1.2));
    for (let r = 0; r < 5; r++) {
      const cx = 260 + ((localSec * 140 + r * 175) % 980);
      const cy = 910 + Math.sin(localSec * 9 + r * 1.4) * 7;
      ctx.save();
      ctx.globalAlpha = cavP;
      ctx.translate(cx, cy);
      // Stylized horse & rider geometric silhouette
      ctx.fillStyle = PALETTE.sandstone;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 12, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Neck & head
      ctx.beginPath();
      ctx.moveTo(18, -4);
      ctx.lineTo(36, -24);
      ctx.lineTo(44, -18);
      ctx.lineTo(26, 4);
      ctx.closePath();
      ctx.fill();
      // Rider & spear
      ctx.fillRect(-6, -28, 12, 22);
      ctx.beginPath();
      ctx.arc(0, -34, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.bronzeLight;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, -16);
      ctx.lineTo(26, -62);
      ctx.stroke();
      ctx.restore();
    }

    // Foreground dark desert dune
    ctx.fillStyle = '#2B1F12';
    ctx.beginPath();
    ctx.moveTo(130, 1080);
    ctx.quadraticCurveTo(480, 975, 860, 1045);
    ctx.quadraticCurveTo(1120, 1090, 1310, 1010);
    ctx.lineTo(1310, 1230);
    ctx.lineTo(130, 1230);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Roman Command Panic Plaque
  const panP = springPop(localSec - 7.4, 13, 0.72);
  if (panP > 0.01) {
    ctx.save();
    ctx.translate(WIDTH / 2, 1495 + (1 - clamp01(panP)) * 35);
    drawTacticalPlaque(
      ctx,
      0,
      0,
      1060,
      235,
      'PANIK DI KUBU ROMAWI',
      '"BALA BANTUAN BESAR BARU TIBA DARI MADINAH!"',
      'MENTAL PASUKAN BIZANTIUM RUNTUH SEBELUM PERTEMPURAN',
      'crimson',
      clamp01(panP),
    );
    ctx.restore();
  }
}
