export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    PALETTE,
    beat,
    easeOutCubic,
    easeOutBack,
    drawScholarlyGridBackdrop,
    drawAstrolabeAndSanadChain,
  } = H;

  drawScholarlyGridBackdrop(ctx, localSec, {
    glowColor: 'rgba(245, 158, 11, 0.16)',
    accent: PALETTE.gold,
  });

  const dialP = beat(localSec, 0.2, 0.75, easeOutBack);
  // 5-node interlocking golden chain builds synchronously during "punya sanad, yaitu rantai perawi yang jujur dan bersambung utuh hingga Rasulullah" (4.4s - 9.4s)
  const chainP = beat(localSec, 4.3, 4.9, easeOutCubic);
  // Comparison contrast box slides up during "Tanpa sanad, kalimat indah hanyalah kata mutiara" (10.1s+)
  const compareP = beat(localSec, 10.1, 0.85, easeOutCubic);

  drawAstrolabeAndSanadChain(ctx, WIDTH / 2, 690, {
    dialReveal: dialP,
    chainProgress: chainP,
    compareReveal: compareP,
    localSec,
  });
}
