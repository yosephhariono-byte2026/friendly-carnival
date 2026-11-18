---
date: 2026-11-14
source: raw/2026-11-14-lydia-hallie-rethinking-claude-code-best-practices.md
confidence: seen
---

# CI mengecek semua sesi dengan cara yang sama

Saat banyak sesi berjalan, menurut Lydia Hallie (tim Claude Code, Anthropic, November 2026) yang terpenting adalah CI (pengecekan otomatis di GitHub): setiap sesi akhirnya membuat PR, dan CI menjalankan cek yang sama untuk semuanya, apa pun yang diputuskan Claude di jalan. Dengan CI auto-fix, Claude melihat cek yang gagal dan memperbaikinya sendiri. Untuk perubahan berisiko rendah bisa dipakai "merge when ready".

> "your CI runs the same checks on every one of them"

Links: [[hook-untuk-pengecekan-yang-wajib-jalan]], [[review-manusia-sesuai-tingkat-risiko]]
