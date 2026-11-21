#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = process.cwd();
export const WIDTH = 1440;
export const HEIGHT = 2560;
export const FPS = 90;
export const SAMPLE_RATE = 48000;

export const VIDEO_CONFIG = {
  title: 'Kenapa Satu Kebaikan Dibalas 700 Kali Lipat dalam Islam?',
  channelHandle: '@MuhammadAtarzk',
  categoryLabel: 'HIKMAH ISLAM · AL-QUR\'AN & HADIS',
  outputVideo: join(ROOT, 'out', 'Kenapa_Satu_Kebaikan_Dibalas_700x_Lipat_2K_90fps.mp4'),
  paketFile: join(ROOT, 'out', 'Paket_Metadata_700x_Kebaikan.txt'),
  timelineFile: join(ROOT, '.tmp', 'timeline.json'),
};

export const SCENES_DATA = [
  {
    id: 'x01',
    module: './x1.mjs',
    chapter: 'PEMBUKA',
    badge: 'MATEMATIKA LANGIT',
    headline: 'SATU KEBAIKAN DIBALAS 700 KALI LIPAT',
    highlightWords: ['700', 'KALI', 'LIPAT'],
    arabic: 'وَاللَّهُ يُضَاعِفُ لِمَن يَشَاءُ',
    arabicTrans: 'Allah melipatgandakan bagi siapa yang Dia kehendaki',
    source: 'QS. Al-Baqarah (2): 261 · HR. Bukhari & Muslim',
    voFile: 'audio/vo_01.mp3',
    voText:
      'Dalam hitungan manusia, satu ditambah satu hasilnya dua. Tapi dalam hitungan Islam, satu kebaikan bisa bernilai tujuh ratus kali lipat, bahkan tanpa batas. Bagaimana rumusnya bekerja?',
    sfx: 'reveal_chime',
    transition: 'iris_gold',
  },
  {
    id: 'x02',
    module: './x2.mjs',
    chapter: 'FAKTA 01',
    badge: 'ATURAN DASAR',
    headline: 'MINIMAL SEPULUH KALI LIPAT',
    highlightWords: ['SEPULUH KALI'],
    arabic: 'مَن جَاءَ بِالْحَسَنَةِ فَلَهُ عَشْرُ أَمْثَالِهَا',
    arabicTrans: 'Barang siapa membawa satu kebaikan, baginya sepuluh kali lipatnya',
    source: 'QS. Al-An\'am (6): 160',
    voFile: 'audio/vo_02.mp3',
    voText:
      "Aturan dasarnya tertulis jelas di Surah Al-An'am ayat seratus enam puluh. Siapa yang membawa satu kebaikan, baginya pahala minimal sepuluh kali lipat.",
    sfx: 'parchment_sweep',
    transition: 'arch_wipe',
  },
  {
    id: 'x03',
    module: './x3.mjs',
    chapter: 'FAKTA 02',
    badge: 'RAHMAT VS KEADILAN',
    headline: 'SATU DOSA HANYA DIBALAS SATU',
    highlightWords: ['HANYA', 'SATU'],
    arabic: 'وَمَن جَاءَ بِالسَّيِّئَةِ فَلَا يُجْزَىٰ إِلَّا مِثْلَهَا',
    arabicTrans: 'Siapa membawa keburukan, hanya dibalas seimbang dengannya',
    source: 'QS. Al-An\'am (6): 160 · Tafsir Al-Qurthubi',
    voFile: 'audio/vo_03.mp3',
    voText:
      'Sementara satu keburukan hanya dibalas satu yang setimpal. Imam Al-Qurthubi menjelaskan: kebaikan dilipatgandakan karena rahmat Allah, sedangkan keburukan tidak dilipatgandakan karena keadilan-Nya.',
    sfx: 'scale_balance',
    transition: 'prism_slice',
  },
  {
    id: 'x04',
    module: './x4.mjs',
    chapter: 'FAKTA 03',
    badge: 'KEUTAMAAN NIAT',
    headline: 'BARU BERNIAT SUDAH DICATAT PENUH',
    highlightWords: ['BERNIAT', 'DICATAT PENUH'],
    arabic: 'فَمَنْ هَمَّ بِحَسَنَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا اللَّهُ حَسَنَةً كَامِلَةً',
    arabicTrans: 'Siapa berniat kebaikan lalu belum mengamalkannya, dicatat satu kebaikan sempurna',
    source: 'HR. Bukhari no. 6491 & Muslim no. 131',
    voFile: 'audio/vo_04.mp3',
    voText:
      'Lebih menakjubkan lagi, menurut Hadis Riwayat Bukhari dan Muslim, siapa yang baru berniat melakukan kebaikan lalu belum sempat melakukannya, tetap dicatat satu kebaikan penuh.',
    sfx: 'crystal_ping',
    transition: 'radial_pulse',
  },
  {
    id: 'x05',
    module: './x5.mjs',
    chapter: 'FAKTA 04',
    badge: 'PERISAI IMAN',
    headline: 'BATAL BERBUAT BURUK JADI PAHALA',
    highlightWords: ['BATAL', 'JADI PAHALA'],
    arabic: 'إِنَّمَا تَرَكَهَا مِنْ جَرَّايَ',
    arabicTrans: 'Sesungguhnya ia meninggalkannya semata-mata karena Aku',
    source: 'HR. Bukhari no. 6491 & Muslim no. 131',
    voFile: 'audio/vo_05.mp3',
    voText:
      'Sebaliknya, jika seseorang berniat berbuat buruk lalu ia urungkan karena takut kepada Allah, malaikat justru mencatatnya sebagai satu kebaikan yang sempurna.',
    sfx: 'shield_lock',
    transition: 'gold_curtain',
  },
  {
    id: 'x06',
    module: './x6.mjs',
    chapter: 'FAKTA 05',
    badge: 'LONJAKAN PAHALA',
    headline: 'DARI 10 MELESAT KE 700 KALI LIPAT',
    highlightWords: ['10', '700 KALI LIPAT'],
    arabic: 'عَشْرَ حَسَنَاتٍ إِلَىٰ سَبْعِمِائَةِ ضِعْفٍ',
    arabicTrans: 'Sepuluh kebaikan hingga tujuh ratus kali lipat, bahkan berlipat-lipat banyaknya',
    source: 'HR. Bukhari no. 6491 & Muslim no. 131',
    voFile: 'audio/vo_06.mp3',
    voText:
      'Dan ketika niat baik itu benar-benar dikerjakan, catatannya langsung melonjak dari sepuluh kali lipat hingga tujuh ratus kali lipat, bahkan lebih banyak lagi.',
    sfx: 'ascend_chord',
    transition: 'vertical_lift',
  },
  {
    id: 'x07',
    module: './x7.mjs',
    chapter: 'FAKTA 06',
    badge: 'PERUMPAMAAN AL-QUR\'AN',
    headline: 'SATU BENIH TUMBUH TUJUH TANGKAI',
    highlightWords: ['SATU BENIH', 'TUJUH TANGKAI'],
    arabic: 'كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ',
    arabicTrans: 'Laksana sebutir benih yang menumbuhkan tujuh tangkai',
    source: 'QS. Al-Baqarah (2): 261',
    voFile: 'audio/vo_07.mp3',
    voText:
      'Kenapa angkanya tujuh ratus? Di Surah Al-Baqarah ayat dua ratus enam puluh satu, Allah membuat perumpamaan sebutir benih yang menumbuhkan tujuh tangkai.',
    sfx: 'organic_bloom',
    transition: 'diagonal_sweep',
  },
  {
    id: 'x08',
    module: './x8.mjs',
    chapter: 'FAKTA 07',
    badge: '7 × 100 = 700',
    headline: 'TIAP TANGKAI MEMBAWA SERATUS BIJI',
    highlightWords: ['SERATUS', 'BIJI'],
    arabic: 'فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ',
    arabicTrans: 'Pada tiap-tiap tangkai terdapat seratus biji',
    source: 'QS. Al-Baqarah (2): 261 · Tafsir Ibnu Katsir',
    voFile: 'audio/vo_08.mp3',
    voText:
      'Di setiap tangkai itu tumbuh seratus biji. Tujuh dikali seratus sama dengan tujuh ratus. Dan ayat itu ditutup dengan janji: Allah melipatgandakan bagi siapa yang Dia kehendaki.',
    sfx: 'shimmer_burst',
    transition: 'star_iris',
  },
  {
    id: 'x09',
    module: './x9.mjs',
    chapter: 'FAKTA 08',
    badge: 'DI ATAS 700×',
    headline: 'PUASA MENEMBUS BATAS 700 KALI',
    highlightWords: ['MENEMBUS BATAS'],
    arabic: 'إِلَّا الصَّوْمَ فَإِنَّهُ لِي وَأَنَا أَجْزِي بِهِ',
    arabicTrans: 'Kecuali puasa, sesungguhnya puasa itu untuk-Ku dan Aku sendiri yang membalasnya',
    source: 'HR. Bukhari no. 1904 & Muslim no. 1151',
    voFile: 'audio/vo_09.mp3',
    voText:
      'Tapi ternyata, tujuh ratus bukan batas maksimal. Dalam Hadis Qudsi riwayat Bukhari dan Muslim, Allah berfirman: semua amal dilipatgandakan hingga tujuh ratus kali, kecuali puasa.',
    sfx: 'celestial_bell',
    transition: 'eclipse_wipe',
  },
  {
    id: 'x10',
    module: './x10.mjs',
    chapter: 'FAKTA 09',
    badge: 'TANPA BATAS',
    headline: 'KESABARAN DIBAYAR TANPA HITUNGAN',
    highlightWords: ['TANPA HITUNGAN'],
    arabic: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ',
    arabicTrans: 'Orang-orang yang bersabar dicukupkan pahalanya tanpa batas',
    source: 'QS. Az-Zumar (39): 10',
    voFile: 'audio/vo_10.mp3',
    voText:
      'Puasa itu untuk Allah dan Dia sendiri yang membalasnya. Begitu pula kesabaran: di Surah Az-Zumar ayat sepuluh, pahalanya diberikan tanpa batas perhitungan.',
    sfx: 'infinity_swell',
    transition: 'horizon_split',
  },
  {
    id: 'x11',
    module: './x11.mjs',
    chapter: 'SEJARAH NYATA',
    badge: 'PACEKLIK MADINAH',
    headline: 'SERIBU UNTA KAFILAH UTSMAN BIN AFFAN',
    highlightWords: ['SERIBU UNTA'],
    arabic: 'ذُو النُّورَيْنِ — عُثْمَانُ بْنُ عَفَّانَ',
    arabicTrans: 'Dzun Nurain — Utsman bin Affan radhiyallahu \'anhu',
    source: 'Sirah Sahabat · Masa Khalifah Abu Bakar RA',
    voFile: 'audio/vo_11.mp3',
    voText:
      'Keyakinan ini dibuktikan langsung oleh sahabat Nabi, Utsman bin Affan. Saat Madinah dilanda paceklik di masa Khalifah Abu Bakar, datanglah seribu unta miliknya membawa gandum dari Syam.',
    sfx: 'desert_wind',
    transition: 'dune_sweep',
  },
  {
    id: 'x12',
    module: './x12.mjs',
    chapter: 'BUKTI KEYAKINAN',
    badge: '5× VS 10×–700×',
    headline: 'MENOLAK UNTUNG 5 KALI DEMI JANJI ALLAH',
    highlightWords: ['MENOLAK', 'JANJI ALLAH'],
    arabic: 'اللَّهُ يُعْطِينِي بِكُلِّ وَاحِدٍ عَشْرًا',
    arabicTrans: 'Allah memberiku balasan sepuluh kali lipat untuk setiap satuannya',
    source: 'Riwayat Kedermawanan Utsman bin Affan RA',
    voFile: 'audio/vo_12.mp3',
    voText:
      'Para pedagang menawar muatan itu hingga lima kali lipat. Tapi Utsman menolak dan berkata: sudah ada yang menawariku sepuluh kali lipat, yaitu Allah. Seluruhnya pun disedekahkan gratis.',
    sfx: 'impact_gold',
    transition: 'light_flare',
  },
  {
    id: 'x13',
    module: './x13.mjs',
    chapter: 'HIKMAH TERDALAM',
    badge: 'UMUR & KEIKHLASAN',
    headline: 'UMUR SINGKAT, PAHALA DIPERPANJANG',
    highlightWords: ['UMUR SINGKAT', 'KEIKHLASAN'],
    arabic: 'سَبَقَ دِرْهَمٌ مِائَةَ أَلْفِ دِرْهَمٍ',
    arabicTrans: 'Satu dirham mengalahkan seratus ribu dirham',
    source: 'HR. Tirmidzi no. 3550 (Usia 60–70) · HR. An-Nasa\'i no. 2527',
    voFile: 'audio/vo_13.mp3',
    voText:
      'Mengapa kelipatannya sedahsyat ini? Karena umur umat kita hanya sekitar enam puluh tahun, dan yang dihitung bukan sekadar jumlah harta, melainkan beratnya keikhlasan di hati.',
    sfx: 'deep_resonance',
    transition: 'iris_gold',
  },
  {
    id: 'x14',
    module: './x14.mjs',
    chapter: 'PENUTUP',
    badge: 'REFLEKSI HARI INI',
    headline: 'TAK ADA KEBAIKAN YANG KECIL',
    highlightWords: ['KEBAIKAN', 'KECIL'],
    arabic: 'لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا',
    arabicTrans: 'Jangan sekali-kali meremehkan kebaikan sekecil apa pun',
    source: 'HR. Muslim no. 2626',
    voFile: 'audio/vo_14.mp3',
    voText:
      'Jadi, tidak ada kebaikan yang terlalu kecil di sisi Allah. Tulis di komentar: kebaikan sederhana apa yang paling membekas di hidupmu?',
    sfx: 'warm_resolve',
    transition: 'none',
  },
];

function formatTimestamp(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = String(s % 60).padStart(2, '0');
  return `${m}:${rem}`;
}

export function buildPaketMetadata(timeline = null) {
  const chapterLabels = [
    'Hitungan manusia vs hitungan Islam',
    'Aturan minimal 10 kali lipat (QS. Al-An\'am: 160)',
    'Rahmat Allah vs keadilan-Nya (1 keburukan = 1)',
    'Baru berniat baik sudah dicatat penuh (HR. Bukhari & Muslim)',
    'Niat buruk yang dibatalkan karena Allah menjadi pahala',
    'Lonjakan 10x hingga 700x lipat saat diamalkan',
    'Perumpamaan 1 benih menumbuhkan 7 tangkai (QS. Al-Baqarah: 261)',
    '7 tangkai x 100 biji = 700 kali lipat',
    'Puasa menembus batas 700 kali (Hadis Qudsi)',
    'Kesabaran dibalas tanpa batas hitungan (QS. Az-Zumar: 10)',
    'Kisah 1.000 unta Utsman bin Affan RA saat paceklik Madinah',
    'Menolak untung 5x lipat demi balasan 10x-700x dari Allah',
    'Faktor usia 60-70 tahun & keikhlasan (1 dirham vs 100.000 dirham)',
    'Tak ada kebaikan yang terlalu kecil di sisi Allah',
  ];
  const fallbackSecs = [0, 14, 25, 38, 49, 60, 70, 80, 94, 107, 118, 130, 141, 154];
  const chapters = chapterLabels
    .map((label, i) => {
      const t = timeline?.scenes?.[i] ? timeline.scenes[i].startSec : fallbackSecs[i];
      return `${formatTimestamp(t)} ${label}`;
    })
    .join('\n');

  return `JUDUL
Kenapa Satu Kebaikan Dibalas 700 Kali Lipat dalam Islam?

DESKRIPSI
Dalam hitungan manusia, satu ditambah satu hasilnya dua. Tapi dalam hitungan Islam, satu kebaikan tidak pernah berhenti di angka satu: minimal sepuluh kali lipat, naik menjadi tujuh ratus kali lipat, bahkan tanpa batas bagi puasa dan kesabaran.

Di video ini kita membahas rumus pelipatgandaan pahala berdasarkan Al-Qur'an dan Hadis Shahih, cara malaikat mencatat niat baik maupun niat buruk yang dibatalkan karena Allah, hingga kisah nyata kafilah 1.000 unta Utsman bin Affan radhiyallahu 'anhu saat Madinah dilanda paceklik.

${chapters}

Tulis di komentar: kebaikan sederhana apa yang paling membekas di hidupmu?

Sumber: QS. Al-Baqarah (2): 261; QS. Al-An'am (6): 160; QS. Az-Zumar (39): 10; HR. Bukhari no. 6491 & Muslim no. 131 (pencatatan niat dan lipat ganda amal); HR. Bukhari no. 1904 & Muslim no. 1151 (keutamaan puasa); HR. Tirmidzi no. 3550 (rentang usia umat 60-70 tahun); HR. An-Nasa'i no. 2527 (1 dirham mengalahkan 100.000 dirham); HR. Muslim no. 2626; Tafsir Ibnu Katsir & Tafsir Al-Qurthubi; Sirah Sahabat Utsman bin Affan RA.

HASHTAG
#Shorts #Islam #Kebaikan #Pahala #KisahIslami

TAG
kenapa satu kebaikan dibalas 700 kali lipat, pahala 700 kali lipat, matematika allah dalam islam, sedekah 700 kali lipat, surat al baqarah ayat 261, surat al anam ayat 160, hadits niat baik dan niat buruk, keutamaan puasa, pahala sabar tanpa batas, kisah utsman bin affan, kafilah 1000 unta utsman bin affan, satu dirham mengalahkan seratus ribu dirham, motivasi islam, hikmah islam, edukasi islam, fakta unik islam, kisah sahabat nabi, ceramah singkat, dakwah pendek, shorts islam indonesia`;
}

export const PAKET_METADATA = buildPaketMetadata();

export function findFfmpeg() {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  try {
    const p = execFileSync('/tmp/venv/bin/python', [
      '-c',
      'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())',
    ]).toString().trim();
    if (p && existsSync(p)) return p;
  } catch {}
  return 'ffmpeg';
}

export function probeDuration(ffmpeg, filePath) {
  const res = spawnSync(ffmpeg, ['-hide_banner', '-i', filePath, '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const out = `${res.stderr || ''}\n${res.stdout || ''}`;
  const m = out.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  throw new Error(`Could not probe duration for ${filePath}`);
}

function detectSpeechWindow(ffmpeg, filePath) {
  const res = spawnSync(
    ffmpeg,
    ['-hide_banner', '-i', filePath, '-af', 'silencedetect=noise=-42dB:d=0.12', '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  const stderr = `${res.stderr || ''}\n${res.stdout || ''}`;
  const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const rawDur = durMatch
    ? Number(durMatch[1]) * 3600 + Number(durMatch[2]) * 60 + Number(durMatch[3])
    : probeDuration(ffmpeg, filePath);

  let start = 0;
  let end = rawDur;
  const starts = [...stderr.matchAll(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/g)];
  if (starts.length > 0) {
    const firstEnd = parseFloat(starts[0][1]);
    const firstDur = parseFloat(starts[0][2]);
    if (firstEnd - firstDur < 0.08 && firstEnd < rawDur * 0.4) {
      start = Math.max(0, firstEnd - 0.04);
    }
  }
  const ends = [...stderr.matchAll(/silence_start:\s*([\d.]+)/g)];
  if (ends.length > 0) {
    const lastStart = parseFloat(ends[ends.length - 1][1]);
    if (rawDur - lastStart < 1.2 && lastStart > start + 1.0) {
      end = Math.min(rawDur, lastStart + 0.14);
    }
  }
  return { rawDur, start, end, cleanDur: Math.max(1.0, end - start) };
}

function buildWordTimings(text, activeStart, activeEnd) {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => {
    const len = w.replace(/[^a-zA-Z0-9'-]/g, '').length;
    const pause = /[,.?!:;]$/.test(w) ? 2.4 : 0;
    return Math.max(2, len) + pause;
  });
  const totalW = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0.5, activeEnd - activeStart);
  let acc = 0;
  return words.map((word, i) => {
    const w0 = activeStart + (acc / totalW) * span;
    acc += weights[i];
    const w1 = activeStart + (acc / totalW) * span;
    return { word, start: w0, end: w1 };
  });
}

function writeWavStereo(path, left, right, sr = SAMPLE_RATE) {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }
  writeFileSync(path, buf);
}

function synthesizeAmbientAndSfx(timeline, outBedPath, outSfxPath) {
  const totalSec = timeline.totalSec;
  const totalSamples = Math.ceil(totalSec * SAMPLE_RATE);
  const bedL = new Float32Array(totalSamples);
  const bedR = new Float32Array(totalSamples);
  const sfxL = new Float32Array(totalSamples);
  const sfxR = new Float32Array(totalSamples);

  // Subtle celestial harmonic resonance (Hijaz/Nahawand-inspired warm glass drone, zero drums)
  // Frequencies in D minor / Hijaz luminous chord: D2 (73.42), A2 (110.0), D3 (146.83), F3 (174.61), A3 (220.0), E4 (329.63)
  const voices = [
    { f: 73.416, amp: 0.22, pan: 0.0, lfo: 0.07 },
    { f: 110.0, amp: 0.16, pan: -0.25, lfo: 0.11 },
    { f: 146.832, amp: 0.14, pan: 0.22, lfo: 0.09 },
    { f: 220.0, amp: 0.09, pan: -0.38, lfo: 0.13 },
    { f: 293.665, amp: 0.055, pan: 0.35, lfo: 0.17 },
    { f: 440.0, amp: 0.028, pan: 0.15, lfo: 0.21 },
  ];

  // Build smooth VO envelope for dynamic sidechain ducking
  const envStep = 480; // 10ms resolution
  const envLen = Math.ceil(totalSamples / envStep);
  const duckTarget = new Float32Array(envLen).fill(1.0);
  for (const sc of timeline.scenes) {
    const s0 = Math.max(0, Math.floor((sc.startSec + 0.05) * SAMPLE_RATE / envStep));
    const s1 = Math.min(envLen - 1, Math.ceil((sc.endSec - 0.15) * SAMPLE_RATE / envStep));
    for (let k = s0; k <= s1; k++) duckTarget[k] = 0.36; // -9dB duck under active VO
  }
  const duckSmooth = new Float32Array(envLen);
  let curDuck = 1.0;
  for (let k = 0; k < envLen; k++) {
    const rate = duckTarget[k] < curDuck ? 0.14 : 0.035;
    curDuck += (duckTarget[k] - curDuck) * rate;
    duckSmooth[k] = curDuck;
  }

  const TAU = Math.PI * 2;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const fadeIn = Math.min(1, t / 1.5);
    const fadeOut = Math.min(1, Math.max(0, (totalSec - t) / 2.2));
    const duck = duckSmooth[Math.min(envLen - 1, (i / envStep) | 0)];
    let l = 0;
    let r = 0;
    for (let v = 0; v < voices.length; v++) {
      const vc = voices[v];
      const breathe = 0.68 + 0.32 * Math.sin(TAU * vc.lfo * t + v * 1.1);
      const drift = 1.0 + 0.0012 * Math.sin(TAU * 0.18 * t + v);
      const s = Math.sin(TAU * vc.f * drift * t) * vc.amp * breathe;
      const gL = Math.sqrt(0.5 * (1 - vc.pan));
      const gR = Math.sqrt(0.5 * (1 + vc.pan));
      l += s * gL;
      r += s * gR;
    }
    const gain = fadeIn * fadeOut * duck * 0.16;
    bedL[i] = l * gain;
    bedR[i] = r * gain;
  }

  // Procedural crisp SFX cues at each scene entry
  let seed = 4219;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 4294967296) * 2 - 1;
  };

  const addChime = (startSec, baseFreq, amp = 0.18, dur = 1.1, pan = 0) => {
    const s0 = Math.floor(startSec * SAMPLE_RATE);
    const len = Math.floor(dur * SAMPLE_RATE);
    const gL = Math.sqrt(0.5 * (1 - pan));
    const gR = Math.sqrt(0.5 * (1 + pan));
    for (let j = 0; j < len && s0 + j < totalSamples; j++) {
      if (s0 + j < 0) continue;
      const t = j / SAMPLE_RATE;
      const env = Math.min(1, t / 0.008) * Math.exp(-t * 4.2);
      const tone =
        Math.sin(TAU * baseFreq * t) * 0.65 +
        Math.sin(TAU * baseFreq * 2.0 * t) * 0.25 * Math.exp(-t * 2.5) +
        Math.sin(TAU * baseFreq * 3.0 * t) * 0.1 * Math.exp(-t * 4.0);
      const val = tone * env * amp;
      sfxL[s0 + j] += val * gL;
      sfxR[s0 + j] += val * gR;
    }
  };

  const addWhoosh = (startSec, dur = 0.48, amp = 0.14) => {
    const s0 = Math.floor(startSec * SAMPLE_RATE);
    const len = Math.floor(dur * SAMPLE_RATE);
    let lp = 0;
    let lp2 = 0;
    for (let j = 0; j < len && s0 + j < totalSamples; j++) {
      if (s0 + j < 0) continue;
      const u = j / len;
      const env = Math.sin(Math.PI * u) ** 1.6;
      const cutoff = 0.04 + 0.18 * Math.sin(Math.PI * u);
      const n = rand();
      lp += cutoff * (n - lp);
      lp2 += cutoff * 0.6 * (lp - lp2);
      const v = (lp - lp2) * 3.4 * env * amp;
      sfxL[s0 + j] += v * 0.9;
      sfxR[s0 + j] += v * 0.95;
    }
  };

  const addSubPulse = (startSec, freq = 68, amp = 0.24, dur = 0.65) => {
    const s0 = Math.floor(startSec * SAMPLE_RATE);
    const len = Math.floor(dur * SAMPLE_RATE);
    for (let j = 0; j < len && s0 + j < totalSamples; j++) {
      if (s0 + j < 0) continue;
      const t = j / SAMPLE_RATE;
      const env = Math.min(1, t / 0.012) * Math.exp(-t * 5.2);
      const f = freq * (1 + 0.55 * Math.exp(-t * 18));
      const v = Math.sin(TAU * f * t) * env * amp;
      sfxL[s0 + j] += v;
      sfxR[s0 + j] += v;
    }
  };

  const scale = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66];
  timeline.scenes.forEach((sc, idx) => {
    if (idx === 0) {
      addSubPulse(0.05, 65, 0.26, 0.8);
      addChime(0.08, 587.33, 0.16, 1.4, -0.15);
      addChime(0.24, 880.0, 0.13, 1.3, 0.15);
    } else {
      addWhoosh(Math.max(0, sc.startSec - 0.16), 0.42, 0.12);
      const note = scale[idx % scale.length];
      addChime(sc.startSec + 0.02, note, 0.13, 0.95, idx % 2 === 0 ? -0.2 : 0.2);
      if (['x06', 'x08', 'x09', 'x11', 'x12', 'x13'].includes(sc.id)) {
        addSubPulse(sc.startSec + 0.04, 62, 0.2, 0.55);
      }
    }
  });

  writeWavStereo(outBedPath, bedL, bedR);
  writeWavStereo(outSfxPath, sfxL, sfxR);
}

export function buildAudioAndTimeline() {
  const ffmpeg = findFfmpeg();
  const tmpDir = join(ROOT, '.tmp');
  const outDir = join(ROOT, 'out');
  mkdirSync(tmpDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const missing = SCENES_DATA.filter((s) => !existsSync(join(ROOT, s.voFile)));
  if (missing.length > 0) {
    throw new Error(`Missing VO clips: ${missing.map((m) => m.voFile).join(', ')}`);
  }

  let cursorSec = 0;
  const scenes = [];
  const gapSec = 0.22;

  for (let i = 0; i < SCENES_DATA.length; i++) {
    const sc = SCENES_DATA[i];
    const voPath = join(ROOT, sc.voFile);
    const win = detectSpeechWindow(ffmpeg, voPath);
    const cleanWav = join(tmpDir, `vo_clean_${sc.id}.wav`);

    // Trim dead silence, normalize speech presence with warm broadcast EQ + gentle de-ess/compression
    execFileSync(
      ffmpeg,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-ss',
        win.start.toFixed(4),
        '-t',
        win.cleanDur.toFixed(4),
        '-i',
        voPath,
        '-af',
        'highpass=f=85,equalizer=f=180:t=q:w=1.2:g=1.8,equalizer=f=3200:t=q:w=1.5:g=1.4,equalizer=f=6800:t=q:w=2.0:g=-1.5,acompressor=threshold=-20dB:ratio=2.4:attack=12:release=120,aresample=48000',
        '-ac',
        '2',
        '-ar',
        '48000',
        cleanWav,
      ],
      { stdio: 'inherit' },
    );

    const measuredDur = probeDuration(ffmpeg, cleanWav);
    const sceneDur = measuredDur + (i < SCENES_DATA.length - 1 ? gapSec : 0.65);
    const startSec = cursorSec;
    const endSec = startSec + sceneDur;
    const startFrame = Math.round(startSec * FPS);
    const endFrame = Math.round(endSec * FPS);

    scenes.push({
      ...sc,
      cleanWav,
      voDurationSec: measuredDur,
      startSec,
      endSec,
      durationSec: sceneDur,
      startFrame,
      endFrame,
      durationFrames: Math.max(1, endFrame - startFrame),
      words: buildWordTimings(sc.voText, 0.04, Math.max(0.4, measuredDur - 0.14)),
    });

    cursorSec = endSec;
  }

  const totalSec = cursorSec;
  const totalFrames = scenes[scenes.length - 1].endFrame;
  const timeline = {
    generatedAt: new Date().toISOString(),
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    totalSec,
    totalFrames,
    scenes,
  };

  writeFileSync(VIDEO_CONFIG.timelineFile, JSON.stringify(timeline, null, 2));

  // Build VO concatenation track aligned exactly to scene startSec
  const voMaster = join(tmpDir, 'vo_master.wav');
  const inputs = [];
  const filterParts = [];
  scenes.forEach((sc, idx) => {
    inputs.push('-i', sc.cleanWav);
    const delayMs = Math.round(sc.startSec * 1000);
    filterParts.push(`[${idx}:a]adelay=${delayMs}|${delayMs}[a${idx}]`);
  });
  const mixLabels = scenes.map((_, idx) => `[a${idx}]`).join('');
  filterParts.push(`${mixLabels}amix=inputs=${scenes.length}:duration=longest:normalize=0[vout]`);
  execFileSync(
    ffmpeg,
    ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', filterParts.join(';'), '-map', '[vout]', '-t', totalSec.toFixed(4), '-ar', '48000', '-ac', '2', voMaster],
    { stdio: 'inherit' },
  );

  // Synthesize ambient bed + SFX
  const bedWav = join(tmpDir, 'ambient_bed.wav');
  const sfxWav = join(tmpDir, 'sfx_track.wav');
  synthesizeAmbientAndSfx(timeline, bedWav, sfxWav);

  // Mix VO + bed + SFX, master to -14 LUFS / -1.5 dBTP
  const masterWav = join(tmpDir, 'master_audio.wav');
  const masterM4a = join(tmpDir, 'master_audio.m4a');
  execFileSync(
    ffmpeg,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      voMaster,
      '-i',
      bedWav,
      '-i',
      sfxWav,
      '-filter_complex',
      '[0:a]volume=1.0[vo];[1:a]volume=0.85[bed];[2:a]volume=0.95[sfx];[vo][bed][sfx]amix=inputs=3:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,apad[outa]',
      '-map',
      '[outa]',
      '-t',
      totalSec.toFixed(4),
      '-ar',
      '48000',
      '-ac',
      '2',
      masterWav,
    ],
    { stdio: 'inherit' },
  );

  execFileSync(
    ffmpeg,
    ['-hide_banner', '-loglevel', 'error', '-y', '-i', masterWav, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', masterM4a],
    { stdio: 'inherit' },
  );

  writeFileSync(VIDEO_CONFIG.paketFile, buildPaketMetadata(timeline));
  console.log(`Timeline ready: ${scenes.length} scenes | ${totalSec.toFixed(2)}s | ${totalFrames} frames @ ${FPS}fps`);
  return timeline;
}

if (process.argv.includes('--audio') || import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--audio')) {
    buildAudioAndTimeline();
  } else if (process.argv.includes('--paket')) {
    mkdirSync(join(ROOT, 'out'), { recursive: true });
    writeFileSync(VIDEO_CONFIG.paketFile, PAKET_METADATA);
    console.log(`Wrote ${VIDEO_CONFIG.paketFile}`);
  }
}
