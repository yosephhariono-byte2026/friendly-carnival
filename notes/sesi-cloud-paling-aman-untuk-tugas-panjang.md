---
date: 2026-11-14
source: raw/2026-11-14-lydia-hallie-rethinking-claude-code-best-practices.md
confidence: seen
---

# Sesi cloud paling aman untuk tugas panjang

Sandbox hanya melindungi perintah shell; file Claude, server MCP, dan hook tetap berjalan di komputer Anda. Menurut Lydia Hallie (tim Claude Code, Anthropic, November 2026), lebih aman lagi menjalankan Claude di sesi cloud: mesinnya sendiri dengan salinan repo yang bersih, jadi .env, kunci SSH, dan token tidak ada di sana. Kunci API diberikan sebagai network secret tanpa pernah dikirim ke model, dan akses internet dibatasi. Tetap ingat: mesinnya sekali pakai, tapi yang keluar darinya (commit, pesan) tidak. (Catatan saya: vault ini sendiri berjalan di sesi seperti itu.)

> "this machine is disposable, but the things that leave it aren't."

Links: [[izin-tidak-membatasi-efek-samping-sandbox-yang-membatasi]], [[jangan-tempel-rahasia-ke-claude]]
