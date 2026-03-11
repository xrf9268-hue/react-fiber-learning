# M5｜官方证据笔记：lanes / priority / scheduler / transition

> 基线：React v18.2.0 本地 upstream mirror  
> 对照：React main 仅做最小结构确认，不展开 React 19 语义

## 1. 一次更新先拿到 lane，而不是先“立刻执行”

### 证据
- `packages/react-reconciler/src/ReactFiberClassComponent.old.js:207`
  - 类组件 `enqueueSetState` 路径先调用 `requestUpdateLane(fiber)`。
- `packages/react-reconciler/src/ReactFiberHooks.old.js:1144, 1164, 2209, 2248`
  - hooks 多条更新路径同样先调用 `requestUpdateLane(fiber)`。
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:447-512`
  - `requestUpdateLane` 先区分：非 ConcurrentMode 直接 `SyncLane`；render phase 特例复用当前 render lanes；若当前处于 transition，则分配 transition lane；否则根据当前 update priority / event priority 取得 lane。

### 结论
- M5 的真正起点不是“开始 render”，而是“更新先被归到某个 lane”。
- lane 决定的是这次更新属于哪类工作、应按什么紧急程度参与后续调度。
- `startTransition` 并不是直接调度 render；它先影响 `requestUpdateLane` 的分配结果。

---

## 2. lane 不是单个数字优先级，而是位集合

### 证据
- `packages/react-reconciler/src/ReactFiberLane.old.js`
  - 文件整体以位运算组织 lanes；核心操作大量使用按位与/或。
- `packages/react-reconciler/src/ReactFiberLane.old.js:462-488`
  - `includesOnlyTransitions(lanes)`、`isTransitionLane(lane)` 都把 lane 当集合处理。
- `packages/react-reconciler/src/ReactFiberLane.old.js:492-500`
  - `claimNextTransitionLane()` 通过左移在一组 transition lanes 中轮转分配，而不是返回一个普通排序整数。
- `packages/react-reconciler/src/ReactFiberLane.old.js:187-303`
  - `getNextLanes` 以 `pendingLanes`、`suspendedLanes`、`pingedLanes` 等集合交并方式选择下一批工作。

### 结论
- lane 更像“带优先级语义的工作位集合”。
- 这套编码既能表达“哪类更急”，也能表达“哪些更新要作为同一批工作一起看待”。
- 学 M5 不需要背所有 lane 常量，但必须建立“集合选择”而不是“单值排序”的心智模型。

---

## 3. root 是 lanes 的总账本

### 证据
- `packages/react-reconciler/src/ReactFiberRoot.old.js:67-83`
  - root 初始化时保存：`callbackNode`、`callbackPriority`、`eventTimes`、`expirationTimes`、`pendingLanes`、`suspendedLanes`、`pingedLanes`、`expiredLanes`、`entangledLanes`、`entanglements` 等。
- `packages/react-reconciler/src/ReactFiberLane.old.js:574-599`
  - `markRootUpdated` 把 `updateLane` 并入 `root.pendingLanes`，并在非 idle 更新时清空 `suspendedLanes` / `pingedLanes`，随后记录该 lane 的 `eventTime`。
- `packages/react-reconciler/src/ReactFiberLane.old.js:605-629`
  - `markRootSuspended`、`markRootPinged` 直接维护 root 上的 suspended / pinged 状态。
- `packages/react-reconciler/src/ReactFiberLane.old.js:635-664`
  - `markRootFinished` 以 `remainingLanes` 回写 root，并清理不再 pending 的 lanes 的 entanglement / eventTimes / expirationTimes。

### 结论
- Fiber 节点上当然也有局部标记，但 M5 讨论的“系统级待处理工作状态”集中放在 root 上。
- root 不只是 current / finishedWork 的交换点，也是“还有什么工作、哪些被挂起、哪些被唤醒、哪些已过期”的总账本。

---

## 4. `getNextLanes` 负责选“下一批工作”，不是执行组件逻辑

### 证据
- `packages/react-reconciler/src/ReactFiberLane.old.js:187-303`
  - `getNextLanes(root, wipLanes)` 先从 `root.pendingLanes` 出发；优先选 non-idle；被 `suspendedLanes` 阻塞时改看 `pingedLanes`；必要时比较当前 in-progress 的 `wipLanes` 与新候选 lanes，决定是否中断当前 render。
- `packages/react-reconciler/src/ReactFiberLane.old.js:389-425`
  - `markStarvedLanesAsExpired` 会把长期饥饿的 lane 标进 `root.expiredLanes`，为下一轮选择提供强制推进依据。
- `packages/react-reconciler/src/ReactFiberLane.old.js:258-299`
  - 选择结束后还会把 entangled lanes 一并并入 `nextLanes`。

### 结论
- React 不是“看到更新就无条件全部做完”，而是反复在 root 级别重算“现在最值得做的是哪一批 lanes”。
- `getNextLanes` 的职责是选批次；真正执行组件 render 的是后面的 work loop。
- suspended / pinged / expired 会直接改变“谁先做”的结果，因此它们属于调度主线，不是附带字段。

---

## 5. Scheduler 协作在 v18.2.0 中主要体现在 `ensureRootIsScheduled`

### 证据
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:549-635, 670-671`
  - `scheduleUpdateOnFiber` 在 `markRootUpdated` 之后调用 `ensureRootIsScheduled(root, eventTime)`。
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:691-822`
  - `ensureRootIsScheduled` 会：
    1. 先 `markStarvedLanesAsExpired`；
    2. 再 `getNextLanes`；
    3. 若没有工作则取消已有 callback；
    4. 若有工作则取 `getHighestPriorityLane(nextLanes)` 作为 callback priority；
    5. 若优先级未变可复用旧 callback；否则取消旧 callback 并重新 `scheduleCallback(...)` 或安排 sync callback。
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:814`
  - 并发任务调度到 `performConcurrentWorkOnRoot.bind(null, root)`。

### 结论
- 对 v18.2.0 而言，M5 不必硬讲一个独立 `ReactFiberRootScheduler.old.js` 文件；root 调度桥梁在 `ReactFiberWorkLoop.old.js` 中已经成立。
- scheduler 的角色更像“给 root 安排下一次执行机会”；Fiber work loop 决定“这次真正渲染哪些 lanes、怎样推进到 commit”。
- React 不会为每个更新都盲目新建独立任务，而是尽量复用或重排 root 的 callback。

### 最小 main 对照
- React main 已把这部分主线拆到 `packages/react-reconciler/src/ReactFiberRootScheduler.js`，其中仍保留 `ensureRootIsScheduled`、`getNextLanes` 等骨架调用。
- 说明：实现组织位置变了，但“root 选 lane → 安排 callback → 进入 work loop”的主线没变。

---

## 6. 并发 render 的关键不是多线程，而是可中断、可续跑、可重排

### 证据
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:824-957`
  - `performConcurrentWorkOnRoot` 先 `flushPassiveEffects`，然后重新 `getNextLanes`，再根据 `includesBlockingLane` / `includesExpiredLane` / `didTimeout` 决定走 `renderRootConcurrent` 还是 `renderRootSync`。
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:877-953`
  - 如果并发 render 没完成，会 `ensureRootIsScheduled(root, now())`，并在 callback 未变时返回 continuation：`performConcurrentWorkOnRoot.bind(null, root)`。
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:1743` 起
  - 存在独立的 `renderRootConcurrent` 路径，与同步 render 区分开。
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js:15`
  - 文件开头注释明确提到：如果 work-in-progress render 在完成前被丢弃，依赖双缓冲机制处理。
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js:300-301`
  - 对 render phase captured updates 明确写着：如果 render aborted，这些更新应被丢弃。

### 结论
- 所谓 concurrent，核心是“未提交前的 render 计划可以调整”，不是浏览器里开出另一条线程并行渲染。
- React 可以在更高优先级工作到来时暂停当前并发工作，之后续跑、重试，必要时放弃旧的 work-in-progress。
- M5 这里讲到“render 可被放弃”就够了，不必扩展到完整 Suspense / Offscreen 机制。

---

## 7. transition 的公开口径：非紧急，可被更紧急更新打断

### 证据
- `packages/react/src/ReactStartTransition.js:14-49`
  - `startTransition(scope, options)` 的做法是临时写入 `ReactCurrentBatchConfig.transition`，执行 `scope()`，最后恢复先前的 transition 上下文。
- `packages/react/src/React.js:67, 113-121`
  - `startTransition` 从 React 顶层公开导出。
- `CHANGELOG.md:41-42`
  - React 18 官方发布说明直接写明：
    - `startTransition` / `useTransition` 可把一些 state updates 标记为 **not urgent**；
    - urgent updates（如输入框更新）可以打断 non-urgent updates（如搜索结果列表渲染）；
    - deferred render 是 interruptible，不会阻塞用户输入。

### 结论
- 官方公开语义非常明确：transition 不是“更快执行”，而是“没那么急，可以让位”。
- M5 讲 urgent vs non-urgent 有直接官方文字依据，不需要靠二次推断。

---

## 8. transition lane 的内部落地：通过 transition 上下文影响 lane 分配

### 证据
- `packages/react-reconciler/src/ReactFiberTransition.js:11-17`
  - `requestCurrentTransition()` 直接读取 `ReactCurrentBatchConfig.transition`。
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js:469-490`
  - `requestUpdateLane` 判断 `requestCurrentTransition() !== NoTransition` 时，会在同一事件内缓存并复用 `currentEventTransitionLane`；首次需要时调用 `claimNextTransitionLane()`。
- `packages/react-reconciler/src/ReactFiberLane.old.js:492-500`
  - `claimNextTransitionLane()` 在 transition lanes 中轮转分配新 lane。
- `packages/react-reconciler/src/ReactFiberHooks.old.js:2007-2055`
  - hook 版 `startTransition` 除了设置 pending state 外，也会设置 `ReactCurrentBatchConfig.transition`，因此它同样会影响后续更新拿到 transition lane。

### 结论
- transition 不是口头标签；它确实会通过“当前 transition 上下文”改变更新拿到的 lane。
- 同一事件里的 transition updates 会复用同一个 transition lane，这为“把一组过渡工作当成同类工作管理”提供了基础。

---

## 9. entanglement：某些 transition lanes 需要绑定为同批工作

### 证据
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js:267-289`
  - `entangleTransitions(root, fiber, lane)` 仅在 `isTransitionLane(lane)` 时生效；它把 queue 上已有的 transition lanes 与新 lane 合并，再调用 `markRootEntangled(root, newQueueLanes)`。
- `packages/react-reconciler/src/ReactFiberLane.old.js:666-692`
  - `markRootEntangled` 会把新 entanglement 写入 root，并处理传递性 entanglement。
- `packages/react-reconciler/src/ReactFiberLane.old.js:258-299`
  - `getNextLanes` 在选出 `nextLanes` 后，会把 entangled lanes 一并并入当前批次。

### 结论
- entanglement 的含义不是“永远完全同步”，而是“这些 lanes 不应被拆散到互相无关的批次里”。
- 对 M5 来说，讲到“同一过渡中的相关工作，React 会尽量绑定一起管理”就足够。

---

## 10. M5 可稳定使用的一句总骨架

**React 18 里的优先级主线不是“收到更新就渲染”，而是：更新先拿到 lane；root 记录并维护各类 pending / suspended / pinged / expired 状态；`getNextLanes` 选择下一批最值得做的工作；`ensureRootIsScheduled` 为 root 安排合适 callback；并发 work loop 在未 commit 前允许让位、续跑或放弃旧 render；`startTransition` 则把一类更新明确标成可让位的非紧急工作。**

---

## 本轮刻意不展开的内容

- 不系统展开 Suspense / Offscreen 行为。
- 不背诵全部 lane 常量清单。
- 不深挖 Scheduler 包内部宿主调度实现。
- 不进入 React main 的 async actions / transition type 新语义。
- 不把 transition tracing、hydration 细节纳入正文主线。
