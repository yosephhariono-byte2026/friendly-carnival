# Second Brain: operating rules

This repo is a second brain: one folder of markdown, read by you, written by you,
never trusted until checked against a source. Any session working here follows
this file. Inputs live in `inputs.md`.

Done means: every note in `notes/` follows the note format, every claim carries a
source, and a fresh session can answer every question in `inputs.md` from the
vault alone.

## The rules

1. Markdown only. No database, no app, no plugin that can disappear.
2. Raw goes in before anything is processed. Save the source first, interpret it second.
3. One note, one idea. A note that needs a scroll is two notes.
4. Every claim links to where it came from. A line without a source is an
   opinion, and opinions are marked as such.
5. The brain is read every morning. A note nobody opens for 90 days moves to
   `archive/`. It is never deleted.

If an input in `inputs.md` is missing and it changes the outcome, ask one
question. Otherwise start.

## Layout

| Path | What lives there |
|---|---|
| `raw/` | Untouched source text, one file per item: `raw/YYYY-MM-DD-<slug>.md` |
| `notes/` | Atomic notes, one idea each, named after the idea |
| `inbox/` | Orphan notes (no links) waiting for review |
| `archive/` | Notes not opened in 90 days |
| `index.md` | Entry point; links to every index note |
| `today.md` | Daily note, the only file a human reads every day |
| `gaps.md` | Questions the vault could not answer, and what is missing |
| `templates/` | `raw.md` and `note.md` formats |

## The six passes

**Pass 1, intake.** For each item in SOURCES, save the raw text to `raw/` using
`templates/raw.md`: date, origin, exact URL or file path. Do not summarize. Do
not delete anything that came in.

**Pass 2, atomize.** Cut each raw item into notes of one idea each, using
`templates/note.md`. Name the note after the idea, not the source. Front matter:
`date`, `source` (path into `raw/`), `confidence` (`seen`, `verified`, or
`opinion`).

**Pass 3, link.** Every new note links (`[[note-name]]`) to at least one
existing note, or opens a new index note linked from `index.md`. A note with no
links is an orphan: it goes to `inbox/`, not `notes/`.

**Pass 4, verify.** For every note or line marked `verified`, re-open the raw
source and confirm the words. Downgrade anything that does not match to `seen`.
Never upgrade confidence without the source in hand. Record every downgrade.

**Pass 5, daily note.** Write `today.md`: what came in, what got linked, what
got downgraded, the three notes most worth re-reading. Under 20 lines.

**Pass 6, answer test.** Answer each question in QUESTIONS using the vault
alone: no web, no memory. Cite the note path for every sentence. A question that
cannot be answered goes into `gaps.md` with what is missing.

Run `python3 tools/check.py` after passes 2 to 4. It flags notes missing front
matter, notes without a source, sources that do not exist in `raw/`, and orphans.

## Never

- Store a claim without a source.
- Merge two ideas into one note.
- Delete a raw file.
- Answer from memory when the vault has the note.
- Build a plugin or a database when a folder would do.

## Stop

Stop when every question in QUESTIONS is answered from the vault, when LIMIT is
reached, or when a source conflicts with an existing verified note and a human
has to choose. Return: the vault tree, `today.md`, `gaps.md`, and the list of
downgraded notes.
