---
date: 2026-11-13
source: raw/2026-11-13-claude-code-full-course-javascript-mastery.md
confidence: seen
---

# CLAUDE.md hanya instruksi, bukan penghalang

Menulis "jangan ubah file migrasi" di CLAUDE.md membuat Claude seharusnya menurut, tetapi secara teknis Claude tetap bisa menyentuh file itu. Untuk hal yang benar-benar tidak boleh terjadi, pakai izin (permissions), sandbox, atau hook. Sejak versi terbaru, Claude Code juga membaca AGENTS.md kalau tidak ada CLAUDE.md.

> "It doesn't technically block Claude from doing something."

Links: [[claude-md-adalah-memori-permanen-proyek]], [[lindungi-file-rahasia-dengan-izin-deny]]
