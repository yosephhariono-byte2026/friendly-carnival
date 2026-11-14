---
date: 2026-11-14
source: raw/2026-11-14-lydia-hallie-rethinking-claude-code-best-practices.md
confidence: seen
---

# Satu sesi orkestrator mengatur sesi-sesi lain

Arah ke depan menurut Lydia Hallie (tim Claude Code, Anthropic, November 2026): Anda hanya bicara dengan satu sesi utama yang memecah pekerjaan, memulai sesi lain untuk tiap tugas, dan mengembalikan pekerjaan yang belum benar-benar selesai. Sudah ada di Claude Code projects (beta). Sesi utama butuh model yang pandai memutuskan dan menilai (Fable), sesi pekerja butuh model yang pandai mengerjakan (Opus 5.5). Di setup ini konteks diatur otomatis, jadi tidak perlu lagi memikirkan /compact atau /clear (berbeda dengan saran di sumber-sumber sebelumnya, yang ditujukan untuk sesi biasa).

> "So instead of talking to eight sessions, you're just talking to one."

Links: [[dari-mengawasi-tiap-langkah-menjadi-manajer-sesi]], [[model-pintar-merencanakan-model-murah-mengerjakan]], [[clear-saat-pindah-ke-tugas-yang-tidak-berkaitan]]
