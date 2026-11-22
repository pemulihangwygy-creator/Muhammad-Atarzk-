export default function renderK2(ctx, h) {
  const {
    localSec, WIDTH, PALETTE, clamp01, easeOutCubic, springPop, stagger,
    roundRectPath, drawText, drawDiamondBadge, drawSandTableSlab, drawTacticalArrow, drawCompassRose,
  } = h;

  const badgeP = easeOutCubic(stagger(localSec, 0.1, 0.45));
  drawDiamondBadge(ctx, WIDTH / 2, 265, '8 HIJRIAH / 629 M · PEMICU KONFLIK', 'bronze', badgeP);

  // Cartographic Sand-Table Map (Madinah -> Mu'tah Syam)
  const mapP = easeOutCubic(stagger(localSec, 0.35, 0.6));
  drawSandTableSlab(ctx, WIDTH / 2, 760, 1180, 740, mapP, {
    title: "PETA EKSPEDISI HIJAZ — SYAM (~1.100 KM)",
  });

  if (mapP > 0.2) {
    drawCompassRose(ctx, 1190, 510, 52, 0.12 * Math.sin(localSec * 0.5), mapP);

    // Madinah node (south-east bottom of map)
    const madP = springPop(localSec - 0.7, 13, 0.7);
    ctx.save();
    ctx.globalAlpha = clamp01(madP);
    ctx.fillStyle = PALETTE.muslimTeal;
    ctx.beginPath();
    ctx.arc(330, 990, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.bronzeLight;
    ctx.lineWidth = 4;
    ctx.stroke();
    drawText(ctx, 'MADINAH', 330, 1044, { font: '800 24px JetMono', color: '#A7F3D0' });
    drawText(ctx, '3.000 SAHABAT', 330, 1076, { font: '600 18px JetMono', color: PALETTE.sandMuted });
    ctx.restore();

    // Mu'tah node (north-west / top right of map)
    const mutP = springPop(localSec - 1.2, 13, 0.7);
    ctx.save();
    ctx.globalAlpha = clamp01(mutP);
    ctx.fillStyle = PALETTE.crimson;
    ctx.beginPath();
    ctx.arc(1050, 570, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 4;
    ctx.stroke();
    drawText(ctx, "MU'TAH (SYAM)", 1050, 514, { font: '800 24px JetMono', color: '#FCA5A5' });
    drawText(ctx, 'YORDANIA SELATAN', 1050, 624, { font: '600 18px JetMono', color: PALETTE.sandMuted });
    ctx.restore();

    // Animated expedition route arrow
    const routeP = easeOutCubic(stagger(localSec, 2.2, 3.6));
    drawTacticalArrow(ctx, 360, 975, 1015, 588, routeP, PALETTE.bronzeLight, 6, {
      curveOffset: -110,
      dashed: true,
    });

    // Moving army marker along curve
    if (routeP > 0.05 && routeP < 0.99) {
      const t = routeP;
      const omt = 1 - t;
      const mx = 687.5;
      const my = 781.5 - 110;
      const bx = omt * omt * 360 + 2 * omt * t * mx + t * t * 1015;
      const by = omt * omt * 975 + 2 * omt * t * my + t * t * 588;
      ctx.save();
      ctx.fillStyle = PALETTE.bronzeLight;
      ctx.shadowColor = PALETTE.bronzeLight;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(bx, by, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Diplomatic Seal & Murder of Envoy plaque below map
  const sealP = springPop(localSec - 1.5, 12, 0.72);
  if (sealP > 0.01) {
    const cx = WIDTH / 2;
    const cy = 1420;
    ctx.save();
    ctx.globalAlpha = clamp01(sealP);
    ctx.translate(cx, cy);

    // Forged iron card
    roundRectPath(ctx, -530, -180, 1060, 360, 18);
    const cg = ctx.createLinearGradient(0, -180, 0, 180);
    cg.addColorStop(0, '#231914');
    cg.addColorStop(1, '#140E0B');
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = PALETTE.crimsonBright;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Wax diplomatic seal on left
    const slashP = easeOutCubic(stagger(localSec, 3.0, 0.55));
    ctx.save();
    ctx.translate(-350, 0);
    ctx.fillStyle = PALETTE.bronzeDeep;
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.bronzeLight;
    ctx.lineWidth = 4;
    ctx.stroke();
    drawText(ctx, 'SURAT', 0, -14, { font: '800 22px JetMono', color: PALETTE.bronzeLight });
    drawText(ctx, 'NABI SAW', 0, 16, { font: '800 20px JetMono', color: PALETTE.sandstone });

    // Crimson slash across seal when envoy is killed
    if (slashP > 0.02) {
      ctx.strokeStyle = PALETTE.crimsonBright;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-64, -64);
      ctx.lineTo(-64 + 128 * slashP, -64 + 128 * slashP);
      ctx.stroke();
    }
    ctx.restore();

    drawText(ctx, 'UTUSAN DAMAI DIBUNUH', -210, -76, {
      font: '800 22px JetMono',
      color: PALETTE.crimsonBright,
      align: 'left',
    });
    drawText(ctx, "Al-Harits bin Umair Al-Azdi RA", -210, -14, {
      font: '800 38px PlusJakarta',
      color: PALETTE.sandstone,
      align: 'left',
      maxWidth: 700,
    });
    drawText(ctx, 'Dibunuh oleh Syurahbil bin Amr Al-Ghassani', -210, 46, {
      font: '600 25px PlusJakarta',
      color: PALETTE.sandMuted,
      align: 'left',
      maxWidth: 700,
    });
    drawText(ctx, 'PELANGGARAN BERAT HUKUM DIPLOMASI', -210, 108, {
      font: '700 20px JetMono',
      color: PALETTE.bronzeLight,
      align: 'left',
    });
    ctx.restore();
  }
}
