---
name: ringkasan-mingguan
description: Tulis ringkasan mingguan otak kedua (second brain) satu halaman dari catatan 7 hari terakhir, setiap baris menyebut catatan asalnya, simpan di weekly/. Pakai saat pengguna minta "ringkasan mingguan", "rangkum minggu ini", atau saat dijalankan terjadwal.
---

# Ringkasan mingguan otak kedua

Pengguna berbahasa Indonesia, bukan programmer. Tulis dalam bahasa Indonesia sederhana, tanpa em dash.

Aturan utama: **hanya dari catatan, tidak menebak, dan tidak mengirim apa pun.**
Hasilnya ditulis ke file di repo ini. Jangan kirim email, pesan, atau apa pun ke luar repo.

## Langkah

1. Pastikan berangkat dari versi terbaru: `git fetch origin main` lalu bekerja di atas `origin/main`.
2. Daftar bahan: `python3 tools/weekly.py list 7`. Ini menampilkan sumber baru di `raw/` dan catatan
   di `notes/` yang bertanggal 7 hari terakhir. Hanya catatan di daftar ini yang boleh diringkas.
3. Baca catatan-catatan itu, plus `gaps.md` dan `today.md`.
4. Tulis `weekly/<tahun>-W<minggu>.md` (minggu ISO, misalnya `weekly/2026-W47.md`). Maksimal satu
   halaman, sekitar 40 baris. Susunannya:
   - `# Ringkasan mingguan <tahun>-W<minggu>` dan rentang tanggalnya.
   - **Yang masuk minggu ini**: jumlah sumber dan catatan baru, judul sumbernya.
   - **Ide utama minggu ini**: 8 sampai 15 poin, dikelompokkan per tema. Pilih yang paling berguna
     untuk pengguna, bukan semuanya.
   - **Saling sepakat atau berbeda**: poin yang didukung beberapa sumber, atau sumber yang berbeda pendapat.
   - **Yang perlu dicek**: celah atau klaim yang belum terverifikasi dari `gaps.md`.
   - **3 catatan paling layak dibaca ulang**.
5. **Setiap poin (baris yang diawali `-` atau angka) wajib menyebut path catatan asalnya**, misalnya
   `(notes/minta-angkanya-ditunjukkan.md)`. Jangan menambah fakta yang tidak ada di catatan.
   Kalau perlu pendapat sendiri, tulis "(pendapat Claude)" dan tetap sebut catatan yang memicunya.
6. Cek: `python3 tools/weekly.py check weekly/<file>.md` harus `0 problems`, dan
   `python3 tools/check.py` harus `0 problems`. Perbaiki sampai lolos.
7. Kalau tidak ada catatan baru dalam 7 hari, tetap tulis file pendek: "Tidak ada catatan baru minggu
   ini", lalu daftar 3 catatan lama yang layak dibaca ulang (tetap dengan path).
8. Commit, push ke branch kerja, dan buka pull request ke `main` di repo ini berjudul
   "Ringkasan mingguan <tahun>-W<minggu>", supaya pengguna bisa membacanya di GitHub dan menggabungkannya.
   Itu satu-satunya "pengiriman" yang boleh.
9. Jawab pengguna (atau tutup sesi terjadwal) dengan: link pull request, dan 3 poin terpenting.
