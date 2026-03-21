# React Fiber 最终总览（第一版草稿）

## 一句话先说清：这套仓库到底在讲什么

这套仓库不是要把 React 源码逐行讲完，而是要建立一条稳定、可复习、可回查证据的主线：

**React Fiber 的本质，是把更新从“不可拆分的一整块渲染工作”，改造成“可分段推进、可中断、可恢复、可按优先级取舍，但最终仍要一致提交”的内部工作系统。**

M1 到 M6，分别是在把这句话拆开讲清楚。

---

## 这份最终总览怎么读

建议按下面两层来读：

1. **先读这份总览**，建立整条学习主线。
2. **再按模块回看**，用各模块正文和 evidence notes 校验细节。

如果只想先抓住骨架，可以先记六个问题：

1. 为什么 React 不能一直停留在旧同步渲染模型？
2. Fiber 这个“工作单元”在内部是什么形状？
3. React 为什么要同时保留 current 和 workInProgress 两棵树？
4. 一次具体更新是怎样从组件一路走到 root，再走到 commit 的？
5. 既然更新会同时到来，React 怎么决定先做什么、后做什么？
6. 如果某段工作中途做不下去，React 怎样回退、隐藏并等待重试？

这六个问题，正好对应 M1-M6。

---

## 全局主线：从“为什么要改”到“遇到阻塞怎么办”

如果把整个仓库压缩成一条学习链，可以写成：

**为什么需要 Fiber → Fiber 节点与遍历 → 双树与 render/commit → 一次更新全链路 → lanes 与 scheduler → Suspense / Offscreen / retry**

这条链的重点不是模块数量，而是因果关系：

配套图示入口见：`docs/diagrams/index.md`。

学习路线总图见：`docs/diagrams/react-learning-roadmap.svg`。

- 先有旧模型的控制力问题；
- 才需要一种新的工作节点与树结构；
- 有了工作节点，才谈得上双树准备与统一提交；
- 有了双树模型，才能把一次具体更新完整追踪下来；
- 当更新不止一条时，就必须引入 lanes、优先级与 scheduler；
- 当某段工作中途做不下去时，才轮到 Suspense、Offscreen、ping 与 retry 出场。

因此，M1-M6 不是六个并列知识点，而是一条逐步加骨架的解释路径。

---

## M1：为什么 React 需要 Fiber

M1 回答的是整套学习路径里最上游的问题：**React 为什么必须改造旧的渲染组织方式。**

旧同步渲染模型的问题，不应被粗糙地总结成“React 太慢了”。更准确地说，是：

- 一次渲染开始后，往往要一路做完；
- React 很难在中途把执行机会让给更紧急的工作；
- 某些已经进行到一半的工作，即使过时了，也不容易优雅放弃；
- 如果要保证界面一致性，就更不能把半成品直接暴露给用户。

所以 Fiber 解决的首先不是“多快算完”，而是**如何更细粒度地控制渲染工作**。

M1 最重要的结论可以压成一句话：

**Fiber 让 React 首次具备了把渲染当成可调度工作系统来处理的能力。**

这也是后面所有模块的前提。如果不先建立这个问题意识，后面看到 Fiber 节点、双树、lanes 时，很容易把它们误读成彼此孤立的实现细节。

建议回查：
- `docs/modules/m1-why-fiber-exists-draft.md`
- `docs/modules/m1-evidence-notes.md`
- `docs/modules/m1-compare-notes.md`
- `docs/diagrams/react-old-sync-vs-fiber.svg`

---

## M2：Fiber 节点到底是什么，React 又怎样沿树推进工作

M2 解决的是：**既然 React 要把渲染变成可拆分的工作系统，那么“工作单元”本身长什么样？**

这一章最该建立的认识不是“Fiber 也是一种虚拟 DOM”，而是：

**Fiber 是 React 用来承载组件工作上下文的内部节点。**

它至少同时承担几类职责：

- 记录树结构关系：`child`、`sibling`、`return`
- 记录输入与缓存：`pendingProps`、`memoizedProps`、`memoizedState`
- 记录更新与副作用：`updateQueue`、`flags`、`subtreeFlags`
- 为优先级与双树配对预留位置：`lanes`、`childLanes`、`alternate`

M2 的第二个关键点，是 React 不是把整棵树一次性算完，而是围绕当前 `workInProgress`，一份 Fiber 一份 Fiber 地推进。

也就是说，render 阶段真正重复执行的是“处理当前工作单元”的循环；`beginWork` 决定是否继续向下，`completeWork` 负责在回退过程中收束结果。

所以 M2 建立的是整个仓库最基础的结构直觉：

**React 之所以能更细粒度地推进工作，前提就是它先把树拆成了一个个显式相连的工作节点。**

建议回查：
- `docs/modules/m2-fiber-node-and-traversal-draft.md`
- `docs/modules/m2-evidence-notes.md`
- `docs/modules/m2-source-entry-points.md`

---

## M3：为什么要有 current 和 workInProgress 两棵树

理解了 Fiber 节点之后，下一个问题自然变成：**React 一边准备下一版界面，一边又怎样保证当前界面保持稳定？**

M3 的答案是双树模型。

这一章最重要的三个名字是：

- `current`：当前已经提交、对外生效的树
- `workInProgress`：正在准备、尚未生效的下一版树
- `finishedWork`：render 已完成、等待 commit 接手的那棵结果树

M3 最核心的结论不是“有两棵树”，而是：

**render 的主要任务，是在 `current` 的配对节点基础上准备 `workInProgress`；commit 的主要任务，是把已经准备好的结果树正式切换成新的 `current`。**

这带来三个直接后果：

1. render 可以反复准备、暂停、继续，甚至放弃；
2. 当前界面在提交前始终由 `current` 代表，不会被半成品污染；
3. commit 成为真正让结果生效的边界时刻。

因此，M3 是整条主线里的分水岭。到这一章为止，React Fiber 不再只是“节点和遍历”，而是开始显露出一整套**准备结果与提交结果分离**的工作体系。

建议回查：
- `docs/modules/m3-current-wip-render-commit-draft.md`
- `docs/modules/m3-evidence-notes.md`
- `docs/modules/m3-source-entry-points.md`
- `docs/modules/m3-compare-diagram-note.md`
- `docs/diagrams/react-current-wip-commit.svg`

---

## M4：一次 `setState` 是怎样从组件一路走到提交的

如果说 M1-M3 主要在搭概念骨架，那么 M4 的作用就是：**把前面的静态认识第一次串成动态过程。**

M4 选取的是一个最小但典型的例子：类组件中的一次 `this.setState(...)`。

这条链路可以压成七步：

1. 为这次更新创建一条 update；
2. 把 update 放进当前 Fiber 的更新队列；
3. 沿 `return` 父链一路向上找到所属 root；
4. root 把这次更新纳入调度；
5. render 在 `workInProgress` 树上真正消费 update queue，算出新的 state；
6. render 结束后产出 `finishedWork` 并写回 root；
7. commit 接手 `finishedWork`，使更新真正生效。

这一章最需要纠正的误解是：

**`setState` 不是“立刻把 state 改掉”，而是先登记更新，后续再由 root 发起 render 并完成提交。**

因此，M4 的意义不是再讲一遍 API 行为，而是让读者第一次从时间顺序上看到：

- 组件级动作如何上升为 root 级工作；
- root 如何点燃一轮新的 render；
- render 与 commit 又如何沿着 M3 的双树模型衔接起来。

读完 M4，前面 M2 与 M3 里那些看似抽象的结构，才会真正“动起来”。

建议回查：
- `docs/modules/m4-one-setstate-trace-draft.md`
- `docs/modules/m4-evidence-notes.md`
- `docs/modules/m4-source-entry-points.md`
- `docs/diagrams/react-setstate-full-path.svg`

---

## M5：当更新不止一条时，React 怎样决定先做什么

M4 讲的是“单次更新怎样走完全链路”；M5 讲的是更真实的情况：**当系统里同时有多批工作时，React 怎么取舍。**

这一章的核心不是把所有 lane 常量背下来，而是建立这样一个系统观：

1. 更新进入系统时，先被分配到某条 lane；
2. root 统一记录当前有哪些 pending、suspended、pinged、expired 的 lanes；
3. `getNextLanes` 从这些 lanes 里选出当前最值得处理的一批；
4. scheduler 负责给 root 安排执行机会，而不是代替 React 做渲染决策；
5. `startTransition` 代表的是“这类更新可以让位”，而不是另一套独立渲染机制。

所以，M5 最适合压成一句话：

**React 不是见到更新就立刻把整棵树算到底，而是先把更新编码进 lanes，再由 root 和 scheduler 协作决定下一批工作何时、以什么优先级推进。**

这一章也是理解“并发”一词最需要去神秘化的地方。它不是多线程平行渲染，也不是所有工作同时进行，而是：

- 能区分哪些工作更急；
- 能让低优先级工作在必要时让位；
- 能避免已经过时的中间结果继续浪费资源；
- 也能防止某些工作永远被饿死。

建议回查：
- `docs/modules/m5-lanes-priority-scheduler-transition-draft.md`
- `docs/modules/m5-evidence-notes.md`
- `docs/modules/m5-source-entry-points.md`
- `docs/modules/m5-compare-diagram-note.md`

---

## M6：如果某段工作中途做不下去，React 怎样回退、隐藏并等待重试

理解了 lanes 与调度后，还差最后一个关键环节：**如果 render 过程中某段子树暂时无法继续产出稳定结果，React 怎么办？**

M6 的答案是：Suspense、Offscreen、ping 与 retry。

这一章最重要的主线不是“loading 怎么显示”，而是：

**挂起 → 边界捕获 → fallback 出场 → 主内容转入 hidden Offscreen → ping / retry → 再次尝试主内容**

这里有几个必须建立的稳定认识：

- Suspense 首先是 render 的协调机制，不只是一个展示 loading 的组件 API；
- fallback 出现时，主内容往往不是简单消失，而是以 hidden Offscreen 子树的形式被保留；
- root 会把暂时做不下去的工作记成 `suspendedLanes`；
- 当 wakeable resolve 后，系统通过 ping 把相应工作重新送回 root 的调度体系；
- retry 也不是魔法捷径，而是重新以 lane 的形式发起一次“再试主内容”的工作。

因此，M6 是前面整条主线的收束点。到这里为止，React Fiber 的核心骨架已经完整了：

- 为什么要把渲染变成工作系统；
- 工作节点怎样组织；
- 新旧版本怎样并存；
- 更新怎样从组件进入 root；
- root 怎样按优先级安排工作；
- 工作卡住时系统又怎样回退、隐藏、恢复与重试。

React 19 相关内容在这一章里只保留轻量 delta：它说明这套骨架仍在延展，但**不改变 M1-M6 已建立的主干理解**。

建议回查：
- `docs/modules/m6-suspense-offscreen-react19-draft.md`
- `docs/modules/m6-evidence-notes.md`
- `docs/modules/m6-source-entry-points.md`
- `docs/modules/m6-compare-diagram-note.md`

---

## 把 M1-M6 连成一句完整的话

如果必须把整个仓库压缩成一段最短总结，我会写成：

**React 之所以需要 Fiber，是因为它必须把渲染从不可中断的整块工作，改造成可逐节点推进、可在双树之间准备下一版、可由 root 按 lanes 和 scheduler 协调优先级、并在 Suspense/Offscreen 机制下处理挂起与重试的内部工作系统。**

这就是 M1-M6 的共同主线。

---

## 推荐复习顺序

### 第一轮：先抓骨架
- 先读本总览
- 再读 M1、M3、M5

这轮的目标，是先回答三个大问题：
- 为什么需要 Fiber？
- 为什么 render/commit 要分开？
- 为什么 React 需要 lanes 与 scheduler？

提示：M3 讲双树模型时会用到 M2 中的 Fiber 节点字段（如 `alternate`、`child`、`sibling`、`return`）。如果 M3 中遇到不熟悉的字段名，可以先回看 M2 的第 2 节"一个 Fiber 节点大致装了什么"。

### 第二轮：补齐结构与动态过程
- 回读 M2
- 再读 M4
- 最后读 M6

这轮的目标，是把“工作节点”“单次更新链路”“挂起与恢复”补齐。

### 第三轮：带着问题回查证据
- 进入各模块 evidence notes
- 对照 source entry points
- 只沿问题读函数，不线性扫源码

这轮的目标，不是记更多细节，而是把已经建立的主线，重新钉回官方源码证据上。

---

## 阅读时最该避免的几个误区

### 误区 1：把 Fiber 只当成一种数据结构
Fiber 当然是一种节点结构，但它更重要的身份是“工作单元”。如果只看到字段，看不到工作系统，后面所有模块都会碎掉。

### 误区 2：把并发理解成多线程并行渲染
本仓库强调的并发，核心是可中断、可让位、可恢复的工作安排，而不是多线程神话。

### 误区 3：把 render 当成“已经改完界面”
render 的主要职责是准备结果；真正让结果对外生效的是 commit。

### 误区 4：把 Suspense 只看成 loading 组件
Suspense 真正处理的是“当前 render 暂时做不下去时，系统如何保持一致并等待重试”。

### 误区 5：为了看懂源码而线性扫完整个 React 仓库
这个仓库的原则一直是：**先有问题，再读最少但关键的源码入口。**

---

## 如果要继续完善成品，接下来最值得补什么

在不扩展新技术范围的前提下，最终成品最值得补的是图示，而不是继续横向加新主题。

优先级最高的图应当服务于下面几个问题：

1. M1-M6 的整条学习路线是什么；
2. Fiber 节点与 child / sibling / return 如何形成遍历骨架；
3. current / workInProgress / finishedWork / commit 的关系是什么；
4. 一次 `setState` 如何从 update queue 走到 root 再走到 commit；
5. lanes、root 与 scheduler 怎样协作；
6. Suspense / Offscreen / ping / retry 如何形成恢复闭环。

这些图不需要花哨，重点是结构正确、文字准确、与正文主结论一致。

---

## 最后一句总结

**这套仓库真正想让读者得到的，不是“我看过 React Fiber 的一些名词”，而是“我已经能沿着一条稳定主线，把 React 为什么需要 Fiber、Fiber 怎样组织工作、更新如何被安排、挂起如何被恢复，完整地串起来”。**
