export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    drawSunsetHorizonCloudsBackdrop,
    drawHomelandCompassAndFlag,
    drawIvoryPaperSlip,
    drawMicroPill,
  } = H;

  // Sunset Sky Gradient + Bokeh Clouds + Homeland Globe/Flag + Ivory Manuscript Pass (ref_38s!)
  drawSunsetHorizonCloudsBackdrop(ctx, localSec);

  const globeP = beat(localSec, 0.3, 0.8, easeOutBack);
  const pillP = beat(localSec, 3.6, 0.6, easeOutCubic);
  const passP = beat(localSec, 1.4, 0.75, easeOutBack);
  const stampP = beat(localSec, 6.8, 0.6, easeOutBack);
  const fitrahP = beat(localSec, 9.6, 0.6, easeOutCubic);

  // Illustrated Homeland Globe, Waving Flag & Living Heart in Sky
  drawHomelandCompassAndFlag(ctx, WIDTH / 2 + 210, 620, 1.35, {
    wavePhase: localSec,
    reveal: globeP,
  });

  // Floating micro-pill in sky (like AVTUR $98 -> $104 in ref_38s)
  drawMicroPill(ctx, 410, 625, 'ASH-SHAGHANI · ALI AL-QARI: MAUDHU’', {
    dotColor: PALETTE.crimson,
    bg: 'rgba(18, 16, 22, 0.92)',
    stroke: 'rgba(255, 255, 255, 0.16)',
    reveal: pillP,
  });

  // Tilted Ivory Manuscript Pass (`HUBBUL WATHAN`)
  drawIvoryPaperSlip(ctx, WIDTH / 2, 1145, 1120, 390, {
    eyebrow: 'KASUS #02 · حُبُّ الْوَطَنِ مِنَ الْإِيمَانِ',
    headline: '“Cinta tanah air adalah sebagian dari iman”',
    struckClaim: 'KLAIM: HADITS NABI',
    verdict: 'LA ASHLA LAHU (TANPA SANAD)',
    metaRightTop: 'AL-MASHNU\'',
    metaRightBot: 'NO. 106',
    barcode: true,
    stampText: 'PALSU',
    stampReveal: stampP,
    tilt: -0.02,
    reveal: passP,
  });

  // Fitrah Clarification Pill
  drawMicroPill(ctx, WIDTH / 2, 1485, 'CINTA NEGERI = FITRAH MANUSIA (BUKAN HADITS)', {
    dotColor: PALETTE.teal,
    bg: 'rgba(14, 24, 22, 0.92)',
    stroke: 'rgba(45, 212, 191, 0.42)',
    reveal: fitrahP,
  });
}
