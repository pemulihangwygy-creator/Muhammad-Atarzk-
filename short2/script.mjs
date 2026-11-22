#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = process.cwd();
export const SHORT2_DIR = join(ROOT, 'short2');
export const WIDTH = 1440;
export const HEIGHT = 2560;
export const FPS = 90;
export const SAMPLE_RATE = 48000;

export const VIDEO_CONFIG = {
  title: 'Kenapa Suaramu Terdengar Aneh di Rekaman? (Fakta Sains & Psikologi)',
  channelHandle: '@MuhammadAtarzk',
  categoryLabel: 'SAINS TUBUH · AKUSTIK & PSIKOLOGI',
  outputVideo: join(ROOT, 'out', 'Kenapa_Suaramu_Terdengar_Aneh_di_Rekaman_2K_90fps.mp4'),
  paketFile: join(ROOT, 'out', 'Paket_Metadata_Suara_Rekaman.txt'),
  timelineFile: join(ROOT, '.tmp', 'short2_timeline.json'),
  masterAudioFile: join(ROOT, '.tmp', 'short2_master_audio.m4a'),
};

export const SCENES_DATA = [
  {
    id: 's01',
    module: './s1.mjs',
    chapter: 'PEMBUKA',
    badge: 'MISTERI SEHARI-HARI',
    headline: 'SUARAMU DI KEPALAMU SEBENARNYA TIDAK ADA',
    highlightWords: ['TIDAK ADA'],
    factPill: 'Voice Note WhatsApp vs Persepsi Otak',
    source: 'Akustik Pendengaran Manusia · Persepsi Suara Diri',
    voFile: 'short2/audio/vo_01.mp3',
    voText:
      'Pernah dengar suaramu sendiri di voice note WhatsApp lalu merasa aneh dan canggung? Fakta mengejutkannya: suara yang kamu dengar di kepalamu selama ini sebenarnya tidak pernah ada di luar tengkorakmu.',
    transition: 'iris_cyan',
  },
  {
    id: 's02',
    module: './s2.mjs',
    chapter: 'FAKTA 01',
    badge: 'DUA JALUR SUARA',
    headline: 'SUARA MASUK LEWAT DUA JALUR SEKALIGUS',
    highlightWords: ['DUA JALUR'],
    factPill: 'Konduksi Udara + Konduksi Tulang',
    source: 'Anatomi Pendengaran · Dual-Pathway Model',
    voFile: 'short2/audio/vo_02.mp3',
    voText:
      'Saat kamu berbicara, suara bergerak menuju telinga melalui dua jalur berbeda secara bersamaan: jalur udara di luar kepala, dan jalur getaran tulang di dalam tengkorakmu.',
    transition: 'wipe_gold',
  },
  {
    id: 's03',
    module: './s3.mjs',
    chapter: 'FAKTA 02',
    badge: 'JALUR PERTAMA',
    headline: 'KONDUKSI UDARA BERKECEPATAN 340 M/DETIK',
    highlightWords: ['340 M/DETIK'],
    factPill: 'Mulut → Udara → Gendang Telinga → Osikula → Koklea',
    source: 'Fisika Gelombang Suara di Udara (20°C ~ 340–343 m/s)',
    voFile: 'short2/audio/vo_03.mp3',
    voText:
      'Jalur pertama disebut konduksi udara. Gelombang suara keluar dari mulut, merambat lewat udara berkecepatan tiga ratus empat puluh meter per detik, lalu menggetarkan gendang telingamu.',
    transition: 'wipe_cyan',
  },
  {
    id: 's04',
    module: './s4.mjs',
    chapter: 'FAKTA 03',
    badge: 'JALUR KEDUA',
    headline: 'KONDUKSI TULANG MELESAT 3.000 M/DETIK',
    highlightWords: ['3.000 M/DETIK'],
    factPill: 'Pita Suara → Rahang & Tengkorak → Langsung ke Koklea',
    source: 'O’Brien & Liu (2005) · Kecepatan Bunyi di Tulang Tengkorak',
    voFile: 'short2/audio/vo_04.mp3',
    voText:
      'Jalur kedua disebut konduksi tulang. Getaran pita suara merambat langsung lewat tulang rahang dan tengkorak hingga tiga ribu meter per detik langsung ke koklea, melewati telinga luar.',
    transition: 'wipe_gold',
  },
  {
    id: 's05',
    module: './s5.mjs',
    chapter: 'FAKTA 04',
    badge: 'EFEK PENYARING BASS',
    headline: 'TENGKORAKMU BEKERJA SEPERTI SUBWOOFER',
    highlightWords: ['SUBWOOFER'],
    factPill: 'Frekuensi < 1.000 Hz Lolos Kuat · Nada Tinggi Teredam',
    source: 'Mekanika Fluida Koklea · Bone Low-Pass Filtering',
    voFile: 'short2/audio/vo_05.mp3',
    voText:
      'Masalahnya, tulang tengkorak bekerja seperti penyaring bas alami. Frekuensi rendah di bawah seribu hertz lolos sangat kuat lewat tulang, membuat suaramu terdengar lebih dalam, tebal, dan merdu di kepalamu.',
    transition: 'wipe_cyan',
  },
  {
    id: 's06',
    module: './s6.mjs',
    chapter: 'FAKTA 05',
    badge: 'KENAPA TERASA ASING',
    headline: 'MIKROFON HANYA MEREKAM JALUR UDARA',
    highlightWords: ['HANYA', 'JALUR UDARA'],
    factPill: 'Tanpa Bonus Bas Tengkorak = Lebih Tipis & Tinggi',
    source: 'Perbandingan Input Mikrofon vs Pendengaran Internal',
    voFile: 'short2/audio/vo_06.mp3',
    voText:
      'Sedangkan mikrofon ponsel hanya merekam jalur udara saja, tanpa bonus getaran bas dari tulang tengkorak. Akibatnya, hasil rekaman terdengar jauh lebih tipis, tinggi, dan terasa asing.',
    transition: 'wipe_gold',
  },
  {
    id: 's07',
    module: './s7.mjs',
    chapter: 'FAKTA 06',
    badge: 'PSIKOLOGI 1966',
    headline: 'PENELITIAN RESMI: VOICE CONFRONTATION',
    highlightWords: ['VOICE CONFRONTATION'],
    factPill: 'Philip Holzman & Clyde Rousey (1966)',
    source: 'Holzman & Rousey (1966) · Journal of Personality and Social Psychology',
    voFile: 'short2/audio/vo_07.mp3',
    voText:
      'Rasa canggung itu ternyata punya nama ilmiah. Pada tahun seribu sembilan ratus enam puluh enam, psikolog Philip Holzman dan Clyde Rousey menamainya fenomena Konfrontasi Suara.',
    transition: 'iris_cyan',
  },
  {
    id: 's08',
    module: './s8.mjs',
    chapter: 'FAKTA 07',
    badge: 'EKSPERIMEN BUTA',
    headline: 'HANYA 38% BISA MENGENALI SUARANYA SENDIRI',
    highlightWords: ['38%'],
    factPill: '62% Gagal Mengenali dalam 5 Detik · Justru Dinilai Menarik',
    source: 'Studi Persepsi Diri & Uji Pengenalan Suara (5 Detik)',
    voFile: 'short2/audio/vo_08.mp3',
    voText:
      'Dalam penelitian lanjutannya, hanya tiga puluh delapan persen orang yang mampu mengenali suara rekamannya sendiri dalam lima detik. Anehnya, orang justru menilai suaranya lebih menarik saat tidak tahu itu suaranya.',
    transition: 'wipe_gold',
  },
  {
    id: 's09',
    module: './s9.mjs',
    chapter: 'INSIGHT UTAMA',
    badge: 'FAKTA SEBENARNYA',
    headline: 'REKAMAN ITULAH SUARA ASLIMU DI DUNIA NYATA',
    highlightWords: ['SUARA ASLIMU'],
    factPill: 'Suara di Kepala Hanya Terdengar Olehmu Sendiri',
    source: 'Kesimpulan Akustik & Neurosains Persepsi Diri',
    voFile: 'short2/audio/vo_09.mp3',
    voText:
      'Jadi, rekaman yang terasa canggung itu bukanlah suara yang rusak. Justru versi itulah suara aslimu yang selama ini selalu didengar oleh semua orang di sekitarmu.',
    transition: 'wipe_cyan',
  },
  {
    id: 's10',
    module: './s10.mjs',
    chapter: 'PENUTUP',
    badge: 'REFLEKSI',
    headline: 'PERNAH KAGET DENGAR SUARAMU SENDIRI?',
    highlightWords: ['KAGET', 'SUARAMU'],
    factPill: 'Tulis Pengalamanmu di Kolom Komentar',
    source: 'Sains Tubuh & Psikologi · @MuhammadAtarzk',
    voFile: 'short2/audio/vo_10.mp3',
    voText:
      'Sekarang kamu tahu alasannya. Pernah kaget atau malu saat mendengar rekaman suara sendiri? Tulis pengalamanmu di kolom komentar!',
    transition: 'none',
  },
];

function formatTimestamp(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function buildPaketMetadata(timeline) {
  const chapterLines = timeline.scenes
    .map((sc) => `${formatTimestamp(sc.startSec)} ${sc.chapter} — ${sc.headline}`)
    .join('\n');

  return `====================================================================
PAKET METADATA YOUTUBE SHORTS (SIAP SALIN-TEMPEL)
====================================================================

1. JUDUL UTAMA (PILIHAN REKOMENDASI #1 - HIGH CTR)
Kenapa Suaramu Terdengar Aneh di Rekaman? (Ternyata Ini Suara Aslimu!)

2. ALTERNATIF JUDUL VIRAL
- Suaramu di Kepalamu Sebenarnya TIDAK PERNAH ADA! #sains #fakta
- Kenapa Kita Selalu Malu Dengar Voice Note Sendiri? (Sains & Psikologi)

3. DESKRIPSI YOUTUBE
Pernah kirim voice note di WhatsApp, lalu saat diputar ulang kamu langsung merasa aneh, tipis, dan canggung?

Ternyata suara yang selama ini kamu dengar di kepalamu TIDAK PERNAH ADA di luar tengkorakmu! Penjelasan lengkap sains di balik "Voice Confrontation":
• Dua jalur suara (Konduksi Udara 340 m/s vs Konduksi Tulang 3.000 m/s)
• Mengapa tengkorak bekerja seperti penyaring bas (< 1.000 Hz)
• Kenapa mikrofon hanya menangkap versi udara
• Eksperimen psikologi 1966 (Philip Holzman & Clyde Rousey) & fakta 38%

⏱️ Pembahasan per Bagian:
${chapterLines}

📚 Referensi Ilmiah:
- Philip Holzman & Clyde Rousey (1966), "The Voice as a Percept", Journal of Personality and Social Psychology
- O'Brien & Liu (2005), Kecepatan Rambat Bunyi pada Tulang Tengkorak
- Fisika Akustik Konduksi Udara vs Konduksi Tulang

💬 Tulis di komentar: pernah kaget atau malu saat mendengar rekaman suaramu sendiri?

#Sains #FaktaUnik #Psikologi #KenapaSuaraAnehDiRekaman #BoneConduction #VoiceConfrontation #Edukasi #Shorts #SainsTubuh #WawasanBaru

4. TAGS / KATA KUNCI YOUTUBE
kenapa suara aneh di rekaman, suara asli di rekaman, kenapa malu dengar voice note sendiri, konduksi tulang, bone conduction, voice confrontation, fakta sains tubuh manusia, kenapa suara di kepala lebih bagus, psikologi manusia, fakta unik sains, edukasi shorts indonesia, sains populer

5. TEKS PIN KOMENTAR
Fakta menarik: dalam uji buta, orang justru menilai suara rekamannya LEBIH MENARIK saat tidak sadar itu suara mereka sendiri! Pernah kaget dengar voice note sendiri? Tulis di bawah 👇

====================================================================
CATATAN TEKNIS RENDER:
- Resolusi: ${WIDTH}x${HEIGHT} (2K Portrait 9:16) | FPS: ${FPS} fps
- Total Durasi: ${timeline.totalDurationSec.toFixed(2)} detik (${timeline.totalFrames} frame)
====================================================================
`;
}

export function findFfmpeg() {
  const candidates = [
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2',
    'ffmpeg',
  ];
  for (const c of candidates) {
    try {
      if (c === 'ffmpeg' || existsSync(c)) {
        execFileSync(c, ['-version'], { stdio: 'ignore' });
        return c;
      }
    } catch {
      // try next
    }
  }
  throw new Error('FFmpeg binary not found.');
}

function probeDurationSec(ffmpeg, filePath) {
  const res = spawnSync(ffmpeg, ['-hide_banner', '-i', filePath, '-f', 'null', '-'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const txt = `${res.stdout || ''}\n${res.stderr || ''}`;
  const m = txt.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) throw new Error(`Cannot parse duration for ${filePath}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

function tokenizeWordsTimed(voText, durationSec) {
  const cleanTokens = voText.trim().split(/\s+/);
  const weights = cleanTokens.map((w) => {
    let wt = Math.max(2, w.replace(/[^a-zA-Z0-9]/g, '').length);
    if (/[,.?!:;]$/.test(w)) wt += 2.6;
    return wt;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const padStart = 0.04;
  const usable = Math.max(0.5, durationSec - 0.14);
  let cursor = padStart;
  return cleanTokens.map((word, idx) => {
    const seg = (weights[idx] / totalWeight) * usable;
    const item = { word, start: cursor, end: cursor + seg };
    cursor += seg;
    return item;
  });
}

export function buildAudioAndTimeline() {
  const ffmpeg = findFfmpeg();
  const tmpDir = join(ROOT, '.tmp', 'short2');
  mkdirSync(tmpDir, { recursive: true });
  mkdirSync(join(ROOT, 'out'), { recursive: true });

  const normalizedClips = [];
  const sceneTimings = [];
  let cursorSec = 0;
  const gapSec = 0.24;

  for (let i = 0; i < SCENES_DATA.length; i++) {
    const sc = SCENES_DATA[i];
    const absVo = join(ROOT, sc.voFile);
    if (!existsSync(absVo)) {
      throw new Error(`Missing VO audio: ${absVo}`);
    }
    const rawDur = probeDurationSec(ffmpeg, absVo);
    const clipPad = i === SCENES_DATA.length - 1 ? 0.55 : gapSec;
    const totalSceneSec = rawDur + clipPad;

    const normWav = join(tmpDir, `norm_${sc.id}.wav`);
    execFileSync(
      ffmpeg,
      [
        '-y',
        '-i',
        absVo,
        '-af',
        `loudnorm=I=-14:TP=-1.5:LRA=9,apad=pad_dur=${clipPad.toFixed(3)}`,
        '-t',
        totalSceneSec.toFixed(4),
        '-ar',
        String(SAMPLE_RATE),
        '-ac',
        '2',
        '-c:a',
        'pcm_s16le',
        normWav,
      ],
      { stdio: 'ignore' },
    );
    normalizedClips.push(normWav);

    const exactDur = probeDurationSec(ffmpeg, normWav);
    const startSec = cursorSec;
    const endSec = startSec + exactDur;
    const startFrame = Math.round(startSec * FPS);
    const endFrame = Math.round(endSec * FPS);

    sceneTimings.push({
      ...sc,
      voDurationSec: rawDur,
      durationSec: exactDur,
      startSec,
      endSec,
      startFrame,
      endFrame,
      durationFrames: endFrame - startFrame,
      words: tokenizeWordsTimed(sc.voText, rawDur),
    });

    cursorSec = endSec;
  }

  const concatList = join(tmpDir, 'concat.txt');
  writeFileSync(concatList, normalizedClips.map((p) => `file '${p}'`).join('\n'));

  const masterWav = join(tmpDir, 'master_vo.wav');
  execFileSync(
    ffmpeg,
    ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', masterWav],
    { stdio: 'ignore' },
  );

  const totalDurationSec = sceneTimings[sceneTimings.length - 1].endSec;
  const totalFrames = sceneTimings[sceneTimings.length - 1].endFrame;

  execFileSync(
    ffmpeg,
    [
      '-y',
      '-i',
      masterWav,
      '-af',
      'loudnorm=I=-14:TP=-1.5:LRA=9,apad=pad_dur=0.6',
      '-t',
      totalDurationSec.toFixed(4),
      '-ar',
      String(SAMPLE_RATE),
      '-ac',
      '2',
      '-c:a',
      'aac',
      '-b:a',
      '320k',
      VIDEO_CONFIG.masterAudioFile,
    ],
    { stdio: 'ignore' },
  );

  const timeline = {
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    totalDurationSec,
    totalFrames,
    scenes: sceneTimings,
  };

  writeFileSync(VIDEO_CONFIG.timelineFile, JSON.stringify(timeline, null, 2));
  writeFileSync(VIDEO_CONFIG.paketFile, buildPaketMetadata(timeline));
  console.log(`Timeline ready: ${sceneTimings.length} scenes | ${totalDurationSec.toFixed(2)}s | ${totalFrames} frames @ ${FPS}fps`);
  return timeline;
}

if (import.meta.url === `file://${process.argv[1]}` && process.argv.includes('--audio')) {
  buildAudioAndTimeline();
}
