---
date: 2026-11-13
source: raw/2026-11-13-claude-code-1000-hours-coding-sloth.md
confidence: seen
---

# Subagent punya konteks sendiri, tapi boros

Subagent adalah Claude kecil yang dijalankan Claude utama untuk satu tugas (peneliti, peninjau, pencari bug). Masing-masing punya jendela konteks sendiri dan melapor ringkasan saat selesai. Cara termudah membuatnya: minta Claude. Tapi tiap subagent adalah percakapan penuh, jadi di paket $20 bisa menghabiskan batas sebelum tugas selesai. Nilai: A, atau S kalau token tidak terbatas.

> "each sub agent gets its own context window"

Links: [[satu-tugas-satu-sesi-baru]], [[pemakaian-dihitung-dari-token-bukan-jumlah-pesan]], [[worktree-untuk-kerja-paralel]]
