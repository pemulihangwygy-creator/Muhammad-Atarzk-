export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawDawnMasjidSilhouette,
    drawAntiqueParchmentScroll,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World C: Golden Dawn Masjid Silhouette + Closing Call-to-Action Scroll
  const masjidP = beat(localSec, 0.25, 0.9, easeOutCubic);
  const scrollP = beat(localSec, 2.2, 0.85, easeOutCubic);
  const ctaP = beat(localSec, 6.2, 0.7, easeOutBack);

  // 1. Dawn Masjid Silhouette with Green Dome & Minarets (correct signature!)
  if (masjidP > 0.02) {
    ctx.save();
    ctx.globalAlpha = masjidP;
    drawDawnMasjidSilhouette(ctx, WIDTH / 2, 1005, WIDTH - 176, 420, localSec);
    ctx.restore();
  }

  // 2. Final Golden Blessing Scroll
  drawAntiqueParchmentScroll(ctx, 88, 1045, WIDTH - 176, 355, {
    header: 'AMANAH ILMU · TABAYYUN SEBELUM SEBAR',
    arabic: 'نَضَّرَ اللَّهُ امْرَأً سَمِعَ مَقَالَتِي فَوَعَاهَا',
    arabicSize: 52,
    translit: '“Semoga Allah mencerahkan wajah orang yang mendengar sabdaku lalu menjaganya.”',
    meaning: 'HR. At-Tirmidzi no. 2656 — Bagikan video ini agar makin banyak yang paham mana sabda Nabi SAW yang asli.',
    accent: PALETTE.sunnahGold,
    unroll: scrollP,
  });

  // 3. Interactive Comment CTA (snug fit)
  drawCalloutBox(
    ctx,
    88,
    1435,
    WIDTH - 176,
    230,
    'DISKUSI DI KOMENTAR:',
    'Hadits populer mana yang paling baru kamu tahu ternyata bukan sabda Nabi? Tulis di komentar — Like, Save & Follow untuk seri Cek Fakta Hadits berikutnya!',
    {
      accent: PALETTE.sunnahGold,
      bg: '#0E241C',
      textColor: '#FEF3C7',
      subColor: '#FDE68A',
      reveal: ctaP,
    },
  );
}
