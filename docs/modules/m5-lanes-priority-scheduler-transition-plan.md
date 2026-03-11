# M5｜lanes / priority / scheduler / transition：规划稿

## 范围

本模块只回答四个互相关联的问题：

1. **React 为什么需要 lanes，而不是只靠“有没有更新”。**
2. **React 怎样从许多待处理 lanes 里挑出“下一批该做的工作”。**
3. **scheduler 在这条链里到底扮演什么角色，它与 Fiber work loop 是怎样协作的。**
4. **`startTransition` 为什么不是“新开一个线程”，而是把一类更新标成可让位、可中断、可丢弃陈旧结果的非紧急工作。**

纳入范围：
- 以 **React 18.2.0** 为主基线，建立 lanes 作为“优先级 + 批次/集合编码”的最小模型。
- `requestUpdateLane`、`markRootUpdated`、`getNextLanes` 这条最小主线。
- root 如何维护 pending / suspended / pinged / expired 等与“挑下一批工作”直接相关的 lanes 状态。
- `ensureRootIsScheduled` 与 scheduler callback 之间的最小连接关系。
- `performConcurrentWorkOnRoot` / `renderRootConcurrent` 在概念上的位置：说明并发 render 为什么能暂停、续跑、丢弃陈旧工作。
- `startTransition` / transition lane 的最小教学模型：urgent vs non-urgent，以及“为什么输入更新优先，过时过渡结果可丢弃”。
- 只在必要处回扣 M4：M4 讲“更新怎样跑通”，M5 讲“多类更新同时存在时，React 怎样决定先做谁、何时让位、何时重排”。

暂不纳入：
- Scheduler 包的完整实现细节、时间切片算法常量、宿主环境调度 polyfill 细节。
- 所有 lane 常量逐个背诵与全量位图表。
- Suspense / Offscreen 的系统化行为分析（放到 M6）。
- `useTransition` 的全部用户态 API 语义，只保留与 reconciler 主线直接相关的部分。
- React main / React 19 的新文件拆分细节，只做轻量对照。
- 把“并发”误讲成多线程、后台线程或真实并行执行。

---

## 成功定义

完成 M5 后，学习者应该能用自己的话准确说明：

1. **lane 不是一条普通数字优先级，而是一种能表示“哪些更新属于同一批工作、哪些更紧急”的位集合。**
2. **一次更新在进入系统时会先被分配 lane；root 会累计这些待处理 lanes。**
3. **React 并不是见到更新就立刻把所有事都做完，而是会从 root 的待处理 lanes 中挑选当前最该做的一批。**
4. **`getNextLanes` 一类逻辑的职责，是决定“下一轮 render 该处理哪些 lanes”，而不是执行具体组件逻辑。**
5. **scheduler 的职责更像“安排什么时候再次进入 root 工作”，而 Fiber work loop 负责“真正渲染哪棵树、从哪里继续”。**
6. **并发 render 的核心不是多线程，而是工作可以被切片、让位、继续，必要时丢弃陈旧结果。**
7. **`startTransition` 的本质，是把一类更新标成非紧急，让更重要的输入类更新可以插队。**
8. **transition 被打断时，React 可以放弃旧的过渡 render，只保留最新那次更有价值的结果。**
9. **M5 的重点不是背 API，而是建立“lane 选择 + root 调度 + scheduler 协作 + transition 语义”这一整套骨架认识。**

---

## 关键误解与纠偏

### 误解 1：lane 就是一个简单的数字优先级

不准确。更准确地说，lane 是位集合编码。它既承载“优先级层次”，也承载“这几条更新是否属于同一批待处理工作”的信息。

### 误解 2：有了 lanes，就不需要 root 统一调度了

不成立。lane 只是把工作分类并编码；真正决定下一轮 root 做哪些工作，仍然发生在 root 级别。

### 误解 3：scheduler 就是 React 的渲染器本体

不对。scheduler 更像外部时间与回调安排器；Fiber reconciler 仍然负责 render / commit 主线。M5 要讲清“谁负责安排，谁负责执行”。

### 误解 4：并发渲染 = 多线程同时渲染

不对。React 在这里的“并发”重点是可中断、可恢复、可让位，而不是浏览器里真的有两棵树在不同线程并行跑。

### 误解 5：`startTransition` 会让更新更快完成

不准确。它的核心不是“更快”，而是“优先级更低、允许让位”，从而让更重要的交互先保持流畅。

### 误解 6：transition 被打断说明 React 做坏了

不对。对 transition 来说，被更紧急的更新打断、甚至丢弃陈旧 render，正是设计目标之一。

### 误解 7：M5 必须先把 Scheduler 包源码全部读完，才能解释 transition

没必要。M5 只需要把 root 选 lane、安排 callback、进入 concurrent work loop 的主线讲稳；Scheduler 包内部实现可作为附加阅读，不必成为主正文负担。

---

## 官方证据目标

本模块以 **React 18.2.0** 为主基线，围绕“lane 分配 → root 累积 → 选择下一批 lanes → 安排调度回调 → concurrent work loop → transition 语义”建立最小证据链。

### 一组：更新是如何获得 lane 的

1. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - 目标：确认 `requestUpdateLane` 在更新入口处扮演什么角色。
   - 重点问题：
     - lane 是在什么时机被分配给一次更新的？
     - 为什么 M4 里已经看到 `requestUpdateLane`，但 M5 才真正展开它？

2. `packages/react-reconciler/src/ReactFiberLane.old.js`
   - 目标：确认 lane 常量、集合操作、选择逻辑的最小骨架。
   - 重点问题：
     - lane 为什么更像位集合而不是单个标量？
     - `mergeLanes`、`includesSomeLane`、`getHighestPriorityLane`、`getNextLanes` 各自解决什么问题？

### 二组：root 如何记录并挑选待处理工作

3. `packages/react-reconciler/src/ReactFiberRoot.old.js`
   - 目标：确认 root 上与 pending lanes、suspended lanes、pinged lanes、expired lanes 直接相关的关键槽位。
   - 重点问题：
     - 为什么“哪些工作还没做、哪些被挂起、哪些重新可做”必须落在 root 上？
     - root 为什么是 lanes 系统的总账本？

4. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - 目标：确认 `markRootUpdated`、render 入口与 root lanes 状态之间的关系。
   - 重点问题：
     - 一次更新拿到 lane 后，root 是怎样被标记为“有这些待处理 lanes”的？
     - 这如何接到后续调度？

5. `packages/react-reconciler/src/ReactFiberLane.old.js`
   - 目标：确认 `getNextLanes` 如何决定“下一轮 root 应该先做什么”。
   - 重点问题：
     - `getNextLanes` 选择的是“下一批 lanes”，还是“下一棵子树”？
     - suspended / pinged / expired 状态为什么会影响选择结果？

### 三组：scheduler 怎样与 Fiber root 调度协作

6. `packages/react-reconciler/src/ReactFiberRootScheduler.old.js`
   - 目标：确认 root 级调度与 scheduler callback 的桥接主线。
   - 重点函数：
     - `ensureRootIsScheduled`
     - `scheduleTaskForRootDuringMicrotask`
     - 与 callback priority / callback node 相关的最小逻辑
   - 重点问题：
     - 为什么 React 不会每来一个更新就盲目重新起一条独立任务？
     - root callback 是如何按当前最佳 lanes 重新安排的？
     - 这一层与 M4 的 `scheduleUpdateOnFiber` 是什么关系？

7. `packages/scheduler/src/*`
   - 用途：只做轻量背景补充。
   - 使用边界：
     - 只说明 Scheduler 是“时间与回调安排器”；
     - 不深挖全部宿主调度实现。

### 四组：并发 work loop 与 transition 的最小主线

8. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - 目标：确认 `performConcurrentWorkOnRoot` / `renderRootConcurrent` 的概念位置。
   - 重点问题：
     - concurrent render 为什么可以中断、恢复、重试？
     - 为什么“正在做的旧 transition render”可以在更紧急更新到来后被放弃？

9. `packages/react/src/ReactStartTransition.js`
10. `packages/react/src/React.js`
    - 目标：确认公开 API `startTransition` 的最小暴露关系。
    - 重点问题：
      - 用户态入口在哪里？
      - 官方对 transition 的公开概念口径是什么？

11. `packages/react-reconciler/src/ReactFiberTransition.old.js`
12. `packages/react-reconciler/src/ReactFiberHooks.old.js`（只读与 `startTransition` / transition lane 直接相关片段）
13. `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`（只回查 `entangleTransitions` 的最小角色）
    - 目标：确认 transition lane、transition 上下文与 entanglement 的最小证据。
    - 重点问题：
      - transition lane 是如何被请求/分配的？
      - 为什么一组 transition 更新需要在 root 上保持关联？
      - M5 应该如何讲“同一过渡中的工作不要被拆得支离破碎”？

### 五组：必要的官方文档证据

14. React 18 官方发布文 / 升级文中关于 transitions 的表述
    - 目标：用官方语言钉牢：
      - urgent vs non-urgent
      - transition 可被打断
      - 陈旧过渡结果可被丢弃
    - 用途：给教学文字一个源码外的官方概念锚点。

### 六组：必要的现代对照（可选，非主线）

15. `packages/react-reconciler/src/ReactFiberLane.js`
16. `packages/react-reconciler/src/ReactFiberRootScheduler.js`
17. `packages/react-reconciler/src/ReactFiberWorkLoop.js`
18. `packages/react-reconciler/src/ReactFiberTransition.js`

用途：
- 只确认主线骨架仍成立：
  - lane 分配
  - root 选下一批 lanes
  - root callback 调度
  - concurrent work loop
  - transition lane / transition 语义
- 如果 main 中文件拆分变化较大，只备注“实现位置变化，但主线不变”。

---

## 建议教学顺序

1. **先回答“为什么 M4 之后还要学 M5”。**
   - M4 讲清了一次更新怎样跑通。
   - M5 要回答：当 root 上同时存在很多类更新时，React 怎样决定先做谁、后做谁、要不要暂停、要不要丢弃旧工作。

2. **先讲 lane 是什么，不先讲 Scheduler 包。**
   - 先建立“lane 是位集合、不是一个简单分数”的认识。
   - 先把“更新被分配 lane，root 累积 lanes”讲稳。

3. **再讲 root 怎样选下一批 lanes。**
   - 这是 M5 的核心骨架。
   - 把 `pending / suspended / pinged / expired` 讲成“root 的工作账本状态”，不要讲成零散字段列表。

4. **再讲 scheduler 的角色边界。**
   - scheduler 负责“何时再给 root 一个执行机会”。
   - reconciler/work loop 负责“这一轮到底渲染哪些 lanes、从哪里继续”。
   - 一定要避免把两者混成同一个系统。

5. **再讲 concurrent render 为什么能让位。**
   - 这里不必先讲所有时间切片细节。
   - 只要讲清：工作不是一次必须做完；可以检查是否该继续，也可以被更高优先级工作抢占。

6. **最后讲 transition。**
   - 用官方 urgent / non-urgent 口径收束。
   - 把 `startTransition` 解释为：给某类更新贴上“可让位”的语义标记。
   - 再说明：被打断、丢弃陈旧 render 不是 bug，而是目的。

7. **结尾给 M6 留接口。**
   - M5 已解释“React 怎样按优先级安排工作”。
   - M6 再接“Suspense / Offscreen / React 19 新结构如何利用这套机制”。

---

## 建议交付物形态

M5 正文建议至少包含：
- 一张 lane 视角图：更新进入 root 后，不是排成单线队列，而是落入不同 lanes 集合。
- 一张 root 调度图：`markRootUpdated` → `getNextLanes` → `ensureRootIsScheduled` → callback → concurrent render。
- 一张 transition 语义图：urgent 输入更新与 non-urgent transition 更新的让位关系。
- 一段简明解释：为什么并发不是多线程，而是“可中断、可让位的单线程工作管理”。
- 少量源码锚点，重点放在：
  - `requestUpdateLane`
  - `markRootUpdated`
  - `getNextLanes`
  - `ensureRootIsScheduled`
  - `performConcurrentWorkOnRoot`
  - `startTransition` / `requestTransitionLane`

如需配图，优先：
1. lanes 作为位集合与批次选择的示意图；
2. root 选择下一批 lanes 的调度图；
3. transition 被更紧急输入打断的时序图。

---

## 复核清单

- [ ] 是否把 lane 解释成“位集合 + 工作分组”，而不是简单数字排名。
- [ ] 是否讲清 root 才是 lanes 的总账本与选择中心。
- [ ] 是否把 `getNextLanes` 讲成“选择下一批工作”，而不是执行具体渲染。
- [ ] 是否区分清楚 scheduler 的安排职责与 reconciler 的执行职责。
- [ ] 是否明确说明并发不等于多线程并行。
- [ ] 是否用官方证据讲清 transition = non-urgent、可让位、可被打断。
- [ ] 是否避免把 Suspense / Offscreen / React 19 细节提前吃进来。
- [ ] 是否保持中文、概念优先、证据导向，并控制篇幅边界。
- [ ] 是否与 M4 保持衔接：M4 讲单次更新跑通，M5 讲多类更新如何被安排。

---

## 一句话主论点

**M5 要建立的核心认识是：React 不只是“收到更新就渲染”，而是先把更新编码进 lanes，由 root 按优先级和状态选择下一批工作，再借助 scheduler 安排执行时机；`startTransition` 则是在这套系统里明确标记“可让位的非紧急更新”。**
