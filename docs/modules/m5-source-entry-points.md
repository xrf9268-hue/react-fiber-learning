# M5｜源码入口清单：lanes / priority / scheduler / transition

## 使用原则

- 本清单只保留 **M5 必须读的最小官方源码入口**。
- 目标不是把 React 的优先级系统讲成源码导游，而是回答：
  1. 更新为什么要先拿到 lane；
  2. root 怎样从很多待处理 lanes 里挑出下一批工作；
  3. scheduler 怎样与 root 调度协作；
  4. `startTransition` 为什么代表“可让位的非紧急更新”。
- 以 **v18.2.0** 为主基线；`main` 只做轻量对照。
- 优先使用本地 upstream mirror：
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-v18.2.0`
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-main`

---

## 先定一条本模块主链

M5 建议始终围绕这条最小问题链阅读：

1. 一次更新是在哪里拿到 lane 的？
2. root 收到这个 lane 后，最少会记录哪些“待处理状态”？
3. React 怎样决定下一轮该处理哪些 lanes？
4. React 怎样确保 root 被重新安排到合适的调度回调里？
5. 并发 render 为什么可以让位、续跑或放弃旧工作？
6. `startTransition` 怎样把一类更新标成 non-urgent？
7. transition 被打断时，React 为什么可以丢弃陈旧结果？

如果正文能把这七个问题答顺，M5 就成立了。

---

## 入口 1：更新是在哪里拿到 lane 的

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
- 可回查：`packages/react-reconciler/src/ReactFiberClassComponent.old.js`
- 可回查：`packages/react-reconciler/src/ReactFiberHooks.old.js`

### 为什么先读它
因为 M4 已经见过 `requestUpdateLane`，但还没解释它背后的优先级系统。M5 要先补上：**为什么每次更新进入系统时，都要先被分配 lane。**

### 这轮只回答这些问题
- `requestUpdateLane` 的概念职责是什么？
- 为什么更新入口拿到的不是“立即执行标志”，而是 lane？
- 类组件与 hooks 更新入口都为什么要经过这一层？

### 建议盯住的函数 / 片段
- `requestUpdateLane(...)`
- M4 已见的 `enqueueSetState(... requestUpdateLane(fiber) ...)`
- hooks 路径里直接调用 `requestUpdateLane(fiber)` 的片段

### 本入口读完后应回答
- React 接收一条更新时，第一件重要的优先级动作，不是立刻渲染，而是先给它归类到某个 lane。

---

## 入口 2：lane 本身为什么不是普通数字优先级

### 文件
- `packages/react-reconciler/src/ReactFiberLane.old.js`

### 为什么它是 M5 的第一核心入口
M5 的地基就在这里。只有先理解 lane 是位集合，后面 root 如何合并、筛选、比较、重排工作才读得顺。

### 这轮只回答这些问题
- lane / lanes 在结构上最少应该被理解成什么？
- 为什么需要 `mergeLanes`、`removeLanes`、`includesSomeLane` 这类集合操作？
- `getHighestPriorityLane` 与 `getNextLanes` 分别解决什么问题？
- lane 为什么天然适合表达“同一批工作”和“优先级层次”？

### 建议盯住的函数 / 片段
- lane 常量区（只抓主要分层，不逐个背）
- `mergeLanes`
- `removeLanes`
- `includesSomeLane`
- `getHighestPriorityLane`
- `getNextLanes`
- `markStarvedLanesAsExpired`

### 本入口读完后应回答
- lane 更像“带优先级语义的工作位集合”，而不是一个从 1 到 N 的打分数值。

---

## 入口 3：root 怎样成为 lanes 的总账本

### 文件
- `packages/react-reconciler/src/ReactFiberRoot.old.js`
- 配套回查：`packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 为什么读它
如果不看 root，就容易把 lanes 理解成分散在各个 Fiber 上的局部标记。实际上，**root 才是 pending / suspended / pinged / expired 等状态的总账本。**

### 这轮只回答这些问题
- root 上哪些字段是 M5 真正需要的？
- 为什么“还有哪些工作没做、哪些暂时不能做、哪些又重新可做”必须挂在 root 上？
- `markRootUpdated` 最少改了什么系统状态？

### 建议盯住的函数 / 片段
- `pendingLanes`
- `suspendedLanes`
- `pingedLanes`
- `expiredLanes`
- `eventTimes` / `expirationTimes`（只理解用途）
- `markRootUpdated(root, lane, eventTime)`

### 本入口读完后应回答
- root 不只是 current/finishedWork 的交接点，也是 lanes 工作状态的集中管理点。

---

## 入口 4：React 怎样决定“下一轮先做哪些 lanes”

### 文件
- `packages/react-reconciler/src/ReactFiberLane.old.js`

### 为什么它是 M5 的第二核心入口
M5 最重要的能力，不是知道“有优先级”，而是知道：**当 root 上同时挂着很多待处理 lanes 时，React 怎样选出当前该做的一批。**

### 这轮只回答这些问题
- `getNextLanes(root, wipLanes)` 选择的到底是什么？
- suspended / pinged / expired 为什么会影响选择？
- 为什么“下一批 lanes”是 root 级决策，而不是组件级决策？

### 建议盯住的函数 / 片段
- `getNextLanes`
- `getHighestPriorityLanes`
- `getNextLanesToFlushSync`（只作对照）
- `markStarvedLanesAsExpired`

### 本入口读完后应回答
- React 不是简单地“谁先来先做谁”，而是在 root 级别不断重算当前最值得做的一批 lanes。

---

## 入口 5：scheduler 怎样与 root 调度衔接

### 文件
- `packages/react-reconciler/src/ReactFiberRootScheduler.old.js`

### 为什么它是 M5 的桥梁入口
前面几步只解释了“工作如何分类、root 如何选下一批”；这一层要解释的是：**React 怎样把这个 root 重新安排进一个合适的调度回调。**

### 这轮只回答这些问题
- `ensureRootIsScheduled` 为什么是 root 调度桥梁？
- React 为什么不会为每个更新都开一条新的独立 callback？
- `scheduleTaskForRootDuringMicrotask` 在概念上做了什么？
- callback priority 与 selected lanes 的关系是什么？

### 建议盯住的函数 / 片段
- `ensureRootIsScheduled`
- `scheduleTaskForRootDuringMicrotask`
- root callback node / callback priority 相关逻辑
- 其中调用 `getNextLanes(...)` 的位置

### 本入口读完后应回答
- scheduler 不是直接替 React 渲染，而是帮助 React 按当前最佳 lanes 重排 root 的执行机会。

---

## 入口 6：并发 work loop 为什么能中断、续跑、放弃旧工作

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 为什么要回到它
M5 不可能只停留在“选 lanes”。还要补一个关键事实：**为什么 selected lanes 对应的 render 工作不是一次必须做完，而是可以让位、继续或重来。**

### 这轮只回答这些问题
- `performConcurrentWorkOnRoot` 的概念职责是什么？
- `renderRootConcurrent` 与 M4/M3 里的同步 render 有什么教学差异？
- 更高优先级工作到来时，为什么旧的并发工作可以被替换或放弃？

### 建议盯住的函数 / 片段
- `performConcurrentWorkOnRoot`
- `renderRootConcurrent`
- 与 shouldYield / exitStatus / retry 相关的最小主干片段

### 本入口读完后应回答
- 并发 render 的价值，不是并行算得更多，而是允许 React 在“尚未提交”阶段调整计划。

---

## 入口 7：`startTransition` 在公开 API 层是什么意思

### 文件
- `packages/react/src/ReactStartTransition.js`
- `packages/react/src/React.js`

### 为什么读它
M5 不能只从 reconciler 里面讲 transition，否则容易失去用户态语义。需要先确认：**官方到底把 `startTransition` 暴露成什么概念入口。**

### 这轮只回答这些问题
- `startTransition` 是从哪里导出的？
- 它在 API 层想表达什么用户意图？
- 为什么这能与“urgent vs non-urgent”对上？

### 本入口读完后应回答
- `startTransition` 不是魔法加速器，而是公开告诉 React：“这组更新没那么急，可以让位。”

---

## 入口 8：transition lane 与 entanglement 的最小证据

### 文件
- `packages/react-reconciler/src/ReactFiberTransition.old.js`
- `packages/react-reconciler/src/ReactFiberHooks.old.js`
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`

### 为什么读它
如果只读公开 API，会知道 transition 是 non-urgent；但还缺一个内部解释：**React 怎样在内部给 transition 分配 lane，并保持同一过渡中的工作关联。**

### 这轮只回答这些问题
- transition lane 是如何被请求出来的？
- 同一 transition 中的更新为什么需要 entangle？
- 这如何帮助解释“一个过渡里的工作应尽量作为同类工作一起被管理”？

### 建议盯住的函数 / 片段
- `requestTransitionLane(...)`
- hooks 中与 `startTransition` 直接相关的最小主线
- `entangleTransitions(root, fiber, lane)`

### 本入口读完后应回答
- transition 不是口头标签；它会落实为 lane 分配与 root 上的关联管理。

---

## 入口 9：官方文档怎样描述 transition

### 证据类型
- React 18 官方发布文 / 升级文

### 为什么要补它
M5 很容易因为源码细节而讲偏。这里需要官方文档来钉住公开口径，尤其是：
- urgent vs non-urgent
- 可被打断
- 陈旧 render 可丢弃

### 这轮只回答这些问题
- 官方是否明确把 transition 描述为 non-urgent？
- 官方是否明确说过 transition work 会被更紧急更新打断？
- 官方是否明确说过会丢弃陈旧的未完成 render？

### 本入口读完后应回答
- transition 的教学表达不能靠二次解读，必须尽量贴住官方公开语义。

---

## 可选轻量对照：React main

### 文件
- `packages/react-reconciler/src/ReactFiberLane.js`
- `packages/react-reconciler/src/ReactFiberRootScheduler.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberTransition.js`

### 对照目的
- 确认 M5 主线骨架仍然成立：
  - 更新分配 lane
  - root 选 next lanes
  - `ensureRootIsScheduled`
  - concurrent work loop
  - transition lane / entanglement
- 如果实现位置变化，只备注“组织方式变化，但主线没变”。

### 不要做的事
- 不为了追 main 的文件拆分，而改写 M5 的稳定教学骨架。
- 不把 React 19 的新语义提前混进 M5。

---

## 本模块最小阅读顺序

1. `ReactFiberLane.old.js`
2. `ReactFiberRoot.old.js`
3. `ReactFiberWorkLoop.old.js`
4. `ReactFiberRootScheduler.old.js`
5. `ReactStartTransition.js`
6. `ReactFiberTransition.old.js`
7. `ReactFiberHooks.old.js`（按需补读）
8. `ReactFiberClassUpdateQueue.old.js`（只回查 entangleTransitions）
9. React 18 官方 transitions 文档证据

> 说明：这里把 `ReactFiberLane.old.js` 放在最前面，是因为 M5 的最大门槛不是函数数量，而是 lane 思维方式。如果这一层不先建立，后面的调度与 transition 都容易读散。

---

## 读完后应能回答的最小问题集

- `requestUpdateLane` 为什么是理解 M5 的真正起点？
- lane 为什么不是普通数字优先级？
- root 为什么必须维护 `pendingLanes`、`suspendedLanes`、`pingedLanes`、`expiredLanes`？
- `getNextLanes` 为什么是“选下一批工作”的关键函数？
- `ensureRootIsScheduled` 为什么是 React 与 scheduler 的桥梁？
- 并发 render 为什么可以暂停、恢复、重排甚至放弃旧工作？
- `startTransition` 为什么代表 non-urgent，而不是“更快执行”？
- transition lane / entanglement 在内部是如何落地的？
- 为什么说 M5 讲的是“工作如何被安排”，而不是“某次更新如何单独跑通”？
