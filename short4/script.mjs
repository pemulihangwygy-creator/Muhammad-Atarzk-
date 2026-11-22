#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = process.cwd();
export const SHORT4_DIR = join(ROOT, 'short4');
export const WIDTH = 1440;
export const HEIGHT = 2560;
export const FPS = 90;
export const SAMPLE_RATE = 48000;

export const VIDEO_CONFIG = {
  title: "3.000 Pasukan Lawan 200.000 Romawi! Taktik Mustahil Khalid bin Walid di Perang Mu'tah",
  channelHandle: 'MUHAMMAD ATARZK',
  categoryLabel: "SIRAH NABAWIYAH · STRATEGI MU'TAH",
  outputVideo: join(ROOT, 'out', 'Taktik_Mustahil_Khalid_Perang_Mutah_2K_90fps.mp4'),
  paketFile: join(ROOT, 'out', 'Paket_Metadata_Khalid_Perang_Mutah.txt'),
  timelineFile: join(ROOT, '.tmp', 'short4_timeline.json'),
  masterAudioFile: join(ROOT, '.tmp', 'short4_master_audio.m4a'),
};

export const SCENES_DATA = [
  {
    id: 'k01',
    module: './k1.mjs',
    chapter: '01 — 1 : 66',
    headline: "3.000 VS 200.000 DI DATARAN MU'TAH",
    voFile: 'short4/audio/vo_01.mp3',
    voText:
      'Bayangkan tiga ribu pasukan harus menghadapi dua ratus ribu tentara Romawi. Secara hitungan militer, itu mustahil. Tapi Khalid bin Walid membalikkan takdir di Perang Mutah.',
    captionText:
      "Bayangkan tiga ribu pasukan harus menghadapi dua ratus ribu tentara Romawi. Secara hitungan militer, itu mustahil. Tapi Khalid bin Walid membalikkan takdir di Perang Mu'tah.",
  },
  {
    id: 'k02',
    module: './k2.mjs',
    chapter: '02 — PEMICU',
    headline: '8 HIJRIAH · EKSPEDISI KE SYAM',
    voFile: 'short4/audio/vo_02.mp3',
    voText:
      'Tahun delapan Hijriah, utusan Nabi Muhammad shalallahu alaihi wa salam dibunuh di wilayah Syam. Pasukan Islam pun berangkat menuju dataran Mutah demi menegakkan keadilan.',
    captionText:
      "Tahun delapan Hijriah, utusan Nabi Muhammad shallallahu alaihi wa sallam dibunuh di wilayah Syam. Pasukan Islam pun berangkat menuju dataran Mu'tah demi menegakkan keadilan.",
  },
  {
    id: 'k03',
    module: './k3.mjs',
    chapter: '03 — PANGLIMA',
    headline: 'TIGA PANGLIMA SYUHADA PENJAGA PANJI',
    voFile: 'short4/audio/vo_03.mp3',
    voText:
      'Rasulullah menunjuk tiga panglima berurutan. Zaid bin Haritsah gugur. Lalu Jafar bin Abi Thalib memeluk panji hingga syahid. Terakhir, Abdullah bin Rawahah menyusul syahid.',
    captionText:
      "Rasulullah menunjuk tiga panglima berurutan. Zaid bin Haritsah gugur. Lalu Ja'far bin Abi Thalib memeluk panji hingga syahid. Terakhir, Abdullah bin Rawahah menyusul syahid.",
  },
  {
    id: 'k04',
    module: './k4.mjs',
    chapter: '04 — 9 PEDANG',
    headline: 'SEMBILAN PEDANG PATAH DI TANGAN KHALID',
    voFile: 'short4/audio/vo_04.mp3',
    voText:
      'Panji lalu diserahkan kepada Khalid bin Walid. Riwayat Al-Bukhari mencatat, Khalid bertempur begitu dahsyat sampai sembilan bilah pedang patah di tangannya!',
  },
  {
    id: 'k05',
    module: './k5.mjs',
    chapter: '05 — DILEMA',
    headline: 'KEPUNGAN MALAM & STRATEGI PSIKOLOGIS',
    voFile: 'short4/audio/vo_05.mp3',
    voText:
      'Malam pun tiba. Jika terus bertempur terbuka keesokan harinya, tiga ribu sahabat terancam habis terkepung. Khalid tidak mencari menang nekat, ia menyusun jebakan psikologis.',
  },
  {
    id: 'k06',
    module: './k6.mjs',
    chapter: '06 — FORMASI',
    headline: 'ROMBAK TOTAL SAYAP & BARISAN DEPAN',
    voFile: 'short4/audio/vo_06.mp3',
    voText:
      'Menjelang fajar, Khalid merombak total formasi. Sayap kanan ditukar ke kiri, barisan depan dipindah ke belakang, agar musuh melihat wajah dan panji yang serba baru.',
  },
  {
    id: 'k07',
    module: './k7.mjs',
    chapter: '07 — ILUSI DEBU',
    headline: 'KEPULAN DEBU & GEMA TAKBIR BALA BANTUAN',
    voFile: 'short4/audio/vo_07.mp3',
    voText:
      'Ia juga mengirim pasukan berkuda berputar di balik bukit, mengepulkan debu tebal dan menggemakan takbir. Jenderal Romawi panik, mengira bala bantuan besar baru tiba!',
  },
  {
    id: 'k08',
    module: './k8.mjs',
    chapter: '08 — MUNDUR RAPI',
    headline: 'INSHIHAB MUNAZZHAM · MUNDUR TERKENDALI',
    voFile: 'short4/audio/vo_08.mp3',
    voText:
      'Saat Romawi ragu, Khalid menyerang lebih dulu, lalu menarik mundur pasukan secara rapi. Musuh tak berani mengejar karena takut masuk perangkap di padang pasir.',
  },
  {
    id: 'k09',
    module: './k9.mjs',
    chapter: '09 — SAIFULLAH',
    headline: 'SAIFULLAH AL-MASLUL · PEDANG ALLAH',
    voFile: 'short4/audio/vo_09.mp3',
    voText:
      'Pasukan Muslim selamat, hanya dua belas sahabat yang gugur. Dari Madinah, Nabi menggelari Khalid Saifullah Al-Maslul, Pedang Allah yang Terhunus. Tulis pendapatmu dan bagikan!',
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
3.000 Pasukan Lawan 200.000 Romawi! Taktik Mustahil Khalid bin Walid di Perang Mu'tah

2. ALTERNATIF JUDUL VIRAL
- 9 Pedang Patah di Tangannya! Bagaimana Khalid Menyelamatkan 3.000 Pasukan? #sirah #islam
- Perang Mu'tah 8 H: Ketika Taktik Psikologis Menghentikan 200.000 Tentara Bizantium

3. DESKRIPSI YOUTUBE
Bagaimana mungkin 3.000 pasukan Muslim bertahan menghadapi 200.000 tentara gabungan Romawi Bizantium dan sekutunya di dataran Mu'tah (8 H / 629 M)?

Video ini membedah secara visual meja taktik Perang Mu'tah — mulai dari gugurnya 3 panglima yang ditunjuk Rasulullah SAW (Zaid bin Haritsah, Ja'far bin Abi Thalib, Abdullah bin Rawahah), rekor pertempuran Khalid bin Walid mematahkan 9 bilah pedang (Shahih Al-Bukhari 4266), hingga 3 manuver kecerdasan militer Khalid:
1) Perombakan formasi fajar (sayap kanan ↔ kiri, depan ↔ belakang) untuk efek psikologis "pasukan baru".
2) Kepulan debu kavaleri di balik bukit & gema takbir sebagai ilusi bala bantuan dari Madinah.
3) Serangan kejutan pembuka disusul penarikan mundur terkendali (Inshihab Munazzham) sehingga musuh gentar mengira itu jebakan gurun.

Hanya 12 sahabat yang gugur syahid, dan dari Madinah Rasulullah SAW menganugerahkan gelar abadi kepada Khalid bin Walid RA: Saifullah Al-Maslul (Pedang Allah yang Terhunus).

⏱️ Pembahasan per Bagian:
${chapterLines}

📚 Referensi Sejarah & Hadits Shahih:
- Shahih Al-Bukhari no. 4262 & 4266 (Kabar wahyu Perang Mu'tah, gelar Saifullah, dan 9 pedang patah di tangan Khalid bin Walid RA)
- Sirah Nabawiyah Ibnu Hisyam & Al-Bidayah wan Nihayah Ibnu Katsir (Peristiwa Perang Mu'tah tahun 8 H)
- Ar-Rahiq Al-Makhtum (Syaikh Shafiyyurrahman Al-Mubarakfuri)

💬 Bagian taktik Khalid bin Walid mana yang paling bikin takjub? Tulis di komentar & bagikan ke temanmu!

#KhalidBinWalid #PerangMutah #SirahNabawiyah #SejarahIslam #Saifullah #FaktaIslam #KisahSahabat #StrategiPerang #Shorts #DakwahVisual

4. TAGS / KATA KUNCI YOUTUBE
khalid bin walid, perang mutah, taktik perang khalid bin walid, 3000 lawan 200000 romawi, saifullah al maslul, sirah nabawiyah, sejarah islam, kisah sahabat nabi, zaid bin haritsah, jafar bin abi thalib, abdullah bin rawahah, hadits bukhari khalid 9 pedang

5. TEKS PIN KOMENTAR
Strategi bukan sekadar menang nekat — tapi menyelamatkan nyawa umat dan menjaga kehormatan Islam. Bagian mana dari taktik Khalid di Mu'tah yang paling berkesan buatmu? Tulis di bawah 👇

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

function tokenizeWordsTimed(displayText, spokenText, durationSec) {
  const dispTokens = displayText.trim().split(/\s+/);
  const spkTokens = spokenText.trim().split(/\s+/);
  const weights = dispTokens.map((w, idx) => {
    const sw = spkTokens[idx] || w;
    let wt = Math.max(2, sw.replace(/[^a-zA-Z0-9]/g, '').length);
    if (/[,;]$/.test(w)) wt += 2.2;
    if (/[.?!:]$/.test(w)) wt += 3.2;
    return wt;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const padStart = 0.05;
  const usable = Math.max(0.5, durationSec - 0.16);
  let cursor = padStart;
  return dispTokens.map((word, idx) => {
    const seg = (weights[idx] / totalWeight) * usable;
    const item = { word, start: cursor, end: cursor + seg };
    cursor += seg;
    return item;
  });
}

export function buildAudioAndTimeline() {
  const ffmpeg = findFfmpeg();
  const tmpDir = join(ROOT, '.tmp', 'short4');
  mkdirSync(tmpDir, { recursive: true });
  mkdirSync(join(ROOT, 'out'), { recursive: true });

  const normalizedClips = [];
  const sceneTimings = [];
  let cursorSec = 0;
  const gapSec = 0.22;

  for (let i = 0; i < SCENES_DATA.length; i++) {
    const sc = SCENES_DATA[i];
    const absVo = join(ROOT, sc.voFile);
    if (!existsSync(absVo)) {
      throw new Error(`Missing VO audio: ${absVo}`);
    }
    const rawDur = probeDurationSec(ffmpeg, absVo);
    const clipPad = i === SCENES_DATA.length - 1 ? 0.50 : gapSec;
    const totalSceneSec = rawDur + clipPad;

    const normFlac = join(tmpDir, `norm_${sc.id}.flac`);
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
        'flac',
        normFlac,
      ],
      { stdio: 'ignore' },
    );
    normalizedClips.push(normFlac);

    const exactDur = probeDurationSec(ffmpeg, normFlac);
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
      words: tokenizeWordsTimed(sc.captionText || sc.voText, sc.voText, rawDur),
    });

    cursorSec = endSec;
  }

  const concatList = join(tmpDir, 'concat.txt');
  writeFileSync(concatList, normalizedClips.map((p) => `file '${p}'`).join('\n'));

  const masterFlac = join(tmpDir, 'master_vo.flac');
  execFileSync(
    ffmpeg,
    ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c:a', 'flac', masterFlac],
    { stdio: 'ignore' },
  );

  const totalDurationSec = sceneTimings[sceneTimings.length - 1].endSec;
  const totalFrames = sceneTimings[sceneTimings.length - 1].endFrame;

  execFileSync(
    ffmpeg,
    [
      '-y',
      '-i',
      masterFlac,
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
