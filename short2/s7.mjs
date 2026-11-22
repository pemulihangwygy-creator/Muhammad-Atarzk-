export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    clamp01,
    easeOutCubic,
    easeOutBack,
    drawCard,
    drawResearchPaperCard,
    drawReelToReelRecorder,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World C: 1966 Archive Psychology Dossier
  const paperIn = beat(localSec, 0.4, 0.85, easeOutCubic);
  const recorderIn = beat(localSec, 3.2, 0.75, easeOutBack);
  const termBoxIn = beat(localSec, 8.8, 0.65, easeOutBack);

  // 1. 1966 Holzman & Rousey Study Card (y = 565..1030)
  drawResearchPaperCard(ctx, 88, 565 + (1 - paperIn) * 24, WIDTH - 176, 465, {
    year: '1966',
    authors: 'Philip S. Holzman & Clyde Rousey',
    journal: 'Journal of Personality and Social Psychology',
    term: 'VOICE CONFRONTATION',
    summary:
      'Penelitian klasik yang mendokumentasikan reaksi terkejut, canggung, dan penolakan psikologis ketika manusia mendengar rekaman suaranya sendiri untuk pertama kali.',
    reveal: paperIn,
  });

  // 2. Vintage 1966 Reel-to-Reel Tape Recorder Lab Apparatus (y = 1070..1495)
  ctx.save();
  ctx.globalAlpha = clamp01(recorderIn);
  drawCard(ctx, 88, 1070, WIDTH - 176, 425, {
    radius: 22,
    fill: '#FAF5E8',
    stroke: '#8D7B5A',
    lineWidth: 3,
  });

  ctx.font = '700 22px JetMono';
  ctx.fillStyle = PALETTE.archiveMuted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('EKSPERIMEN LAB 1966 · PEMUTARAN PITA MAGNETIK EKSTERNAL', 124, 1098);

  drawReelToReelRecorder(ctx, WIDTH / 2, 1308, 1.08, localSec);
  ctx.restore();

  // 3. Why the Brain Rejects It (y = 1525..1825)
  drawCalloutBox(
    ctx,
    88,
    1525,
    WIDTH - 176,
    290,
    'MENGAPA OTAK MERASA ASING ("KONFRONTASI SUARA")?',
    'Otakmu telah menghafal versi "internal + bass tulang" sejak kecil. Saat rekaman diputar dari luar, otak mendeteksi ketidaksesuaian identitas suara sehingga muncul rasa canggung spontan.',
    {
      accent: PALETTE.archiveStamp,
      bg: '#FAF5E8',
      textColor: PALETTE.archiveInk,
      subColor: '#3F372C',
      reveal: termBoxIn,
    },
  );
}
