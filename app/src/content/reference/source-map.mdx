# Official Source Map (Initial)

This is the minimal source-reading map for learning Fiber from the official React repository without getting buried in the whole codebase.

## Baseline Strategy

- **Primary learning baseline:** `v18.2.0`
- **Delta comparison target:** `main` (React 19 era ongoing work)
- **Rule:** learn the stable skeleton first, then compare newer extensions.

> **注意**：React 18.2.0 的 reconciler 核心文件采用 fork 机制，同时存在 `.old.js` 和 `.new.js` 两个版本（内容几乎相同）。本文档统一引用 `.old.js` 版本。

## Phase A — vocabulary and data structures

### 1. Fiber node shape
- `packages/react-reconciler/src/ReactFiber.old.js`
- `packages/react-reconciler/src/ReactInternalTypes.js`

**Questions to answer**
- What fields live on a Fiber node?
- What are `child`, `sibling`, `return`, `alternate`?
- What are `pendingProps`, `memoizedProps`, `memoizedState`, `flags`, `lanes`?

### 2. Enums / tags / flags / lanes
- `packages/react-reconciler/src/ReactWorkTags.js`
- `packages/react-reconciler/src/ReactFiberFlags.js`
- `packages/react-reconciler/src/ReactFiberLane.old.js`
- `packages/react-reconciler/src/ReactRootTags.js`

**Questions to answer**
- What kinds of Fiber exist?
- Which side effects are tracked via flags?
- How do lanes encode priority?

## Phase B — update entry and scheduling

### 3. Class component update entry
- `packages/react-reconciler/src/ReactFiberClassComponent.old.js`
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`

**Initial functions to follow**
- `classComponentUpdater.enqueueSetState`
- `createUpdate` / `enqueueUpdate`
- `processUpdateQueue`

### 4. Hook update entry
- `packages/react-reconciler/src/ReactFiberHooks.old.js`

**Initial functions to follow**
- `dispatchSetState`
- Hook update queue helpers nearby

### 5. Concurrent update helpers
- `packages/react-reconciler/src/ReactFiberConcurrentUpdates.old.js`

**Initial functions to follow**
- `enqueueConcurrentClassUpdate`
- `enqueueConcurrentHookUpdate`
- `markUpdateLaneFromFiberToRoot`

### 6. Scheduling and work loop
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

**Initial functions to follow**
- `scheduleUpdateOnFiber`
- `ensureRootIsScheduled`（18.2.0 中定义在 ReactFiberWorkLoop 内，React 19 才拆分到独立文件）
- `performConcurrentWorkOnRoot`
- `renderRootConcurrent`
- `commitRoot`

## Phase C — render phase

### 7. Begin / reconcile / complete
- `packages/react-reconciler/src/ReactFiberBeginWork.old.js`
- `packages/react-reconciler/src/ReactChildFiber.old.js`
- `packages/react-reconciler/src/ReactFiberCompleteWork.old.js`

**Questions to answer**
- How does React descend the tree?
- How are children reconciled?
- What work is prepared before commit?

## Phase D — commit phase

### 8. Commit effects
- `packages/react-reconciler/src/ReactFiberCommitWork.old.js`

> 注意：18.2.0 中 commit 阶段的所有 effect 处理逻辑全部在 `ReactFiberCommitWork.old.js` 内。`ReactFiberCommitEffects.js` 和 `ReactFiberCommitHostEffects.js` 是 React 19 开发期间才拆分出来的文件，在 18.2.0 中不存在。

**Questions to answer**
- What becomes visible during commit?
- What is the difference between mutation, layout, and passive work?

## Phase E — advanced extensions

### 9. Scheduler package
- `packages/scheduler/src/*`

### 10. Suspense / offscreen
- `packages/react-reconciler/src/ReactFiberSuspenseComponent.old.js`
- `packages/react-reconciler/src/ReactFiberThrow.old.js`
- `packages/react-reconciler/src/ReactFiberOffscreenComponent.js`

> 注意：`ReactFiberThenable.js` 在 18.2.0 中不存在，Thenable 处理逻辑主要在 `ReactFiberThrow.old.js` 中。

## Reading Rule

Do not attempt to linearly read the whole repository. Always start from a question and trace only the functions that answer it.

## First Trace

The first end-to-end trace for this project is（类组件 `setState` 路径）：

`this.setState` → `enqueueSetState` → `enqueueUpdate`（内部调用 `markUpdateLaneFromFiberToRoot` 向上标记并返回 root）→ `scheduleUpdateOnFiber` → `ensureRootIsScheduled` → `performConcurrentWorkOnRoot` → `renderRootConcurrent` → `beginWork` / `completeWork` → `commitRoot`

函数组件 hooks 路径入口为 `dispatchSetState`，后续同样汇入 `scheduleUpdateOnFiber`。
