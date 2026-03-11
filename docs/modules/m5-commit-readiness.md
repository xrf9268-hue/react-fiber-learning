# M5｜提交就绪性说明

## 结论
- **结论：基本已具备进入下一次本地里程碑提交的条件。**
- 判断依据：M5 的最小教学主线、官方证据笔记、自检记录已经齐备；本轮又补做了轻度措辞收束与证据呈现整理。
- 不建议再继续无限打磨。当前更合理的动作是：以 **M5 模块包完成** 为边界准备本地提交，然后再进入 M6。

## 这次提交建议包含的文件

### 核心模块文件
- `docs/modules/m5-evidence-notes.md`
- `docs/modules/m5-lanes-priority-scheduler-transition-draft.md`
- `docs/modules/m5-self-review.md`
- `docs/modules/m5-commit-readiness.md`

### 可一并纳入的项目状态文件
- `STATUS.md`
- `checkpoints/2026-03-11-progress.md`

### 可选文件
- 若补了一页极小的图示/对比说明，可一并提交；
- 若没有，就不必为了“凑完整模块模板”强行新增。

## 为什么说现在可以提交

### 1. 模块主线已经闭合
M5 当前已经能稳定回答以下问题：
- 更新为什么先拿 lane；
- lane 为什么不是简单数字优先级，而是位集合；
- root 为什么是 lanes 的总账本；
- `getNextLanes` 为什么是在选下一批工作；
- `ensureRootIsScheduled` 怎样把 root 选择结果接到 scheduler callback；
- concurrent render 为什么强调“可让位、可续跑、可放弃旧 render”；
- `startTransition` 为什么代表“非紧急、可让位”的更新。

这说明 M5 已不是零散笔记，而是一个可独立阅读的模块包。

### 2. 证据链已经足够支撑正文
当前证据已覆盖：
- `requestUpdateLane`
- `markRootUpdated`
- root 上 pending / suspended / pinged / expired / entangled 字段
- `getNextLanes`
- `markStarvedLanesAsExpired`
- `ensureRootIsScheduled`
- `performConcurrentWorkOnRoot`
- `startTransition`
- `requestCurrentTransition`
- `claimNextTransitionLane`
- `entangleTransitions`
- React 18 `CHANGELOG.md` 对 urgent / non-urgent / interruptible 的公开表述

对 M5 这个边界而言，证据密度已经够用，不需要再把正文拖进更深的宿主调度或 Suspense 细节。

### 3. 范围控制是成功的，而不是遗漏
当前稿件刻意没有展开：
- Suspense / Offscreen 机制
- React 19 / main 的新语义细节
- Scheduler 宿主层实现
- 全量 lane 常量背诵

这些不是缺漏，而是模块边界控制的结果。它们更适合放到 M6 或最终总览阶段。

## 仍存在的缺口，但不阻塞本次提交

### 1. 还可以再压缩少量段落
正文目前已经清楚，但仍有少数段落可以继续收紧，让整体更接近“最终讲义稿”。

这属于 **表达优化**，不影响模块结论成立，因此**不阻塞提交**。

### 2. 可补一张很小的后续图示说明
后面如果要做总览图，M5 很适合补一张极简关系图，例如：
- 更新进入 `requestUpdateLane`
- root 维护 lanes 总账本
- `getNextLanes` 选择下一批工作
- `ensureRootIsScheduled` 安排 callback
- concurrent work loop 推进 render
- transition 作为非紧急 lane 参与这条主线

这会提升后续视觉整理效率，但**不是本次提交前置条件**。

### 3. 计划文件里的一个旧表述需要按现实理解
早前规划里提到过 `ReactFiberRootScheduler.old.js`，但 v18.2.0 基线下并没有这个 old 文件；实际 root 调度桥梁在 `ReactFiberWorkLoop.old.js` 中，React main 才拆出 `ReactFiberRootScheduler.js`。

这已经在证据笔记中被澄清，因此**不构成阻塞**；提交时只需接受“计划名词曾偏粗、正文已纠正到位”这一现实即可。

## 不建议为了提交前再做的事
- 不建议继续扩展到 Suspense / Offscreen；
- 不建议补写 React 19 对照专题；
- 不建议把 Scheduler 包底层实现细节拉进正文；
- 不建议把 M5 改写成“所有 lane 常量大全”。

这些都会稀释本次提交边界。

## 建议的提交边界表达
如果主代理随后执行本地提交，建议把提交语义保持在：
- **完成 M5 lanes / priority / scheduler / transition 模块包**

也就是把它视为继 M4 之后的下一次独立学习里程碑，而不是“顺手提前打开 M6”。

## 提交后的自然下一步
1. 关闭本次 M5 里程碑；
2. 在 `STATUS.md` 中把 M5 切换到完成状态；
3. 进入 M6 的有界规划；
4. 将 Suspense / Offscreen / React main 增量放到新的模块边界里处理。
