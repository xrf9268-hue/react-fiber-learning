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
- **图例/注释框位置**：不要将 legend box 放在泳道内部，容易与泳道标题重叠；应放在泳道边界之外的空白区域。
- **跨泳道箭头中间路径**：箭头连接非相邻步骤时，垂直/水平段可能穿过中间其他步骤的圆圈或文本；需逐段检查路径经过的坐标区域是否与已有元素碰撞。
- **箭头曲线**：return/回退箭头使用虚线区分，曲线控制点需保持在容器范围内。
- **viewBox 比例**：修改后检查整体 viewBox，避免出现极端宽高比（如 12:1）。

### 通用原则

- **先打开预览确认再提交**：不要仅凭 viewBox 数值判断，实际渲染可能有意外问题。
- **图表修改易连锁**：一次布局调整可能引发多处溢出/重叠，修完后全图扫一遍。

## Source Accuracy Rules (Lessons from 2026-03-20 Review)

本项目曾因以下问题导致多处严重/中等错误，后续涉及源码引用时务必遵守：

### 1. React 18.2.0 的 fork 机制

reconciler 核心文件采用 `.old.js` / `.new.js` 双版本 fork 机制。**不存在**无后缀的 `.js` 版本。
- 正确：`ReactFiberWorkLoop.old.js`
- 错误：`ReactFiberWorkLoop.js`
- 本项目统一引用 `.old.js` 版本

以下文件**没有** fork 后缀（直接使用 `.js`）：`ReactInternalTypes.js`、`ReactWorkTags.js`、`ReactFiberFlags.js`、`ReactRootTags.js`、`ReactFiberOffscreenComponent.js`

### 2. 版本差异：18.2.0 vs React 19

以下文件/结构**仅存在于 React 19 开发期间**，18.2.0 中不存在：
- `ReactFiberRootScheduler.js`（18.2.0 中 `ensureRootIsScheduled` 在 `ReactFiberWorkLoop` 内）
- `ReactFiberCommitEffects.js` / `ReactFiberCommitHostEffects.js`（18.2.0 中全在 `ReactFiberCommitWork` 内）
- `ReactFiberThenable.js`（18.2.0 中逻辑在 `ReactFiberThrow` 内）

引用源码路径时，必须先确认该文件在 18.2.0 中存在。

### 3. Fiber 字段写入时机的常见误判

| 字段 | 常见错误 | 正确时机 |
|------|---------|---------|
| `memoizedProps` | "completeWork 写入" | `performUnitOfWork` 中 `beginWork` 返回后立即写入 |
| `memoizedState` | "commit 后写入" | render 阶段 `beginWork` 内部写入（`processUpdateQueue` / hooks） |

### 4. 调用链描述原则

描述函数调用链时，必须区分"外部顺序调用"和"内部嵌套调用"。例如：
- `enqueueUpdate` 内部调用 `markUpdateLaneFromFiberToRoot`，不应将两者描述为独立的顺序步骤
- 描述步骤数量时必须与实际列出的步骤数一致（如"八步"就列八步）

### 5. 不要虚构 API 名称

描述触发场景时，不得使用不存在的 API 名称（如 `useIdleCallback`）。如果不确定，先查证源码。

## Default Next-Step Logic

When unsure what to do next, prefer this order:
1. finish the current module package
2. produce commit-readiness
3. create local milestone commit if ready
4. plan the next module
5. execute the next module
