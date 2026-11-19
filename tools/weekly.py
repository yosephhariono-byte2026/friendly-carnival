#!/usr/bin/env python3
"""Weekly summary helper. Standard library only.

  python3 tools/weekly.py list [DAYS]   notes and raw sources dated in the last DAYS days (default 7)
  python3 tools/weekly.py check FILE    every bullet line in FILE must cite an existing notes/*.md path
"""
import datetime as dt
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def field(text, key):
    m = re.search(rf"^{key}:\s*(.+)$", text, re.M)
    return m.group(1).strip() if m else ""


def list_recent(days):
    since = dt.date.today() - dt.timedelta(days=days - 1)
    print(f"# Since {since} ({days} days)\n\n## Raw sources")
    for p in sorted((ROOT / "raw").glob("*.md")):
        d = p.name[:10]
        if d >= since.isoformat():
            print(f"- {p.relative_to(ROOT)}")
    print("\n## Notes")
    rows = []
    for p in (ROOT / "notes").glob("*.md"):
        t = p.read_text(encoding="utf-8")
        d = field(t, "date")
        if d >= since.isoformat():
            title = re.search(r"^# (.+)$", t, re.M)
            rows.append((d, field(t, "source"), str(p.relative_to(ROOT)), title.group(1) if title else ""))
    for d, src, path, title in sorted(rows):
        print(f"- {d} | {path} | {title} | {src}")
    print(f"\n{len(rows)} notes")


def check(file):
    text = (ROOT / file).read_text(encoding="utf-8")
    problems = 0
    for n, line in enumerate(text.splitlines(), 1):
        if not re.match(r"\s*([-*]|\d+\.)\s", line):
            continue
        cites = re.findall(r"notes/[\w.-]+\.md", line)
        if not cites:
            print(f"line {n}: no note cited: {line.strip()[:80]}")
            problems += 1
        for c in cites:
            if not (ROOT / c).exists():
                print(f"line {n}: missing {c}")
                problems += 1
    print(f"{problems} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "check":
        sys.exit(check(sys.argv[2]))
    list_recent(int(sys.argv[2]) if len(sys.argv) > 2 else 7)
