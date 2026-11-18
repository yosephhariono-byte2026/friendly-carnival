---
date: 2026-11-14
source: raw/2026-11-14-lydia-hallie-rethinking-claude-code-best-practices.md
confidence: seen
---

# Hook untuk pengecekan yang wajib jalan

Prompt tidak menjamin model melakukan pengecekan. Untuk yang wajib, Lydia Hallie (tim Claude Code, Anthropic, November 2026) memakai hook: skrip yang dijalankan Claude Code pada titik tertentu. Contoh: jalankan linter setiap file diedit, tes bagian yang diubah setiap tugas ditandai selesai, dan semua tes saat sesi mau selesai. Detail penting: skrip harus keluar dengan kode 2 saat gagal; kode 1 membuat tugas tetap dianggap selesai.

> "make sure that your scripts exit with a two exit code because that's what actually sends Cloud back to fix it."

Links: [[pasang-titik-cek-di-sepanjang-jalan]], [[larangan-di-prompt-bukan-pagar-cabut-alatnya]]
