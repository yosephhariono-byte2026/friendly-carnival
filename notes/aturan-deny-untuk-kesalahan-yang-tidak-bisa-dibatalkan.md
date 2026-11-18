---
date: 2026-11-14
source: raw/2026-11-14-lydia-hallie-rethinking-claude-code-best-practices.md
confidence: seen
---

# Aturan deny untuk kesalahan yang tidak bisa dibatalkan

Cara menentukan apa yang perlu jadi aturan, menurut Lydia Hallie (tim Claude Code, Anthropic, November 2026): kalau Claude salah sekali, bisakah saya membatalkannya? Kode yang salah bisa dikembalikan, jadi serahkan ke model. Membuang perubahan yang belum disimpan, atau membaca kunci rahasia sampai masuk ke percakapan, tidak bisa dibatalkan, jadi buat aturan deny. Contoh: mode auto mengizinkan membaca .env secara bawaan; kalau tidak mau, tambahkan deny.

> "if Cloud gets this wrong once, can I take it back?"

Links: [[lindungi-file-rahasia-dengan-izin-deny]], [[izin-allow-ask-deny]], [[mode-auto-lebih-jeli-dari-manusia-tapi-tidak-sempurna]]
