export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    easeOutBack,
    drawSmartphoneWithLoupe,
    drawCalloutBox,
    PALETTE,
  } = H;

  // Hook: Illustrated Smartphone Screen + Brass Magnifying Loupe + Red Wax Seal
  const phoneIn = beat(localSec, 0.2, 0.7, easeOutBack);
  const p1 = beat(localSec, 1.0, 0.55, easeOutCubic);
  const p2 = beat(localSec, 3.0, 0.55, easeOutCubic);
  const p3 = beat(localSec, 5.2, 0.55, easeOutCubic);
  const loupeIn = beat(localSec, 7.2, 0.9, easeOutCubic);
  const stampP = beat(localSec, 11.4, 0.6, easeOutBack);
  const noteP = beat(localSec, 11.8, 0.65, easeOutCubic);

  // Loupe sweeps smoothly along the right side of the viral messages
  const lx = 965 + Math.sin(localSec * 1.4) * 85;
  const ly = 875 + Math.cos(localSec * 1.1) * 145;

  drawSmartphoneWithLoupe(ctx, WIDTH / 2, 1005, 1040, 840, {
    posts: [
      { text: '1. "Tuntutlah ilmu walau ke negeri Cina"', reveal: p1 },
      { text: '2. "Cinta tanah air sebagian dari iman"', reveal: p2 },
      { text: '3. "Perbedaan umatku adalah rahmat"', reveal: p3 },
    ],
    loupeX: lx,
    loupeY: ly,
    loupeProgress: loupeIn,
    stampReveal: stampP,
    reveal: phoneIn,
  });

  // Crisp Bottom Insight Strip (compact, zero dead space)
  drawCalloutBox(
    ctx,
    92,
    1510,
    WIDTH - 184,
    205,
    'JANGAN LANGSUNG TERIMA MENTAH-MENTAH:',
    'Ketiga kalimat viral di atas BUKAN sabda Nabi Muhammad SAW. Mari telusuri jejak sanad, perawi, dan kitab ulama satu per satu!',
    {
      accent: PALETTE.gold,
      bg: 'rgba(13, 28, 24, 0.95)',
      textColor: '#FEF3C7',
      subColor: '#FDE68A',
      reveal: noteP,
    },
  );
}
