#!/usr/bin/env bash
set -euo pipefail

# 检查 D2 是否安装
if ! command -v d2 &>/dev/null; then
  echo "Error: d2 not found. Install: https://d2lang.com/install" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SCRIPT_DIR}/src"
OUT_DIR="${SCRIPT_DIR}"
THEME="${SRC_DIR}/theme.d2"

if [ ! -f "$THEME" ]; then
  echo "Error: theme.d2 not found at $THEME" >&2
  exit 1
fi

count=0
for f in "${SRC_DIR}"/*.d2; do
  [ "$(basename "$f")" = "theme.d2" ] && continue
  name=$(basename "$f" .d2)
  echo "Building ${name}.svg ..."
  cat "$THEME" "$f" | d2 --layout elk --theme 0 --pad 20 - "${OUT_DIR}/${name}.svg"
  count=$((count + 1))
done

echo "Done: ${count} D2 diagrams generated."
