# M4｜一次 `setState` 是怎样从组件一路走到提交的：规划稿

## 范围

本模块只追一条**最小且完整**的更新链路：

**类组件里调用一次 `this.setState(...)` 之后，React 18.2.0 内部如何把这次更新挂到 Fiber、一路冒泡到 root、启动 render，并最终完成 commit。**

纳入范围：
- 以 **class component 的 `setState`** 作为主线样本。
- `enqueueSetState` 如何创建 update 并入队。
- update 如何从当前 Fiber 一路标记到 root。
- `scheduleUpdateOnFiber` 如何把“有更新”变成“开始这轮工作”。
- root 如何进入 render，并产出 `finishedWork`。
- commit 如何接过 `finishedWork`，并让这次更新真正生效。
- 只在必要处回扣 M2 / M3：Fiber 配对结构、`current/workInProgress/finishedWork`。

暂不纳入：
- Hooks 的 `dispatchSetState` 细节。
- 事件系统、batched updates、flushSync 的展开。
- lanes 的系统化讲解；这里只把 lane 当作“这次更新的优先级标记”。
- 并发中断、恢复、transition、scheduler 宏观设计。
- 一次更新中所有 beginWork / completeWork 分支细节。
- DOM 细粒度变更算法与宿主配置细节。

---

## 成功定义

完成 M4 后，学习者应该能用自己的话准确说明：

1. **`setState` 并不是直接改 state，更不是直接改 DOM；它首先是在对应 Fiber 上创建并挂入一个 update。**
2. **这条 update 不只停留在当前组件，它会沿 Fiber 的 return 链一路把“有工作要做”的信息传到 root。**
3. **拿到 root 后，React 才能把这次局部更新提升为一轮 root 级 render。**
4. **render 仍然是在 `workInProgress` 树上准备下一版结果，而不是直接修改当前界面。**
5. **这轮 render 完成后，root 会暂存 `finishedWork`，随后 commit 再真正让结果生效。**
6. **因此，一次 `setState` 的最小主线可以压缩为：组件发起更新 → update 入队 → 向上找到 root → 调度 render → 产出 finishedWork → commit 生效。**
7. **M4 的目标不是讲全调度系统，而是把“为什么一次组件内的更新最后会变成 root 级工作”讲清。**

---

## 关键误解与纠偏

### 误解 1：`setState` 调用时 state 就已经立刻改掉了

不准确。更准确地说，`setState` 先创建一条 update，并把它挂进更新队列；真正计算出新 state，发生在后续 render 过程中处理 update queue 时。

### 误解 2：`setState` 只影响当前组件，不需要经过 root

不成立。React 的 render / commit 是以 root 为总入口推进的，所以组件上的更新需要一路向上冒泡，最终定位到所属 root。

### 误解 3：找到 root 以后就等于已经完成更新

不对。找到 root 只是说明 React 已经知道“哪棵树需要重跑”；后面仍要经过 render 与 commit。

### 误解 4：M4 应该先把 lanes / scheduler 全部讲完，才能讲一次 `setState`

不必。M4 只需要把 lane 当作“这次更新带着的优先级标签”，够解释主链路即可；系统化优先级模型留给 M5。

### 误解 5：`finishedWork` 是 commit 重新算出来的

不对。`finishedWork` 是 render 完成后交给 commit 的结果；commit 是消费它，而不是重新算一遍树。

### 误解 6：M4 必须同时讲类组件和 Hooks 两条更新链路

没必要。为了把主骨架讲稳，先用 class `setState` 建立一条最小、可追踪、证据清晰的链路；Hooks 可在 M5 或附注中再对照。

---

## 官方证据目标

本模块以 **React 18.2.0** 为主基线，围绕“从 `setState` 到 root，再到 render/commit”建立最小证据链。

### 一组：`setState` 从哪里进入 reconciler

1. `packages/react-reconciler/src/ReactFiberClassComponent.old.js`
   - 目标：确认类组件 `setState` 最终会进入 `classComponentUpdater.enqueueSetState`。
   - 重点问题：
     - `enqueueSetState` 做了哪几步最关键的事？
     - `createUpdate`、`enqueueUpdate`、`scheduleUpdateOnFiber` 的调用顺序是什么？
     - 为什么这已经足以说明 `setState` 不是直接改界面？

2. `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`
   - 目标：确认 update queue 的最小角色：update 被创建后如何进入 Fiber 的更新队列，以及 render 时如何被处理。
   - 重点问题：
     - queue 挂在哪里？
     - update 被放入的是哪类结构？
     - `processUpdateQueue` 为什么能作为“真正计算新 state”发生在 render 阶段的证据？

### 二组：更新怎样从组件一路冒泡到 root

3. `packages/react-reconciler/src/ReactFiberConcurrentUpdates.old.js`
   - 目标：确认 `enqueueUpdate` 最终如何通过 `markUpdateLaneFromFiberToRoot` 把 lane 沿父链向上标记，并返回 root。
   - 重点问题：
     - 为什么一个组件上的更新最终能拿到 root？
     - 这里沿着哪些链接向上走？
     - 为什么这能说明 React 的调度入口是 root 级，而不是组件各自为战？

4. `packages/react-reconciler/src/ReactFiberLane.old.js`
   - 目标：只补足 M4 所需的最小 lane 概念：lane 是 update 携带的优先级/工作位置信息。
   - 使用边界：不做系统化讲解，只为读懂参数流与 root 标记服务。

### 三组：root 如何把“有更新”变成一轮 render

5. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - 目标：确认 `scheduleUpdateOnFiber` 如何接手 root，并推动后续 render / commit 主线。
   - 重点函数：
     - `scheduleUpdateOnFiber`
     - `prepareFreshStack`
     - `renderRootSync`（必要时轻触 concurrent 入口）
     - `commitRoot`
   - 重点问题：
     - schedule 阶段最少做了哪些 root 级处理？
     - render 的起点为什么仍然是 `createWorkInProgress(root.current, null)`？
     - 这怎样与 M3 的双树模型接上？

### 四组：render 时 update 在哪里真正参与计算

6. `packages/react-reconciler/src/ReactFiberClassComponent.old.js`
   - 目标：确认 class 组件在 render 路径中会调用 `processUpdateQueue`。
   - 重点问题：
     - 为什么说 `setState` 的 payload 并不是调用时立刻生效，而是在 render 中被消费？
     - 这一点如何帮助纠正“setState 立即改 state”的误解？

### 五组：commit 如何让这次更新真正生效

7. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
8. `packages/react-reconciler/src/ReactFiberCommitWork.old.js`
9. `packages/react-reconciler/src/ReactFiberFlags.js`
   - 目标：确认 commit 消费 `finishedWork`，按 render 留下的 flags 生效，并在关键时刻切换 `root.current`。
   - 重点问题：
     - commit 的输入是什么？
     - `root.current = finishedWork` 在这条链里意味着什么？
     - 为什么这能闭合“一次 `setState` 最终真的生效”这件事？

### 六组：必要的现代对照（可选，非主线）

10. `packages/react-reconciler/src/ReactFiberClassComponent.js`（若 main 已不分 old/new，则用现名）
11. `packages/react-reconciler/src/ReactFiberWorkLoop.js`
12. `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`

用途：
- 只确认主链仍成立：
  - `setState` 创建 update
  - update 入队并向上找到 root
  - root 调度 render
  - render 产出 `finishedWork`
  - commit 生效并切换 current
- 如果 main 文件拆分变化较大，只做“实现位置变化，但主线没变”的说明。

---

## 建议教学顺序

1. **先把一句话主链打稳。**
   - `setState` 不是“立刻改页面”，而是“登记一次更新，并让 root 安排一轮新工作”。

2. **先讲入口，不先讲全局调度。**
   - 从 `classComponentUpdater.enqueueSetState` 开始。
   - 让读者先看到：update 被创建、入队、然后交给调度。

3. **再讲“为什么会找到 root”。**
   - 这是 M4 的关键认知跃迁。
   - 强调：React 最终要重跑的是整棵 root 管辖的工作树，不是某个组件私下偷偷重算。

4. **再把 M3 的双树模型接回来。**
   - root 有了更新以后，render 仍然从 `root.current` 派生 `workInProgress`。
   - 这样读者会明白：M3 讲的是“树怎么交接”，M4 讲的是“谁点燃了这次交接”。

5. **再讲 update queue 在 render 中被消费。**
   - 这是纠正“setState 立即改 state”的最好位置。
   - 强调：调用时只是登记，render 时才计算。

6. **最后闭合到 commit。**
   - `finishedWork` 进入 commit。
   - `root.current = finishedWork`。
   - 到这里，一次 `setState` 的 end-to-end 路径才真正闭环。

7. **结尾只留一个自然口子给 M5。**
   - M4 已讲清一条更新怎么跑通。
   - M5 再问：为什么有的更新快，有的慢，为什么会被打断、合并或延后。

---

## 建议交付物形态

M4 正文建议至少包含：
- 一条最小链路图：
  - `setState` → `createUpdate` → `enqueueUpdate` → `markUpdateLaneFromFiberToRoot` → `scheduleUpdateOnFiber` → render → `finishedWork` → commit
- 一张“局部更新为什么会上升为 root 级工作”的示意图。
- 一段简明解释：
  - 调用 `setState` 时只是登记更新，真正计算与提交分别发生在 render / commit。
- 少量源码锚点，重点放在：
  - `enqueueSetState`
  - `markUpdateLaneFromFiberToRoot`
  - `scheduleUpdateOnFiber`
  - `processUpdateQueue`
  - `commitRoot`

如需配图，优先：
1. 一次 `setState` 的十步最小链路图；
2. Fiber return 链向上找到 root 的示意图；
3. M3 双树模型与 M4 触发链的拼接图。

---

## 复核清单

- [ ] 是否把 `setState` 先解释为“登记 update”，而不是“直接改 state / DOM”。
- [ ] 是否明确给出 `enqueueSetState -> createUpdate -> enqueueUpdate -> scheduleUpdateOnFiber` 这条主线。
- [ ] 是否讲清 update 为什么会沿 Fiber 父链一路找到 root。
- [ ] 是否讲清 root 在这条链里为什么是必须的总入口。
- [ ] 是否把 M3 的 `current/workInProgress/finishedWork` 正确接回 M4，而不是重新起一套概念。
- [ ] 是否说明 `processUpdateQueue` 才是“消费 update、计算新 state”的关键证据点。
- [ ] 是否闭合到 commit，而不是停在“已经调度了”。
- [ ] 是否避免过早滑入 lanes / scheduler / concurrent 的系统化细节。
- [ ] 是否坚持中文、概念优先、证据导向，并保持篇幅有边界。

---

## 一句话主论点

**M4 要建立的核心认识是：一次 `setState` 并不会直接修改界面；它先把 update 挂到当前组件对应的 Fiber 上，再一路把工作冒泡到 root，由 root 启动 render，产出 `finishedWork`，最后再由 commit 让结果真正生效。**
