# React Fiber 图表审查报告

**日期**: 2026-03-21
**审查范围**: `docs/diagrams/` 下全部 8 张 SVG 图 + 6 份 markdown 文档
**审查目标**: 技术准确性、视觉清晰度、文档一致性

---

## 一、现有图表清单

| # | 文件名 | 模块 | 类型 | 整体评价 |
|---|--------|------|------|----------|
| 1 | `react-learning-roadmap.svg` | 总览 | D2 | 内容准确，缺顺序箭头 |
| 2 | `react-old-sync-vs-fiber.svg` | M1 | D2 | 内容准确，对比关系不够直观 |
| 3 | `react-fiber-node-traversal.svg` | M2 | 手工 | 质量高，有小瑕疵 |
| 4 | `react-current-wip-commit.svg` | M3 | 手工 | 质量高，有小瑕疵 |
| 5 | `react-setstate-full-path.svg` | M4 | 手工 | 质量高，有措辞/箭头问题 |
| 6 | `react-lanes-assignment.svg` | M5 | D2 | 质量高，虚实线可优化 |
| 7 | `react-scheduler-render-loop.svg` | M5 | D2 | 内容准确，信息密度偏低 |
| 8 | `react-suspense-offscreen-ping-retry.svg` | M6 | 手工 | 质量高，有小瑕疵 |

---

## 二、逐图审查

### 1. react-learning-roadmap.svg

**问题**: 6 个模块卡片平铺在 2×3 网格中，读者无法从图形本身看出学习顺序。底部 hint 文字写了 "M1→M2→…→M6"，但图中没有箭头路径。

**建议**: 在 D2 源文件中添加 M1→M2→M3→M4→M5→M6 的有向箭头连接线。

---

### 2. react-old-sync-vs-fiber.svg

**问题**: 旧模型与 Fiber 上下排列，中间仅一条虚线标注"Fiber 解决了什么"。缺少逐条对比维度（如"难以让位" ↔ "可暂停、可让位"），读者需要自己逐条对照。

**建议**: 考虑左右并列布局，或添加对应节点之间的水平对比连接线。

---

### 3. react-fiber-node-traversal.svg

**质量**: 高。上层树结构 + 右侧指针说明 + 中层字段分组 + 下层 work loop，结构完整。

**瑕疵 1 — subtreeFlags hint 间距不一致**:
紫色"工作标记"卡片中，`subtreeFlags` 的 hint 文字 x 坐标 (`x="950"`) 与 mono 文字 x 坐标 (`x="824"`) 不一致，而其他卡片（树链接、输入缓存）的 hint 始终与 mono 对齐。

**瑕疵 2 — completeWork 缺少 return 回退箭头**:
beginWork→completeWork 之间有 `null` 和 `sibling` 两条循环箭头，但 completeWork 内部"沿 return 向上回退"这条路径没有箭头表示，只在文字中提到。

**修复**: 补充 completeWork 右侧的自循环弯曲箭头，标注 "return ↑"。

---

### 4. react-current-wip-commit.svg

**质量**: 高。2×2 网格布局，4 阶段（提交前→render→render完成→commit）逻辑连贯。

**瑕疵 1 — Cell 3 绿色 pill 与树距离过远**:
"finishedWork 不是第三棵树" pill 位于 `y=610`，而 WIP 树根节点在 `y=670`，两者间距 60px，视觉关联弱。

**瑕疵 2 — ①→③ 垂直箭头无标签**:
`x=413, y=450→480` 有一条垂直箭头但没有文字标签，读者不理解它的含义。

**修复**:
1. 给 ①→③ 箭头补标签 "current 保持"

---

### 5. react-setstate-full-path.svg

**质量**: 高。4 泳道 10 步时序图，覆盖从 setState 到 commit 全链路。

**瑕疵 1 — Step 3→4 箭头向上回折**:
路径 `M 370 420 … C 416 420 416 300 416 250 L 430 216` 有一个向上弯曲，在时序图中看起来像时间倒流。实际含义是 "沿 return 到达 Root"，但方向容易误导。

**瑕疵 2 — Step 5→6 标签不够精确**:
箭头标签写 `ensureRootIsScheduled`，但这是 Root 内部调度行为，放在 Lane2→Lane3 的跨泳道箭头上更适合的描述是"进入 render"。

**瑕疵 3 — "回流 Root" 措辞与浏览器 reflow 冲突**:
Step 7→8 标注 "回流 Root"，在前端语境中"回流"容易与浏览器 reflow 混淆。

**修复**:
1. "回流 Root" 改为 "结果返回 Root"

---

### 6. react-lanes-assignment.svg

**质量**: 高。完整展示 Sources → Lanes → Root Ledger → getNextLanes。

**瑕疵 — expiredLanes 和 pingedLanes 连线样式相同**:
两者都是虚线，但语义不同：expired 是强制优先（应为实线），pinged 是恢复候选（虚线合理）。

**建议**: D2 源文件中将 expiredLanes→getNextLanes 改为实线。

---

### 7. react-scheduler-render-loop.svg

**问题 — 信息密度偏低**:
整图只有 3 个节点（ensure → scheduler → render）+ 1 个 note box，纵向 1223px 大量空白。

**缺失**: 未展示 render work loop 内部结构（workLoopSync / workLoopConcurrent → performUnitOfWork → beginWork / completeWork）以及 `shouldYield()` 让位时机。

**建议**: 在 Render Work Loop 内部或下方展开 workLoop 循环结构。

---

### 8. react-suspense-offscreen-ping-retry.svg

**质量**: 高。3 行 10 步闭环，retry loop 虚线箭头回到步骤 1。

**瑕疵 1 — Step 5→6 方向暗示先后关系**:
hidden Offscreen 和 suspendedLanes 几乎同时发生，但左向箭头暗示了严格先后。

**瑕疵 2 — Step 6→7 缺少异步等待标注**:
Step 7 的 "async trigger" 文字无箭头连接，与 Step 5/6 的关系不明确。

**修复**: 在 Step 6 和 Step 7 之间添加虚线时间轴标注 "异步等待 (wakeable pending)"。

---

## 三、Markdown 文档审查

### index.md
质量好，作为导航入口清晰。无问题。

### diagram-specs.md
只是摘要性质。详细 spec 分散在独立文件中（如 `react-current-wip-commit-spec.md`），但本文件未链接到这些 spec。**建议补充链接**。

### diagram-execution-plan.md
第 3 张优先图 `openclaw-long-task-workflow.svg` 不属于 React Fiber 学习范畴。**建议移除或标注为无关项**。

### BUILD.md
手工 SVG 列表遗漏了 `react-suspense-offscreen-ping-retry.svg`（M6）。**需要补充**。

### react-setstate-full-path-spec.md
Spec 定义了 5 个泳道（Component / Current Fiber / Root / Render / Commit），但实际 SVG 实现只有 4 个泳道（合并了 Component→Fiber 和 Root 的部分流程）。**Spec 与实现存在泳道数量不一致**，应更新 spec 或 SVG 使两者匹配。

---

## 四、建议新增图表

| 图表 | 覆盖内容 | 优先级 |
|------|----------|--------|
| `react-reconciler-children.svg` | reconcileChildren / ChildReconciler 的 key 匹配、effectTag 分配 | P2 |
| `react-hooks-linked-list.svg` | Hooks circular linked list、dispatcher 切换、update queue | P2 |
| `react-effect-list-bubbling.svg` | completeWork 阶段 effect list 冒泡过程 | P3 |

---

## 五、修复清单（本次已执行）

| 文件 | 修复内容 |
|------|----------|
| `react-current-wip-commit.svg` | ①→③ 箭头补标签 "current 保持" |
| `react-setstate-full-path.svg` | "回流 Root" → "结果返回 Root" |
| `react-fiber-node-traversal.svg` | 补 completeWork return 自循环箭头 |
| `react-suspense-offscreen-ping-retry.svg` | Step 6→7 补异步等待虚线标注 |
