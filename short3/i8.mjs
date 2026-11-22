export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    drawFakeVsSahihCard,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World C: Pengganti Hadits SHAHIH (HR. Ibnu Majah 224 & HR. Muslim 223)
  const pair1P = beat(localSec, 2.2, 0.8, easeOutCubic);
  const pair2P = beat(localSec, 11.2, 0.8, easeOutCubic);
  const footP = beat(localSec, 14.5, 0.6, easeOutCubic);

  // 1. Replacement Pair #1: Seeking Knowledge (y = 560..1075)
  drawFakeVsSahihCard(ctx, 88, 560, WIDTH - 176, 505, {
    fakeTitle: 'PALSU (TIDAK SAH)',
    fakeArabic: 'وَلَوْ بِالصِّينِ',
    fakeText: '“Tuntutlah ilmu walau sampai ke negeri Cina.” (Cacat perawi Abu ‘Atikah)',
    sahihTitle: 'SHAHIH · HR. IBNU MAJAH 224',
    sahihArabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    sahihText: '“Menuntut ilmu itu wajib atas setiap muslim.”',
    sahihRef: 'Dinilai Shahih oleh Syaikh Al-Albani',
    reveal: pair1P,
  });

  // 2. Replacement Pair #2: Cleanliness & Faith (y = 1100..1615)
  drawFakeVsSahihCard(ctx, 88, 1100, WIDTH - 176, 505, {
    fakeTitle: 'SLOGAN KELIRU',
    fakeArabic: 'حُبُّ الْوَطَنِ / النَّظَافَةُ',
    fakeText: 'Menisbatkan slogan “Cinta tanah air / kebersihan sebagian iman” tanpa lafaz shahih.',
    sahihTitle: 'SHAHIH · HR. MUSLIM NO. 223',
    sahihArabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ',
    sahihText: '“Kesucian (bersuci lahir & batin) adalah sebagian dari iman.”',
    sahihRef: 'Dari Abu Malik Al-Asy’ari RA · Shahih Muslim',
    reveal: pair2P,
  });

  // 3. Bottom Summary Callout (y = 1640..1825)
  drawCalloutBox(
    ctx,
    88,
    1640,
    WIDTH - 176,
    180,
    'ISLAM SUDAH PUNYA RIBUAN DALIL SHAHIH:',
    'Kita tidak pernah kekurangan hadits shahih untuk memotivasi umat — cukup kutip dari Shahih Bukhari, Muslim, dan kitab mu’tabar.',
    {
      accent: PALETTE.sunnahEmerald,
      bg: '#ECFDF5',
      textColor: '#064E3B',
      subColor: '#065F46',
      reveal: footP,
    },
  );
}
