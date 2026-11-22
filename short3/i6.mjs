export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawAntiqueParchmentScroll,
    drawRehalKitabAndLantern,
    drawMagnifyingGlassTool,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Unfurling Scroll + Rehal Kitab & Swinging Lantern + Sweeping Brass Magnifying Glass
  const scrollP = beat(localSec, 0.2, 0.85, easeOutCubic);
  const stampP = beat(localSec, 7.6, 0.6, easeOutBack);
  const rehalP = beat(localSec, 4.4, 0.9, easeOutCubic);
  const loupeP = beat(localSec, 8.8, 0.8, easeOutCubic);
  const noteP = beat(localSec, 12.2, 0.65, easeOutCubic);

  // 1. Unfurling Scroll: Ikhtilafu Ummati Rahmah
  drawAntiqueParchmentScroll(ctx, 88, 560, WIDTH - 176, 345, {
    header: 'KASUS #03 · KLAIM POPULER',
    arabic: 'اِخْتِلَافُ أُمَّتِي رَحْمَةٌ',
    arabicSize: 64,
    translit: '“Ikhtilafu ummati rahmah”',
    meaning: '“Perbedaan di antara umatku adalah rahmat.”',
    accent: PALETTE.kitabCrimson,
    unroll: scrollP,
    stampLabel: 'NO SANAD',
    stampSub: 'TIDAK ADA ASAL',
    stampReveal: stampP,
  });

  // 2. Side-by-side Physical Artifacts: Rehal + Lantern (left) & Sweeping Magnifying Loupe (right)
  drawRehalKitabAndLantern(ctx, WIDTH / 2 - 235, 1245, 0.96, {
    openProg: rehalP,
    glowPulse: localSec,
  });

  if (loupeP > 0.02) {
    ctx.save();
    ctx.globalAlpha = loupeP;
    drawMagnifyingGlassTool(ctx, WIDTH / 2 + 235, 1185, 1.08, localSec);
    ctx.restore();
  }

  // 3. Verdict Strip (compact, zero dead space)
  drawCalloutBox(
    ctx,
    88,
    1475,
    WIDTH - 176,
    225,
    'TIDAK DITEMUKAN DI KITAB HADITS MANAPUN:',
    'Al-Hafizh Al-Iraqi (Takhrij Al-Ihya no. 74), Imam As-Subki, hingga Al-Albani menegaskan kalimat ini tidak bersanad. Yang shahih: persatuan adalah rahmat.',
    {
      accent: PALETTE.kitabCrimson,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );
}
