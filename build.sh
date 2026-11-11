#!/usr/bin/env bash
# Wraps src/game.html (title, styles, markup, script) into a standalone index.html.
set -euo pipefail
cd "$(dirname "$0")"
{
  printf '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<style>body{margin:0}[hidden]{display:none!important}</style>\n'
  cat src/game.html
  printf '</body>\n</html>\n'
} > index.html
