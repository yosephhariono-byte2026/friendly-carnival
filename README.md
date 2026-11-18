# Penjaga Nusantara

Game arcade tembak-menembak orisinal bertema Nusantara, digambar seperti wayang kulit di atas kelir.
Terbangkan Garuda, panah bala Buto, Leak, dan Kalong, lalu jaga tujuh pulau dari Sumatra sampai Papua.

## Main

Buka `index.html` di browser. Tidak perlu instalasi.

- Gerak: panah kiri/kanan atau A/D
- Memanah: Spasi
- Jeda: P, suara: M
- Layar sentuh: geser jari di kelir, atau pakai tombol di bawah

## Pusaka

- Keris: panah menembus barisan musuh
- Gong: musuh terpaku beberapa detik
- Payung: menahan satu serangan
- Kendi: tambah satu nyawa

## Mengubah game

Sumbernya ada di `src/game.html`. Jalankan `./build.sh` untuk membuat ulang `index.html`.

## Game lain: Lintas Nusa

Game balap arcade retro orisinal di `lintas-nusa/index.html`. Melaju dari Pantai Fajar, pilih jalur di tiap
persimpangan, dan capai salah satu dari tiga tujuan akhir: Danau Senja, Kota Malam, atau Kawah Bintang.

- Setir, gas, rem: panah atau WASD
- Turbo: Spasi (terisi saat menyalip mepet)
- Jeda: P, suara: M
- Layar sentuh: tombol di bawah layar, gas otomatis

## Second brain (otak kedua)

Repo ini juga menyimpan catatan pribadi dari video dan bacaan. Sumber asli disimpan utuh di `raw/`,
lalu dipecah jadi catatan satu ide di `notes/`, disambungkan, dicek ke sumbernya, dan diuji dengan
menjawab pertanyaan dari catatan saja.

1. Kirim link atau teks ke Claude, atau tulis sumber dan pertanyaan di `inputs.md`.
2. Aturan kerjanya ada di `CLAUDE.md` (bagian second brain).
3. Baca `today.md` untuk ringkasan terbaru; `gaps.md` berisi yang belum bisa dijawab; mulai dari `index.md`.

Cek catatan dengan `python3 tools/check.py`.

Alur kerja berdasarkan prompt dari slash1s, dibangun di atas cara menyimpan catatan markdown yang pernah
dijelaskan Andrej Karpathy secara publik. Tidak ditulis atau didukung oleh Andrej Karpathy.
