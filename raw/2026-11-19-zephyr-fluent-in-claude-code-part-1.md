---
date: 2026-11-19
origin: Guide "Fluent in Claude Code, Part 1" by @Zephyr_hg (footer: Zephyr HQ). Three phone screenshots sent by the user; original link not given.
url: raw/assets/2026-11-19-zephyr-fluent-claude-code-p1-1.png, raw/assets/2026-11-19-zephyr-fluent-claude-code-p1-2.png, raw/assets/2026-11-19-zephyr-fluent-claude-code-p1-3.png
transcript: Text transcribed word for word from the screenshots by Claude at intake. Tables written as "Label: text". Typography (colors, italics) not kept.
---

## Page 1

# Fluent in Claude Code, Part 1

Seven small tools you build in one weekend, in the order that teaches you the most. No coding background needed, just a folder and the words for what you want.

@Zephyr_hg

Claude Code looks like a tool for developers because it lives in a terminal. You don't write the code, though. You describe the tool, Claude writes it, runs it, and fixes it when it breaks. The skill you're building is describing a job clearly enough that the first version works.

Every tool below runs on your own files, so you finish the weekend with things you actually use, not a tutorial project you delete.

### 1. The folder and its rules

Goal: one place where Claude knows what it's working on.

- Folder: One new folder for the weekend. Open Claude Code inside it, nowhere else.
- CLAUDE.md: Ask Claude to write one: who you are, what the folder is for, and that it asks before deleting anything.
- First test: Ask it to look at the folder and say what it would do with it. Fix CLAUDE.md until the answer is right.

### 2. The file renamer

Goal: your first tool that changes real files, safely.

- The job: Rename a messy downloads or invoices folder to date, client and type.
- The rule: It shows the old and new names as a list and waits for your yes.
- What you learn: Plan first, then run. Every tool after this works the same way.

Two tools in. Next, the ones that handle your numbers and your notes.

Zephyr HQ

## Page 2

### 3. The spreadsheet merger

Goal: two exports in, one clean file out.

- The job: Merge two CSV exports (clients, orders, subscribers), drop duplicates, fix the dates.
- The check: It tells you how many rows went in, how many came out and why.
- What you learn: Ask for the numbers back. That is how you trust a tool you didn't write.

### 4. A one-page site

Goal: something you can open in a browser and share.

- The job: A single HTML page for your offer: who it's for, what they get, one button.
- The loop: Open it, say what looks wrong, let Claude fix it. Five rounds is normal.
- What you learn: Describing what you see is most of the work.

### 5. The weekly report

Goal: a tool that reads a folder and writes for you.

- The job: Read every note in notes/ from the last 7 days and write a one-page summary.
- The rule: Every line in the summary names the note it came from.
- What you learn: Tools that read your files beat tools that guess.

Five tools by Saturday night. The last two run without you.

Zephyr HQ

## Page 3

### 6. Your own command

Goal: stop typing the same request twice.

- The job: Turn the report into a saved command or skill you run with one line.
- The test: Run it on a fresh set of notes without explaining anything again.
- What you learn: A saved command is a tool you can hand to someone else.

### 7. Put one on a schedule

Goal: a tool that runs without you opening anything.

- The job: Ask Claude to schedule the weekly report on your computer (cron on Mac or Linux, Task Scheduler on Windows).
- The rule: It writes the result to a file and never sends anything.
- What you learn: This is the step where it starts to feel like staff.

WHAT TO DO
On Sunday afternoon, run all seven on real work: your real downloads, your two real exports, your real notes. Keep the ones you used. Delete the rest.

Fluent means you can describe the next tool without a guide.

Zephyr HQ
