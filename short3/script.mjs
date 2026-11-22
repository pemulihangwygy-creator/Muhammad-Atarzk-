#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = process.cwd();
export const SHORT3_DIR = join(ROOT, 'short3');
export const WIDTH = 1440;
export const HEIGHT = 2560;
export const FPS = 90;
export const SAMPLE_RATE = 48000;

export const VIDEO_CONFIG = {
  title: '3 "Hadits" Populer Ini Ternyata BUKAN Sabda Nabi SAW! (Cek Sanad Ulama)',
  channelHandle: '@MuhammadAtarzk',
  categoryLabel: 'TAKHRIJ HADITS · FORENSIK SANAD ISLAM',
  outputVideo: join(ROOT, 'out', '3_Hadits_Populer_Ternyata_Bukan_Sabda_Nabi_2K_90fps.mp4'),
  paketFile: join(ROOT, 'out', 'Paket_Metadata_Cek_Hadits_Palsu.txt'),
  timelineFile: join(ROOT, '.tmp', 'short3_timeline.json'),
  masterAudioFile: join(ROOT, '.tmp', 'short3_master_audio.m4a'),
};

export const SCENES_DATA = [
  {
    id: 'i01',
    module: './i1.mjs',
    chapter: 'PEMBUKA',
    badge: 'PERINGATAN SANAD',
    headline: '3 "HADITS" POPULER INI TERNYATA PALSU',
    highlightWords: ['TERNYATA', 'PALSU'],
    factPill: 'Sering Beredar di Ceramah & Status Media Sosial',
    source: 'Ilmu Takhrij Hadits · Al-Jarh wa At-Ta’dil',
    voFile: 'short3/audio/vo_01.mp3',
    voText:
      'Hati-hati! Ada kalimat viral yang sering kita dengar di ceramah dan status media sosial, tapi ternyata bukan sabda Nabi Muhammad shallallaahu alaihi wa sallam. Apa saja tiga hadits populer yang ternyata palsu? Mari kita telusuri!',
    transition: 'seal_crimson',
  },
  {
    id: 'i02',
    module: './i2.mjs',
    chapter: 'METODOLOGI',
    badge: 'SYARAT HADITS SAH',
    headline: 'KALIMAT INDAH BUKAN BERARTI HADITS NABI',
    highlightWords: ['BUKAN', 'HADITS'],
    factPill: 'Wajib Punya Rantai Sanad Utuh hingga Rasulullah SAW',
    source: 'Ushul Hadits · Kaidah Sanad & Matan',
    voFile: 'short3/audio/vo_02.mp3',
    voText:
      'Dalam ilmu hadits, ucapan baru sah disebut sabda Nabi jika punya sanad, yaitu rantai perawi yang bersambung utuh hingga Rasulullah. Tanpa rantai sanad, kalimat seindah apa pun hanyalah kata mutiara, bukan hadits.',
    transition: 'wipe_parchment',
  },
  {
    id: 'i03',
    module: './i3.mjs',
    chapter: 'KASUS #01',
    badge: 'VONIS ULAMA HADITS',
    headline: '"TUNTUTLAH ILMU SAMPAI KE NEGERI CINA"',
    highlightWords: ['NEGERI', 'CINA'],
    factPill: 'Divonis Bathil & Maudhu’ oleh Ibnu Hibban & Ibnul Jauzi',
    source: 'Al-Maudhu’at (1/215) · Al-Maqasid al-Hasanah (hlm. 63)',
    voFile: 'short3/audio/vo_03.mp3',
    voText:
      'Pertama, ungkapan tuntutlah ilmu walau sampai ke negeri Cina. Para imam hadits seperti Ibnu Hibban, Ibnul Jauzi, hingga Syekh Al-Albani mengetok vonis bahwa riwayat ini palsu atau batil tidak ada dasarnya.',
    transition: 'wipe_gold',
  },
  {
    id: 'i04',
    module: './i4.mjs',
    chapter: 'BEDAH SANAD #01',
    badge: 'TITIK PATAH RANTAI',
    headline: 'RANTAI SANAD PUTUS DI ABU ‘ATIKAH',
    highlightWords: ['PUTUS', 'ABU', '‘ATIKAH'],
    factPill: 'Abu ‘Atikah Tarif bin Sulaiman Ditolak Bukhari & An-Nasa’i',
    source: 'Al-Majruhin (Ibnu Hibban) · Jarh wa Ta’dil Bukhari & Abu Hatim',
    voFile: 'short3/audio/vo_04.mp3',
    voText:
      'Mengapa rantai sanadnya patah? Karena ada perawi bernama Abu Atikah Tarif bin Sulaiman. Imam Al-Bukhari, An-Nasai, dan Abu Hatim sepakat riwayatnya tertolak, sehingga rantai ke Rasulullah langsung terputus di titik ini.',
    transition: 'wipe_parchment',
  },
  {
    id: 'i05',
    module: './i5.mjs',
    chapter: 'KASUS #02',
    badge: 'VONIS MAUDHU’',
    headline: '"CINTA TANAH AIR SEBAGIAN DARI IMAN"',
    highlightWords: ['TANAH', 'AIR'],
    factPill: 'Cinta Negeri = Fitrah Manusia · Bukan Sabda Nabi SAW',
    source: 'Imam Ash-Shaghani · Ali Al-Qari (Al-Mashnu’ no. 106) · Al-Albani',
    voFile: 'short3/audio/vo_05.mp3',
    voText:
      'Kedua, ungkapan cinta tanah air sebagian dari iman, atau hubbul wathan minal iman. Imam Ash-Shaghani dan Ali Al-Qari menegaskan kalimat ini palsu tanpa asal sanad. Mencintai negeri adalah fitrah manusia, tetapi bukan sabda Nabi.',
    transition: 'wipe_gold',
  },
  {
    id: 'i06',
    module: './i6.mjs',
    chapter: 'KASUS #03',
    badge: 'TIDAK ADA SANAD',
    headline: '"PERBEDAAN UMATKU ADALAH RAHMAT"',
    highlightWords: ['PERBEDAAN', 'RAHMAT'],
    factPill: 'Perbedaan Fikih Dibahas Kitab · Kalimat Ini Bukan Hadits',
    source: 'Al-Iraqi (Takhrij Al-Ihya no. 74) · As-Silsilah Adh-Dha’ifah no. 59',
    voFile: 'short3/audio/vo_06.mp3',
    voText:
      'Ketiga, ungkapan perbedaan pendapat umatku adalah rahmat. Imam Al-Iraqi dan Syekh Al-Albani menegaskan sanadnya tidak pernah bersambung hingga Nabi. Perbedaan fikih memang dibahas para ulama dalam kitab, namun kalimat ini bukan hadits.',
    transition: 'wipe_emerald',
  },
  {
    id: 'i07',
    module: './i7.mjs',
    chapter: 'PERINGATAN KERAS',
    badge: 'HADITS MUTAWATIR',
    headline: 'ANCAMAN BERDUSTA ATAS NAMA NABI SAW',
    highlightWords: ['BERDUSTA', 'NABI'],
    factPill: 'Man Arafa Nafsahu = Petuah Yahya bin Mu’adz Ar-Razi',
    source: 'HR. Bukhari no. 110 & Muslim no. 3 · Al-Hawi lil Fatawa (2/288)',
    voFile: 'short3/audio/vo_07.mp3',
    voText:
      'Begitu pula petuah siapa mengenal dirinya maka ia mengenal Tuhannya, yang aslinya ucapan ulama Yahya bin Muadz Ar-Razi. Ingat sabda Nabi dalam Riwayat Bukhari dan Muslim: siapa sengaja berdusta atas namaku, siapkan tempat duduknya di neraka.',
    transition: 'wipe_gold',
  },
  {
    id: 'i08',
    module: './i8.mjs',
    chapter: 'PENGGANTI SHAHIH',
    badge: 'DALIL ASLI',
    headline: 'KUTIP YANG SHAHIH, TINGGALKAN YANG PALSU',
    highlightWords: ['YANG', 'SHAHIH'],
    factPill: 'HR. Ibnu Majah 224 (Ilmu Wajib) & HR. Muslim 223 (Kesucian)',
    source: 'Shahih Muslim no. 223 · Sunan Ibnu Majah no. 224 (Shahih)',
    voFile: 'short3/audio/vo_08.mp3',
    voText:
      'Lalu apa gantinya yang shahih? Alih-alih ke negeri Cina, kutip Riwayat Ibnu Majah: menuntut ilmu itu wajib bagi setiap muslim. Dan dalam Riwayat Muslim: kesucian atau bersuci itu sebagian dari iman.',
    transition: 'wipe_emerald',
  },
  {
    id: 'i09',
    module: './i9.mjs',
    chapter: 'PANDUAN PRAKTIS',
    badge: '3 ALAT VERIFIKASI',
    headline: '3 LANGKAH CEK HADITS SEBELUM SHARE',
    highlightWords: ['CEK', 'HADITS'],
    factPill: 'Periksa Sanad · Timbang Petuah vs Sabda · Rujuk Kitab Shahih',
    source: 'Adab Menyampaikan Ilmu & Menjaga Kemurnian Sunnah',
    voFile: 'short3/audio/vo_09.mp3',
    voText:
      'Agar terhindar dari hoaks hadits, biasakan tiga hal: periksa kaca pembesar sanadnya, timbang mana petuah bijak dan mana sabda Nabi, lalu rujuk kitab Shahih Bukhari dan Muslim.',
    transition: 'seal_gold',
  },
  {
    id: 'i10',
    module: './i10.mjs',
    chapter: 'PENUTUP',
    badge: 'JAGA KEMURNIAN SUNNAH',
    headline: 'MANA YANG BARU KAMU TAHU TERNYATA PALSU?',
    highlightWords: ['BARU', 'TAHU'],
    factPill: 'Tulis di Komentar & Bagikan ke Orang Terdekatmu',
    source: 'Takhrij & Edukasi Islam · @MuhammadAtarzk',
    voFile: 'short3/audio/vo_10.mp3',
    voText:
      'Mari jaga kemurnian sunnah Nabi bersama-sama. Dari tiga kalimat tadi, mana yang baru kamu tahu ternyata bukan hadits? Tulis di kolom komentar dan bagikan ke orang terdekatmu!',
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
3 "Hadits" Populer Ini Ternyata BUKAN Sabda Nabi SAW! (Cek Sanad Ulama)

2. ALTERNATIF JUDUL VIRAL
- Hati-Hati! 3 Kalimat Viral Ini Sering Dikira Hadits, Padahal PALSU! #islam #hadits
- Bongkar Fakta Sanad: "Tuntut Ilmu ke Negeri Cina" Ternyata Bukan Hadits?

3. DESKRIPSI YOUTUBE
Sering mendengar kalimat motivasi Islami yang langsung disebut "hadits", padahal para ulama ahli hadits memvonisnya PALSU (Maudhu') atau tidak memiliki sanad?

Video ini membedah secara ilmiah berbasis kaidah Takhrij Hadits & Al-Jarh wa At-Ta'dil:
1) "Tuntutlah ilmu walau ke negeri Cina" (اُطْلُبُوا الْعِلْمَ وَلَوْ بِالصِّينِ) — Cacat pada perawi Abu 'Atikah Tarif bin Sulaiman (Ibnu Hibban, Ibnul Jauzi, Al-Albani).
2) "Cinta tanah air sebagian dari iman" (حُبُّ الْوَطَنِ مِنَ الْإِيمَانِ) — Tidak memiliki asal sanad (Imam Ash-Shaghani, Ali Al-Qari, Al-Albani).
3) "Perbedaan pendapat umatku adalah rahmat" (اِخْتِلَافُ أُمَّتِي رَحْمَةٌ) — Sanad terputus/tidak ditemukan hingga Nabi SAW (Al-Iraqi, Al-'Ajluni, Al-Albani).
➕ Bonus klarifikasi ucapan Yahya bin Mu'adz Ar-Razi ("Barangsiapa mengenal dirinya...") & alternatif hadits SHAHIH (HR. Ibnu Majah 224 & HR. Muslim 223).

⏱️ Pembahasan per Bagian:
${chapterLines}

📚 Kitab & Referensi Ulama:
- Shahih Al-Bukhari no. 110 & Shahih Muslim no. 3 (Ancaman berdusta atas nama Nabi SAW)
- Shahih Muslim no. 223 ("Ath-thuhuru syathrul iman")
- Sunan Ibnu Majah no. 224 ("Thalabul 'ilmi faridhatun 'ala kulli muslim" - Shahih)
- Al-Maudhu'at (Ibnul Jauzi 1/215), Al-Majruhin (Ibnu Hibban), Al-Mashnu' (Ali Al-Qari no. 106), As-Silsilah Adh-Dha'ifah (Al-Albani no. 59, 110)

💬 Dari 3 kalimat di atas, mana yang baru kamu tahu ternyata bukan hadits shahih? Tulis di komentar & bagikan agar keluarga tidak keliru!

#HaditsPalsu #TakhrijHadits #Islam #BelajarIslam #CekSanad #Sunnah #FaktaIslam #EdukasiIslam #Shorts #DakwahIlmiah

4. TAGS / KATA KUNCI YOUTUBE
hadits palsu yang sering dianggap asli, cek hadits palsu, tuntutlah ilmu sampai ke negeri cina palsu, hubbul wathan minal iman, ikhtilafu ummati rahmah, takhrij hadits, ilmu sanad hadits, hadits maudhu populer, edukasi islam shorts, belajar hadits shahih, fakta islam, dakwah ilmiah

5. TEKS PIN KOMENTAR
Penting: tidak semua kalimat yang maknanya baik boleh disandarkan sebagai sabda Nabi SAW. Gunakan hadits shahihnya (HR. Ibnu Majah 224 & HR. Muslim 223). Mana yang baru kamu tahu? Tulis di bawah 👇

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
  const tmpDir = join(ROOT, '.tmp', 'short3');
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
