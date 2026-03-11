# M2｜源码入口清单：Fiber 节点与树遍历

## 使用原则

- 本清单只保留 **M2 必须读的最小官方源码入口**。
- 目标不是通读整个 reconciler，而是回答“节点长什么样、树怎么走”这两个问题。
- 以 **v18.2.0** 为主基线；`main` 只做轻量对照。

---

## 入口 1：Fiber 节点类型定义

### 文件
- `packages/react-reconciler/src/ReactInternalTypes.js`

### 为什么先读它
这是最直接的“词汇表”入口。先看类型定义，能知道一个 Fiber 节点到底承载了哪些信息，再去理解遍历逻辑时才不会只剩函数名。

### 本模块只回答这些问题
- Fiber 节点上有哪些最核心字段？
- 哪些字段属于“树链接关系”？
- 哪些字段属于“输入 / 缓存 / 更新结果”？
- 哪些字段明显提示它不只是 UI 描述对象？
- `alternate` 在类型层面如何出现？

### 本轮重点盯住
- `return`
- `child`
- `sibling`
- `alternate`
- `pendingProps`
- `memoizedProps`
- `memoizedState`
- `updateQueue`
- `flags`
- `subtreeFlags`
- `lanes`
- `childLanes`

---

## 入口 2：Fiber 节点如何被创建

### 文件
- `packages/react-reconciler/src/ReactFiber.js`

### 为什么读它
如果只看类型定义，容易把 Fiber 理解成静态结构。读创建逻辑，可以更直观看出：React 把它当成真实的工作节点来初始化和复用。

### 本模块只回答这些问题
- FiberNode 构造时会初始化哪些骨架字段？
- `createFiber` 说明了什么？
- workInProgress Fiber 是如何被创建或复用的？
- 哪些字段暗示 current / workInProgress 的双份关系？

### 本轮建议关注的函数
- `FiberNode`
- `createFiber`
- `createWorkInProgress`

---

## 入口 3：Fiber 节点类型标签的最小背景

### 文件
- `packages/react-reconciler/src/ReactWorkTags.js`

### 为什么读它
M2 不需要展开所有分支实现，但需要让读者知道：不同 Fiber 会因 `tag` 不同而承担不同类型的工作。

### 本模块只回答这些问题
- `tag` 大致在区分什么？
- 为什么“同样都是 Fiber 节点”，实际处理路径会不同？
- M2 正文需要最少提到哪些常见 tag，才足以帮助理解？

### 使用边界
- 不做 tag 大全。
- 不逐个进入各类组件处理分支。

---

## 入口 4：work loop 如何推进单个 Fiber 单元

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 为什么它是 M2 的主入口
M2 的重点不在调度，而在“树怎么走”。这份文件里能看到 React 怎样围绕当前工作节点反复执行 begin / complete，并决定下一步去哪里。

### 本模块只回答这些问题
- render 阶段如何维护“当前正在处理的 Fiber”？
- `performUnitOfWork` 做了什么最小动作？
- 当 `beginWork` 返回子节点时，为什么表示继续向下？
- 当没有子节点可进时，为什么会进入 complete / 回退路径？
- `completeUnitOfWork` 如何找到兄弟节点或父节点？
- 为什么这种写法比“直接递归到底”更适合作为工作系统骨架？

### 本轮建议关注的函数
- `workLoopSync`
- `workLoopConcurrent`
- `performUnitOfWork`
- `completeUnitOfWork`

---

## 入口 5：begin 阶段如何决定“往下走到哪”

### 文件
- `packages/react-reconciler/src/ReactFiberBeginWork.old.js`

### 为什么读它
M2 不需要吃下所有 beginWork 分支，但必须看懂一个关键事实：**beginWork 的返回值会决定下一步是否进入子节点。**

### 本模块只回答这些问题
- `beginWork` 的职责是什么？
- 为什么它的返回值可以被理解成“下一份向下工作的入口”？
- 在什么情况下它会返回 `null`，从而触发 complete / 回退？
- 读者在 M2 需要知道哪些分支存在，但暂不展开？

### 使用边界
- 不在本轮深挖组件类型差异。
- 只抓“返回 child 或 null”的骨架语义。

---

## 入口 6：complete 阶段如何收尾并寻找下一站

### 文件
- `packages/react-reconciler/src/ReactFiberCompleteWork.old.js`

### 为什么读它
Fiber 树遍历最容易讲空的部分，就是“走不下去以后发生什么”。这份文件配合 `completeUnitOfWork`，能帮助把“回退、转兄弟、再回退”的路径讲实。

### 本模块只回答这些问题
- complete 阶段在概念上是在做什么？
- 为什么一个节点处理完后，不一定马上回到根？
- 当前节点 complete 之后，下一步为什么常常是兄弟节点？
- 如果没有兄弟节点，为什么要继续沿 `return` 回退？

### 使用边界
- 不展开宿主环境创建细节。
- 不展开 commit effect 执行。

---

## 可选轻量对照：React 19 / main

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberBeginWork.js`
- `packages/react-reconciler/src/ReactFiberCompleteWork.js`

### 对照目的
- 确认主线骨架仍然成立：单元工作、begin 向下、complete 回退。
- 如果文件拆分或命名有变化，只做一句备注。

### 不要做的事
- 不把 main 的新增细节拉成主线。
- 不为了“追新”破坏 M2 的稳定教学骨架。

---

## 本模块最小阅读顺序

1. `ReactInternalTypes.js`
2. `ReactFiber.js`
3. `ReactFiberWorkLoop.old.js`
4. `ReactFiberBeginWork.old.js`
5. `ReactFiberCompleteWork.old.js`
6. `ReactWorkTags.js`（穿插补背景即可）

---

## 读完后应能回答的最小问题集

- Fiber 节点为什么说是“工作节点”而不只是“描述节点”？
- `child / sibling / return` 三个链接怎样共同表示树遍历路线？
- `performUnitOfWork` 为什么能成为 render 的最小推进单位？
- `beginWork` 返回 child、返回 null，各自意味着什么？
- 一个节点没有 child 后，React 如何通过 complete 路径继续找下一份工作？
- `alternate` 在 M2 层面最少应该理解到什么程度？
- 为什么这种结构天然适合后续可中断 render，而不只是普通递归？
