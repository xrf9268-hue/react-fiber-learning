---
outline: [2, 3]
---

# React Fiber 图示总览

建议使用顺序：

1. 先看学习路线总图，拿到整条学习链；
2. 再按 M1 → M6 逐张进入对应图示；
3. 看不懂时回到对应模块正文与证据笔记。

---

## 学习路线总图

用一张图把 M1-M6 串成连续解释链。

![学习路线总图](/diagrams/react-learning-roadmap.svg)

---

## M1 | 旧模型 vs Fiber 能力对比

对比旧同步渲染模型与 Fiber 带来的控制能力变化。

[前往 M1 正文 →](/modules/m1)

![旧模型 vs Fiber](/diagrams/react-old-sync-vs-fiber.svg)

---

## M2 | Fiber 节点与遍历

说明 Fiber 节点关键字段分组、child / sibling / return 关系与 beginWork / completeWork 骨架。

[前往 M2 正文 →](/modules/m2)

![Fiber 节点与遍历](/diagrams/react-fiber-node-traversal.svg)

---

## M3 | current / workInProgress / commit

说明 current、workInProgress、finishedWork 与 commit 边界。

[前往 M3 正文 →](/modules/m3)

![双树与 commit](/diagrams/react-current-wip-commit.svg)

---

## M4 | 一次 setState 全链路

说明一次 `setState` 如何从组件、Fiber、root 一路进入 render / commit。

[前往 M4 正文 →](/modules/m4)

![setState 全链路](/diagrams/react-setstate-full-path.svg)

---

## M5 | lanes 分配与状态流转

更新如何归类进入 lanes，root 内部 lanes 状态流转。

[前往 M5 正文 →](/modules/m5)

![lanes 分配](/diagrams/react-lanes-assignment.svg)

### Scheduler 与 render work loop

ensureRootIsScheduled、scheduler、render work loop 的协作分工。

![Scheduler 与 render loop](/diagrams/react-scheduler-render-loop.svg)

---

## M6 | Suspense / Offscreen / ping / retry

说明主内容挂起后的 fallback、hidden Offscreen 与 retry 闭环。

[前往 M6 正文 →](/modules/m6)

![Suspense ping retry](/diagrams/react-suspense-offscreen-ping-retry.svg)

---

## 阅读提醒

- 这些图优先服务理解，不追求覆盖所有源码细节。
- 图中的主结论应与各模块正文保持同一口径。
- 如果只想快速复习，建议优先看：M1、M3、M4、M5 四张。
