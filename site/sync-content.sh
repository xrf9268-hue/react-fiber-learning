#!/usr/bin/env bash
# sync-content.sh
# 从 docs/ 目录同步 Markdown 内容到 site/ 对应目录
# 在 vitepress build 之前运行

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_DIR="$(dirname "$SCRIPT_DIR")/docs"
SITE_DIR="$SCRIPT_DIR"

echo "Syncing content from docs/ to site/..."

# --- 模块正文 ---
mkdir -p "$SITE_DIR/modules"

declare -A MODULE_FILES=(
  [m1]="m1-why-fiber-exists-draft.md"
  [m2]="m2-fiber-node-and-traversal-draft.md"
  [m3]="m3-current-wip-render-commit-draft.md"
  [m4]="m4-one-setstate-trace-draft.md"
  [m5]="m5-lanes-priority-scheduler-transition-draft.md"
  [m6]="m6-suspense-offscreen-react19-draft.md"
)

declare -A MODULE_PREV=(
  [m1]="guide/|总览"
  [m2]="modules/m1|M1 | 为什么需要 Fiber"
  [m3]="modules/m2|M2 | Fiber 节点与树遍历"
  [m4]="modules/m3|M3 | 双树与 render/commit"
  [m5]="modules/m4|M4 | 一次 setState 全链路"
  [m6]="modules/m5|M5 | lanes / priority / scheduler"
)

declare -A MODULE_NEXT=(
  [m1]="modules/m2|M2 | Fiber 节点与树遍历"
  [m2]="modules/m3|M3 | 双树与 render/commit"
  [m3]="modules/m4|M4 | 一次 setState 全链路"
  [m4]="modules/m5|M5 | lanes / priority / scheduler"
  [m5]="modules/m6|M6 | Suspense / Offscreen / retry"
  [m6]="false"
)

for key in "${!MODULE_FILES[@]}"; do
  src="$DOCS_DIR/modules/${MODULE_FILES[$key]}"
  dst="$SITE_DIR/modules/${key}.md"

  if [ -f "$src" ]; then
    prev_info="${MODULE_PREV[$key]}"
    next_info="${MODULE_NEXT[$key]}"

    prev_link="/${prev_info%%|*}"
    prev_text="${prev_info##*|}"

    # Build frontmatter
    {
      echo "---"
      echo "outline: [2, 3]"

      if [ "$prev_info" != "false" ]; then
        echo "prev:"
        echo "  text: '${prev_text}'"
        echo "  link: ${prev_link}"
      else
        echo "prev: false"
      fi

      if [ "$next_info" != "false" ]; then
        next_link="/${next_info%%|*}"
        next_text="${next_info##*|}"
        echo "next:"
        echo "  text: '${next_text}'"
        echo "  link: ${next_link}"
      else
        echo "next: false"
      fi

      echo "---"
      echo ""
    } > "$dst"

    cat "$src" >> "$dst"

    # Append diagram section for modules that have associated SVGs
    declare -A MODULE_DIAGRAMS=(
      [m1]="react-old-sync-vs-fiber.svg|旧同步模型 vs Fiber 能力对比"
      [m2]="react-fiber-node-traversal.svg|Fiber 节点与 child/sibling/return 遍历骨架"
      [m3]="react-current-wip-commit.svg|current / workInProgress / finishedWork / commit 关系"
      [m4]="react-setstate-full-path.svg|一次 setState 从组件到 commit 的完整路径"
      [m5]="react-lanes-assignment.svg|lanes 分配与状态流转,react-scheduler-render-loop.svg|Scheduler 与 render work loop 协作"
      [m6]="react-suspense-offscreen-ping-retry.svg|Suspense 挂起 → fallback → ping → retry 闭环"
    )

    if [ -n "${MODULE_DIAGRAMS[$key]+x}" ]; then
      {
        echo ""
        echo "---"
        echo ""
        echo "## 配套图示"
        echo ""
      } >> "$dst"

      IFS=',' read -ra DIAGRAM_LIST <<< "${MODULE_DIAGRAMS[$key]}"
      for diagram_entry in "${DIAGRAM_LIST[@]}"; do
        svg_file="${diagram_entry%%|*}"
        svg_alt="${diagram_entry##*|}"
        {
          echo "### ${svg_alt}"
          echo ""
          echo "![${svg_alt}](/diagrams/${svg_file})"
          echo ""
        } >> "$dst"
      done

      echo "  + Added diagrams to ${key}.md"
    fi

    echo "  Synced: ${key}.md"
  else
    echo "  WARN: Source not found: $src"
  fi
done

# --- 证据笔记 ---
mkdir -p "$SITE_DIR/evidence"

for i in 1 2 3 4 5 6; do
  src="$DOCS_DIR/modules/m${i}-evidence-notes.md"
  dst="$SITE_DIR/evidence/m${i}.md"
  if [ -f "$src" ]; then
    {
      echo "---"
      echo "outline: [2, 3]"
      echo "---"
      echo ""
    } > "$dst"
    cat "$src" >> "$dst"
    echo "  Synced: evidence/m${i}.md"
  fi
done

# --- 参考文档 ---
mkdir -p "$SITE_DIR/reference"

declare -A REF_FILES=(
  [fiber-fields]="reference/fiber-fields.md"
  [lane-constants]="reference/lane-constants.md"
  [source-map]="source-map.md"
)

for key in "${!REF_FILES[@]}"; do
  src="$DOCS_DIR/${REF_FILES[$key]}"
  dst="$SITE_DIR/reference/${key}.md"
  if [ -f "$src" ]; then
    {
      echo "---"
      echo "outline: [2, 3]"
      echo "---"
      echo ""
    } > "$dst"
    cat "$src" >> "$dst"
    echo "  Synced: reference/${key}.md"
  fi
done

# --- 图示索引 ---
# diagrams/index.md 是手写的（含嵌入图片），不从 docs/ 覆盖
mkdir -p "$SITE_DIR/diagrams"

# --- SVG 文件 ---
mkdir -p "$SITE_DIR/public/diagrams"
for svg in "$DOCS_DIR"/diagrams/*.svg; do
  if [ -f "$svg" ]; then
    cp "$svg" "$SITE_DIR/public/diagrams/"
    echo "  Copied: $(basename "$svg")"
  fi
done

echo "Content sync complete."
