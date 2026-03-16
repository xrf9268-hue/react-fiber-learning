# M2｜Fiber 节点与树遍历（讲解稿）

## 这一模块要建立什么认识

本模块只做两件事：

1. 解释 **Fiber 节点到底是什么**。
2. 解释 **React 在 render 阶段怎样沿 Fiber 树推进工作**。

如果只记一句话，我认为应该是：

> **Fiber 不是单纯的“虚拟 DOM 节点”，而是 React 用来承载状态、链接树关系并逐单元推进渲染工作的内部工作节点。**

这句话里最关键的词不是“节点”，而是“工作”。

---

## 1. Fiber 为什么不能只理解成“虚拟 DOM 节点”

React 官方在 `ReactInternalTypes.js` 中对 Fiber 的定性非常直接：

> A Fiber is work on a Component that needs to be done or was done. There can be more than one per component.

这句定义有两层意思。

### 第一层：Fiber 的重点是“工作”

如果一个对象只是描述 UI 长什么样，那么它更像一张结构快照。  
但 Fiber 不是这样。它不只描述“这里有个组件”，还要携带：

- 这个节点当前要处理的输入是什么
- 上一次已经记住的 props 和 state 是什么
- 有没有待处理更新
- 这个节点和子树有没有副作用需要后续处理
- 它在整棵工作树中的父子兄弟关系是什么

所以更准确的说法是：

> **Fiber 表示的是 React 当前要处理、已经处理过，或即将继续处理的一份组件工作。**

### 第二层：同一个组件不一定只有一个 Fiber

官方同一句还补了一句：

> There can be more than one per component.

这句话在 M2 里只需要建立基础认识：**同一个逻辑组件，可能同时存在不止一个对应 Fiber。**

为什么会这样，后面看 `alternate` 就能得到一个最小答案：React 往往会保留“当前已提交的那一份”和“正在准备的新那一份”的配对关系。这里先知道它不是单份静态对象就够了，完整双缓冲切换留到 M3。

---

## 2. 一个 Fiber 节点大致装了什么

如果把 Fiber 看成工作节点，那么它身上的字段大致可以分成四类。

## 2.1 树链接：它在整棵工作树里怎么走

在 `ReactInternalTypes.js` 中，最重要的三个链接是：

- `return`
- `child`
- `sibling`

官方对 `return` 的注释尤其值得记住：

> The Fiber to return to after finishing processing this one.

> It is conceptually the same as the return address of a stack frame.

这几乎已经把遍历方式讲透了：

- `child`：往下走到第一个子节点
- `sibling`：当前层往右走到兄弟节点
- `return`：当前节点做完后，回到哪一个父节点继续

官方还直接把这种关系称为：

> Singly Linked List Tree Structure.

也就是说，React 不是只靠 JavaScript 函数递归去“隐式记住”树怎么走，而是把遍历路线显式写进每个 Fiber 节点的链接里。

这件事非常重要，因为后面 work loop 想暂停、继续、切换目标时，不必完全依赖语言层面的调用栈。

## 2.2 输入与缓存：它现在拿到什么、上次记住什么

同一个类型定义里还有几组字段：

- `pendingProps`
- `memoizedProps`
- `memoizedState`
- `updateQueue`

官方对 `pendingProps` 的注释是：

> Input is the data coming into process this fiber. Arguments. Props.

这几个字段合起来可以这样理解：

- `pendingProps`：这次处理要用的新输入
- `memoizedProps`：上次真正用于产出结果的 props
- `memoizedState`：上次记住的 state
- `updateQueue`：排队等待处理的状态更新与回调

仅从这些字段名就能看出，Fiber 不是“只描述组件类型和 children”的对象，而是完整工作上下文的一部分。

## 2.3 副作用与子树结果：本轮工作产生了什么后果

Fiber 还带有：

- `flags`
- `subtreeFlags`
- `deletions`

这说明 render 阶段不只是“遍历并返回子节点”，还会把当前节点和整棵子树后续要处理的结果记在节点上。

M2 不展开 commit 细节，但至少要建立一个认识：

> **Fiber 节点既负责走树，也负责在走树过程中累积工作结果。**

## 2.4 优先级与配对关系：它如何接入更大的工作系统

同一个类型里还有：

- `lanes`
- `childLanes`
- `alternate`

`lanes` 相关属于后续模块。M2 只需要知道：Fiber 结构天生给优先级系统留了位置。

而 `alternate` 是本模块必须轻量提到的字段，因为它回答了“为什么一个组件可能有不止一个 Fiber”。

---

## 3. `alternate` 最少要理解到什么程度

在 `ReactInternalTypes.js` 中，官方对 `alternate` 的注释是：

> This is a pooled version of a Fiber. Every fiber that gets updated will eventually have a pair.

在 `ReactFiber.old.js` 的 `createWorkInProgress(current, pendingProps)` 中，又出现了更直接的说明：

> We use a double buffering pooling technique because we know that we'll only ever need at most two versions of a tree.

关键代码也很清楚：

- `let workInProgress = current.alternate;`
- 若没有，就创建一个新的 Fiber
- 然后让两边互相指向：
  - `workInProgress.alternate = current`
  - `current.alternate = workInProgress`

因此，M2 可以先得到一个足够准确但不过度展开的认识：

> **同一个逻辑节点，React 往往会保留两份互相关联的 Fiber：一份代表当前已提交状态，一份代表正在准备的新工作版本。**

这里不要再往前讲到“何时切换 current、何时成为 finishedWork、何时进入 commit”。这些内容会自然进入 M3。M2 的目标只是让读者看到：Fiber 从结构上就不是“单份节点快照”。

---

## 4. Fiber 树为什么适合“逐单元推进工作”

到了这里，可以把问题从“节点长什么样”切换到“树怎么走”。

React 18.2 的 `ReactFiberWorkLoop.old.js` 给出了最直接的证据。

### 4.1 同步 work loop

`workLoopSync()` 是这样写的：

```js
while (workInProgress !== null) {
  performUnitOfWork(workInProgress);
}
```

### 4.2 并发 work loop

`workLoopConcurrent()` 是这样写的：

```js
while (workInProgress !== null && !shouldYield()) {
  performUnitOfWork(workInProgress);
}
```

这两段代码足以说明一个核心事实：

> **React 的 render 推进，是围绕当前 `workInProgress` Fiber，反复执行“处理一个工作单元”的循环。**

同步和并发的差别，在 M2 里只需要理解到：

- 同步模式：一直做，直到没有更多工作
- 并发模式：每处理一些工作，就允许检查是否该让出执行权

但无论哪种模式，最小单位都不是“整棵树”，而是“当前这个 Fiber”。

这就是 Fiber 真正作为工作单元的证据。

---

## 5. `performUnitOfWork`：render 推进器的最小骨架

`performUnitOfWork(unitOfWork)` 可以说是 M2 最该读懂的函数之一。

它的核心骨架是：

```js
const current = unitOfWork.alternate;
next = beginWork(current, unitOfWork, subtreeRenderLanes);
unitOfWork.memoizedProps = unitOfWork.pendingProps;
if (next === null) {
  completeUnitOfWork(unitOfWork);
} else {
  workInProgress = next;
}
```

把它翻成中文，可以理解成四步：

1. 找到当前工作节点对应的上一份节点，也就是 `alternate`
2. 对当前节点执行 begin 阶段
3. 如果 begin 给出了下一个节点，就继续往下做
4. 如果 begin 没给出新的下探目标，就开始 complete / 回退流程

这里最重要的认识是：

> **begin 和 complete 不是两次彼此独立的大遍历，而是同一轮 render 推进过程中的两个阶段面。**

React 每次只盯着当前这一份工作单元，判断下一步是继续往下，还是开始往回收。

---

## 6. `beginWork`：向下进入子树的入口

M2 不需要把 `beginWork` 的所有分支都看完，因为那会很快滑进组件类型细节里。  
本模块真正要抓住的是它的返回值语义。

在 `ReactFiberBeginWork.old.js` 的常见路径中，可以看到：

```js
reconcileChildren(current, workInProgress, nextChildren, renderLanes);
return workInProgress.child;
```

这句几乎可以直接翻译为：

> 当前节点 begin 完成后，下一步去处理它的第一个子节点。

而在另一些路径里，会直接出现：

```js
return null;
```

这说明：

> 当前节点没有新的向下入口了，work loop 不该继续 child 方向，而该转入 complete / 回退逻辑。

所以，M2 对 `beginWork` 最准确也最节制的讲法应该是：

- 它的内部会按不同 `tag` 做不同准备工作
- 但对理解遍历来说，最关键的是：**它通过返回值告诉 work loop 下一步是否继续向下进入子节点**

这就够了。

---

## 7. `completeUnitOfWork`：走不下去以后，React 怎么继续

很多人第一次看 Fiber，最容易模糊的地方就是：

- 如果当前节点没有 child 了，接下来到底发生什么？
- 为什么 render 不会就地结束？

`ReactFiberWorkLoop.old.js` 里的 `completeUnitOfWork` 把这件事讲得很直白。官方注释是：

> Attempt to complete the current unit of work, then move to the next sibling. If there are no more siblings, return to the parent fiber.

翻成中文就是：

> 先尝试完成当前工作单元，然后转向下一个兄弟节点；如果没有更多兄弟节点，就回到父 Fiber。

关键代码骨架如下：

```js
const returnFiber = completedWork.return;
next = completeWork(current, completedWork, subtreeRenderLanes);

if (next !== null) {
  workInProgress = next;
  return;
}

const siblingFiber = completedWork.sibling;
if (siblingFiber !== null) {
  workInProgress = siblingFiber;
  return;
}

completedWork = returnFiber;
workInProgress = completedWork;
```

这段逻辑很值得慢慢消化，因为它正是 Fiber 树遍历的核心路线图：

1. 先 complete 当前节点
2. 如果 complete 过程中又产生了新的工作，就先去做那份新工作
3. 否则检查有没有兄弟节点
4. 有兄弟，就转去兄弟节点
5. 没兄弟，就沿 `return` 回到父节点
6. 再重复同样的判断
7. 一直退到根，整轮 render 才算完成

这也解释了 `return` 注释里为什么会说它“概念上像栈帧的返回地址”。

---

## 8. 用一棵小树看遍历路线

假设有这样一棵简化树：

- App
  - A
    - A1
    - A2
  - B

如果只看 `child / sibling / return` 关系，它大致可以改写成：

- `App.child = A`
- `A.sibling = B`
- `A.child = A1`
- `A1.sibling = A2`
- `A.return = App`
- `B.return = App`
- `A1.return = A`
- `A2.return = A`

render 阶段的最小路线可以概括成：

1. 先处理 `App`
2. begin 之后进入 `A`
3. 再进入 `A1`
4. `A1` 没有 child，于是开始 complete `A1`
5. 发现 `A1` 有 sibling，于是转向 `A2`
6. `A2` 也没有 child，complete `A2`
7. `A2` 没有 sibling，于是沿 `return` 回到 `A`
8. `A` 子树完成后，再看 `A` 的 sibling，也就是 `B`
9. `B` 做完后，再回到 `App`
10. 回到根后，本轮 render 完成

如果从教学角度总结，这是一种**显式的深度优先推进**。  
可以类比 DFS，但不要讲成“普通递归换皮”，因为这里最关键的是：

> **React 把递归过程中“下一步去哪”的控制权，从语言调用栈中拿了出来，显式放进了 Fiber 链接和 work loop 里。**

---

## 9. `tag` 的作用：同样都是 Fiber，但工作类型不同

在 `ReactWorkTags.js` 中，React 定义了一组 `WorkTag`，例如：

- `FunctionComponent`
- `ClassComponent`
- `HostRoot`
- `HostComponent`
- `HostText`
- `Fragment`
- `ContextProvider`
- `SuspenseComponent`
- `MemoComponent`
- `OffscreenComponent`

这说明：

> Fiber 是统一的工作节点模型，但不同节点会因 `tag` 不同而进入不同的 begin / complete 处理分支。

因此，M2 不需要把 Fiber 讲成“所有节点都一模一样”。更准确的说法是：

- **结构骨架是统一的**
- **具体工作分支由 `tag` 区分**

这也是为什么你会在 `beginWork`、`completeWork` 里看到按 `tag` 分发的 `switch`。

---

## 10. 为什么这种遍历模型比“直接递归到底”更重要

到这里，M2 应该把问题接回 M1：React 为什么需要这样的结构？

答案不是“因为这样写起来比较酷”，而是：

> **一旦渲染工作被拆成一个个显式的 Fiber 单元，React 就有机会自己管理工作推进节奏。**

这意味着它可以：

- 明确知道当前正在处理哪个节点
- 在节点与节点之间决定要不要暂停
- 保留已经完成到哪一步的上下文
- 在需要时继续、重做、甚至丢弃一部分旧工作

M2 不展开 scheduler 和 lanes，但这里已经能看出它们为什么会有落脚点：  
如果没有这种“节点级工作单元 + 显式遍历路线”的骨架，后续很多并发能力都很难成立。

所以，本模块与 M1 的连接可以这样表述：

> M1 解释了 React 为什么需要把渲染从“不可打断的大事务”改造成“可管理的工作流程”；而 M2 展示的正是这套工作流程在数据结构和遍历骨架上的最小落地形式。

---

## 11. 本模块只需要掌握到哪里

学完 M2，读者不需要立刻背出所有字段，也不需要一次讲透所有 reconciler 细节。  
真正应该掌握的是下面五点：

1. **Fiber 是工作节点，不只是描述节点。**
2. **`child / sibling / return` 共同决定树的向下、横向和回退路线。**
3. **render 是围绕单个 Fiber 反复执行 `performUnitOfWork` 的推进过程。**
4. **`beginWork` 决定是否继续向下，`completeUnitOfWork` 负责回退并寻找下一份工作。**
5. **`alternate` 说明同一个逻辑节点通常存在 current / workInProgress 的配对关系，但完整双缓冲切换放到 M3。**

如果这五点已经清楚，M2 就达标了。

---

## 小结

用最短的话收束本模块，我会这样总结：

> Fiber 的关键不在于“它也是一棵树”，而在于 React 把这棵树里的每个节点都变成了可链接、可携带状态、可逐单元推进的工作对象；于是 render 阶段不再只是黑箱递归，而是一套由 `beginWork`、`completeWork` 和 `child / sibling / return` 显式驱动的工作流。

这就是 M2 最核心的认识。

---

## 延伸阅读

**下一模块：M3｜从 current 到 workInProgress：render 如何把结果交给 commit**

M2 建立了 Fiber 作为工作节点和树遍历骨架的基础认识，但有一个问题被有意搁置了：React 一边在 `workInProgress` 树上准备新结果，一边又怎样保证当前界面不被打断？

M3 正是回答这个问题的地方。它的核心是**双树模型**：

- `current`：当前已提交、对外生效的树
- `workInProgress`：基于 `current` 准备中的下一版树

M2 里提到的 `alternate` 字段，正是连接这两棵树的桥梁。M3 会展开讲清楚：
- `prepareFreshStack` 如何基于 `current` 创建 `workInProgress`
- render 结束后 `finishedWork` 是什么、放在哪里
- `commitRoot` 如何把 `finishedWork` 切换成新的 `current`

读完 M3，M2 里那些"节点 + 遍历"的结构认识，才会真正与"render 和 commit 的分工"连成一条完整理解链。

参考文件：`docs/modules/m3-current-wip-render-commit-draft.md`