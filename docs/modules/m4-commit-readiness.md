# M4｜提交准备度说明

## 结论

**M4 已基本达到下一次本地里程碑提交的准备状态。**

更准确地说：
- 主线范围已经收住；
- 官方证据链已经闭合到 `setState` → update queue → 向上找到 root → render → `root.finishedWork` → commit；
- 中文讲解已经能独立成立；
- 仍有少量可继续精修之处，但它们属于“可继续优化”，**不构成阻塞提交的缺口**。

因此，如果当前项目策略是“模块形成清晰教学包后就尽快做本地里程碑提交”，那么 **M4 已可进入下一次本地 milestone commit**，不必为了继续抛光而无限延后。

---

## 本轮判断依据

### 1. 范围已经守住
M4 只追一条最小主链：

- `enqueueSetState`
- `createUpdate` / `enqueueUpdate`
- `markUpdateLaneFromFiberToRoot`
- `scheduleUpdateOnFiber`
- render 中的 `processUpdateQueue`
- `root.finishedWork`
- commit 中的 `root.current = finishedWork`

没有扩写 hooks、完整 lanes 理论、scheduler 宏观设计，也没有重开 M3 的双树讲解范围。

### 2. 关键证据链已经闭环
目前已经具备以下关键源码锚点：

- `ReactFiberClassComponent.old.js`
  - 证明 `setState` 入口会创建 update，并调用调度主线。
- `ReactFiberClassUpdateQueue.old.js`
  - 证明 update 会先进队列，render 时才消费。
- `ReactFiberConcurrentUpdates.old.js`
  - 证明更新会沿 `return` 链一路找到 root。
- `ReactFiberWorkLoop.old.js`
  - 证明 root 被标记更新；
  - 证明 render 从 `root.current` 派生 `workInProgress`；
  - 证明 render 结束后会把结果写回 `root.finishedWork`；
  - 证明 commit 消费 `root.finishedWork`，并在关键点切换 `root.current`。
- `ReactFiberFlags.js`
  - 作为 commit 中 mutation/layout 分段的最小辅助证据。

其中，之前偏弱的那一点——**`finishedWork` 是何时写回 root**——本轮已经补上直接源码锚点，因此主链证据已明显更扎实。

### 3. 教学表达已经可用
当前草稿已经能清楚回答三件事：

1. 为什么 `setState` 不是直接改页面；
2. 为什么组件更新最后一定会上升为 root 级工作；
3. 为什么真正生效要经过 render 与 commit 两段。

这说明它已经不仅是“源码摘录”，而是一个可教学、可复核的模块包。

---

## 建议纳入本次本地里程碑提交的文件

建议至少包含以下文件：

- `docs/modules/m4-one-setstate-trace-plan.md`
- `docs/modules/m4-source-entry-points.md`
- `docs/modules/m4-evidence-notes.md`
- `docs/modules/m4-one-setstate-trace-draft.md`
- `docs/modules/m4-self-review.md`
- `docs/modules/m4-commit-readiness.md`
- `STATUS.md`
- `checkpoints/2026-03-11-progress.md`

如果希望保持“一个模块包一个完整提交边界”，以上组合已经基本完整。

---

## 仍然存在，但不阻塞提交的缺口

### 1. 正文还可以再压缩半轮
当前草稿已经清楚，但仍可再收一收重复解释，使其更接近“教学定稿”而非“高质量草稿”。

这属于质量优化，不影响本次里程碑提交成立。

### 2. 暂未补图
M4 很适合配一张最小链路图或“update 冒泡到 root”的示意图，但图不是当前提交边界的必要条件。

建议把图放到后续统一视觉整理或 M7 阶段处理。

### 3. 暂未做 React main 的轻量对照
本模块目前以 React 18.2.0 为主基线，已经满足学习主目标。若以后要补 main 分支轻量对照，可作为增量说明，不应阻塞当前提交。

---

## 不建议继续拖延提交的原因

如果继续在本轮内追求：
- 更完整的 lanes 解释；
- hooks 对照；
- 调度分支细节；
- 更细的 beginWork / completeWork 展开；

那么很容易把 M4 重新拖进 M5 的范围，破坏当前模块边界。

从项目节奏看，更合理的做法是：

1. 认可 M4 作为一个边界清楚的模块包已经成立；
2. 先形成下一次本地 milestone commit；
3. 再把优先级/调度系统化问题留给 M5。

---

## 一句话判断

**M4 现在已经“够完整、够清楚、够有证据”，适合进入下一次本地里程碑提交；剩余问题属于可后续优化，而不是提交阻塞项。**
