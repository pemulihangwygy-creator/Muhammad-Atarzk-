export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    clamp01,
    lerp,
    beat,
    easeOutCubic,
    easeOutBack,
    roundRectPath,
    drawScholarlyGridBackdrop,
    drawMicroPill,
  } = H;

  const isClimax = localSec >= 7.8;

  // Dynamic Stage Mood Shift: Warm Gold Study -> Crimson Mutawatir Alert
  drawScholarlyGridBackdrop(ctx, localSec, {
    glowColor: isClimax ? 'rgba(232, 76, 61, 0.18)' : 'rgba(245, 158, 11, 0.14)',
    accent: isClimax ? PALETTE.crimson : PALETTE.gold,
  });

  // Phase 1 (`0.0s - 7.8s`): Classical Scroll Attributing "Man Arafa Nafsahu" to Yahya bin Mu'adz Ar-Razi
  const scrollP = beat(localSec, 0.25, 0.75, easeOutBack);
  const yahyaTagP = beat(localSec, 4.9, 0.6, easeOutBack);
  const phase1Fade = 1 - beat(localSec, 7.6, 0.65, easeOutCubic);

  if (scrollP > 0.02 && phase1Fade > 0.02) {
    const sy = 560;
    const sw = 1080;
    const sh = 290;

    ctx.save();
    ctx.globalAlpha *= scrollP * phase1Fade;
    ctx.translate(WIDTH / 2, sy + (1 - scrollP) * 24);

    // Rolled Scroll Wooden Ends
    roundRectPath(ctx, -sw / 2, -sh / 2, sw, sh, 20);
    const pg = ctx.createLinearGradient(-sw / 2, -sh / 2, sw / 2, sh / 2);
    pg.addColorStop(0, '#F5EFDF');
    pg.addColorStop(1, '#E2D6B8');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.40)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '700 20px JetMono';
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PETUAH POPULER · BUKAN HADITS NABI SAW', 0, -sh / 2 + 28);

    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = '700 46px Amiri';
    ctx.fillStyle = '#78350F';
    ctx.textBaseline = 'middle';
    ctx.fillText('مَنْ عَرَفَ نَفْسَهُ فَقَدْ عَرَفَ رَبَّهُ', 0, -18);
    ctx.restore();

    ctx.font = '800 30px PlusJakarta';
    ctx.fillStyle = PALETTE.inkDark;
    ctx.textBaseline = 'bottom';
    ctx.fillText('“Siapa mengenal dirinya, ia mengenal Tuhannya”', 0, sh / 2 - 72);

    ctx.restore();

    // Crisp Attribution Pill
    if (yahyaTagP > 0.02) {
      drawMicroPill(ctx, WIDTH / 2, sy + 126, 'ASLINYA UCAPAN: YAHYA BIN MU’ADZ AR-RAZI (AL-HAWI 2/288)', {
        dotColor: PALETTE.gold,
        bg: 'rgba(20, 16, 12, 0.96)',
        stroke: PALETTE.gold,
        reveal: yahyaTagP * phase1Fade,
      });
    }
  }

  // Phase 2 (`7.8s - 16.46s`): Dramatic Pro Kinetic Typography Climax + Mutawatir Warning Plaque
  const climaxP = beat(localSec, 7.9, 0.65, easeOutCubic);
  const strikeP = beat(localSec, 8.6, 0.55, easeOutCubic);
  const mainP = beat(localSec, 9.2, 0.65, easeOutBack);
  const arabicP = beat(localSec, 10.6, 0.75, easeOutCubic);

  if (climaxP > 0.02) {
    const cy = 835;
    ctx.save();
    ctx.globalAlpha *= climaxP;

    // Subtle scrolling mutawatir citation ticker in background
    const scrollX = (localSec * 65) % 900;
    ctx.font = '700 26px JetMono';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const ticker = 'HR. BUKHARI NO. 110   ·   HR. MUSLIM NO. 3   ·   HADITS MUTAWATIR   ·   ';
    ctx.fillText(ticker + ticker + ticker, -scrollX, cy + 165);
    ctx.fillText(ticker + ticker + ticker, -900 + scrollX * 0.75, cy + 215);

    ctx.font = '700 32px JetMono';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.72)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUKAN SEKADAR', WIDTH / 2, cy - 175);

    ctx.font = '800 92px PlusJakarta';
    ctx.fillStyle = 'rgba(244, 239, 230, 0.34)';
    ctx.fillText('KATA BIJAK', WIDTH / 2, cy - 95);

    if (mainP > 0.02) {
      ctx.save();
      ctx.globalAlpha *= mainP;
      ctx.font = '800 92px PlusJakarta';
      ctx.fillStyle = PALETTE.cream;
      ctx.fillText('ITU ANCAMAN', WIDTH / 2, cy - 8);

      ctx.shadowColor = 'rgba(245, 158, 11, 0.50)';
      ctx.shadowBlur = 32;
      ctx.font = '800 106px PlusJakarta';
      ctx.fillStyle = PALETTE.goldLight;
      ctx.fillText('NERAKA.', WIDTH / 2, cy + 100);
      ctx.restore();
    }

    if (strikeP > 0.02) {
      ctx.strokeStyle = PALETTE.crimson;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2 - 330, cy - 82);
      ctx.lineTo(lerp(WIDTH / 2 - 330, WIDTH / 2 + 330, strikeP), lerp(cy - 82, cy - 106, strikeP));
      ctx.stroke();
    }

    // Mutawatir Bukhari & Muslim Warning Plaque
    if (arabicP > 0.02) {
      ctx.save();
      ctx.globalAlpha *= arabicP;
      const bx = 110;
      const by = cy + 280 + (1 - arabicP) * 20;
      const bw = WIDTH - 220;
      const bh = 215;

      roundRectPath(ctx, bx, by, bw, bh, 20);
      ctx.fillStyle = 'rgba(24, 12, 12, 0.94)';
      ctx.fill();
      ctx.strokeStyle = PALETTE.crimson;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = '700 20px JetMono';
      ctx.fillStyle = PALETTE.crimson;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('HADITS MUTAWATIR · HR. BUKHARI 110 & MUSLIM 3', WIDTH / 2, by + 22);

      ctx.save();
      ctx.direction = 'rtl';
      ctx.font = '700 50px Amiri';
      ctx.fillStyle = PALETTE.cream;
      ctx.textBaseline = 'middle';
      ctx.fillText('مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ', WIDTH / 2, by + 108);
      ctx.restore();

      ctx.font = '600 24px PlusJakarta';
      ctx.fillStyle = 'rgba(244, 239, 230, 0.78)';
      ctx.textBaseline = 'bottom';
      ctx.fillText('“Siapa berdusta atas namaku sengaja, siapkan tempatnya di neraka.”', WIDTH / 2, by + bh - 22);
      ctx.restore();
    }

    // Warm rising ember sparks during climax
    for (let e = 0; e < 14; e++) {
      const ep = (localSec * 0.4 + e * 0.19) % 1;
      const ex = 240 + ((e * 173) % (WIDTH - 480)) + Math.sin(localSec * 2 + e) * 24;
      const ey = lerp(1640, 740, ep);
      ctx.fillStyle = `rgba(251, 146, 60, ${0.55 * Math.sin(ep * Math.PI)})`;
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }
}
