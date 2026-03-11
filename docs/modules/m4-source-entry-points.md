# M4｜源码入口清单：一次 `setState` 如何走到 render 与 commit

## 使用原则

- 本清单只保留 **M4 必须读的最小官方源码入口**。
- 目标不是讲完整个调度系统，而是回答：
  1. `setState` 如何变成一条 update；
  2. update 如何从组件一路找到 root；
  3. root 如何把它变成一轮 render；
  4. render / commit 如何让这次更新真正生效。
- 以 **v18.2.0** 为主基线；`main` 只做轻量对照。
- 优先使用本地 upstream mirror：
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-v18.2.0`
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-main`

---

## 先定一条本模块主链

M4 建议始终围绕这条最小问题链阅读：

1. `this.setState(...)` 先进入哪个 reconciler 入口？
2. update 是在哪里被创建出来的？
3. update 是如何挂进 Fiber 的更新队列的？
4. React 怎样从当前组件一路找到所属 root？
5. root 怎样把“有更新”变成一轮 render？
6. render 时 update 在哪里真正参与 state 计算？
7. render 的结果如何变成 `finishedWork`？
8. commit 如何接手它，并让这次更新真正生效？

如果正文能把这八个问题答顺，M4 就成立了。

---

## 入口 1：`setState` 从哪里进入 reconciler

### 文件
- `packages/react-reconciler/src/ReactFiberClassComponent.old.js`

### 为什么先读它
因为 M4 的主样本就是类组件 `setState`。读者首先要看到的，不应该是 work loop，而应该是：**一次 `setState` 到底先落在哪个内部入口上。**

### 这轮只回答这些问题
- `this.setState` 最终对应到哪个 updater 方法？
- `enqueueSetState` 内最关键的调用顺序是什么？
- 为什么这里已经足以说明：`setState` 不是直接改 state / DOM？

### 建议盯住的函数 / 片段
- `classComponentUpdater`
- `enqueueSetState(inst, payload, callback)`
- 其中这一组顺序：
  - `requestEventTime()`
  - `requestUpdateLane(fiber)`
  - `createUpdate(eventTime, lane)`
  - `enqueueUpdate(fiber, update, lane)`
  - `scheduleUpdateOnFiber(root, fiber, lane, eventTime)`

### 本入口读完后应回答
- `setState` 调用时真正发生的第一件事，是“登记更新”，而不是“立即完成更新”。

---

## 入口 2：update queue 最少要看到哪里

### 文件
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`

### 为什么读它
如果不补这一层，读者很容易把 update 理解成一条瞬时消息。实际上，`setState` 创建出来的是一条会进入 **update queue** 的更新记录，而 render 时会再消费它。

### 这轮只回答这些问题
- `createUpdate` 创建出来的对象大致是什么角色？
- `enqueueUpdate` 最少把 update 放进了什么结构？
- 为什么说真正“把 update 算成 state”是在 render 里，由 `processUpdateQueue` 完成？

### 建议盯住的函数 / 片段
- `createUpdate`
- `enqueueUpdate`
- `processUpdateQueue`

### 本入口读完后应回答
- `setState` 的 payload 不是调用时立刻落成最终 state，而是先进入队列，后续在 render 中处理。

---

## 入口 3：更新为什么会一路找到 root

### 文件
- `packages/react-reconciler/src/ReactFiberConcurrentUpdates.old.js`

### 为什么它是 M4 的关键入口
这是 M4 相比 M3 最重要的新认知：**组件级更新最终必须变成 root 级工作。** 这一步的最小证据，就在 `markUpdateLaneFromFiberToRoot` 相关逻辑里。

### 这轮只回答这些问题
- update 入队后，React 怎样把 lane 标记到当前 Fiber 以及它的祖先？
- 这里沿着哪条结构关系向上走？
- 为什么走到 `HostRoot` 后就能拿到 `FiberRoot`？
- 这如何说明 React 的 render/commit 总入口是 root？

### 建议盯住的函数 / 片段
- `enqueueConcurrentClassUpdate`（若正文需要追到这里）
- `markUpdateLaneFromFiberToRoot(sourceFiber, lane)`
- `parent = sourceFiber.return`
- `if (node.tag === HostRoot) { const root = node.stateNode; return root; }`

### 本入口读完后应回答
- 一个组件上的更新之所以能驱动整轮渲染，是因为 React 会沿 Fiber 父链把工作一路冒泡到 root。

---

## 入口 4：lane 在 M4 只需要理解到什么程度

### 文件
- `packages/react-reconciler/src/ReactFiberLane.old.js`

### 为什么读它
M4 不讲完整优先级系统，但源码里反复出现 `lane` / `lanes`。如果完全跳过，参数流会读不顺。

### 这轮只回答这些问题
- lane 在 M4 层面最少应该被理解成什么？
- 为什么 `setState` 创建 update 时要同时带上 lane？
- root / fiber 上记录 lane 是为了什么？

### 使用边界
- 不展开所有 lane 种类。
- 不展开优先级比较、选择与抢占策略。
- 只把它当作“更新的优先级/工作标记”。

---

## 入口 5：root 怎样把“有更新”变成一轮 render

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 为什么它是 M4 的主干入口
前面几步只是说明“更新被登记了，而且找到了 root”；真正把这件事推进成 render / commit 主线的，还是 work loop。

### 这轮只回答这些问题
- `scheduleUpdateOnFiber` 接到 root 以后，最少做了什么？
- 为什么 render 的准备仍然会回到 `prepareFreshStack(root, lanes)`？
- `prepareFreshStack` 为什么再次证明 render 的工作树来自 `createWorkInProgress(root.current, null)`？
- render 完成后，结果怎样进入 commit？

### 建议盯住的函数 / 片段
- `scheduleUpdateOnFiber`
- `prepareFreshStack`
- `renderRootSync`
- `commitRoot`
- `const finishedWork = root.finishedWork`
- `root.current = finishedWork`

### 本入口读完后应回答
- 组件更新之所以能真正执行，是因为 root 接手后把它推进成一轮完整的 render → commit 流程。

---

## 入口 6：update 在 render 的哪里真正被消费

### 文件
- `packages/react-reconciler/src/ReactFiberClassComponent.old.js`
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`

### 为什么要回读这里
M4 如果只讲到 `scheduleUpdateOnFiber`，会留下一个关键空洞：**那条 update 到底什么时候真的参与 state 计算？**

### 这轮只回答这些问题
- class 组件更新路径里，哪里调用了 `processUpdateQueue`？
- 为什么这能说明“state 的新结果是在 render 中算出来的”？
- 这与“调用 `setState` 时先入队”如何形成前后闭环？

### 建议盯住的函数 / 片段
- class component 更新路径中的 `processUpdateQueue(workInProgress, newProps, instance, renderLanes)`
- queue 读写前后与 `memoizedState` 的关系

### 本入口读完后应回答
- `setState` 的调用点负责登记，render 路径负责消费 update 并得出新的 state。

---

## 入口 7：commit 如何让这次更新真正生效

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
- `packages/react-reconciler/src/ReactFiberCommitWork.old.js`
- `packages/react-reconciler/src/ReactFiberFlags.js`

### 为什么要补这一段
M4 是一条 end-to-end 链，不能停在“已经开始 render”。必须闭合到：**这次 `setState` 何时算真正完成。**

### 这轮只回答这些问题
- commit 的输入为什么是 `root.finishedWork`？
- 为什么可以说 commit 是在消费 render 结果，而不是重新算一遍？
- `flags` / `subtreeFlags` 在这里扮演什么最小角色？
- `root.current = finishedWork` 为什么是一条更新真正生效的关键瞬间？

### 建议盯住的函数 / 片段
- `commitRoot`
- `const finishedWork = root.finishedWork`
- `root.finishedWork = null`
- `root.current = finishedWork`
- `finishedWork.flags`
- `finishedWork.subtreeFlags`

### 本入口读完后应回答
- 一次 `setState` 最终能生效，不是因为调用了 API 本身，而是因为 render 产出了 `finishedWork`，commit 再把它扶正为新的 current。

---

## 可选轻量对照：React main

### 文件
- `packages/react-reconciler/src/ReactFiberClassComponent.js`（若 main 中未保留 old/new 分拆）
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.js`
- `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`

### 对照目的
- 确认 M4 主线骨架仍然成立：
  - `setState` 创建 update
  - update 入队
  - 沿父链找到 root
  - root 调度 render
  - render 产出 `finishedWork`
  - commit 生效并切换 current
- 如果实现位置变化，只备注“实现拆分或命名变化，但主线未变”。

### 不要做的事
- 不为了追 main 的最新组织方式而改写 M4 的稳定教学骨架。
- 不在本模块里被 hooks / transition / scheduler 细节带跑。

---

## 本模块最小阅读顺序

1. `ReactFiberClassComponent.old.js`
2. `ReactFiberClassUpdateQueue.old.js`
3. `ReactFiberConcurrentUpdates.old.js`
4. `ReactFiberWorkLoop.old.js`
5. `ReactFiberFlags.js`
6. `ReactFiberCommitWork.old.js`
7. `ReactFiberLane.old.js`（按需补读）

> 说明：这里把 `ReactFiberLane.old.js` 放到后面按需补读，是因为 M4 的主问题是“更新怎样跑通”，不是“优先级体系如何设计”。

---

## 读完后应能回答的最小问题集

- `setState` 在 reconciler 中的第一个明确入口是什么？
- `createUpdate` / `enqueueUpdate` 分别解决什么问题？
- update 为什么不会只停留在当前组件，而会一路找到 root？
- `markUpdateLaneFromFiberToRoot` 为什么是 M4 的关键证据点？
- `scheduleUpdateOnFiber` 如何把局部更新转成 root 级工作？
- `processUpdateQueue` 为什么能证明“新 state 是 render 时算出来的”？
- M3 的 `current / workInProgress / finishedWork` 在这条链里分别处于什么位置？
- `root.current = finishedWork` 为什么意味着这次 `setState` 真正完成了？
