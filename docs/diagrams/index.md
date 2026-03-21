# React Fiber 图示总览

这页只负责做图示入口，不重复展开正文。

建议使用顺序：

1. 先看 `react-learning-roadmap.svg`，拿到整条学习链；
2. 再按 M1 → M6 逐张进入对应图示；
3. 看不懂时回到对应模块正文与 evidence notes。

## 推荐先看

- 学习路线总图：`react-learning-roadmap.svg`
- M1 旧模型 vs Fiber 能力对比：`react-old-sync-vs-fiber.svg`
- M3 双树与 commit 关系：`react-current-wip-commit.svg`
- M4 一次 `setState` 全链路：`react-setstate-full-path.svg`

## 按模块进入

### 总览入口
- `react-learning-roadmap.svg` — 用一张图把 M1-M6 串成连续解释链。

### M1｜为什么需要 Fiber
- `react-old-sync-vs-fiber.svg` — 对比旧同步渲染模型与 Fiber 带来的控制能力变化。

### M2｜Fiber 节点与遍历
- `react-fiber-node-traversal.svg` — 说明 Fiber 节点关键字段分组、child / sibling / return 关系与 beginWork / completeWork 骨架。

### M3｜current / workInProgress / commit
- `react-current-wip-commit.svg` — 说明 current、workInProgress、finishedWork 与 commit 边界。

### M4｜一次更新全链路
- `react-setstate-full-path.svg` — 说明一次 `setState` 如何从组件、Fiber、root 一路进入 render / commit。

### M5｜lanes / root / scheduler
- `react-lanes-assignment.svg` — 更新如何归类进入 lanes，root 内部 lanes 状态流转
- `react-scheduler-render-loop.svg` — ensureRootIsScheduled、scheduler、render work loop 的协作分工

### M6｜Suspense / Offscreen / ping / retry
- `react-suspense-offscreen-ping-retry.svg` — 说明主内容挂起后的 fallback、hidden Offscreen 与 retry 闭环。

## 阅读提醒

- 这些图优先服务理解，不追求覆盖所有源码细节。
- 图中的主结论应与各模块正文保持同一口径。
- 如果只想快速复习，建议优先看：M1、M3、M4、M5 四张。
