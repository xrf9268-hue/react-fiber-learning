# M3｜从 current 到 workInProgress：render 如何把结果交给 commit

## 先给结论

React 在更新时，不会直接在当前正在生效的 Fiber 树上硬改，而是先基于它准备一棵新的工作树。等这棵树准备完成后，再由 commit 阶段把结果真正生效。

如果只记一句话，本模块记住这一句就够了：

**`current` 是当前版本，`workInProgress` 是准备中的下一版本，`finishedWork` 是已经准备好、等待提交的下一版本；render 负责准备，commit 负责生效。**

---

## 一、先把三个名字放到同一条时间线上

这三个名字最容易被误解成三种不同对象，实际上它们描述的是**同一套界面在不同阶段的状态**。

### 1. `current`

`current` 表示：**当前已经提交、已经对外生效的 Fiber 树**。

换句话说，它代表“此刻页面真正对应的是哪一版内部树”。在 root 上，这个角色由 `root.current` 持有。

### 2. `workInProgress`

`workInProgress` 表示：**React 正在构建、但还没有对外生效的新树**。

它不是另一个页面，也不是随便复制出来的草稿，而是 React 为“下一版界面”准备的工作版本。

### 3. `finishedWork`

`finishedWork` 表示：**这轮 render 已经完成、现在可以交给 commit 的那棵新树**。

它听上去像第三种东西，其实不是。更准确地说，它通常就是：

- render 跑完之后的那棵 `workInProgress` 根节点
- 只是此时它已经从“进行中”变成了“待提交”

所以这三个名字连起来看，最容易理解：

- `current`：当前生效版本
- `workInProgress`：正在准备的下一版
- `finishedWork`：已经准备好、等着提交的下一版

---

## 二、为什么 React 要同时保留 current 和 workInProgress

如果 React 在更新时直接改当前树，会遇到一个根本问题：

**一边计算下一版，一边又要保证当前界面仍然是稳定可用的。**

这两件事最好不要混在一起。

因此 React 采用的是更稳的办法：

1. 保留一棵已经提交的树，作为当前真相，也就是 `current`
2. 在它旁边准备一棵新的工作树，也就是 `workInProgress`
3. 等新树准备好后，再一次性交给 commit 生效

这样做的好处很直接：

- render 过程中可以放心计算，不必把“半成品”暴露出去
- 当前界面在提交前始终由 `current` 代表
- 新旧版本能一一对应，便于比较、复用和切换

这也是 Fiber 双树模型最核心的意义：

**不是两套业务树，而是同一套界面的已提交版本和待提交版本。**

---

## 三、`alternate` 是双树关系的关键链接

在 M2 里，我们已经见过 `alternate`。到了 M3，需要把它的作用讲完整。

`alternate` 不是“额外备份”，而是**同一逻辑节点在两棵树之间的配对关系**。

也就是说，一个 Fiber 节点通常会对应另一份 Fiber：

- 一份处在当前树里
- 一份处在工作树里

它们通过 `alternate` 互相指向。

React 18.2.0 的 `createWorkInProgress(current, pendingProps)` 直接证明了这一点：

- 它先尝试读取 `current.alternate`
- 如果还没有，就创建一份新的 Fiber
- 然后建立双向链接：
  - `workInProgress.alternate = current`
  - `current.alternate = workInProgress`
- 如果已经有，就直接复用那份 alternate，并重置本轮提交相关标记

这说明一件很重要的事：

**React 的工作树不是每次凭空从零造出来，而是基于当前树的配对节点复用和推进。**

因此，`alternate` 的教学重点不应该停留在“有两份”，而应该进一步说清：

- 它让 current 与 workInProgress 成对存在
- 它让 React 能在旧版本基础上准备新版本
- 它为后续的比较、复用与切换提供了结构前提

---

## 四、从 root 视角看，谁在管理这次切换

如果只盯着单个 Fiber，很容易把更新理解成节点局部行为。实际上，真正掌管这轮切换的是 root。

在 React 18.2.0 中，root 上至少有三个与本模块直接相关的槽位：

- `root.current`
- `root.finishedWork`
- `root.finishedLanes`

它们分别代表：

- 当前生效的根 Fiber
- render 完成后等待提交的结果
- 这份结果对应的优先级集合

root 创建时，React 就会把 HostRoot Fiber 绑定到 `root.current`。这意味着：

- 当前树归 root 管
- 待提交结果也暂存在 root 上
- commit 也是从 root 接手这份结果

所以，M3 讲 render 和 commit 的衔接，最好统一从 root 视角理解：

**root 是当前树、工作树与待提交结果的交接中心。**

---

## 五、render 阶段到底在做什么

很多初学者会把 render 理解成“开始改页面”。这并不准确。

更准确的说法是：

**render 主要负责沿着 workInProgress 树计算下一版结果，并把需要提交的信息记录下来。**

在 `prepareFreshStack(root, lanes)` 中，React 会先做两件关键的事：

1. 清空 root 上上一轮的完成态
   - `root.finishedWork = null`
   - `root.finishedLanes = NoLanes`
2. 从 `root.current` 派生本轮根级工作节点
   - `createWorkInProgress(root.current, null)`

这一步的意义非常大。它表明：

- render 的起点是当前树
- 但 render 的主要工作场所不是 current，而是由 current 派生出来的 workInProgress

后面的 work loop 会继续沿着这棵工作树推进。M2 已经讲过 begin / complete 的遍历骨架；在 M3 里，重点不再是“树怎么走”，而是“这次走树是在干什么”：

- 不是立即改外部界面
- 而是在准备下一版树

因此，把 render 理解成“准备阶段”，比理解成“修改阶段”更准确。

---

## 六、`finishedWork` 为什么不是第三棵树

这是 M3 最容易讲歪的地方。

render 完成后，React 会拿到：

- `const finishedWork = root.current.alternate`
- 然后写入 `root.finishedWork = finishedWork`

这说明：

- render 完成时的结果，就是当前根节点对应的 alternate
- 也就是那棵已经构建好的 workInProgress 根节点

因此，`finishedWork` 并不是新的第三棵树，而只是**工作树进入“已完成、待提交”状态后的名字**。

如果把这层关系讲顺，三个概念就不会混淆：

- 更新开始前：它叫 `workInProgress`
- render 完成后：同一棵结果树可以被叫做 `finishedWork`
- commit 切换完成后：它又成为新的 `current`

这其实是一条连续的状态流转，而不是三套并列体系。

---

## 七、为什么说 render 不等于“界面已经更新”

因为 render 完成时，结果只是“准备好了”，还没有正式成为当前版本。

此时发生的事情是：

- React 已经算出了下一版树
- React 已经把需要处理的变化写进了 Fiber 的标记里
- root 也已经暂存了 `finishedWork`

但还差最后一步：**真正提交**。

这就是 commit 阶段存在的原因。

所以，render 完成时更准确的说法应该是：

- 下一版已经准备好了
- 但还没有正式对外生效

这也是 React 要把 render 和 commit 分开的根本原因之一。

---

## 八、commit 是怎样接过 render 结果的

在 `commitRoot(...)` 中，React 不是重新算一遍树，而是直接读取：

- `const finishedWork = root.finishedWork`
- `const lanes = root.finishedLanes`

这已经足以说明，commit 的输入就是 render 刚刚准备好的结果树。

然后 commit 会清空 root 上这两个暂存槽位，并开始执行真正的提交逻辑。

这里最重要的认识有两个。

### 1. commit 消费的是 render 的结果

也就是说，commit 不是另起炉灶，而是接手 `finishedWork`。

### 2. commit 主要按标记执行

在 `ReactFiberFlags.js` 中，官方注释明确说明：

- 有一组“commit flags”
- commit 可以通过检查 `subtreeFlags` 跳过没有 effect 的子树

在 `commitReconciliationEffects(finishedWork)` 中也能直接看到：

- 读取 `finishedWork.flags`
- 如果有 `Placement`，就执行 `commitPlacement(finishedWork)`
- 执行后再清掉这个标记

这意味着：

**render 已经把“哪里需要处理、要处理什么”编码进 Fiber；commit 主要是按这些编码真正执行。**

因此，render 和 commit 的边界可以概括成：

- render：计算并记录
- commit：执行并生效

---

## 九、`root.current = finishedWork`：双树切换的关键瞬间

整个 M3 最关键的源码瞬间，就是 commit 里的这一句：

- `root.current = finishedWork`

React 源码旁边还有一段很重要的注释，大意是：

- work-in-progress 树现在变成 current 树了
- 这一步必须发生在 mutation 之后、layout 之前

这段安排说明了两件事。

### 第一，切换发生在 commit，而不是 render

render 只是在准备；真正把工作树扶正为当前树，是 commit 阶段做的。

### 第二，切换时机本身很讲究

React 不能过早切换，因为旧树在某些卸载逻辑里还需要被视为当前树；
React 也不能过晚切换，因为后面的布局相关逻辑又需要看到新的当前树。

对 M3 来说，不必把 commit 三小阶段全部讲透，但一定要抓住这句的教学意义：

**从 `root.current = finishedWork` 开始，本轮新树才正式成为当前版本。**

这就是 render → commit 衔接里的核心瞬间。

---

## 十、把整个过程压缩成一条最小主线

现在可以把 M3 的主线压缩成六步：

1. root 持有当前生效树：`root.current`
2. 更新开始时，React 用 `createWorkInProgress(root.current, null)` 准备工作树
3. render 阶段沿着 workInProgress 树推进，计算下一版结果并写入标记
4. render 完成后，这棵工作树以 `finishedWork` 的身份挂到 root 上
5. commit 阶段读取 `root.finishedWork`，按 `flags` / `subtreeFlags` 执行提交
6. 当 `root.current = finishedWork` 发生时，新树正式成为当前树

如果把这六步理解清楚，M3 的骨架就算真正建立起来了。

---

## 十一、几个常见误解

### 误解 1：`current` 和 `workInProgress` 是两个不同页面

不是。它们描述的是同一界面的两个时间态：

- 一个已经提交
- 一个正在准备

### 误解 2：render 阶段已经在直接改界面

不准确。render 的主任务是计算新树并记录变化；真正让变化生效的是 commit。

### 误解 3：`finishedWork` 是第三棵独立树

不是。它通常就是 render 完成后的 workInProgress 根节点，只是此时它已经进入待提交状态。

### 误解 4：`alternate` 只是为了保存旧数据

不完整。它更重要的作用，是建立 current / workInProgress 的配对关系，从而支持复用、比较与切换。

---

## 十二、为 M4 留下接口

到了这里，我们已经能回答：

- 当前树是什么
- 工作树是什么
- render 做什么
- commit 如何接手
- current 是怎样切换的

但还有一个自然会冒出来的问题：

**那到底是谁触发了这轮 render？又是怎么一路把工作安排到 root 上的？**

这正是 M4 要回答的问题。

M4 会把视角从“树的状态流转”进一步推进到“一次具体更新是怎样跑完整条链路的”，也就是从一次 `setState` 出发，追踪它如何进入调度、如何抵达 root、又如何最终完成 render 与 commit。

所以，M3 到这里刚好收住：

- 已经把双树与交接关系讲清
- 但还没有展开一次具体更新的触发链路

这个边界是合适的。

---

## 本模块一句话总结

**React 会在 `current` 之外构建一棵 `workInProgress` 树；render 负责把它准备完成，形成 `finishedWork`；随后 commit 再把它真正生效，并把 `root.current` 切换到这棵新树。**

---

## 延伸阅读

**下一模块：M4｜一次 `setState` 是怎样从组件一路走到提交的**

M3 解答了"两棵树如何交接"，但留下了一个自然的悬念：**是谁触发了这轮 render，更新又是怎样一路到达 root 的？**

M4 正是从这个问题出发，选取最小典型案例——类组件的一次 `this.setState(...)`——把整条动态链路完整追踪一遍：

1. `enqueueSetState` 把 update 写入当前 Fiber 的 update queue
2. `markUpdateLaneFromFiberToRoot` 沿 `return` 父链向上标记 lane，找到所属 root
3. `ensureRootIsScheduled` 让 root 纳入调度
4. render 阶段在 `workInProgress` 上消费 update queue，算出新 state
5. `commitRoot` 接手 `finishedWork`，使更新生效

M3 里的双树模型是这条链路的"中间结构"：update 进来之前树的状态是 `current`，render 产出的是 `workInProgress / finishedWork`，commit 之后 `current` 完成切换。

读完 M4，M3 的双树模型才会从"静态结构"变成"动态过程中的一个环节"。

参考文件：`docs/modules/m4-one-setstate-trace-draft.md`
