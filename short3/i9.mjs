export function renderScene(ctx, scene, localSec, H) {
  const {
    WIDTH,
    beat,
    easeOutCubic,
    drawChecklistStepRow,
    drawCalloutBox,
    PALETTE,
  } = H;

  // World C: 3 Langkah Praktis Cek Hadits Sebelum Share
  const s1 = beat(localSec, 3.6, 0.7, easeOutCubic);
  const s2 = beat(localSec, 6.8, 0.7, easeOutCubic);
  const s3 = beat(localSec, 10.2, 0.7, easeOutCubic);
  const tip = beat(localSec, 12.2, 0.65, easeOutCubic);

  // Step 01 (y = 565..845)
  drawChecklistStepRow(ctx, 88, 565, WIDTH - 176, 275, {
    num: '01',
    title: 'CEK PERAWI & KITAB RUJUKANNYA',
    desc: 'Pastikan ada keterangan perawi dan nomor hadits jelas (misal: HR. Bukhari no. 110, HR. Muslim no. 223), bukan sekadar “katanya hadits”.',
    accent: PALETTE.sunnahEmerald,
    isLight: true,
    reveal: s1,
  });

  // Step 02 (y = 870..1150)
  drawChecklistStepRow(ctx, 88, 870, WIDTH - 176, 275, {
    num: '02',
    title: 'PISAHKAN PETUAH BIJAK & SABDA NABI SAW',
    desc: 'Banyak kalimat indah berasal dari ucapan ulama (seperti Yahya bin Mu’adz) atau pepatah hikmah — jangan otomatis ditempel label hadits.',
    accent: PALETTE.sunnahGold,
    isLight: true,
    reveal: s2,
  });

  // Step 03 (y = 1175..1455)
  drawChecklistStepRow(ctx, 88, 1175, WIDTH - 176, 275, {
    num: '03',
    title: 'RUJUK SUMBER TAKHRIJ TERPERCAYA',
    desc: 'Verifikasi lewat kitab Shahih Bukhari & Muslim, atau situs/kitab takhrij hadits ulama yang kredibel sebelum meneruskan broadcast.',
    accent: '#0369A1',
    isLight: true,
    reveal: s3,
  });

  // Bottom Practical Reminder (y = 1485..1795)
  drawCalloutBox(
    ctx,
    88,
    1485,
    WIDTH - 176,
    290,
    'TABAYYUN DIGITAL = PAHALA MENJAGA SUNNAH:',
    'Satu menit memeriksa status hadits sebelum menekan tombol kirim bisa menyelamatkan ratusan orang dari menyebarkan riwayat palsu.',
    {
      accent: PALETTE.sunnahEmerald,
      bg: '#FFFFFF',
      textColor: PALETTE.sunnahInk,
      subColor: PALETTE.sunnahMuted,
      reveal: tip,
    },
  );
}
