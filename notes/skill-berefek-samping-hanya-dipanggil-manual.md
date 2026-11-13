---
date: 2026-11-13
source: raw/2026-11-13-claude-code-full-course-javascript-mastery.md
confidence: seen
---

# Skill berefek samping sebaiknya hanya dipanggil manual

Untuk skill seperti deploy atau commit, Anda tidak mau Claude memutuskan sendiri "sepertinya sudah siap, saya deploy". Tambahkan baris "disable model invocation" bernilai true di header skill (ejaan persisnya perlu dicek di dokumentasi), maka hanya Anda yang bisa memanggilnya.

> "disable model invocation set to true"

Links: [[deskripsi-skill-menentukan-kapan-dipakai]], [[izin-allow-ask-deny]]
