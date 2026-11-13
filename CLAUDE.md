# Catatan kerja: tab biola

Pengguna berbahasa Indonesia. Jawab dalam bahasa Indonesia, tanpa em dash.

## Alur membuat lagu baru
1. Salin partitur dari pengguna ke `<lagu>/index.html` (format `SONG_CONFIG`, lihat komentar di `tabplayer/player.js`).
2. Video tab: `node tabplayer/render_video.js <lagu>/index.html <lagu>/<nama>_tab_biola.mp4 [tempo]`.
   Versi lambat (`_lambat.mp4`) hanya kalau diminta.
3. Partitur PDF dengan angka jari: `node tabplayer/render_sheet.js <lagu>/index.html <lagu>/<nama>_partitur_biola.pdf`.
4. Commit dan push ke branch kerja.

## Mengirim file ke pengguna
Setelah push, selalu berikan link unduhan langsung dari GitHub untuk setiap file hasil (video, PDF):

    https://github.com/yosephhariono-byte2026/friendly-carnival/raw/<branch>/<lagu>/<file>

Pengguna tidak bisa mengunduh dari kartu file di chat, dan lampiran Gmail dari sesi ini dibatasi sekitar 3 MB
(video tab jauh lebih besar). Jadi jangan coba kirim video lewat Gmail atau Drive; pakai link GitHub di atas.
