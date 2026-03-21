# M6｜Suspense、Offscreen 与 React 19 的轻量变化

## 这一模块要解决什么问题

M5 讲的是：React 已经有了一套按 lanes 划分优先级、决定先做什么后做什么的机制。

M6 要接着回答另一个更关键的问题：**如果某段工作在 render 过程中暂时做不下去，React 怎样避免整棵树陷入“既没完成、又没法继续”的状态？**

Suspense、Offscreen，以及后面的 ping / retry，回答的就是这个问题。

所以本模块不把 Suspense 当成一个“显示 loading 的组件 API”来讲，而是把它当成一套内部协调机制来讲。

本章的主线可以先记成一句话：**挂起 → 边界捕获 → fallback 出场 → 主内容转入 hidden Offscreen → ping / retry → 再次尝试主内容。**

---

## 一、先把 Suspense 看对：它首先解决的是“当前 render 暂时不能继续”

很多人第一次接触 Suspense，会把它理解成：

- 数据没回来，就显示 loading；
- 数据回来了，就显示真正内容。

这个理解只看到了表面现象，还没有碰到内部本质。

从 Fiber 的角度看，Suspense 真正处理的是下面这件事：

> **render 过程中，某个子树现在无法继续产出稳定结果，但整棵树又不能因此直接报废。React 需要一个边界，决定这轮是继续主内容，还是先退到 fallback，等条件满足后再重试。**

这也是为什么 `updateSuspenseComponent(...)` 会成为理解 M6 的第一入口。

在 React 18.2.0 的 `ReactFiberBeginWork.old.js` 里，`updateSuspenseComponent(...)` 会先看两件事：

1. 当前边界内部是不是已经有子树 suspend 了；
2. 当前边界是不是应该继续停留在 fallback 状态。

如果答案是“是”，它就把这轮 render 导向 fallback 分支；否则就继续尝试主内容。

这说明 Suspense boundary 的角色不是“被动显示 loading 文案”，而是一个**render 协调点**。

---

## 二、fallback 不是简单替换；React 会把主内容放进一棵隐藏的 Offscreen 子树

如果只看 JSX，很容易误以为 Suspense 只是：

- 要么渲染 `children`
- 要么渲染 `fallback`

但源码里的结构比这个更准确。

在 React 18.2.0 中：

- 主内容通常会被包装进一个 `Offscreen` fiber；
- 正常显示时，这个 Offscreen 的 `mode` 是 `visible`；
- 如果边界进入 fallback，主内容并不是简单“逻辑删除”，而是会变成 `mode: 'hidden'` 的 Offscreen 子树；
- 与此同时，fallback fragment 作为另一支被接出来显示。

这件事非常重要，因为它直接修正了一个常见误解：

> **fallback 出现，并不等于主内容在内部完全消失。**

更准确地说，React 常常会把主内容保留在一棵特殊模式的子树里，只是这棵子树暂时不作为当前可见结果继续展示。对应的直接源码信号是：主内容会被包装为 `mode: 'visible'` 或 `mode: 'hidden'` 的 Offscreen fiber，而在 fallback 分支下，边界自身还会记录 `SUSPENDED_MARKER` 等状态，表示这轮已经进入挂起/回退路径。

这也是为什么 Suspense 和 Offscreen 应该放在同一个模块里讲，而不是拆开讲成两个互不相干的特性。

---

## 三、render 遇到 suspend 时，到底发生了什么

真正让 Suspense 进入工作状态的，不是 `<Suspense>` 这行 JSX 本身，而是 render 过程中出现了一个“当前不能继续”的结果。

在 React 18.2.0 的 `ReactFiberThrow.old.js` 里，`throwException(...)` 会先判断被抛出来的值是不是一个带 `then` 的对象，也就是一个 `wakeable`。

一旦满足这个条件，React 就把它视为：

> **这个组件 suspend 了。**

这里最关键的地方是：React **不会把它立即当成普通错误处理**。

相反，它会做三件事：

1. 重置当前 suspend 组件的局部状态，避免把不完整结果误当成完成品；
2. 沿着 return path 往上找最近可捕获的 Suspense boundary；
3. 把这次“抛出 wakeable”的情况，改道到 Suspense 的捕获路径上。

也就是说，Suspense 的底层不是“组件自己异步刷新”，而是：

- render 中途抛出 wakeable；
- reconciler 识别出这是可等待结果；
- 再由最近边界决定要不要回退到 fallback。

这时我们就可以把整个过程看成一句话：

> **Suspense 不是把错误吞掉，而是把 render 的控制流从“继续主内容”切换到“等待 / 回退 / 以后再试”。**

---

## 四、边界如何从“尝试主内容”切换到“显示 fallback”

当最近的 Suspense boundary 被找到以后，React 会把这个边界标记成“需要捕获”。

在 `ReactFiberThrow.old.js` 里，这一步由 `markSuspenseBoundaryShouldCapture(...)` 完成。它的含义不是“现在立刻提交 fallback”，而是：

- 当前这轮 render 的正常前进路线被打断；
- 接下来在 unwind / complete 过程中，这个边界会收束成一次 fallback 路径；
- 如果是并发模式，还会决定是否挂起提交、是否等待更合适的重试时机。

到 `ReactFiberCompleteWork.old.js` 时，如果 React 发现这个 Suspense boundary 已经带上 `DidCapture`，就会直接走“重新用 fallback children 再过一遍”的路径。

这条链路非常关键，因为它把几件事连成了同一件事：

- render 中有子树 suspend；
- 边界被标记为 should capture / did capture；
- 当前结果不再继续冒充主内容完成态；
- 这轮收束为 fallback 路径。

所以，fallback 不是“另一个平行功能”，而是 **Suspense boundary 捕获 render 挂起之后的正式结果**。

---

## 五、为什么说 Suspense 不只是边界逻辑，还一定牵涉到 root

如果只看边界，你可能会觉得 Suspense 只是“某个局部组件决定显示 loading”。

但到了 M5 的 lanes 体系里，就会发现它远不止如此。

一旦某条 render 路径 suspend，React 需要决定：

- 这批工作现在算不算还能继续做；
- 下一轮应该优先挑哪些 lanes；
- 什么时候把原来挂起的工作重新纳入候选。

这些都不是单个边界能独立完成的，它们必须由 root 统一记账。

### 1. root 会记录哪些 lanes 已经 suspend

在 `ReactFiberLane.old.js` 中，root 上有两个与 M6 最相关的字段：

- `suspendedLanes`
- `pingedLanes`

当某批工作因为 suspend 暂时做不下去时，React 会调用 `markRootSuspended(...)`，把对应 lanes 记进 `root.suspendedLanes`。

这意味着：

> **这些工作不是不存在了，而是暂时不应该再被当作“现在就能推进”的候选。**

### 2. `getNextLanes` 会主动避开 suspended work

`getNextLanes(root, wipLanes)` 在选下一批工作时，会优先选：

- 未被阻塞的 pending lanes；
- 如果没有，再考虑已经 ping 的 lanes。

换句话说：

- 被 suspend 的 lanes 不会一直被盲目重试；
- 只有当它们恢复成“值得再试”的状态时，才会重新进入优先级竞争。

这正是 M5 与 M6 的衔接点。

M5 告诉我们：React 不是靠一个全局布尔值来决定“现在忙不忙”，而是靠 lanes 这本账。

M6 则补上：**当工作因为 Suspense 暂时卡住时，这本账会把它记成 suspended；恢复时再改写成 pinged / retryable。**

---

## 六、ping 是什么：不是“Promise 回来了”，而是 root 获得了再试机会

很多介绍 Suspense 的文章会说“Promise resolve 以后 React 就会重渲染”。

这句话方向没错，但太粗糙了。

更准确的说法是：

> **wakeable resolve 后，会触发一次 ping；ping 的结果是 root 被重新标记并重新安排调度。**

在 `ReactFiberThrow.old.js` 里，React 在 suspend 发生时就会先调用 `attachPingListener(root, wakeable, lanes)`。

这里有两个关键点：

1. listener 是**在 fallback commit 之前**就挂上的；
2. React 会把 `(wakeable, lanes)` 做缓存，避免重复挂同一组 listener。

这样做的原因很直接：

- 数据可能很快就回来了；
- 有时 fallback 甚至还没来得及 commit；
- 但 React 不能因为“还没显示 fallback”就错过恢复时机。

当 wakeable resolve 后，会进入 `pingSuspendedRoot(...)`。在 `ReactFiberWorkLoop.old.js` 里，这个函数会：

- 从 `pingCache` 中删掉已经 resolve 的 wakeable；
- 调用 `markRootPinged(root, pingedLanes, eventTime)`；
- 再调用 `ensureRootIsScheduled(root, eventTime)`。

也就是说，ping 的实际含义是：

> **之前挂起的某批工作，现在有资格重新进入 root 调度系统了。**

对应的最小源码锚点也很直接：`pingSuspendedRoot(...)` 会调用 `markRootPinged(...)`，随后再调用 `ensureRootIsScheduled(...)`。这不是一个“组件层面的通知”，而是一次 **root 级重新排班**。

---

## 七、retry 是什么：边界退出 fallback 的正式重试入口

除了 ping，M6 里还有一个必须讲清的词：`retry`。

当某个 Suspense boundary 已经处在 fallback 状态时，React 需要一个明确入口来再次尝试主内容。这件事在 `ReactFiberWorkLoop.old.js` 里由 `retryTimedOutBoundary(...)` 负责。

它的逻辑很朴素：

1. 为这个 boundary 申请一个 retry lane（通过 `requestRetryLane` → `claimNextRetryLane`）；
2. 通过 `enqueueConcurrentRenderForLane` 把这个 boundary fiber 标记为需要在该 lane 上重新 render（注意这里不是创建 update 对象，而是标记 fiber 需要重新 render）；
3. 调用 `markRootUpdated` 把这个 lane 记入 root；
4. 再次调用 `ensureRootIsScheduled(...)`。

实际上 Suspense 的 retry 有两条触发路径：

- **ping 路径**：`attachPingListener` → wakeable resolve → `pingSuspendedRoot` → `markRootPinged` + `ensureRootIsScheduled`。这条路径在 render 阶段就挂上，甚至在 fallback commit 之前就可能触发。
- **retry 路径**：`attachRetryListener`（在 commit 阶段挂上）→ wakeable resolve → `resolveRetryWakeable` → `retryTimedOutBoundary`。这条路径在 fallback 已经 commit 之后触发。

两条路径解决不同时机：ping 处理”数据很快就回来了”的情况，retry 处理”fallback 已经显示一段时间后数据才回来”的情况。

无论哪条路径，retry 都不是绕开 lanes/scheduler 的特殊捷径，而是把”退出 fallback、重试主内容”这件事重新翻译回 root 能继续处理的工作。

这说明 retry 并不神秘，它仍然遵守和普通更新相同的总原则：

- 有 lane；
- lane 进入 root；
- root 决定何时调度；
- work loop 再次尝试 render。

所以，M6 里的一条重要结论是：

> **Suspense 的恢复并不是“自动魔法恢复”，而是通过 ping / retry 把原本挂起的工作重新送回 lanes + root scheduler 体系。**

---

## 八、Offscreen 到底是什么：不是“隐藏 DOM”，而是“隐藏但保留”的 Fiber 子树模式

很多人第一次听到 Offscreen，会自然联想到：

- DOM 上加个 `display: none`；
- 或者只是把节点先不显示。

这种理解不准确。

在 `ReactFiberOffscreenComponent.js` 里，React 对 Offscreen 的定义非常克制，但已经足够说明问题：

- `OffscreenProps` 有 `mode`；
- `OffscreenState` 的存在本身，就表示这棵子树当前是 hidden；
- `OffscreenInstance` 记录稳定的 `isHidden` 状态。

尤其关键的一句注释是：

> **We use the existence of the state object as an indicator that the component is hidden.**

也就是说，Offscreen 的核心不是某种 DOM 命令，而是：

- 这棵子树当前在 reconciler 里属于哪种存在状态；
- 它是 visible，还是 hidden；
- hidden 时哪些工作被延期，哪些状态被保留；
- 重新 visible 时如何恢复。

### hidden 时会发生什么

在 `updateOffscreenComponent(...)` 里，如果当前树是 `hidden`，而且这次 render 不是在 `OffscreenLane` 上做的，React 会：

- 记录这次没做完的 `baseLanes`（注意：在 18.2.0 中，源码注释标注 `baseLanes` 尚未实际启用——"TODO: This doesn't do anything, yet. It's always NoLanes."——但这个字段的设计意图是为后续版本预留的）；
- 把当前 fiber 和 childLanes 标到 `OffscreenLane`；
- 然后直接 bailout，等之后再恢复这棵隐藏树。

这说明 Offscreen 的关键语义是：

> **这棵树可以暂时不作为前台可见工作继续推进，但它的工作和状态不会被简单抹掉。**

所以 Offscreen 本质上是“**隐藏但保留**”。

---

## 九、为什么 Suspense 总是和 Offscreen 连在一起出现

现在我们可以把前面的结论串起来了。

Suspense 要解决的是：

- 某段 render 暂时做不下去；
- 当前边界需要决定：继续主内容，还是先退 fallback。

而 Offscreen 解决的是：

- 那些暂时不该显示、但又不该被粗暴丢弃的主内容子树，该以什么方式存在。

因此两者天然拼在一起：

### 1. Suspense 决定“现在显示谁”

- 主内容还能继续，就显示主内容；
- 主内容暂时不行，就显示 fallback。

### 2. Offscreen 决定“暂时不显示的那棵树如何存在”

- 主内容不显示时，不一定卸载；
- 它可以进 hidden Offscreen；
- 等后面条件满足，再恢复。

所以如果要把整个 M6 压缩成一条链，就是：

> **挂起 → 边界捕获 → fallback 出场 → 主内容转入隐藏/保留状态 → wakeable ping → retry → 主内容恢复**

这条链才是理解 Suspense / Offscreen 最稳定的内部骨架。

---

## 十、commit 阶段如何体现 Offscreen 的“隐藏但保留”

如果 Offscreen 只是 render 阶段的内部标记，那它还不足以说明问题。

真正能证明它不只是“样式技巧”的，是 commit 阶段也会受它影响。

在 `ReactFiberCompleteWork.old.js` 和 `ReactFiberCommitWork.old.js` 中，有两类值得抓住的证据。

### 1. Suspense 状态切换时，会安排可见性 effect

当边界从主内容切到 fallback，或者从 fallback 切回主内容时，React 会专门安排与 Offscreen 可见性相关的 effect。

这说明“主内容是否显示”不是一次纯 render 决策，而会贯穿到后续提交阶段。

### 2. 隐藏的 Offscreen 子树会跳过 layout effects，重新出现时再恢复

在 commit layout 阶段，如果 React 发现当前处在隐藏的 Offscreen 子树里，就会跳过其 layout effects。

等这棵树重新出现时，再调用专门逻辑把这些 layout effects 恢复回来。

这有两个重要含义：

- hidden 不等于彻底卸载；
- hidden 也不等于“什么都不管，只是不画出来”。

更准确地说：

> **Offscreen 影响的是一整棵子树在提交阶段的生命周期连接方式。**

这就是为什么把它解释成 `display: none` 的内部别名，会严重低估它的作用。

---

## 十一、把 M5 和 M6 连起来看

到这里，可以把 M5 和 M6 的关系明确说出来了。

### M5 关注的是：

- React 怎样按 lanes 表示不同类别的工作；
- root 怎样在不同优先级中挑选下一批工作；
- scheduler 怎样让这些工作能被打断、恢复、再安排。

### M6 关注的是：

- 如果这批工作里有一段因为 Suspense 暂时做不下去，会发生什么；
- root 怎样把这些 lanes 记成 suspended；
- wakeable resolve 后又怎样记成 pinged / retryable；
- 边界怎样在 fallback 与主内容之间切换；
- Offscreen 怎样承接那些暂时隐藏但需要保留的子树。

因此可以把它们概括成一句连续的话：

> **M5 讲“工作怎样被安排”，M6 讲“工作安排好了以后，如果中途卡住，系统怎样优雅地退、等、再试”。**

---

## 十二、React 19 值得补哪一点，哪些又不该在本模块展开

本模块以 React 18.2.0 为基线，但可以用很轻的方式补一点 React 19 的公开变化。

最值得补的一点，是官方 changelog 里提到的：

### Suspense sibling pre-warming

React 19 提到：

- 当某个组件 suspend 时，React 会立即 commit 最近 Suspense 边界的 fallback，不再等待 sibling 子树全部 render 完；
- fallback commit 之后，React 再安排一轮后续 render，对 suspended siblings 进行”预渲染”（pre-warming）；
- 这样用户能更快看到 fallback，同时 sibling 的预渲染结果可以加速后续恢复。

这对学习路径的意义不是“要重新画一整套理论图”，而是：

- React 19 更积极地把“先给出 fallback”和“为后续恢复做准备”拆成两个阶段；
- 但底层主线仍然是：
  - 有东西 suspend；
  - 边界决定 fallback；
  - root 记录与再调度；
  - 后续 retry 恢复主内容。

所以这部分只需要写成一个**轻量 delta**即可。

### 另外一个可轻提但不展开的点

React 19 还调整了公开错误处理口径，例如 render 中错误不再重新抛出，而改为通过统一接口上报。

这件事可以作为背景提醒，但不应在 M6 中展开成完整错误处理专题。因为那会把模块边界从 Suspense / Offscreen 拉向另一条主线。

### 本模块明确不展开

为了让 M6 保持边界清晰，以下话题都不展开：

- RSC / Flight
- `use` API 的系统讲解
- 流式 SSR / selective hydration 的完整路径
- Activity / ViewTransition
- SuspenseList、Cache、Transition tracing 的全量细节

原因很简单：

> **M6 的任务不是覆盖所有“与 Suspense 有关”的新主题，而是先把挂起—回退—隐藏—重试—恢复这条骨架讲稳。**

---

## 十三、这一模块最重要的稳定认识

如果把整章压缩成几句最值得记住的话，我会保留下面这几句：

1. **Suspense 的本质不是 loading UI，而是 render 遇到暂不可继续工作时的边界协调机制。**
2. **当子树 suspend 时，React 不会简单报错退出，而是把控制流导向边界捕获、fallback 与后续重试。**
3. **root 会把相关工作记成 suspended lanes；wakeable resolve 后，再把它们作为 pinged / retry 的候选重新送回调度系统。**
4. **Offscreen 不是“隐藏 DOM”，而是“隐藏但保留”的 Fiber 子树模式。**
5. **Suspense 与 Offscreen 不是两套孤立功能，而是同一条“挂起—隐藏—恢复”链上的相邻部件。**
6. **React 19 有一些体验与组织上的增强，但并没有推翻这条主线。**

---

## 小结

到 M6 为止，我们已经能把 React 的一条重要内部主线连起来：

- M3 讲 current / workInProgress / render / commit；
- M4 讲一次更新怎样走完整条链；
- M5 讲 lanes / priority / scheduler 怎样安排工作；
- **M6 则讲：当工作进行到一半，某段 render 因 Suspense 暂时做不下去时，React 怎样通过边界、lane 记账、Offscreen 隐藏子树以及后续 retry，把系统从“不完整”重新带回“可恢复”。**

如果把 Fiber 看成 React 的内部操作系统，那么 Suspense 和 Offscreen 讨论的就不是“一个组件长什么样”，而是：

> **当某段前台任务暂时阻塞时，系统怎样保存现场、先给用户一个稳定结果，再在合适的时候恢复原任务。**

这就是 M6 的核心。