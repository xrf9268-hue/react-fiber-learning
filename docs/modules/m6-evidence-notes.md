# M6｜官方证据笔记：Suspense / Offscreen / React 19 deltas

## 说明

- 基线：**React v18.2.0** 本地 upstream mirror。
- 对照：只做**少量 React main / React 19** 补充，用来确认教学骨架仍成立。
- 本文只保留 M6 正文真正需要的证据，不扩展到 RSC、`use`、流式 SSR、Activity、ViewTransition。

---

## 1. Suspense 的第一层本质：不是“loading 组件”，而是 render 遇到暂时无法继续时的边界协调

### 证据 A：`updateSuspenseComponent` 先决定这轮是走主内容还是 fallback

文件：`packages/react-reconciler/src/ReactFiberBeginWork.old.js`

关键点：

- `updateSuspenseComponent(current, workInProgress, renderLanes)` 里先计算 `didSuspend`，再结合 `shouldRemainOnFallback(...)` 决定 `showFallback`。
- 如果某个子树已经 suspend，或者当前边界应该继续停留在 fallback，就把 `showFallback = true`。
- 否则继续尝试主内容。

可直接引用的源码信号：

- `const didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;`
- `if (didSuspend || shouldRemainOnFallback(...)) { showFallback = true; ... }`
- 注释明确写着：`Something in this boundary's subtree already suspended. Switch to rendering the fallback children.`

结论：

- Suspense boundary 的核心职责是：**在当前 render 里决定主内容是否还能继续，否则转入 fallback 分支**。
- 所以它首先是一个 **render 控制流协调点**，不是一个单纯的 JSX 占位容器。

### 证据 B：主内容与 fallback 在 Fiber 结构上不是“二选一销毁”，而是通过 Offscreen 包装主内容

同文件：`ReactFiberBeginWork.old.js`

关键点：

- `mountSuspensePrimaryChildren(...)` 会把主内容包装进一个 `Offscreen` fiber，且 `mode: 'visible'`。
- `mountSuspenseFallbackChildren(...)` 在 fallback 分支下，会把主内容包装成 `mode: 'hidden'` 的 Offscreen fiber，再把 fallback fragment 作为它的兄弟节点接上。
- 更新阶段如果 `showFallback`，也会把主内容对应的 primary child fragment 记上 `OffscreenState`，并把 `workInProgress.memoizedState = SUSPENDED_MARKER`。

可直接引用的源码信号：

- `const primaryChildProps: OffscreenProps = { mode: 'visible', children: primaryChildren }`
- `const primaryChildProps: OffscreenProps = { mode: 'hidden', children: primaryChildren }`
- `primaryChildFragment.memoizedState = mountSuspenseOffscreenState(renderLanes)`
- `workInProgress.memoizedState = SUSPENDED_MARKER`

结论：

- fallback 出现时，React 的内部结构不是“把主内容概念上抹掉”，而是常常把主内容放进**隐藏但保留的 Offscreen 子树**里，再显示 fallback。

---

## 2. render 中遇到 thenable / wakeable 时，React 会把它导入 Suspense 路径，而不是普通错误路径

### 证据 A：`throwException` 先识别“这是 wakeable”

文件：`packages/react-reconciler/src/ReactFiberThrow.old.js`

关键点：

- `throwException(...)` 中首先判断：`value !== null && typeof value === 'object' && typeof value.then === 'function'`。
- 满足这个条件时，React 把它视为 `wakeable`，并明确注释：`This is a wakeable. The component suspended.`
- 随后会 `resetSuspendedComponent(...)`，并去找最近的可捕获 Suspense boundary。

可直接引用的源码信号：

- `if (value !== null && typeof value === 'object' && typeof value.then === 'function')`
- `const wakeable: Wakeable = (value: any);`
- 注释：`This is a wakeable. The component suspended.`

结论：

- 从 reconciler 视角看，Suspense 的触发点不是“组件声明了 fallback”，而是**render 过程中抛出了一个可等待的 wakeable**。

### 证据 B：找到最近边界后，会标记该边界进入捕获/回退流程

同文件：`ReactFiberThrow.old.js`

关键点：

- `getNearestSuspenseBoundaryToCapture(returnFiber)` 会沿 return path 往上找最近可捕获的 Suspense boundary。
- 找到后调用 `markSuspenseBoundaryShouldCapture(...)`。
- 并不是立刻当普通错误结束，而是把边界标记到“这一轮要捕获并切换 fallback”的路径上。

可直接引用的源码信号：

- `const suspenseBoundary = getNearestSuspenseBoundaryToCapture(returnFiber);`
- `markSuspenseBoundaryShouldCapture(...)`
- 注释：`This marks a Suspense boundary so that when we're unwinding the stack, it captures the suspended "exception" and does a second (fallback) pass.`

结论：

- Suspense 的核心不是“报错后补救”，而是**把本轮 render 改道到边界捕获 + fallback 第二遍**。

---

## 3. ping / retry 不是附属细节，而是 Suspense 主线的一部分

### 证据 A：`attachPingListener` 在 fallback 还没 commit 前就先挂监听

文件：`packages/react-reconciler/src/ReactFiberThrow.old.js`

关键点：

- `attachPingListener(root, wakeable, lanes)` 的注释直接说明：数据可能在 fallback commit 前就 resolve，所以必须现在就挂 listener。
- 它会把 `(wakeable, lanes)` 记到 `root.pingCache` 里，避免重复挂同一组 listener。
- `wakeable.then(ping, ping)` 最终会回到 `pingSuspendedRoot(...)`。

可直接引用的源码信号：

- 注释：`The data might resolve before we have a chance to commit the fallback... So we need to attach a listener now.`
- `wakeable.then(ping, ping)`

结论：

- React 不是“先 fallback，再慢慢想怎么恢复”；它在 suspend 发生时就已经把**未来恢复的入口**接好了。

### 证据 B：如果 fallback 真的 commit 了，还会给 boundary 自己挂 retry listener

同文件：`ReactFiberThrow.old.js`

关键点：

- `attachRetryListener(...)` 会把 wakeable 记到 `suspenseBoundary.updateQueue`。
- 注释明确写着：如果 fallback 真的 commit 了，需要另一类 listener，用来在 wakeable resolve 后重新调度 boundary，把 fallback 状态关掉。

结论：

- ping 关注的是 root 级“这批 lanes 可以再试了”；retry listener 关注的是 boundary 级“这个边界可以重试退出 fallback 了”。

---

## 4. Suspense 不是边界私事；一旦 suspend，root 的 lanes 账本会被改写

### 证据 A：`getNextLanes` 会避开 `suspendedLanes`，必要时再选 `pingedLanes`

文件：`packages/react-reconciler/src/ReactFiberLane.old.js`

关键点：

- `getNextLanes(root, wipLanes)` 一开始就读 `root.suspendedLanes` 和 `root.pingedLanes`。
- 选择非 idle 工作时，会优先选 `nonIdlePendingLanes & ~suspendedLanes`。
- 如果没有未阻塞的 lane，才退回去看 `nonIdlePendingLanes & pingedLanes`。
- idle 工作的分支也有同样逻辑：先看未阻塞，再看 pinged。

可直接引用的源码信号：

- `const suspendedLanes = root.suspendedLanes;`
- `const pingedLanes = root.pingedLanes;`
- `const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;`
- `const nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;`

结论：

- M5 的 lanes 机制到了 M6 这里没有失效，反而正是 Suspense 得以工作的账本基础：
  - **被挂起的 lane 暂时不选**
  - **被 ping 的 lane 重新回到候选集**

### 证据 B：`markRootSuspended` 与 `markRootPinged` 直接维护 root 状态

同文件：`ReactFiberLane.old.js`

关键点：

- `markRootSuspended(root, suspendedLanes)` 会：
  - `root.suspendedLanes |= suspendedLanes`
  - `root.pingedLanes &= ~suspendedLanes`
- `markRootPinged(root, pingedLanes, eventTime)` 会：
  - `root.pingedLanes |= root.suspendedLanes & pingedLanes`

结论：

- Suspense 恢复不是“重新 render 一下试试看”的随意行为，而是 root 上有明确账本：
  - 哪些工作被挂起了；
  - 哪些挂起工作又被唤醒了。

---

## 5. ping 之后如何重新进入 work loop

### 证据 A：wakeable resolve 后会进入 `pingSuspendedRoot`

文件：`packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

关键点：

- `pingSuspendedRoot(root, wakeable, pingedLanes)` 会先从 `root.pingCache` 删除已 resolve 的 wakeable。
- 然后调用 `markRootPinged(root, pingedLanes, eventTime)`。
- 最后 `ensureRootIsScheduled(root, eventTime)`，把 root 再次接回调度链。

可直接引用的源码信号：

- `markRootPinged(root, pingedLanes, eventTime);`
- `ensureRootIsScheduled(root, eventTime);`

结论：

- ping 的本质不是“通知某组件好了”，而是**把 root 重新推进调度系统**。

### 证据 B：`retryTimedOutBoundary` 会给边界申请 retry lane 并重新调度 root

同文件：`ReactFiberWorkLoop.old.js`

关键点：

- `retryTimedOutBoundary(boundaryFiber, retryLane)` 用于“之前已经在 fallback 的边界”再次尝试主内容。
- 如果没有现成 `retryLane`，就 `requestRetryLane(boundaryFiber)`。
- 再 `enqueueConcurrentRenderForLane(boundaryFiber, retryLane)`，并对 root 调用：
  - `markRootUpdated(root, retryLane, eventTime)`
  - `ensureRootIsScheduled(root, eventTime)`

结论：

- retry 不是绕开 lanes/scheduler 的特殊后门；它仍然通过**新 lane + root 调度**回到正常工作流。

---

## 6. fallback 收束时，complete/commit 阶段会继续处理 Suspense / Offscreen 的切换

### 证据 A：`completeWork` 里如果 `DidCapture`，会回到 fallback 第二遍

文件：`packages/react-reconciler/src/ReactFiberCompleteWork.old.js`

关键点：

- `SuspenseComponent` 分支里，如果 `(workInProgress.flags & DidCapture) !== NoFlags`，说明这轮确实有东西 suspend 了。
- 这时 React 会：
  - `workInProgress.lanes = renderLanes;`
  - 直接 `return workInProgress;`
- 注释写得很直白：`Something suspended. Re-render with the fallback children.`

结论：

- beginWork 里的“决定可能 fallback”，最终会在 complete 阶段正式收束成**重新走一遍 fallback 分支**。

### 证据 B：当边界超时状态变化时，会安排 Offscreen 可见性相关 effect

同文件：`ReactFiberCompleteWork.old.js`

关键点：

- `nextDidTimeout !== prevDidTimeout` 时，说明边界的显示状态切换了。
- 注释明确说明：如果 suspended state 改变，需要安排 effect 来切换 subtree visibility。
- 当 `nextDidTimeout` 为真时，会给内部 Offscreen fiber 打上 `Visibility` flag。

可直接引用的源码信号：

- `offscreenFiber.flags |= Visibility;`
- 注释：`we need to schedule an effect to toggle the subtree's visibility`

结论：

- Suspense 的 fallback 切换不只发生在 render 中途；它还会影响**后续提交阶段如何处理子树可见性**。

### 证据 C：commit 阶段隐藏的 Offscreen 子树会跳过 layout effects，重新出现时再恢复

文件：`packages/react-reconciler/src/ReactFiberCommitWork.old.js`

关键点：

- commit layout 阶段会根据 `fiber.memoizedState !== null` 判断当前 Offscreen 是否隐藏。
- 如果当前 Offscreen 子树隐藏，就跳过其 layout effects：注释写的是 `The Offscreen tree is hidden. Skip over its layout effects.`
- 如果是“之前隐藏、现在重新出现”，则调用 `reappearLayoutEffects_begin(fiber)` 把它们重新打开。

结论：

- Offscreen 不是“仅仅视觉上不显示”；它会影响**layout effects 的连接、跳过与重新启用**。

---

## 7. Offscreen 的最小内部语义：不是 DOM 技巧，而是“隐藏但保留”的 Fiber 子树模式

### 证据 A：`OffscreenState` 的存在本身就表示 hidden

文件：`packages/react-reconciler/src/ReactFiberOffscreenComponent.js`

关键点：

- 文件注释直接说：`We use the existence of the state object as an indicator that the component is hidden.`
- `OffscreenProps` 里有 `mode?: OffscreenMode`，默认 visible。
- `OffscreenInstance` 里只有 `isHidden: boolean` 这种稳定实例状态。

结论：

- Offscreen 的核心抽象不是某个 DOM 属性，而是**Fiber 子树当前处于 hidden/visible 哪种存在模式**。

### 证据 B：`updateOffscreenComponent` 在 hidden 模式下会直接把工作延后到 `OffscreenLane`

文件：`packages/react-reconciler/src/ReactFiberBeginWork.old.js`

关键点：

- 当 `nextProps.mode === 'hidden'` 且当前不是在 `OffscreenLane` render 时：
  - React 会记录 `baseLanes`
  - 给当前 fiber 和 childLanes 赋上 `OffscreenLane`
  - 然后 bailout，稍后再恢复这棵隐藏树
- 注释写得很清楚：`We're hidden, and we're not rendering at Offscreen. We will bail out and resume this tree later.`

可直接引用的源码信号：

- `workInProgress.lanes = workInProgress.childLanes = laneToLanes(OffscreenLane);`
- `workInProgress.memoizedState = nextState;`
- 注释：`Schedule this fiber to re-render at offscreen priority. Then bailout.`

结论：

- Offscreen 关心的是：
  1. 这棵子树现在是否隐藏；
  2. 隐藏时哪些工作要保留；
  3. 何时以 Offscreen 优先级恢复。
- 这明显是 reconciler / scheduler 语义，不是单纯 DOM 样式切换。

---

## 8. Suspense 与 Offscreen 的结构关系

### 证据 A：Suspense primary children 天然就是一个 Offscreen 包装层

文件：`packages/react-reconciler/src/ReactFiberBeginWork.old.js`

关键点：

- 主内容分支：`mode: 'visible'` 的 Offscreen。
- fallback 分支：主内容切成 `mode: 'hidden'` 的 Offscreen，再把 fallback 兄弟节点接出来。

结论：

- 在 React 18.2.0 的实现里，**Suspense 与 Offscreen 不是偶然相邻，而是结构上直接相接**。

### 证据 B：`markSuspenseBoundaryShouldCapture` 的注释直接提到 boundary 的 inner Offscreen wrapper

文件：`packages/react-reconciler/src/ReactFiberThrow.old.js`

关键点：

- 注释专门讨论了一个特殊情况：当前 suspend 的 fiber 实际上是 `a Suspense boundary's inner Offscreen wrapper fiber`。

结论：

- 这再次说明 Suspense 内部不是独立于 Offscreen 的另一套树结构；**Offscreen 就是其主内容承载层的一部分**。

---

## 9. React 19 / main 的轻量 delta：主线未变，但公开语义有少量值得补充的变化

### 证据 A：React 19 官方 changelog 明确提到 “Suspense sibling pre-warming”

文件：`react-main/CHANGELOG.md`

原文要点：

- `Suspense sibling pre-warming`: 当某个组件 suspend 时，React 会立即提交最近边界的 fallback，而不是等整个 sibling tree 都 render 完。
- fallback commit 后，还会再调度一次 render，去给那些 suspended siblings “pre-warm” lazy requests。

对 M6 的意义：

- 这说明 React 19 在 Suspense 体验上更积极地拆分“先提交 fallback”和“再为后续恢复预热兄弟子树”两个阶段。
- 但主线仍然是：**挂起 → fallback → 再调度重试**，并没有推翻 M6 骨架。

### 证据 B：React 19 还强调了错误处理口径变化，但这不是 M6 主线

同文件：`react-main/CHANGELOG.md`

原文要点：

- `Errors in render are not re-thrown`，改由 `window.reportError` / `console.error` 等统一上报，并新增 `onUncaughtError` / `onCaughtError` root 选项。

对 M6 的意义：

- 可以轻量提示：React 19 的公开错误处理口径有变化。
- 但这不应扩展成 M6 的重点，因为 M6 主要讨论的是 Suspense / Offscreen 的内部协调链，而不是完整错误系统。

### 证据 C：React main changelog 中多次出现 Suspense / hydration / retries / Offscreen 相关修正与增强

同文件：`react-main/CHANGELOG.md`

可作为轻量旁证的点：

- `Enhanced support for Suspense boundaries ... client, server, and hydration`
- `Reduced garbage collection pressure by improving Suspense boundary retries`
- `Immediately rerender pinged fiber`
- `Don't group Idle/Offscreen work with other work`

结论：

- React main / 19 的演进方向仍在围绕：
  - Suspense 边界更稳定地工作；
  - ping/retry 更高效；
  - Offscreen/idle work 的调度边界更清晰。
- 这属于**稳定骨架上的实现与体验增强**，不是理论框架重写。

---

## 10. 可直接写进正文的最小结论

1. **Suspense 先是 render 控制流机制，后才表现为 loading/fallback UI。**
2. **当 render 抛出 wakeable 时，React 不走普通错误路径，而是寻找最近的 Suspense boundary 来捕获。**
3. **边界一旦捕获，root 会把对应 lanes 记成 suspended；wakeable resolve 后再把它们记成 pinged，并重新安排调度。**
4. **retry 仍然通过 lanes 与 root scheduler 进入下一轮 render，不是特殊捷径。**
5. **Offscreen 表示的是“隐藏但保留”的 Fiber 子树模式；隐藏时可延期工作，重新出现时再恢复相关 effect。**
6. **Suspense 与 Offscreen 在 React 18 内部结构上直接相连：主内容通常由 Offscreen 承载，fallback 则是与之配套出现的另一支。**
7. **React 19 值得补充的 delta 可以轻量提到 sibling pre-warming 等体验增强，但不要把 M6 扩成 React 19 新 API 总览。**

---

## 11. 本模块暂不展开的内容

以下内容在本轮证据笔记中有意不展开：

- RSC / Flight / `use` 的完整机制
- 流式 SSR 与 selective hydration 的系统化讲解
- Activity / ViewTransition
- SuspenseList、Cache、Transition tracing 的全量细节
- 面向业务代码的最佳实践大全

原因：这些内容会把 M6 从“挂起—回退—隐藏—重试—恢复”的骨架教学，扩散成另一门课。