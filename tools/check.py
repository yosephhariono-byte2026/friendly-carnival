#!/usr/bin/env python3
"""Vault lint: front matter, sources, confidence, links. Standard library only."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK = re.compile(r"\[\[([^\]|#]+)")
CONFIDENCE = {"seen", "verified", "opinion"}


def front_matter(text):
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---", 4)
    if end == -1:
        return None
    fields = {}
    for line in text[4:end].splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            fields[key.strip()] = value.split("#", 1)[0].strip()
    return fields


def main():
    notes = sorted((ROOT / "notes").glob("*.md"))
    names = {p.stem for p in notes}
    linked_to = set()
    problems = []

    for path in notes:
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)
        fm = front_matter(text)
        if fm is None:
            problems.append(f"{rel}: missing front matter")
            continue
        for key in ("date", "source", "confidence"):
            if not fm.get(key):
                problems.append(f"{rel}: missing '{key}'")
        if fm.get("confidence") and fm["confidence"] not in CONFIDENCE:
            problems.append(f"{rel}: confidence must be one of {sorted(CONFIDENCE)}")
        src = fm.get("source")
        if src and not (ROOT / src).exists():
            problems.append(f"{rel}: source '{src}' not found")
        links = set(LINK.findall(text))
        for target in links:
            if target.strip() not in names:
                problems.append(f"{rel}: broken link [[{target}]]")
        linked_to |= {t.strip() for t in links}
        if not links:
            problems.append(f"{rel}: orphan (no links), move to inbox/")

    index_links = {t.strip() for t in LINK.findall((ROOT / "index.md").read_text(encoding="utf-8"))}
    for path in notes:
        if path.stem not in linked_to and path.stem not in index_links:
            problems.append(f"{path.relative_to(ROOT)}: nothing links here")

    for p in problems:
        print(p)
    print(f"{len(notes)} notes, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
