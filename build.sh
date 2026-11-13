#!/usr/bin/env bash
# Wraps each game source (title, styles, markup, script) into a standalone page.
#   src/game.html          -> index.html          (Penjaga Nusantara)
#   src/runtuh-candi.html  -> runtuh-candi.html   (Runtuh Candi)
set -euo pipefail
cd "$(dirname "$0")"
wrap() {
  {
    printf '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n'
    printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    printf '<style>body{margin:0}[hidden]{display:none!important}</style>\n'
    cat "$1"
    printf '</body>\n</html>\n'
  } > "$2"
}
wrap src/game.html index.html
wrap src/runtuh-candi.html runtuh-candi.html
