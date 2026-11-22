export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawAntiqueParchmentScroll,
    drawHomelandFitrahScene,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World B: Unfurling Scroll + Wax Seal vs Illustrated Globe, Waving Flag & Living Heart (Fitrah)
  const scrollP = beat(localSec, 0.25, 0.85, easeOutCubic);
  const stampP = beat(localSec, 9.8, 0.6, easeOutBack);
  const fitrahP = beat(localSec, 12.0, 0.75, easeOutCubic);
  const noteP = beat(localSec, 7.6, 0.65, easeOutCubic);

  // 1. Unfurling Scroll: Hubbul Wathan Minal Iman
  drawAntiqueParchmentScroll(ctx, 88, 560, WIDTH - 176, 350, {
    header: 'KASUS #02 · UNGKAPAN POPULER',
    arabic: 'حُبُّ الْوَطَنِ مِنَ الْإِيمَانِ',
    arabicSize: 62,
    translit: '“Hubbul wathan minal iman”',
    meaning: '“Cinta tanah air adalah sebagian dari iman.”',
    accent: PALETTE.kitabCrimson,
    unroll: scrollP,
    stampLabel: 'PALSU',
    stampSub: 'LA ASHLA LAHU',
    stampReveal: stampP,
  });

  // 2. Scholar Verdict Strip (snug fit)
  drawCalloutBox(
    ctx,
    88,
    945,
    WIDTH - 176,
    205,
    'IMAM ASH-SHAGHANI, ALI AL-QARI & AL-ALBANI:',
    'Kalimat ini divonis Maudhu’ (palsu) dan tidak memiliki sumber sanad sama sekali dalam kitab hadits (Al-Mashnu’ no. 106 · Adh-Dha’ifah hal. 110).',
    {
      accent: PALETTE.kitabCrimson,
      bg: '#FFFDF7',
      textColor: PALETTE.kitabInk,
      subColor: PALETTE.kitabMuted,
      reveal: noteP,
    },
  );

  // 3. Illustrated Globe + Waving Flag + Beating Heart (Fitrah Manusia)
  drawHomelandFitrahScene(ctx, 88, 1185, WIDTH - 176, 565, {
    reveal: fitrahP,
    wavePhase: localSec,
  });
}
