# AGENTS.md — React Fiber Learning Project

This file defines the project-local execution rules for the long-running React Fiber learning repo.

## Project Goal

Build a high-quality Chinese study repo for understanding React Fiber from the official React 18/19 codebase, using a concept-first path plus minimal but precise source verification.

## Canonical State Sources

Always treat these as the primary continuity objects for this project:

1. `STATUS.md`
2. `checkpoints/*.md`
3. `docs/modules/*.md`
4. Git history inside this repo

Do not rely on chat memory alone for project state.

## Learning Baseline

- Primary baseline: **React v18.2.0**
- Delta comparison target: **React main**
- Learn the stable skeleton first, then compare newer extensions.

## Local Upstream Source Mirrors

Prefer local source mirrors over ad-hoc remote browsing when checking React internals:

- `../tmp/react-upstream/react-v18.2.0`
- `../tmp/react-upstream/react-main`

If they drift or are missing, refresh them before deep source work.

## Module Execution Rules

- Work module by module.
- Keep each work package bounded.
- Each module should aim to produce, where applicable:
  - plan
  - evidence notes
  - draft
  - self-review
  - compare notes or diagram notes
  - commit-readiness note

## Hard Continuation Rules

These rules exist because this project is long-running and must not silently stall.

1. **Do not treat a user-facing progress update as continuation.**
   A short report is not progress by itself.

2. **When a bounded subagent work package finishes and the project is still active and unfinished, immediately start the next concrete work package or review/commit-readiness package.**
   Do this before or immediately after any short update.

3. **Treat the project as truly in progress only if at least one of these is true:**
   - a dedicated worker is active, or
   - substantive project files were updated recently, or
   - a new checkpoint/status update was created as part of real work.

4. **If there is no active worker and the remaining task is multi-step, resume with a dedicated subagent rather than trying to hold everything in the main session.**

5. **If a module is ready for a clean local milestone commit, commit it instead of endlessly polishing.**

## Progress Definition

Use explicit evidence, not intention.

Good signals of progress:
- new or updated files in `docs/modules/`
- new or updated `STATUS.md`
- new or updated `checkpoints/*.md`
- local milestone commit created

Bad signals:
- only saying "I will continue"
- only discussing next steps without starting them
- only having completed subagents with no next package started

## Commit Boundary Rules

- Prefer clean local milestone commits.
- A commit should correspond to a coherent module milestone.
- Do not mix half-finished future modules into the current milestone unless clearly intentional.

## Teaching Style Rules

- Chinese,书面语、通俗易懂
- Concept first, evidence oriented
- Do not drown the learner in source details too early
- Keep module boundaries clean:
  - M1 = why Fiber exists
  - M2 = Fiber node and traversal
  - M3 = current / workInProgress / render / commit
  - M4 = one `setState` trace
  - M5+ = priority / lanes / scheduler / advanced topics

## Quality Bar

Before calling a module "ready", check:
- Is the scope still bounded?
- Are official sources or official source files cited?
- Is the explanation understandable without reading the whole React repo?
- Are misconceptions explicitly handled?
- Is there a self-review note?
- Is the next action clear: polish, commit, or next module?

## Diagram Authoring Rules

本项目有两类图表，工作流不同：

- **D2 编译型**（4 张）：源文件在 `docs/diagrams/src/*.d2`，共享 `theme.d2`，通过 `docs/diagrams/build.sh` 或手动 `cat theme.d2 <name>.d2 | d2 --layout=elk - <name>.svg` 编译。
- **手工 SVG**（4 张）：直接编辑 `docs/diagrams/*.svg`。

参考文档：`docs/diagrams/BUILD.md`、`docs/diagrams/diagram-specs.md`。

### D2 + ELK 引擎注意事项

- **编译验证**：每次修改 `.d2` 后必须编译并检查 `viewBox` 尺寸比例，确认布局合理后再提交。
- **ELK direction 限制**：`direction: down/right` 仅对有边连接的节点生效。断开的顶层节点需用隐形边（`stroke-width: 0`）强制布局方向。
- **Grid 与边互斥**：`grid-columns`/`grid-rows` 容器内不能定义边，否则 grid 布局失效回退为普通布局。边必须放到容器外部，或改用文本标注顺序。
- **中文文本不自动换行**：D2 不对中文做 word-wrap，必须手动用 `\n` 控制每行宽度。Markdown 块（`|md ... |`）会忽略 `width` 约束，纯文本标签配合 `width` 更可控。
- **嵌套容器风险**：ELK 下嵌套容器设为不可见（fill/stroke 同背景色）时，子节点可能不渲染。优先用 grid 或 flat 结构代替深层嵌套。

### 手工 SVG 检查清单

历史上手工 SVG 反复出现以下问题（同一张图连续 2-3 次修复），提交前务必逐项检查：

- **z-order**：箭头/连线必须在所有矩形/面板之后绘制，否则会被遮挡裁剪。
- **文本与图形重叠**：检查 text 元素的 y 坐标是否与相邻 rect/path 冲突，尤其是多行文本。
- **容器溢出**：note box、legend box 等子元素不得超出父 panel 边界。
- **箭头曲线**：return/回退箭头使用虚线区分，曲线控制点需保持在容器范围内。
- **viewBox 比例**：修改后检查整体 viewBox，避免出现极端宽高比（如 12:1）。

### 通用原则

- **先打开预览确认再提交**：不要仅凭 viewBox 数值判断，实际渲染可能有意外问题。
- **图表修改易连锁**：一次布局调整可能引发多处溢出/重叠，修完后全图扫一遍。

## Default Next-Step Logic

When unsure what to do next, prefer this order:
1. finish the current module package
2. produce commit-readiness
3. create local milestone commit if ready
4. plan the next module
5. execute the next module
