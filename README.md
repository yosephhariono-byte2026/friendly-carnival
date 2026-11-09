# friendly-carnival

A second brain as a folder of markdown. Sources go into `raw/` untouched, get cut
into one-idea notes in `notes/`, linked, verified against the source, and tested
by answering questions from the vault alone.

How to use it:

1. Put sources and questions in `inputs.md`.
2. Ask Claude to "run the six passes". The rules are in `CLAUDE.md`.
3. Read `today.md` each day. Check `gaps.md` for what the vault cannot answer yet.

Check the vault any time with `python3 tools/check.py`.

Workflow based on a prompt by slash1s, built on the markdown second-brain setup
Andrej Karpathy has described publicly. Not written or endorsed by Andrej Karpathy.
