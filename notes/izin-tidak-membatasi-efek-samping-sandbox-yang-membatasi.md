---
date: 2026-11-14
source: raw/2026-11-14-lydia-hallie-rethinking-claude-code-best-practices.md
confidence: seen
---

# Izin tidak membatasi efek samping; sandbox yang membatasi

Contoh dari Lydia Hallie (tim Claude Code, Anthropic, November 2026): `npm test` itu perintah wajar, tapi saat berjalan ia menjalankan kode yang tidak Anda tulis (dependensi). Kalau salah satunya disusupi, ia bisa membaca .env atau kunci SSH dan mengirimnya keluar; manusia pun akan menyetujui perintah itu. Izin hanya menentukan perintah boleh jalan atau tidak. Sandbox membuat sistem operasi membatasi file, folder, dan alamat internet yang bisa dijangkau, termasuk proses turunannya.

> "permissions only decide if a tool call runs, but they cannot limit what it can reach once it's running."

Links: [[aturan-deny-untuk-kesalahan-yang-tidak-bisa-dibatalkan]], [[sesi-cloud-paling-aman-untuk-tugas-panjang]]
