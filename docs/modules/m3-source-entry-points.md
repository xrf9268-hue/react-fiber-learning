# M3｜源码入口清单：current / workInProgress / render → commit

## 使用原则

- 本清单只保留 **M3 必须读的最小官方源码入口**。
- 目标不是吃完整个 reconciler，而是回答：
  1. `current`、`workInProgress`、`finishedWork` 分别是什么；
  2. render 如何把结果交给 commit；
  3. root 为什么是这次交接的中心。
- 以 **v18.2.0** 为主基线；`main` 只做轻量对照。
- 优先使用本地 upstream mirror：
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-v18.2.0`
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-main`

---

## 入口 1：workInProgress 是如何从 current 派生出来的

### 文件
- `packages/react-reconciler/src/ReactFiber.js`

### 为什么先读它
M3 的第一关键，不是先读 commit，而是先回答：**React 正在工作的那棵新树是怎么来的。** 这个问题基本都落在 `createWorkInProgress` 相关逻辑上。

### 本模块只回答这些问题
- `createWorkInProgress` 如何利用 current Fiber 创建或复用对应节点？
- `alternate` 在这里是如何建立和使用的？
- 哪些字段会被复制，哪些会被重置？
- 为什么这能说明 React 不是“凭空再造一棵完全无关的新树”，而是在旧树基础上准备下一版？

### 本轮建议关注的函数 / 结构
- `FiberNode`
- `createWorkInProgress`
- 与字段重置、复用相关的关键段落

---

## 入口 2：类型层面如何表达 current / alternate / root 连接

### 文件
- `packages/react-reconciler/src/ReactInternalTypes.js`

### 为什么读它
如果只看执行流程，很容易把 `current`、`workInProgress` 理解成运行时口头概念。类型定义能帮助确认：这些关系在结构上本来就是被建模出来的。

### 本模块只回答这些问题
- Fiber 上哪些字段是 M3 必须重新关注的？
- `alternate` 在类型里如何出现？
- Fiber 与 root 的连接关系，最少能从类型里看到什么？

### 本轮重点盯住
- `alternate`
- `stateNode`
- 与 root、已提交树、工作树有关的最小结构字段

---

## 入口 3：root 如何持有当前树与待提交结果

### 文件
- `packages/react-reconciler/src/ReactFiberRoot.old.js`

### 为什么读它
M3 如果不从 root 视角看，就容易把“双树切换”讲成节点局部行为。实际上，**current 的归属、finishedWork 的暂存、commit 的接管，都是 root 级别的事情。**

### 本模块只回答这些问题
- `root.current` 是什么？
- root 上与本轮 render/commit 交接相关的关键字段有哪些？
- 为什么说 root 是 render 与 commit 的交汇点？

### 本轮建议关注的内容
- FiberRoot 创建时如何绑定 current
- `finishedWork`
- `finishedLanes`
- 其他与“待提交结果”有关的最小槽位

---

## 入口 4：render 是如何准备整棵 workInProgress 树的

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 为什么它是 M3 的主入口
M2 读这个文件，是为了看树怎么走；M3 再读它，是为了看：**React 怎样从 root.current 出发，建立 workInProgress 栈帧，跑完整轮 render，并把结果交给 commit。**

### 本模块只回答这些问题
- render 开始前，workInProgress 根是如何准备的？
- `prepareFreshStack` 在概念上做了什么？
- `renderRootSync` / `renderRootConcurrent` 最终产出的“完成态”是什么？
- render 结束后，结果是如何挂到 root 上的？
- commit 为什么不是凭空开始，而是消费 render 产物？

### 本轮建议关注的函数
- `prepareFreshStack`
- `renderRootSync`
- `renderRootConcurrent`
- `performUnitOfWork`
- `commitRoot`
- 与 `finishedWork` 赋值、消费相关的关键片段

---

## 入口 5：commit 如何接过 render 的结果

### 文件
- `packages/react-reconciler/src/ReactFiberCommitWork.old.js`

### 为什么要读它
M3 不需要讲透 commit 的每个阶段，但至少要建立一个非常稳的认识：**commit 不是重新算一遍树，而是在消费 render 已经准备好的结果。**

### 本模块只回答这些问题
- commit 阶段在处理什么输入？
- commit 为什么依赖 render 阶段留下的 Fiber 状态与标记？
- 对 M3 来说，最少需要知道哪些 commit 动作，才足以说明“结果真正生效了”？

### 使用边界
- 不展开所有宿主环境操作。
- 不在 M3 深挖所有 effect 分支。
- 只抓“接手 finishedWork 并生效”的连接证据。

---

## 入口 6：render 留下哪些标记供 commit 使用

### 文件
- `packages/react-reconciler/src/ReactFiberFlags.js`

### 为什么读它
如果不补这一层，读者容易误以为 commit 是“重新判断哪里要改”。读 flags 可以帮助建立一个更准确的说法：**render 阶段已经把需要处理的变化编码进 Fiber 标记里，commit 主要按这些标记执行。**

### 本模块只回答这些问题
- `flags` / `subtreeFlags` 在 M3 应该被理解成什么？
- 为什么它们能作为 render → commit 的连接线索？
- 在不展开细节的前提下，正文最少要如何描述它们？

---

## 可选轻量对照：React main

### 文件
- `packages/react-reconciler/src/ReactFiber.js`
- `packages/react-reconciler/src/ReactFiberRoot.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberCommitWork.js`
- `packages/react-reconciler/src/ReactFiberCommitEffects.js`

### 对照目的
- 确认主线骨架仍然成立：
  - current 派生 workInProgress
  - render 产出 finishedWork
  - commit 消费 finishedWork 并切换 current
- 如果 main 中 commit 代码拆分更细，只在文中顺手备注“实现拆得更细，但概念没变”。

### 不要做的事
- 不为了追新而改写 M3 的稳定教学骨架。
- 不把 React 19 的附加复杂度提前压进本模块。

---

## 本模块最小阅读顺序

1. `ReactFiber.js`
2. `ReactFiberRoot.old.js`
3. `ReactFiberWorkLoop.old.js`
4. `ReactInternalTypes.js`（按需回查）
5. `ReactFiberFlags.js`
6. `ReactFiberCommitWork.old.js`

> 说明：这里把 `ReactInternalTypes.js` 放到第三步之后按需回查，是因为 M3 更强调“状态流转与交接关系”，不需要像 M2 那样先从字段词汇表进入。

---

## 读完后应能回答的最小问题集

- `current`、`workInProgress`、`finishedWork` 三者分别处于什么阶段？
- `createWorkInProgress` 为什么是理解双树模型的核心入口？
- root 为什么必须持有 `current`，并暂存 `finishedWork`？
- render 阶段为什么主要是在 workInProgress 树上推进？
- render 结束后，结果是如何从“进行中”变成“待提交”的？
- commit 为什么可以不重算整棵树，而直接消费 render 结果？
- current 的切换为什么是 render → commit 连接中的关键瞬间？
- `flags` 在 M3 层面最少应该理解到什么程度？
