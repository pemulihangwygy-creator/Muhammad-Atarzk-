export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    drawScholarlyGridBackdrop,
    drawSahihVolumeCard,
    drawMicroPill,
  } = H;

  // Luminous Emerald-Teal & Gold Sanctuary Backdrop (NO arbitrary bar chart!)
  drawScholarlyGridBackdrop(ctx, localSec, {
    glowColor: 'rgba(45, 212, 191, 0.14)',
    accent: PALETTE.gold,
  });

  // Top Header Intro ("Lalu apa gantinya yang shahih?")
  const hdrP = beat(localSec, 0.15, 0.55, easeOutCubic);
  ctx.save();
  ctx.globalAlpha *= hdrP;
  ctx.font = '700 22px JetMono';
  ctx.fillStyle = PALETTE.teal;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('SOLUSI ILMIAH · KUTIP YANG TERVERIFIKASI', WIDTH / 2, 265);

  ctx.font = '800 58px PlusJakarta';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('Ganti Dengan Hadits Shahih', WIDTH / 2, 305);
  ctx.restore();

  // Card 1 (`2.4s+`): Sunan Ibnu Majah 224 + Open Book & Brass Quill (`Menuntut Ilmu`)
  const c1 = beat(localSec, 2.35, 0.75, easeOutBack);
  drawSahihVolumeCard(ctx, WIDTH / 2, 725, 1180, 400, {
    badge: 'PENGGANTI #01',
    bookTitle: 'HR. IBNU MAJAH NO. 224 (SHAHIH)',
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    meaning: '“Menuntut ilmu itu wajib bagi setiap muslim.”',
    accent: PALETTE.gold,
    iconType: 'book',
    localSec,
    reveal: c1,
  });

  // Card 2 (`8.1s+`): Shahih Muslim 223 + Crystal Ibrik Pouring Sparkling Water (`Kesucian`)
  const c2 = beat(localSec, 8.05, 0.75, easeOutBack);
  drawSahihVolumeCard(ctx, WIDTH / 2, 1205, 1180, 400, {
    badge: 'PENGGANTI #02',
    bookTitle: 'HR. MUSLIM NO. 223 (SHAHIH)',
    arabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ',
    meaning: '“Kesucian (thaharah) adalah separuh dari keimanan.”',
    accent: PALETTE.teal,
    iconType: 'ibrik',
    localSec,
    reveal: c2,
  });

  const footP = beat(localSec, 10.6, 0.6, easeOutCubic);
  drawMicroPill(ctx, WIDTH / 2, 1485, 'SANAD BERSAMBUNG · MAKNA KUAT · AMAN DISEBARKAN', {
    dotColor: PALETTE.teal,
    checkIcon: true,
    bg: 'rgba(10, 26, 22, 0.94)',
    stroke: PALETTE.teal,
    reveal: footP,
  });
}
