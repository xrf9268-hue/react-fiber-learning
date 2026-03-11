# M7｜来源与产出映射

## 目的

本文件用于回答两个问题：

1. **最终总览应该从哪些既有模块文件提炼内容。**
2. **最终仓库还需要产出哪些图示或整理型输出物。**

M7 只做映射与收束，不新增新的研究主题。

---

## 一、最终总览的来源映射

### 1. 仓库总目标与学习边界

主要来源：
- `README.md`
- `STATUS.md`
- `docs/roadmap.md`
- `docs/source-map.md`
- `AGENTS.md`

用途：
- 提炼仓库目标、基线版本、模块边界、阅读方式。
- 统一“这是概念优先、证据导向的 React Fiber 学习仓库”这一口径。

---

### 2. M1：为什么需要 Fiber

主要来源：
- `docs/modules/m1-why-fiber-exists-draft.md`
- `docs/modules/m1-evidence-notes.md`
- `docs/modules/m1-compare-notes.md`
- `docs/modules/m1-why-fiber-exists-plan.md`

最终总览应提炼出的内容：
- 旧同步渲染模型的核心限制。
- Fiber 需要解决的目标：可中断、可恢复、可分优先级。
- M1 作为整仓入口的“问题意识”。

建议产出：
- 一段“为什么 React 需要 Fiber”的压缩总述。
- 一张“旧模型 vs Fiber 能力”对比图或卡片。

---

### 3. M2：Fiber 节点与树遍历

主要来源：
- `docs/modules/m2-fiber-node-and-traversal-draft.md`
- `docs/modules/m2-evidence-notes.md`
- `docs/modules/m2-source-entry-points.md`
- `docs/modules/m2-fiber-node-and-traversal-plan.md`

最终总览应提炼出的内容：
- Fiber 不是抽象口号，而是带字段的节点结构。
- child / sibling / return 如何组成可遍历的树。
- beginWork / completeWork 的遍历骨架感。

建议产出：
- 一张 Fiber 节点字段与三指针关系图。
- 一张深度优先遍历骨架图。

---

### 4. M3：current / workInProgress / render / commit

主要来源：
- `docs/modules/m3-current-wip-render-commit-draft.md`
- `docs/modules/m3-evidence-notes.md`
- `docs/modules/m3-source-entry-points.md`
- `docs/modules/m3-compare-diagram-note.md`

最终总览应提炼出的内容：
- current 树与 workInProgress 树的分工。
- render 阶段生成结果，commit 阶段提交结果。
- 为什么双树结构让更新更可控。

建议产出：
- 一张 current / workInProgress 双树关系图。
- 一张 render / commit 分工图。

---

### 5. M4：一次 `setState` 全链路

主要来源：
- `docs/modules/m4-one-setstate-trace-draft.md`
- `docs/modules/m4-evidence-notes.md`
- `docs/modules/m4-source-entry-points.md`
- `docs/modules/m4-one-setstate-trace-plan.md`

最终总览应提炼出的内容：
- 一次更新怎样从入口进入调度，再进入 render / commit。
- update、root、work loop、finishedWork、commit 的顺序关系。
- 为什么 M4 是把前面概念第一次串成动态过程的模块。

建议产出：
- 一张“单次更新全链路时序图”。
- 一段“从 setState 到提交”的压缩流程说明。

---

### 6. M5：lanes / priority / scheduler

主要来源：
- `docs/modules/m5-lanes-priority-scheduler-transition-draft.md`
- `docs/modules/m5-evidence-notes.md`
- `docs/modules/m5-source-entry-points.md`
- `docs/modules/m5-compare-diagram-note.md`

最终总览应提炼出的内容：
- lane 是什么，为什么 React 用它表示工作类别与优先级。
- root 怎样挑下一批工作。
- scheduler 与可中断 render 的关系。
- transition 只是这套机制在用户态的一种体现。

建议产出：
- 一张 lane 选择与 `getNextLanes` 关系图。
- 一张“scheduler 如何配合 work loop”的简图。

---

### 7. M6：Suspense / Offscreen / retry

主要来源：
- `docs/modules/m6-suspense-offscreen-react19-draft.md`
- `docs/modules/m6-evidence-notes.md`
- `docs/modules/m6-source-entry-points.md`
- `docs/modules/m6-compare-diagram-note.md`
- `docs/modules/m6-suspense-offscreen-react19-plan.md`

最终总览应提炼出的内容：
- render 遇到 suspend 时，边界如何切到 fallback。
- Offscreen 如何承接“隐藏但保留”的主内容子树。
- ping / retry 如何把工作重新送回 root 调度。
- React 19 对照为何只是轻量 delta。

建议产出：
- 一张“挂起 → fallback → hidden Offscreen → ping → retry”主线图。
- 一张 `suspendedLanes` / `pingedLanes` 关系图。

---

## 二、最终仓库应产出的整理型文稿

### 必需

1. **最终总览文稿**
   - 作用：作为整仓总入口。
   - 内容：总论、模块路线、关键图示入口、回查方式。

2. **README 收尾更新**
   - 作用：让首次进入仓库的人快速知道怎么读。
   - 内容：目标、边界、阅读顺序、总览入口。

3. **状态文件同步**
   - 作用：保证 STATUS 与 checkpoints 反映真实完成度。

### 可选但推荐

4. **图示索引页或图示说明段**
   - 作用：集中列出有哪些图、各自回答什么问题。

5. **简版复习清单**
   - 作用：供读完全文后快速回顾主线。

---

## 三、最终图示建议清单

### A. 仓库总览级图示

1. **React Fiber 学习路线总图**
   - 回答：M1-M6 各在整条主线上处于什么位置。
   - 来源：各模块 plan / draft + README / roadmap。
   - 优先级：高。

### B. 核心机制图示

2. **旧同步模型 vs Fiber 能力对比图**
   - 来源：M1。
   - 回答：为什么必须进入 Fiber 语境。

3. **Fiber 节点结构与 child/sibling/return 图**
   - 来源：M2。
   - 回答：Fiber 树如何被组织与遍历。

4. **current / workInProgress 双树图**
   - 来源：M3。
   - 回答：为什么 render 可以在另一棵树上准备结果。

5. **render / commit 分工图**
   - 来源：M3。
   - 回答：为什么 React 把“准备结果”与“提交结果”拆开。

6. **一次 `setState` 全链路时序图**
   - 来源：M4。
   - 回答：一个具体更新怎样走完整个系统。

7. **lane 选择与 root 调度图**
   - 来源：M5。
   - 回答：为什么不是所有更新都同优先级处理。

8. **Suspense / Offscreen / ping / retry 图**
   - 来源：M6。
   - 回答：工作中途卡住时，系统怎样回退、隐藏并恢复。

### C. 导出格式建议

- **优先 SVG**：适合版本管理、文字清晰、后续可编辑。
- **按需导出 PNG**：用于 README 展示或分享截图。
- 不建议一开始维护多套设计稿；先有结构正确、文字准确的简洁图。

---

## 四、最终总览的建议吸收方式

建议不是把所有 draft 直接拼接，而是按以下方式提炼：

1. **每个模块只提炼 1 个核心问题。**
2. **每个模块只保留 2-4 条最稳定结论。**
3. **每个模块最多配 1-2 个必要图示。**
4. **源码证据不直接堆进总览正文，而是通过模块链接或脚注式回指承接。**
5. **React 19 内容只在 M6 相关段落轻量出现，不扩成独立主线。**

---

## 五、执行优先顺序建议

1. 先确认最终总览文稿结构。
2. 再确认图示清单与命名。
3. 再做 README 与索引收口。
4. 最后统一检查 STATUS / checkpoints / 模块命名与链接。

---

## 一句话结论

**M7 的关键不是再写新内容，而是明确：已有哪批模块文件负责供给最终总览，最终又需要落出哪些图示与入口型产物，才能让整个仓库真正可读、可复习、可交付。**
