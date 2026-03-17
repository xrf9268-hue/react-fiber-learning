# M5｜lanes、优先级、scheduler 协作与 transition

> 本文只建立 React 18.2.0 中 M5 需要的最小骨架：  
> **更新先进入哪条 lane，root 怎样从许多 lanes 里挑下一批工作，scheduler 怎样提供执行机会，以及 `startTransition` 为什么代表“可让位的非紧急更新”。**

## 一、为什么 M4 之后还必须学 M5

M4 已经回答了一个问题：

- 一次 `setState` 进入 React 之后，大致怎样从更新入队，一路走到 render，再走到 commit。

但真实应用不会永远只有“一条更新正在排队”。更常见的情况是：

- 用户刚输入了一个字符；
- 页面里另一个区域也触发了重渲染；
- 某次较慢的界面切换仍在计算中；
- 某些工作暂时做不了，之后又重新变得可做。

这时 React 真正要解决的问题就变成了：

1. 这些更新怎么分类？
2. 哪些更急，应该先做？
3. 哪些没那么急，可以稍后再做？
4. 如果做到一半发现来了更重要的工作，能不能先让位？
5. 如果旧的那次慢更新已经过时了，能不能干脆不要它？

M5 讲的就是这套“**工作如何被安排**”的骨架。

---

## 二、先把一句核心话讲清楚

**React 18 不是“收到更新就立刻渲染完全部工作”，而是先把更新编码进 lanes，再由 root 按优先级和状态选择下一批工作，并借助 scheduler 安排执行时机。**

这句话里有四个关键词：

- **lane**：更新落在哪类工作里
- **root**：全局总账本与选择中心
- **scheduler**：安排什么时候再给 root 一个执行机会
- **transition**：明确标记“这类更新没那么急，可以让位”

下面按“更新进入系统 → root 选批次 → scheduler 安排机会 → transition 改变 lane 分配”的顺序展开。

---

## 三、lane 到底是什么

很多人第一次看到 lanes，会把它理解成“新的优先级数字”。

这不够准确。

更准确的说法是：

**lane 是一种带优先级语义的位集合编码。**

### 1. 为什么不是简单数字排名

如果只是一个 1、2、3、4 的优先级数字，只能表达：

- A 比 B 急
- B 比 C 慢

但 React 还想表达另一件事：

- 哪些更新属于同一批工作；
- 哪些工作应该一起考虑；
- 哪些工作虽然不最急，但因为有关联，不能被拆得太散。

位集合很适合这个场景，因为它天然支持：

- 合并：把多条工作并成一个集合；
- 判断是否包含某类工作；
- 从一堆待处理工作里找出当前最高优先级那一批；
- 在必要时把关联工作一起带上。

### 2. 官方证据怎么看这件事

在 `ReactFiberLane.old.js` 里，React 对 lanes 的处理几乎全部建立在位运算和集合操作上。

例如：

- `getNextLanes(...)` 不是比较几个数字大小，而是在多个 lanes 集合之间做筛选；
- `includesOnlyTransitions(...)`、`isTransitionLane(...)` 都是在判断某个 lane / lanes 是否属于 transition 集合；
- `claimNextTransitionLane()` 则在 transition lanes 的一组位上轮转分配。

这说明 lane 不是“单个分数”，而是“工作集合的编码方式”。

### 3. 本模块只需要掌握到什么程度

M5 不要求你背全部 lane 常量。

你只需要抓住三点：

1. 一次更新进入 React 时，会先拿到一个 lane；
2. root 上会同时积累很多 lanes；
3. React 每一轮都要从这些 lanes 中选出“当前最该做的一批”。

这就够了。

---

## 四、更新为什么要先拿 lane

在 M4 里，我们已经见过更新入口会调用 `requestUpdateLane(fiber)`，但当时只是把它当成流程里的一个站点。

到了 M5，这一步必须升级为核心理解。

### 1. 这一步的真实含义

`requestUpdateLane` 的作用不是“开始 render”，而是：

**先给这次更新归类。**

也就是说，React 在更新刚进入系统时，先问的不是：

- 现在要不要立刻执行？

而是：

- 这是什么类型的工作？
- 它该落到哪条 lane？

### 2. v18.2.0 里它大致怎么分

`ReactFiberWorkLoop.old.js` 中的 `requestUpdateLane` 至少区分几类情况：

- 如果当前不是 ConcurrentMode，直接走同步 lane；
- 如果是 render phase update 的特殊情况，会沿用当前 render 的 lanes；
- 如果当前处于 transition 上下文，就分配 transition lane；
- 否则根据当前 update priority 或 event priority 取得 lane。

这一步说明：

**优先级系统不是 render 之后才追加的判断，而是更新入口当场完成的归类。**

### 3. 为什么这很重要

因为后面无论是 root 记账、选下一批工作，还是 scheduler 安排 callback，全部都依赖这里分配出的 lane。

如果没有这一步，后面的“优先级”和“调度”就没有输入材料。

---

## 五、root 才是 lanes 的总账本

如果只盯着单个 Fiber，很容易误以为“优先级信息都散落在各个组件上”。

这会把 M5 看碎。

更稳的理解是：

**真正从系统角度管理这些工作状态的，是 root。**

### 1. root 上记了什么

在 `ReactFiberRoot.old.js` 里，可以直接看到 root 上有这些关键字段：

- `pendingLanes`
- `suspendedLanes`
- `pingedLanes`
- `expiredLanes`
- `callbackNode`
- `callbackPriority`
- `eventTimes`
- `expirationTimes`
- `entangledLanes`
- `entanglements`

你不必逐项死记，但要知道这几类信息分别对应：

- 还有哪些工作没做；
- 哪些工作当前被阻塞；
- 哪些被重新唤醒；
- 哪些等太久，已经不能再拖；
- 当前 root 绑定了哪个调度回调；
- 有哪些 lanes 彼此绑定，最好一起处理。

### 2. 一次更新进来后，root 会发生什么

`markRootUpdated(root, lane, eventTime)` 会做几件关键事：

- 把新的 `lane` 并入 `root.pendingLanes`；
- 非 idle 更新时，清掉 `suspendedLanes` / `pingedLanes`，让系统重新评估哪些工作现在可能又能做了；
- 记录该 lane 的事件时间。

这一步可以直接理解为 root 在记总账：

- 新工作进账；
- 某些旧账状态需要重算；
- 记下这笔工作的时间信息。

### 3. 为什么必须由 root 集中管理

因为“下一轮到底做什么”是一个**全局决策**，不是单个组件自己能决定的。

某个组件并不知道：

- 整棵树还有哪些别的更新；
- 哪些工作更急；
- 哪些工作虽然先来，但现在被挂住了；
- 哪些工作已经饿太久，必须推进。

这些都只能在 root 层汇总后再判断。

所以 M5 的一个重要纠偏是：

**lane 发生在更新入口，但 lanes 的统一选择发生在 root 层。**

---

## 六、`getNextLanes`：React 怎样挑“下一批该做的工作”

这是 M5 的中心函数之一。

如果只记一个调度函数名，应该优先记住它。

### 1. 它不是做 render，而是选批次

`getNextLanes(root, wipLanes)` 做的不是：

- 执行组件 render；
- 遍历 Fiber 子树；
- 提交 DOM 变更。

它做的是更上游的一步：

**从 root 当前所有待处理 lanes 中，选出这一轮最值得处理的一批。**

### 2. 它大致怎么选

根据 `ReactFiberLane.old.js` 的逻辑，可以概括成下面这条主线：

1. 先看 `pendingLanes`，如果根本没有工作，直接返回空；
2. 优先考虑 non-idle work；
3. 如果某些 lanes 没被 `suspendedLanes` 阻塞，就优先选那些未阻塞的高优先级 lanes；
4. 如果都被挂住了，再看 `pingedLanes`，也就是“之前不能做，现在又重新可做”的那部分；
5. 如果已经有一棵 work-in-progress 树正在 render，还要比较当前正在做的 `wipLanes` 和新候选 lanes，决定要不要中断当前 render；
6. 最后再把 entangled lanes 一起补进来。

### 3. 这说明了什么

这说明 React 的调度不是简单的“先来先服务”。

它更像：

- 先看谁更急；
- 再看谁现在做得成；
- 再看是否值得打断当前工作；
- 最后把必须绑定一起的工作一起算上。

### 4. 关于中断的关键直觉

`getNextLanes` 里有一段很重要的判断：

- 如果当前已经在 render 某些 lanes，切换到另一批 lanes 会丢失现有进度；
- 所以只有在“新来的那批确实更值得打断当前工作”时，React 才会切换。

这就是并发 render 能“让位”但又不是“见到新工作就乱跳”的原因。

### 5. 饿太久怎么办

`markStarvedLanesAsExpired` 会把长期没被处理、已经饿太久的 lane 标记为 expired。

一旦 lane 过期，它后续就不再只是“普通待处理工作”，而会被强制推进。

这说明 React 的目标不只是“灵活”，还包括：

- 不能让某些工作永远被插队饿死。

---

## 七、scheduler 在这里到底扮演什么角色

这个问题最容易被讲混。

一个常见误解是：

- scheduler 就是 React 的渲染器本体。

这不对。

更准确地说：

**scheduler 负责安排“什么时候再给 root 一个执行机会”，而 Fiber work loop 负责“拿到这个机会后具体渲染哪些 lanes、怎样推进 render/commit”。**

### 1. v18.2.0 里的主桥梁：`ensureRootIsScheduled`

在 React 18.2.0 的这套旧文件组织里，root 调度桥梁主要还在 `ReactFiberWorkLoop.old.js` 里，而不是一个单独的 `ReactFiberRootScheduler.old.js` 文件。

`ensureRootIsScheduled` 的主线很清楚：

1. 先调用 `markStarvedLanesAsExpired`；
2. 再调用 `getNextLanes`，算出下一批该做的工作；
3. 如果没有工作，就取消已有 callback；
4. 如果有工作，就用这批 lanes 里的最高优先级 lane 代表 callback priority；
5. 如果旧 callback 还能复用，就复用；
6. 否则取消旧 callback，重新安排新的 sync callback 或 scheduler callback。

### 2. 为什么这一步很重要

因为它说明 React 并不是：

- 每来一个更新，就粗暴地新起一条独立任务。

而是：

- 以 root 为单位，重新评估“当前最佳的下一批工作”；
- 然后决定是复用旧安排，还是改排新的 callback。

这就是“调度”真正有意义的地方。

### 3. main 为什么还能做最小对照

React main 已经把这部分骨架拆进了 `ReactFiberRootScheduler.js`，里面仍然能看到：

- `ensureRootIsScheduled`
- `getNextLanes`
- root callback 的重排逻辑

所以这里可以得出一个稳定判断：

**文件位置会变，但“root 选 lane → 安排 callback → 进入 work loop”的骨架没有变。**

这就够 M5 用了。

---

## 八、并发 render 为什么能暂停、续跑、甚至放弃旧工作

说到“并发”，最需要先排除一个误解：

**这里的并发不是多线程并行渲染。**

React 在浏览器里并不是开出另一条渲染线程，同时跑两棵树。

M5 里所谓 concurrent，更准确的意思是：

- render 工作在 commit 前可以被切片；
- 可以在合适的位置让位给更高优先级工作；
- 之后可以继续；
- 如果旧工作已经过时，也可以不要它，重新来。

### 1. `performConcurrentWorkOnRoot` 的位置

这个函数可以看成“通过 Scheduler 进入并发 root 工作”的入口。

它会做这些事：

- 先清理/刷新一些上下文；
- 先执行 pending passive effects，避免这些副作用又额外塞入新工作；
- 再次调用 `getNextLanes`，根据 root 当前真实状态决定要做哪批 lanes；
- 判断这轮是否适合 time slicing；
- 选择走 `renderRootConcurrent` 还是 `renderRootSync`；
- render 结束后，如果任务还没彻底结束，再重新 `ensureRootIsScheduled(...)`。

### 2. 为什么它能“续跑”

因为并发任务执行完一轮后，如果当前 callback 仍然有效，它会返回一个 continuation：

- 下一次可以从这个 root 的并发工作继续。

这说明 React 并不是要求每次一口气把 render 做到底，而是允许“做一段、让一下、再回来”。

### 3. 为什么它能“放弃旧工作”

因为在 commit 之前，work-in-progress 还只是一个尚未成为当前树的候选结果。

如果这期间：

- 来了更高优先级更新；
- 或者当前这批工作已经不再是最值得做的；
- 或者这次 render 中途失败、挂起、需要改计划；

React 就可以放弃这次未完成的 work-in-progress，改做更新的那一批工作。

这不是 bug，而是 concurrent render 的核心价值之一。

### 4. 这一点为什么要在 M5 讲清楚

因为一旦理解了“render 可以在未提交前被重排”，你就更容易理解：

- 为什么 transition 能被 urgent update 打断；
- 为什么旧的 transition render 可能直接被放弃；
- 为什么 React 的并发重点在“计划可调整”，而不在“并行算得更多”。

---

## 九、`startTransition` 到底做了什么

这是 M5 最容易被误讲成“黑魔法”的部分。

### 1. 先看公开语义

React 18 官方 changelog 的表述非常直接：

- `startTransition` 和 `useTransition` 可以把一些 state updates 标记为 **not urgent**；
- urgent updates（例如输入框内容更新）可以打断 non-urgent updates（例如搜索结果列表渲染）。

所以最稳的教学表达是：

**`startTransition` 不是加速器，而是“降紧急度”的标记器。**

### 2. 它在 API 层怎么做

`packages/react/src/ReactStartTransition.js` 里，`startTransition(scope)` 的核心动作是：

- 暂时把 `ReactCurrentBatchConfig.transition` 设为一个对象；
- 执行 `scope()`；
- 结束后再恢复原来的 transition 上下文。

也就是说，它并没有直接自己去 render。

它做的是给“这段代码里触发的更新”加一个上下文标记。

### 3. 这个标记如何影响更新

后面当更新进入 `requestUpdateLane` 时，React 会检查：

- 当前是否正处在 transition 上下文里。

如果是，就不再按普通 urgent update 的路径取 lane，而是去拿 transition lane。

因此 `startTransition` 的本质可以概括成一句话：

**它不是直接安排慢任务，而是让这段更新在进入系统时被分配进 transition lanes。**

---

## 十、transition 为什么是“可让位的非紧急更新”

到了这里，可以把几条线合起来了。

### 1. 公开语义：它不 urgent

官方已经明说：

- transition updates 是 not urgent；
- urgent updates 可以打断它们。

### 2. 内部落地：它拿到 transition lane

因为 `startTransition` 会设置 transition 上下文，所以 `requestUpdateLane` 看到这个上下文时，会把这些更新分配到 transition lane。

而 transition lane 在 lane 系统里就是一类明确的工作集合。

### 3. 调度后果：更高优先级工作可以插队

一旦 root 上同时存在：

- 更紧急的输入类更新；
- 与之并存的 transition lanes；

`getNextLanes` 与后续 root 调度就会优先考虑更紧急的那批工作。

于是你在现象上看到的就是：

- 输入先保持流畅；
- 慢一点的列表或大区域重渲染稍后再完成。

### 4. 为什么旧 transition 结果可以被丢弃

因为 transition 本来就是“可让位”的工作。

如果旧的 transition render 还没提交，新的更重要更新又来了，那么继续死守旧 render 往往没有意义。

对用户更有价值的，通常是：

- 保证当前输入与交互先顺畅；
- 只保留最新、最相关的过渡结果；
- 不为已经过时的中间结果浪费时间。

所以“旧 transition render 被打断甚至被放弃”，并不是 React 做坏了，而是这套优先级与调度设计在正常工作。

---

## 十一、entanglement：为什么有些 transition 工作要绑在一起

如果 transition 只是“分到某条 lane”，还少了一层：

- 某些相关的 transition lanes 不能被拆得过散。

这就是 entanglement 的意义。

### 1. 它在做什么

`entangleTransitions(root, fiber, lane)` 在遇到 transition lane 时，会：

- 读取当前队列上已有的 transition lanes；
- 与 root 当前 pending 的那部分做交集，去掉已经结束的；
- 再把新 lane 合进去；
- 最后通过 `markRootEntangled(...)` 把这些关系写回 root。

### 2. 为什么需要它

因为某些来自同一来源、同一过渡语境的更新，最好不要被拆成互相无关的批次。

否则可能出现一种很别扭的情况：

- 同一过渡里的相关结果，被撕成东一块西一块；
- 用户先看到一些过渡结果，再看到另一些旧结果；
- 最终状态虽然可能还是对的，但过程很不自然。

### 3. M5 只需要怎么讲

本模块不需要把 entanglement 讲成数学系统。

只要讲清楚：

**React 不只是给 transition 分 lane；在某些情况下，还会把相关 transition lanes 绑定起来，尽量作为同批工作来管理。**

这就够了。

---

## 十二、把整个主线串起来

现在可以把 M5 主线压缩成一条完整链路：

1. **更新产生时**，先调用 `requestUpdateLane`；
2. React 根据上下文、事件优先级、是否在 transition 中，为它分配 lane；
3. `markRootUpdated` 把这个 lane 记到 root 的 `pendingLanes` 等总账本里；
4. `getNextLanes` 根据 pending / suspended / pinged / expired / entangled 状态，选出下一批最值得做的 lanes；
5. `ensureRootIsScheduled` 根据这批 lanes 的优先级，复用或重排 root 的 callback；
6. callback 触发后，进入 `performConcurrentWorkOnRoot`；
7. 并发 render 可以让位、续跑、重试，必要时放弃旧的 work-in-progress；
8. 如果某批更新来自 `startTransition`，它们会被归入 transition lanes，因此在这套系统里自然表现为“非紧急、可让位”。

这就是 M5 应该建立的骨架认识。

---

## 十三、三个最容易混淆的点

### 误解一：lane 就是普通优先级数字

不对。

它是位集合编码，既表达优先级，也表达工作分组。

### 误解二：scheduler 就是 React 渲染本体

不对。

scheduler 更像“安排执行机会”的一层；真正 render/commit 仍是 Fiber reconciler 的职责。

### 误解三：并发 = 多线程并行渲染

不对。

这里的重点是：

- 可中断；
- 可恢复；
- 可让位；
- 可放弃未提交的旧 render。

---

## 十四、用一个直观例子收束

假设页面上有一个搜索框和一个搜索结果列表。

用户每输入一个字符，会发生两类更新：

1. 输入框里的文本变化 —— 很急；
2. 根据新关键字重新渲染大列表 —— 没那么急。

如果把第二类更新放进 `startTransition`：

- 输入框更新会以更紧急的 lane 进入系统；
- 列表更新会以 transition lane 进入系统；
- root 上同时挂着这两类 lanes；
- `getNextLanes` 会优先让更紧急的输入更新先走；
- 列表 render 可以稍后继续；
- 如果用户很快又输入下一个字符，旧的列表过渡 render 甚至可能直接被放弃，转而计算更新的结果。

从用户体验看，就是：

- 输入始终跟手；
- 大列表稍后稳定下来；
- React 不会执着于把已经过时的旧列表结果算到底。

这正是 transition 的价值。

---

## 十五、本模块的结论

M5 最重要的不是记住多少函数名，而是建立下面这套判断框架：

- React 先把更新放进 lanes，而不是立刻把所有更新一把做完；
- root 是这些 lanes 的总账本与选择中心；
- `getNextLanes` 决定下一批该做什么；
- `ensureRootIsScheduled` 决定 root 应该以什么调度机会继续推进；
- concurrent render 允许 React 在 commit 前调整计划；
- `startTransition` 则是对一类更新明确打上“非紧急、可让位”的标记。

如果把这套骨架吃透，后面再进入 Suspense、Offscreen，甚至再看 React main 的文件拆分变化，就不会迷路。

---

## 参考锚点（最小集合）

- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
  - `requestUpdateLane`
  - `scheduleUpdateOnFiber`
  - `ensureRootIsScheduled`
  - `performConcurrentWorkOnRoot`
  - `renderRootConcurrent`
- `packages/react-reconciler/src/ReactFiberLane.old.js`
  - `getNextLanes`
  - `markStarvedLanesAsExpired`
  - `markRootUpdated`
  - `includesOnlyTransitions`
  - `claimNextTransitionLane`
  - `markRootEntangled`
- `packages/react-reconciler/src/ReactFiberRoot.old.js`
  - root 上的 pending / suspended / pinged / expired / entangled 相关字段
- `packages/react/src/ReactStartTransition.js`
- `packages/react/src/React.js`
- `packages/react-reconciler/src/ReactFiberTransition.js`
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`
  - `entangleTransitions`
- `CHANGELOG.md`
  - React 18 对 urgent / non-urgent / interruptible 的官方表述

---

## 延伸阅读

**下一模块：M6｜Suspense、Offscreen 与 React 19 的轻量变化**

M5 建立了"React 按 lanes 决定先做哪批工作"的系统观，但还有一个边界情形没有覆盖：**如果某段 render 中途做不下去怎么办？**

比如一个子树在 render 阶段抛出了 Promise——还没有数据可以渲染。React 不能让整棵树卡在这里，也不能把半成品 commit 出去。

M6 回答的正是这个问题，主线是：

- **`throwException`**：捕获被抛出的 wakeable，把当前 Fiber 标记为 suspended
- **边界捕获**：最近的 Suspense boundary 通过 `markSuspenseBoundaryShouldCapture` 接管
- **fallback 出场**：boundary 切换到 fallback 分支，主内容以 hidden Offscreen 形式保留
- **`attachPingListener`**：把 wakeable resolve 事件与 root 的重调度挂钩（ping 机制）
- **retry**：wakeable resolve 后通过 `retryDehydratedSuspenseBoundary` 等入口，把"重新尝试主内容"作为新的 lane 送回 root

M5 里的 `suspendedLanes` 字段正是 M6 的衔接点：Suspense 挂起时，root 会把相关 lanes 记入 `suspendedLanes`，等 ping 来临后再把它们移回可调度状态。

读完 M6，M1-M6 的整条主线就完整了。

参考文件：`docs/modules/m6-suspense-offscreen-react19-draft.md`
