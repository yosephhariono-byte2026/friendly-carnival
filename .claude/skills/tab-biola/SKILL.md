---
name: tab-biola
description: Buat video tab biola (720p, dengan suara) dan partitur PDF berangka jari dari partitur yang dikirim pengguna, lalu kirim link unduhan GitHub. Pakai ketika pengguna mengirim partitur (PDF atau foto), judul lagu, atau link YouTube dan meminta tab biola, video tab, partitur, atau "req lagu".
---

# Tab biola: dari partitur ke video + partitur PDF

Pengguna berbahasa Indonesia. Jawab dalam bahasa Indonesia, singkat, tanpa em dash.

## 0. Bahan
- **Partitur PDF/foto**: paling akurat. Ini yang diharapkan.
- **Hanya judul atau link YouTube**: kita tidak bisa mendengar audio. Bilang terus terang, tawarkan menulis dari ingatan dan tandai bagian yang kurang yakin.
- Default: **tempo normal saja, 720p**. Versi lambat (`_lambat.mp4`) hanya kalau diminta.

## 1. Salin partitur
1. Baca halaman PDF dengan Read (`pages`). Catat: judul, komposer/penyanyi, tanda kunci, tanda birama, tempo + teks tempo (Andante, dst.), jumlah birama, sukat bagian.
2. Untuk membaca nada dengan pasti (terutama not rendah dengan garis bantu dan not 1/16), potong per baris:
   `python3 .claude/skills/tab-biola/scripts/crop_staves.py <partitur.pdf> <scratchpad>/crop`
   lalu Read `s00.png ...` (satu baris) dan `z000.png ...` (belahan diperbesar). Garis bawah paranada = E4; D4 di bawahnya; C4 di garis bantu pertama; B3 di bawahnya; A3 di garis bantu kedua; G3 di bawahnya.
3. Ingat aturan aksidental: tanda ♯/♭/♮ berlaku sampai akhir birama.
4. Bagian yang diulang (oktaf atas, chorus kedua) biasanya pola yang sama. Bandingkan, tapi tetap salin dari gambar: ritme 1/16 bisa beda (mis. `D C16 E16` vs `D16 C16 E`).

## 2. File lagu `<slug>/index.html`
Salin struktur dari lagu yang sudah ada (mis. `kokoro-no-tomo/index.html`), ganti `<title>` dan blok `SONG_CONFIG`:

```js
window.SONG_CONFIG = {
  kicker: "Castle in the Sky",          // sumber/penyanyi (baris kecil di atas judul)
  title: "Carrying You",
  subtitle: "Joe Hisaishi  ·  D mayor  ·  tab biola",
  time: "4/4", keySig: ["F#","C#"],     // flat: ["Bb", ...]
  barLen: 8, beat: 2,                   // satuan 1/8: 4/4 = 8, 3/4 = 6, 12/8 = 12; beat 2 (♩) atau 3 (♩.)
  tempo: 75, tempoText: "Andante",
  staffPx: 56,                          // opsional: lebar 1/8 di not balok video (default 46; naikkan kalau ada 1/16)
  sections: { 1:"Intro", 3:"A", 19:"B" },
  pizz: [54, 55],                       // opsional: birama pizzicato
  meters: { 26:"2/4", 27:"4/4" },       // opsional: ganti tanda birama mulai birama itu
  bars: [
    /* 1 */ "r6 B4:1 C#5:1",            // nada:durasi (satuan 1/8), r = istirahat
    /* 2 */ "D5:3 C#5:1 D5:2 F#5:2",    // 3 = ♩. , 1.5 = ♪. , 0.5 = 1/16
    /* 3 */ "D4:1 C4:0.5 E4:0.5 ~E4:4 r2", // ~ = sambung (tie) ke nada sebelumnya
    /* 4 */ "r1 A4:0.5 G#4:0.5 A4:1 E4:1 F4:4!tr", // !tr = trill, !pz = pizz. satu nada, !arco = gesek di birama pizz
  ],
};
```
- Tulis komentar `// Ditranskrip dari partitur "<judul>" (<arranger>) milik pengguna.` beserta kunci, birama, tempo.
- Jumlah durasi tiap birama harus = `barLen` (player melempar error kalau tidak).
- Angka jari dan senar dihitung otomatis di posisi I (G3 sampai B5); di atas B5 pindah ke posisi III. Tidak perlu menulis jari.

## 3. Cek di player
Screenshot beberapa detik (mis. birama dengan 1/16, not terendah, not tertinggi) dengan Playwright: buka `file://.../<slug>/index.html?video`, panggil `renderAt(detik)`, screenshot 1920x1080. Pastikan tidak ada `pageerror` dan jari/senar masuk akal.

## 4. Render
Jalankan video di latar belakang (lagu 3 menit = beberapa menit render), sambil membuat partitur:
```
node tabplayer/render_video.js <slug>/index.html <slug>/<nama>_tab_biola.mp4
node tabplayer/render_sheet.js <slug>/index.html <slug>/<nama>_partitur_biola.pdf
```
Nama file pakai garis bawah, mis. `kokoro_no_tomo_tab_biola.mp4`.

## 5. Periksa partitur PDF
`pdftoppm -r 110 -png <pdf> <scratchpad>/pg` lalu Read tiap halaman. Cek: nada sama dengan partitur asli, balok (beam) dan bendera benar, angka jari tidak menabrak not, label bagian tidak menimpa tempo. Perbaiki `tabplayer/sheet.js` kalau ada yang berantakan, dan pastikan lagu lain tetap dimuat tanpa error.

## 6. Commit, push, kirim link
1. Commit dan push ke branch kerja sesi ini.
2. Beri link unduhan langsung untuk **setiap** file hasil:
   `https://github.com/yosephhariono-byte2026/friendly-carnival/raw/<branch>/<slug>/<file>`
3. **Jangan** kirim video lewat Gmail atau Drive: batas lampiran dari sesi ini sekitar 3 MB, dan pengguna tidak bisa mengunduh dari kartu file di chat.
4. Ringkas di akhir: durasi, jumlah birama/halaman, rentang nada, catatan penting (bagian jeda, not yang mungkin meragukan, perubahan pada player).
