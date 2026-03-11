# M3｜官方证据笔记：current / workInProgress / finishedWork / render → commit

## 范围说明

本笔记只为 M3 提供最小而可靠的官方证据，聚焦四件事：

1. `current`、`workInProgress`、`finishedWork` 分别表示什么。
2. React 为什么会同时持有“当前树”和“工作树”。
3. render 阶段如何产出可提交结果。
4. commit 阶段如何接手这份结果，并完成 `current` 切换。

基线：**React v18.2.0** 本地 upstream mirror。
轻量对照：`react-main`，只确认主干叙事未变。

---

## 证据 1：Fiber 本身就内建“双缓冲配对”关系

### 文件
- `packages/react-reconciler/src/ReactInternalTypes.js`

### 关键证据

1. Fiber 类型里直接有：
   - `alternate: Fiber | null`
2. 类型注释写明：
   - `workInProgress : Fiber -> alternate`
   - “The alternate used for reuse happens to be the same as work in progress.”
3. Root 类型里直接有：
   - `current: Fiber`
   - `finishedWork: Fiber | null`
   - `finishedLanes: Lanes`
4. Root 上的注释明确说明：
   - `current` 是 “The currently active root fiber. This is the mutable root of the tree.”
   - `finishedWork` 是 “A finished work-in-progress HostRoot that's ready to be committed.”

### 可下结论

- `current`、`workInProgress`、`finishedWork` 不是教学时临时起的口头名词，而是 React reconciler 在类型层面就明确建模的状态位。
- `finishedWork` 不是第三套独立体系，而是“已经完成、等待提交的 work-in-progress 根节点”。
- root 是当前树与待提交结果的统一持有者，因此 render 与 commit 的交接天然发生在 root 上。

---

## 证据 2：`createWorkInProgress` 证明新树不是凭空重建，而是从 current 配对派生

### 文件
- `packages/react-reconciler/src/ReactFiber.js`（对照 `react-main` 同名文件）

### 关键证据

`createWorkInProgress(current, pendingProps)` 的实现写着：

1. 先取 `current.alternate`。
2. 如果没有，就创建一个新的 Fiber，并建立双向链接：
   - `workInProgress.alternate = current`
   - `current.alternate = workInProgress`
3. 如果已经有 alternate，就复用旧的 workInProgress 节点，并重置本轮提交相关字段：
   - `workInProgress.flags = NoFlags`
   - `workInProgress.subtreeFlags = NoFlags`
   - `workInProgress.deletions = null`
4. 随后复制当前已提交版本上的关键稳定信息：
   - `childLanes`
   - `lanes`
   - `child`
   - `memoizedProps`
   - `memoizedState`
   - `updateQueue`
5. 注释直接说明这套机制是：
   - “create an alternate fiber to do work on”
   - “double buffering pooling technique”
   - “only ever need at most two versions of a tree”

### 可下结论

- React 不是每次更新都“从零再造一棵完全无关的新树”，而是在 `current` 的配对节点上准备下一版。
- `alternate` 的核心意义不是备份，而是让“当前版本”和“正在构建的新版本”形成一一对应关系。
- 这也解释了为什么 M3 应该把 `current` 与 `workInProgress` 理解为同一界面的两个时间态，而不是两个不同页面。

---

## 证据 3：root 创建时就绑定了当前树

### 文件
- `packages/react-reconciler/src/ReactFiberRoot.old.js`

### 关键证据

在创建 root 时：

- `root.current = uninitializedFiber`
- `uninitializedFiber.stateNode = root`

并且在 root 构造时初始化：

- `this.finishedWork = null`
- `this.finishedLanes = NoLanes`

### 可下结论

- root 与 HostRoot Fiber 从一开始就是双向绑定的。
- `root.current` 指向“当前已经生效的根 Fiber”。
- `finishedWork` 和 `finishedLanes` 是 render 完成后暂存结果、等待 commit 消费的槽位。
- 因而 root 不是旁观者，而是整轮更新的状态中枢。

---

## 证据 4：render 开始时，会从 `root.current` 生成本轮根级 workInProgress

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 关键证据

`prepareFreshStack(root, lanes)` 中：

1. 先清空上一轮完成态：
   - `root.finishedWork = null`
   - `root.finishedLanes = NoLanes`
2. 随后创建本轮根工作节点：
   - `const rootWorkInProgress = createWorkInProgress(root.current, null)`
3. 再把全局 render 游标切到这棵工作树上：
   - `workInProgress = rootWorkInProgress`

### 可下结论

- render 的起点不是直接改 `root.current`，而是从 `root.current` 派生出一棵新的 work-in-progress 根节点。
- 这就是“先准备，再提交”的结构性基础。
- 也就是说，render 阶段主要在 workInProgress 树上推进，而不是直接把 current 树改坏再补救。

---

## 证据 5：render 完成后，`finishedWork` 就是 `root.current.alternate`

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 关键证据

在 render 完成路径里：

- `const finishedWork: Fiber = (root.current.alternate: any);`
- `root.finishedWork = finishedWork;`
- `root.finishedLanes = lanes;`
- 然后进入 `finishConcurrentRender(...)`

### 可下结论

- 这一轮 render 的完成结果，本质上就是当前根节点的 alternate，也就是本轮已经构建完成的那棵 workInProgress 根。
- `finishedWork` 并不是额外复制出来的第三棵树，而是 workInProgress 进入“已完成、待提交”状态后的名字。
- 这正是 M3 最需要讲清的命名关系：
  - `current`：当前已提交版本
  - `workInProgress`：正在构建的新版本
  - `finishedWork`：已经构建完成、等待提交的新版本

---

## 证据 6：commit 直接消费 `root.finishedWork`，而不是重新计算整棵树

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
- `packages/react-reconciler/src/ReactFiberCommitWork.old.js`

### 关键证据

`commitRoot(...)` 开头直接取：

- `const finishedWork = root.finishedWork;`
- `const lanes = root.finishedLanes;`

并且随后：

- `root.finishedWork = null`
- `root.finishedLanes = NoLanes`

这说明 commit 的输入就是 render 刚刚产出的完成树，而不是再次从头执行 render。

在 commit 具体执行里，大量逻辑都以 `finishedWork` 为输入，例如：

- `commitBeforeMutationEffectsOnFiber(finishedWork)`
- `commitMutationEffectsOnFiber(finishedWork, root, committedLanes)`
- `commitReconciliationEffects(finishedWork)`
- `commitLayoutEffects(finishedWork, root, lanes)`

### 可下结论

- commit 阶段不是重新“算下一版 UI”，而是消费 render 已经准备好的 Fiber 结果。
- render 与 commit 的分工边界是明确存在的：
  - render：构建、比较、标记
  - commit：按结果与标记让变化真正生效

---

## 证据 7：`flags` / `subtreeFlags` 就是 render 留给 commit 的线索

### 文件
- `packages/react-reconciler/src/ReactFiberFlags.js`
- `packages/react-reconciler/src/ReactFiberCommitWork.old.js`

### 关键证据

1. `ReactFiberFlags.js` 写明：
   - `HostEffectMask` 是 “Union of all commit flags”
   - 注释明确说：commit 阶段会通过检查 `subtreeFlags` 跳过没有 effect 的子树。
2. `commitReconciliationEffects(finishedWork)` 中直接读取：
   - `const flags = finishedWork.flags`
   - 如果 `flags & Placement`，就执行 `commitPlacement(finishedWork)`
   - 完成后清掉 `Placement`
3. `commitRoot` 中也会先检查：
   - `finishedWork.subtreeFlags`
   - `finishedWork.flags`
   来决定是否需要执行不同 commit 子阶段。

### 可下结论

- commit 不是重新判断“哪里可能有变化”，而是主要依据 render 阶段已经写入 Fiber 的 `flags` / `subtreeFlags` 来执行。
- 因而可以用一句更准确的话描述两阶段关系：
  - render 负责把变化编码进 Fiber；
  - commit 负责按这些编码让变化生效。

---

## 证据 8：`root.current = finishedWork` 是 render → commit 交接的关键瞬间

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 关键证据

在 commit 过程中有一段核心注释：

- “The work-in-progress tree is now the current tree.”
- “This must come after the mutation phase ... but before the layout phase ...”

紧接着执行：

- `root.current = finishedWork`

### 可下结论

- 这就是双树切换的关键时刻：原来的 workInProgress 树在此正式成为新的 current 树。
- 也因此可以准确解释为什么：
  - render 完成，不等于界面已经更新；
  - 只有 commit 完成关键生效步骤，并切换 `root.current`，这轮更新才真正成为当前版本。
- 这也是 M3 最应该让学习者记住的一句话：
  - **render 负责准备，commit 负责生效，而 `root.current` 的切换是两者衔接的关键瞬间。**

---

## 轻量对照：React main 中主干叙事未变

### 对照文件
- `packages/react-reconciler/src/ReactFiber.js`
- `packages/react-reconciler/src/ReactFiberRoot.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberCommitWork.js`

### 对照结果

1. `ReactFiber.js` 里仍有 `createWorkInProgress(current, pendingProps)`，并仍以 `current.alternate` 为起点，保持双缓冲复用逻辑。
2. `ReactFiberRoot.js` 里仍在 root 创建时设置：
   - `root.current = uninitializedFiber`
3. `ReactFiberWorkLoop.js` 里仍保留：
   - `prepareFreshStack(root, lanes)`
   - `createWorkInProgress(root.current, null)`
   - render 完成后取得 `finishedWork`
   - commit 中执行 `root.current = finishedWork`
4. `ReactFiberCommitWork.js` / `ReactFiberCommitEffects.js` 虽然拆分更细，但仍以 `finishedWork`、`flags`、`alternate` 为主要输入组织 commit 阶段。

### 可下结论

- React main 的实现确实更细化，但 M3 的稳定教学骨架没有变。
- 因此以 v18.2.0 讲清 current / workInProgress / finishedWork / render → commit 的主线，是稳妥且具有延续性的。

---

## M3 可直接使用的总论

- `current` 是当前已经提交、正在对外生效的 Fiber 树。
- `workInProgress` 是 React 基于 `current` 的 alternate 正在构建的新树。
- `finishedWork` 不是第三棵独立树，而是本轮 render 完成后的那棵 workInProgress 根节点。
- render 阶段主要在 workInProgress 树上计算并写入标记。
- commit 阶段直接消费 `finishedWork` 及其 `flags` / `subtreeFlags`，把变化真正应用出去。
- 当 `root.current = finishedWork` 发生时，这轮更新才完成从“准备中”到“当前版本”的切换。

---

## 本模块刻意不展开的内容

以下内容留给后续模块，不在 M3 展开：

- 一次具体 `setState` 如何一路触发到 root（M4）
- lanes、优先级、抢占、scheduler（M5）
- commit 三小阶段的完整机制细节
- React main / React 19 的额外扩展能力细节
