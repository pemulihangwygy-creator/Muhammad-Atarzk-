export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawRehalKitabAndLantern,
    drawPureWaterPitcherScene,
    drawAntiqueParchmentScroll,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World C: Sunnah Sanctuary — Tangible Objects Paired with Authentic Sahih Scrolls
  const rehalP = beat(localSec, 0.3, 0.85, easeOutCubic);
  const scroll1P = beat(localSec, 2.0, 0.85, easeOutCubic);
  const pitcherP = beat(localSec, 9.8, 0.9, easeOutBack);
  const scroll2P = beat(localSec, 10.6, 0.85, easeOutCubic);
  const noteP = beat(localSec, 12.2, 0.65, easeOutCubic);

  // 1. Top Row: Carved Wooden Rehal + Lantern (Left) & Authentic Hadith #1 Scroll (Right)
  drawRehalKitabAndLantern(ctx, 275, 810, 0.82, {
    openProg: rehalP,
    glowPulse: localSec,
  });

  drawAntiqueParchmentScroll(ctx, 495, 575, 860, 355, {
    header: 'PENGGANTI SHAHIH #01 · HR. IBNU MAJAH 224',
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    arabicSize: 50,
    translit: '“Thalabul ‘ilmi faridhatun ‘ala kulli muslim”',
    meaning: '“Menuntut ilmu itu wajib atas setiap Muslim.” (Shahih — Al-Albani)',
    accent: PALETTE.emeraldBright,
    unroll: scroll1P,
  });

  // 2. Middle Row: Crystal Water Pitcher (Left) & Authentic Hadith #2 Scroll (Right)
  if (pitcherP > 0.02) {
    ctx.save();
    ctx.globalAlpha = pitcherP;
    drawPureWaterPitcherScene(ctx, 275, 1185, 1.12, localSec);
    ctx.restore();
  }

  drawAntiqueParchmentScroll(ctx, 495, 985, 860, 355, {
    header: 'PENGGANTI SHAHIH #02 · HR. MUSLIM NO. 223',
    arabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ',
    arabicSize: 54,
    translit: '“Ath-Thuhuru syathrul iman”',
    meaning: '“Kesucian (thaharah) adalah separuh dari keimanan.” (Shahih Muslim)',
    accent: PALETTE.emeraldBright,
    unroll: scroll2P,
  });

  // 3. Summary Callout Strip (fully revealed & high-contrast)
  drawCalloutBox(
    ctx,
    88,
    1395,
    WIDTH - 176,
    205,
    'DALIL SHAHIH SUDAH JAUH LEBIH MULIA & TERANG:',
    'Kita tidak pernah kekurangan hadits shahih tentang kewajiban menuntut ilmu maupun keutamaan kesucian iman!',
    {
      accent: PALETTE.sunnahGold,
      bg: '#0E241C',
      textColor: '#FEF3C7',
      subColor: '#A7F3D0',
      reveal: noteP,
    },
  );
}
