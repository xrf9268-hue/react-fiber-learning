# React Fiber 教程 vs React 18.2.0 源码核对审查报告

> 审查日期：2026-03-20
> 对照基线：React v18.2.0 (`/tmp/react-18.2.0`)
> 审查范围：M1-M6 全部模块正文 + final-guide-draft + 参考文件（fiber-fields / lane-constants / source-map）

---

## 总体评价

**教程整体质量很高。** M1-M6 的概念主线准确，因果链成立，核心结论全部能被源码证据支撑。问题主要集中在三个参考文件（source-map.md、fiber-fields.md、lane-constants.md）和 M4 的调用链细节上。

| 模块 | 评级 | 说明 |
|------|------|------|
| M1 | 优秀 | 概念准确，措辞克制，无技术错误 |
| M2 | 优秀 | 代码骨架与源码高度一致，遍历逻辑清晰 |
| M3 | 优秀 | 所有核心描述与源码一致，`root.current = finishedWork` 位置精确 |
| M4 | 良好 | 主线正确，但调用链有一处严重描述问题和若干中等问题 |
| M5 | 优秀 | lanes/scheduler/transition 描述准确，"并发"去神秘化到位 |
| M6 | 良好 | 主线正确，但 retry 双路径描述不完整，Offscreen baseLanes 状态需标注 |
| final-guide | 优秀 | 因果链成立，五大误区纠正全部准确 |
| fiber-fields | 需修正 | 两个关键字段写入时机描述错误 |
| lane-constants | 良好 | 常量值全部正确，一处 API 名称虚构 |
| source-map | 需修正 | 大面积文件路径不匹配 18.2.0 的 fork 机制 |

---

## 严重问题（5 项）

### S1. source-map.md：大量文件路径缺少 `.old.js` / `.new.js` 后缀

React 18.2.0 reconciler 采用 fork 机制，核心文件都有 `.old.js` 和 `.new.js` 两个版本。教程中 `ReactFiber.js`、`ReactFiberWorkLoop.js`、`ReactFiberBeginWork.js` 等 10+ 个路径均不存在。

**影响**：读者按路径找不到源码文件。

### S2. source-map.md：3 个文件在 18.2.0 中完全不存在

- `ReactFiberRootScheduler.js` — React 19 开发期间才拆分出来，18.2.0 中 `ensureRootIsScheduled` 在 `ReactFiberWorkLoop` 内
- `ReactFiberCommitEffects.js` — 不存在
- `ReactFiberCommitHostEffects.js` — 不存在
- `ReactFiberThenable.js` — 不存在

**影响**：读者会误以为 18.2.0 有这些文件。

### S3. fiber-fields.md：`memoizedProps` 写入时机标注错误

教程称 "`completeWork` 完成后写入"。实际在 `performUnitOfWork` 中、`beginWork` 返回后立即写入：
```js
// ReactFiberWorkLoop.old.js 第 1848 行
unitOfWork.memoizedProps = unitOfWork.pendingProps;
```
`completeWork` 内部从未写入 `memoizedProps`（grep 验证为零次）。

**影响**：读者对 render 阶段内部时序建立错误心智模型。

### S4. fiber-fields.md：`memoizedState` 写入时机标注错误

教程称"commit 后由 `processUpdateQueue` / hooks 写入"。实际在 **render 阶段**（`beginWork` 内部）写入：
- 类组件：`processUpdateQueue` 在 `beginWork` 内调用，`workInProgress.memoizedState = newState`
- 函数组件：hooks 在 render 期间执行时写入

**影响**：与教程底部生命周期图自相矛盾（图中标注为 beginWork 阶段反而是对的）。

### S5. M4：`markUpdateLaneFromFiberToRoot` 被描述为独立步骤

教程将其列为步骤 3（enqueueUpdate 入队）和步骤 5（scheduleUpdateOnFiber）之间的独立步骤 4。实际它是 `enqueueUpdate` **内部**的一部分：

```
enqueueSetState
  -> enqueueUpdate(fiber, update, lane)
       -> enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane)
            -> markUpdateLaneFromFiberToRoot(fiber, lane)  // 内部调用
       -> 返回 root
  -> scheduleUpdateOnFiber(root, fiber, lane, eventTime)
```

入队和向上标记是在同一个调用内完成的。

**影响**：读者误以为入队和向上标记是两个分离的外部步骤。

---

## 中等问题（8 项）

### M1. M4：`enqueueUpdate` 返回 root 的机制未讲清

教程前文把 `enqueueUpdate` 只描述为"把 update 放进队列"，没有提到它同时向上标记 lanes 并返回 root。读者会困惑 root 从哪来。

### M2. M4：向上标记时遗漏 alternate 的 `childLanes`

源码中 `markUpdateLaneFromFiberToRoot` 向上走时，**每一层祖先的 alternate 的 `childLanes` 也会被标记**。这与双树模型直接相关。

### M3. M4：缺少 `ensureRootIsScheduled` 这一关键环节

教程十步模型中步骤 5 只提到 `markRootUpdated`，但 `scheduleUpdateOnFiber` 内部还调用 `ensureRootIsScheduled` — 没有它 render 根本不会被触发。

### M4. M5：`expiredLanes` 的"强制推进"描述不够精确

过期 lane 的实际效果不是"被选择得更优先"，而是"一旦被选中就禁用 time slicing"（通过 `includesExpiredLane` 检查）。教程表述方向基本对，但机制细节有偏差。

### M5. M6：`retryTimedOutBoundary` 中"更新重新挂到 root"用词不准确

实际调用的是 `enqueueConcurrentRenderForLane`（标记需要重新 render），而非创建 update 对象入队。

### M6. M6：Offscreen `baseLanes` 在 18.2.0 中未实际启用

源码注释："TODO: This doesn't do anything, yet. It's always NoLanes." 教程应标注此字段在 18.2.0 中的实际状态。

### M7. M6：缺少 retry 双路径的完整说明

Suspense retry 实际有两条路径：
- **ping 路径**：`attachPingListener` → resolve → `pingSuspendedRoot` → `ensureRootIsScheduled`
- **retry 路径**：`attachRetryListener` → commit 阶段 `resolveRetryWakeable` → `retryTimedOutBoundary`

教程主要讲了 ping 路径，对 retry 路径的触发链缺乏说明。

### M8. lane-constants.md：`IdleLane` 触发场景描述 "useIdleCallback 等价" 不准确

React 18.2.0 中不存在 `useIdleCallback` API。`IdleLane` 通常由 offscreen 预渲染等内部机制触发。

---

## 轻微问题（8 项）

| 编号 | 文件 | 问题 |
|------|------|------|
| L1 | M4 | 开头声称"共十步"实际只有八步 |
| L2 | M1 | React 16 async rendering 描述未说明当时并未默认开启 |
| L3 | M2 | `WorkTag` 示例列表遗漏 `IndeterminateComponent`（函数组件首次渲染时的实际 tag） |
| L4 | fiber-fields.md | 源码文件引用 `.new.js` 与教程其他部分引用 `.old.js` 不一致 |
| L5 | fiber-fields.md | 生命周期图中 `memoizedProps` 阶段标注与实际不符（与 S3 同源） |
| L6 | lane-constants.md | `requestUpdateLane` 文件位置标注与教程其他部分不一致（`.old.js` vs `.new.js`） |
| L7 | final-guide | M4 选取"类组件 this.setState"，但 source-map 的 First Trace 用的是 `dispatchSetState`（hooks），前后不一致 |
| L8 | M5 延伸阅读 | `retryDehydratedSuspenseBoundary` 作为通用 retry 入口描述有误，该函数仅用于 SSR dehydrated boundary |

---

## 教学改进建议（9 项）

| 编号 | 建议 |
|------|------|
| D1 | fiber-fields.md 补充 `tag`、`stateNode`、`updateQueue`、`type` 四个高频字段 |
| D2 | M2 的 `completeUnitOfWork` 骨架可加注提示省略了 `unwindWork` 错误处理路径 |
| D3 | M4 可补充一句提及 `entangleTransitions` 的存在（即使不展开） |
| D4 | M4 可区分两个 `enqueueUpdate` 的文件位置，避免读者查源码时困惑 |
| D5 | M5 补充 lane 过期时间量级差异（SyncLane 250ms / Transition 5000ms / Retry/Idle 永不过期） |
| D6 | M5 补充 `includesBlockingLane` 对 time slicing 决策的影响 |
| D7 | M6 补充 `renderDidSuspendDelayIfPossible` 对 commit 延迟的影响（理解 transition 中 Suspense 不立即显示 fallback 的关键） |
| D8 | lane-constants.md 可在脚注中提及 hydration 相关 lane 的存在 |
| D9 | final-guide 推荐复习顺序可加提示："如果 M3 中遇到不熟悉的字段，回看 M2" |

---

## 修复优先级排序

### 第一优先级（严重，影响读者理解）

1. **source-map.md** — 修正所有文件路径，删除不存在的文件条目
2. **fiber-fields.md** — 修正 `memoizedProps` 和 `memoizedState` 的写入时机
3. **M4** — 合并步骤 3/4，补充 `ensureRootIsScheduled`

### 第二优先级（中等，提升精确度）

4. M4 — 补充 `enqueueUpdate` 返回 root 的机制说明
5. M6 — 补充 retry 双路径、标注 `baseLanes` 实际状态
6. M5 — 精确 `expiredLanes` 的实际效果
7. lane-constants.md — 修正 `useIdleCallback` 为准确描述

### 第三优先级（轻微+建议，锦上添花）

8. 修正 M4 "十步"/"八步"不一致
9. 统一 `.old.js` / `.new.js` 引用
10. 补充教学改进建议（D1-D9）
