#!/usr/bin/env bash
# tools/check-all.sh —— 一键回归链 & 图示复核图生成（git-bash / Windows）
#   bash tools/check-all.sh all      回归链：语法 → 几何 → 映射 → 服务器自测 → 校验 → 外链 → 冒烟
#   bash tools/check-all.sh review   复核图：渲染 23 行模板页 → 切列控高（供视觉打分）
set -u
cd "$(dirname "$0")/.."
CHROME="${CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
TMP="${LOCALAPPDATA:-/tmp}/Temp-smoke.txt"

case "${1:-all}" in
  all)
    exec node tools/check-all.mjs
    ;;
  review)
    "$CHROME" --headless=new --disable-gpu --no-first-run --hide-scrollbars \
      --user-data-dir="${LOCALAPPDATA:-/tmp}/Temp-chrome-qa-poc" --window-size=460,13300 --virtual-time-budget=10000 \
      --screenshot="$(pwd -W)/docs/screenshots/frames-23-latest.png" "file:///$(pwd -W)/tools/art/frames-only.html" >/dev/null 2>&1
    python tools/art/tall_split.py docs/screenshots/frames-23-latest.png docs/screenshots/frames-23-latest-s.png 3 0.92
    ;;
  *) echo "用法: bash tools/check-all.sh [all|review]"; exit 1 ;;
esac
