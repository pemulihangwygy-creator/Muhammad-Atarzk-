export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    clamp01,
    lerp,
    beat,
    easeOutCubic,
    easeOutBack,
    springPop,
    roundRectPath,
    drawScholarlyGridBackdrop,
    drawMicroPill,
    drawWaxOrInkSeal,
  } = H;

  // Rich Dark Scholarly Table Backdrop
  drawScholarlyGridBackdrop(ctx, localSec, {
    glowColor: 'rgba(217, 119, 6, 0.14)',
    accent: PALETTE.gold,
  });

  // 2.5D Illustrated Ancient Parchment Cartography Map Slab (`Madinah -> Daratan Cina`)
  const mapP = beat(localSec, 0.15, 0.75, easeOutCubic);
  const mx = 96;
  const my = 270 + (1 - mapP) * 28;
  const mw = WIDTH - 192;
  const mh = 680;

  ctx.save();
  ctx.globalAlpha *= mapP;

  // Map outer bezel (mahogany/brass map table)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 18;
  roundRectPath(ctx, mx, my, mw, mh, 24);
  const mapBg = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
  mapBg.addColorStop(0, '#182A36');
  mapBg.addColorStop(0.55, '#13222C');
  mapBg.addColorStop(1, '#0F1A22');
  ctx.fillStyle = mapBg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Clip inside cartography slab
  ctx.save();
  roundRectPath(ctx, mx + 3, my + 3, mw - 6, mh - 6, 22);
  ctx.clip();

  // Landmasses (Arabia top-left & Daratan Cina bottom-right in warm ochre-bronze)
  ctx.fillStyle = '#8F6C3D';
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx + 620, my);
  ctx.lineTo(mx + 470, my + 245);
  ctx.lineTo(mx + 220, my + 290);
  ctx.lineTo(mx, my + 340);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#9A7644';
  ctx.beginPath();
  ctx.moveTo(mx + mw, my + mh);
  ctx.lineTo(mx + 460, my + mh);
  ctx.lineTo(mx + 660, my + 440);
  ctx.lineTo(mx + 960, my + 365);
  ctx.lineTo(mx + mw, my + 390);
  ctx.closePath();
  ctx.fill();

  // Mountain Ridges (geometric layered peaks)
  [
    [mx + 310, my + 170, 120, 90],
    [mx + 410, my + 185, 140, 105],
    [mx + 840, my + 565, 150, 115],
    [mx + 990, my + 575, 130, 95],
  ].forEach(([px, py, pw, ph]) => {
    ctx.fillStyle = 'rgba(34, 22, 10, 0.30)';
    ctx.beginPath();
    ctx.moveTo(px - pw / 2, py);
    ctx.lineTo(px, py - ph);
    ctx.lineTo(px + pw / 2, py);
    ctx.closePath();
    ctx.fill();
  });

  // Subtle Latitude/Longitude Cartography Grid
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.08)';
  ctx.lineWidth = 1.5;
  for (let gx = mx + 120; gx < mx + mw; gx += 160) {
    ctx.beginPath(); ctx.moveTo(gx, my); ctx.lineTo(gx, my + mh); ctx.stroke();
  }
  for (let gy = my + 120; gy < my + mh; gy += 140) {
    ctx.beginPath(); ctx.moveTo(mx, gy); ctx.lineTo(mx + mw, gy); ctx.stroke();
  }

  // Animated Silk Road Arc (`Madinah -> Cina`)
  const routeP = beat(localSec, 0.85, 2.9, easeOutCubic);
  const startPt = [mx + 220, my + 195];
  const midPt = [mx + 610, my + 315];
  const endPt = [mx + 1010, my + 485];

  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.40)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startPt[0], startPt[1]);
  ctx.quadraticCurveTo(midPt[0], midPt[1] - 40, endPt[0], endPt[1]);
  ctx.stroke();
  ctx.restore();

  // Animated Glowing Progress Dot + Camel Silhouette along path
  const cxDot = lerp(startPt[0], endPt[0], routeP);
  const cyDot = lerp(startPt[1], endPt[1], routeP) - Math.sin(routeP * Math.PI) * 35;

  // Madinah Nabawi Dome Marker
  ctx.save();
  ctx.translate(startPt[0], startPt[1]);
  ctx.fillStyle = '#065F46';
  ctx.beginPath(); ctx.arc(0, 0, 28, Math.PI, 0); ctx.fill();
  ctx.fillRect(-28, 0, 56, 18);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(32, -26, 9, 44);
  ctx.font = '800 20px JetMono';
  ctx.fillStyle = '#FEF3C7';
  ctx.textAlign = 'center';
  ctx.fillText('MADINAH', 0, 42);
  ctx.restore();

  // Daratan Cina Pagoda Marker
  ctx.save();
  ctx.translate(endPt[0], endPt[1]);
  ctx.fillStyle = PALETTE.crimsonDeep;
  for (let tier = 0; tier < 3; tier++) {
    const tw = 64 - tier * 14;
    const ty = -tier * 20;
    ctx.beginPath(); ctx.moveTo(-tw / 2, ty); ctx.lineTo(0, ty - 16); ctx.lineTo(tw / 2, ty); ctx.closePath(); ctx.fill();
    ctx.fillRect(-tw * 0.25, ty, tw * 0.5, 10);
  }
  ctx.font = '800 20px JetMono';
  ctx.fillStyle = '#FEF3C7';
  ctx.textAlign = 'center';
  ctx.fillText('DARATAN CINA', 0, 34);
  ctx.restore();

  // Moving Golden Beacon on route
  if (routeP > 0.02) {
    const bglow = ctx.createRadialGradient(cxDot, cyDot, 4, cxDot, cyDot, 48);
    bglow.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
    bglow.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = bglow;
    ctx.beginPath(); ctx.arc(cxDot, cyDot, 48, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath(); ctx.arc(cxDot, cyDot, 9, 0, Math.PI * 2); ctx.fill();
  }

  // Crimson Laser-Fracture Ring when scholars reject it (4.5s+)
  const fracP = beat(localSec, 4.5, 0.7, springPop);
  if (fracP > 0.02) {
    const fx = mx + 610;
    const fy = my + 335;
    ctx.strokeStyle = PALETTE.crimson;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(fx, fy, 42 * fracP, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fx - 24 * fracP, fy - 24 * fracP); ctx.lineTo(fx + 24 * fracP, fy + 24 * fracP);
    ctx.moveTo(fx + 24 * fracP, fy - 24 * fracP); ctx.lineTo(fx - 24 * fracP, fy + 24 * fracP);
    ctx.stroke();
  }

  // Compass Rose in top-right of map
  ctx.save();
  ctx.translate(mx + mw - 95, my + 95);
  ctx.rotate(localSec * 0.08);
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.42)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = i === 0 ? PALETTE.gold : 'rgba(253, 230, 138, 0.45)';
    ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Arabic Matan Overlay inside top-right / center of Map Slab
  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = '700 54px Amiri';
  ctx.fillStyle = PALETTE.goldLight;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 16;
  ctx.textAlign = 'center';
  ctx.fillText('اُطْلُبُوا الْعِلْمَ وَلَوْ بِالصِّينِ', mx + mw / 2, my + 82);
  ctx.restore();

  ctx.restore(); // end map clip
  ctx.restore(); // end map alpha

  // 3 Scholar Verdict Cards below Map (`Ibnu Hibban`, `Ibnul Jauzi`, `Syekh Al-Albani`) synced to VO!
  const v1 = beat(localSec, 4.4, 0.55, easeOutBack);
  const v2 = beat(localSec, 5.7, 0.55, easeOutBack);
  const v3 = beat(localSec, 7.4, 0.55, easeOutBack);

  const scholars = [
    { name: 'IMAM IBNU HIBBAN', book: 'AL-MAJRUHIN', verdict: 'BATIL · TIDAK ADA ASAL', p: v1 },
    { name: 'IMAM IBNUL JAUZI', book: 'AL-MAUDHU\'AT 1/215', verdict: 'MAUDHU\' / PALSU', p: v2 },
    { name: 'SYEKH AL-ALBANI', book: 'AD-DHA\'IFAH NO. 416', verdict: 'BATIL · SANAD RUSAK', p: v3 },
  ];

  const cardW = (WIDTH - 240) / 3;
  scholars.forEach((sc, idx) => {
    if (sc.p <= 0.02) return;
    const cx0 = 100 + idx * (cardW + 20);
    const cy0 = 1005 + (1 - sc.p) * 24;

    ctx.save();
    ctx.globalAlpha *= sc.p;
    roundRectPath(ctx, cx0, cy0, cardW, 255, 18);
    ctx.fillStyle = 'rgba(16, 18, 24, 0.94)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 76, 61, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '700 17px JetMono';
    ctx.fillStyle = PALETTE.gold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(sc.book, cx0 + cardW / 2, cy0 + 28);

    ctx.font = '800 25px PlusJakarta';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(sc.name, cx0 + cardW / 2, cy0 + 72);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.beginPath(); ctx.moveTo(cx0 + 30, cy0 + 128); ctx.lineTo(cx0 + cardW - 30, cy0 + 128); ctx.stroke();

    ctx.font = '800 20px JetMono';
    ctx.fillStyle = PALETTE.crimson;
    ctx.fillText(sc.verdict, cx0 + cardW / 2, cy0 + 165);
    ctx.restore();
  });

  // Final Stamp Badge (`PALSU & BATIL`) at 9.8s
  const finalSeal = beat(localSec, 9.8, 0.55, easeOutBack);
  if (finalSeal > 0.02) {
    drawMicroPill(ctx, WIDTH / 2, 1370, 'KESEPAKATAN ULAMA TAKHRIJ: RIWAYAT PALSU & BATIL', {
      dotColor: PALETTE.crimson,
      bg: 'rgba(32, 12, 12, 0.96)',
      stroke: PALETTE.crimson,
      reveal: finalSeal,
    });
    drawWaxOrInkSeal(ctx, WIDTH / 2 - 40, 745, 'BATIL', {
      reveal: finalSeal,
      angle: -0.14,
      font: '800 36px PlusJakarta',
    });
  }
}
