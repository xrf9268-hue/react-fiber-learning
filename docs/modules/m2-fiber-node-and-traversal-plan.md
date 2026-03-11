# M2｜Fiber 节点与树遍历：规划稿

## 范围

本模块只回答两个问题：

1. **Fiber 节点在 React 内部是什么样的工作单元。**
2. **React 在 render 阶段是如何沿着 Fiber 树向下、横向、再向上推进工作的。**

本模块聚焦“节点形状 + 遍历方式 + 工作含义”，不追求一次讲完所有实现细节。

纳入范围：
- Fiber 不是传统意义上的“虚拟 DOM 节点快照”，而是一个可复用、可链接、可携带状态与副作用信息的工作节点。
- `child / sibling / return` 如何把树改写成“可下探、可回退、可横移”的链式结构。
- `alternate` 为什么存在，以及它与 current / workInProgress 的关系应先建立到什么程度。
- render 阶段最小遍历骨架：`performUnitOfWork`、`beginWork`、`completeWork`、向下进入子节点、无子节点时回退与转向兄弟节点。
- 为什么这种遍历模型天然适合“把大任务拆成一个个工作单元”。

暂不纳入：
- lanes、优先级编码与 scheduler 细节。
- commit 阶段 effect 执行细节。
- HostComponent、FunctionComponent 等不同 tag 的完整分支逻辑。
- Hook update queue、`setState` 调度入口。
- React 19 的扩展差异，只在必要处备注，不做主线。

## 成功定义

完成 M2 后，学习者应该能用通俗但准确的语言说明：

1. **Fiber 节点是 React 的最小工作单元，不只是描述 UI 长什么样，还记录“这个节点接下来要做什么”。**
2. **`child / sibling / return` 让 React 不必依赖调用栈，也能显式表示树的向下、横向、回退路径。**
3. **React 的 render 遍历不是简单“递归讲故事”，而是围绕单个 Fiber 单元反复执行 begin / complete 的推进过程。**
4. **当某节点没有子节点时，React 会沿 `return` 回退，并尝试转向 `sibling`，直到找到下一份工作或回到根。**
5. **`alternate` 的存在说明 React 会维护当前已提交树与正在准备的新树之间的配对关系，但 M2 只要求建立基础认识，不展开双缓冲全貌。**
6. **Fiber 之所以适合作为后续并发、可中断渲染的基础，是因为工作被拆成了可逐个推进的节点，而不是绑死在一次性递归调用里。**

## 关键误解与纠偏

### 误解 1：Fiber 只是“新的虚拟 DOM 对象”

不准确。更准确地说，Fiber 是**带有链接关系、状态缓存、更新信息和副作用标记的工作节点**。它当然代表某个 UI 单位，但它的重点是“组织工作”，不是只做结构快照。

### 误解 2：`child / sibling / return` 只是为了省内存或写法特殊

不准确。它们更重要的意义，是把树遍历路线显式编码到节点链接里，使 React 能自己控制前进、回退、切换兄弟节点的节奏，而不是完全把流程交给 JavaScript 调用栈。

### 误解 3：遍历 Fiber 树就是普通递归 DFS，换了个名字而已

不准确。教学上可以先把它类比成深度优先，但要补一句：**React 把“递归过程中的下一步”显式化成节点链接与 work loop**，因此它更像“可暂停的显式 DFS 工作流”，而不是一段黑箱递归。

### 误解 4：`alternate` 在 M2 就必须完整讲透

不必。M2 只需要让读者知道：同一个逻辑节点通常会有 current 与 workInProgress 两个对应 Fiber，通过 `alternate` 互相指向。双树如何切换、何时复用、何时创建，是 M3 的主场。

### 误解 5：beginWork 和 completeWork 是两次完全独立的遍历

不准确。更准确地说，它们是**同一轮 render 推进中的两个阶段面**：先在向下进入节点时做 begin，再在无子可进或子树完成后做 complete。

### 误解 6：只要理解字段名，就等于理解 Fiber

不成立。字段名只是词汇表；真正要掌握的是：这些字段如何共同支撑遍历、回退、复用与工作拆分。

## 官方证据目标

本模块以 **React 18.2.0 源码** 为主基线，优先找“节点定义”和“遍历骨架”的直接证据。

### 一组：Fiber 节点形状与字段职责

1. `packages/react-reconciler/src/ReactInternalTypes.js`
   - 目标：确认 Fiber 类型定义与核心字段列表。
   - 重点字段：`tag`、`key`、`type`、`stateNode`、`return`、`child`、`sibling`、`index`、`pendingProps`、`memoizedProps`、`memoizedState`、`updateQueue`、`flags`、`subtreeFlags`、`lanes`、`childLanes`、`alternate`。

2. `packages/react-reconciler/src/ReactFiber.js`
   - 目标：确认 Fiber 节点创建方式，以及哪些字段属于节点骨架。
   - 重点函数：`FiberNode`、`createFiber`、与创建 workInProgress 相关的函数。

3. `packages/react-reconciler/src/ReactWorkTags.js`
   - 目标：只补最小背景：Fiber 节点会用 `tag` 区分不同工作类型。
   - 使用边界：不在 M2 展开所有 tag 分支，只用于帮助读者理解“同样是 Fiber，职责可能不同”。

### 二组：render 阶段遍历骨架

4. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - 目标：确认工作循环怎样取出当前 Fiber、执行单元工作、在合适时机 yield。
   - 重点函数：`workLoopSync`、`workLoopConcurrent`、`performUnitOfWork`、`completeUnitOfWork`。
   - 重点问题：当前单元做完后，下一单元是怎么决定的？没有子节点时为何会向上回退？

5. `packages/react-reconciler/src/ReactFiberBeginWork.old.js`
   - 目标：确认 begin 阶段的返回值语义。
   - 重点问题：为什么 `beginWork` 返回“下一个子 Fiber”就能驱动向下遍历？什么时候会返回 `null`？

6. `packages/react-reconciler/src/ReactFiberCompleteWork.old.js`
   - 目标：确认 complete 阶段如何配合回退路径完成当前节点。
   - 使用边界：只抓“完成当前节点并准备转向兄弟/父级”的骨架，不在 M2 深挖 host effect 细节。

### 三组：必要的现代对照（可选，非主线）

7. `packages/react-reconciler/src/ReactFiberWorkLoop.js`
8. `packages/react-reconciler/src/ReactFiberBeginWork.js`
9. `packages/react-reconciler/src/ReactFiberCompleteWork.js`

用途：只做轻量对照，确认 React 19 时代主线仍然是同一类遍历骨架；若命名或拆文件方式有变化，只在注释中点明，不改写主叙事。

## 建议教学顺序

1. **先讲 Fiber 是“工作节点”，不是先背字段表。**
   - 用一句话定锚：Fiber 是 React 为了管理渲染工作而定义的节点结构。
   - 先把“它为什么不只是 UI 描述”讲清楚，再看字段。

2. **再讲最关键的四个指针关系：`child / sibling / return / alternate`。**
   - 其中前三个先服务于“树如何走”；
   - `alternate` 只点到“同一逻辑节点的两份对应体”。

3. **用一个三层小树示意遍历路径。**
   - 例如 App → A、B；A → A1、A2。
   - 让读者看到：先向下进 child，走不动时回退，优先找 sibling，再继续回退。

4. **引入 `performUnitOfWork` 作为工作推进器。**
   - 让读者建立“每次只处理一个 Fiber 单元”的感觉。
   - 说明 `beginWork` 决定是否继续下探。

5. **再解释 `completeUnitOfWork` 的回退逻辑。**
   - 节点无子时，不代表整个 render 结束；
   - React 会先完成当前节点，再找兄弟，再继续向上回退。

6. **最后把遍历模型与 Fiber 诞生动机接回 M1。**
   - 结论不是“React 会遍历树”，而是“React 把遍历拆成了显式可管理的单元，因此后续才有可中断与优先级控制的空间”。

## 建议交付物形态

M2 正文建议至少包含：
- 一段总论：Fiber 节点是什么。
- 一张小型结构图：`return <- child / sibling` 关系。
- 一段最小遍历过程说明：begin 向下、complete 回退。
- 一段“为什么这比纯递归更重要”的总结。
- 少量源码锚点，而不是大段源码抄录。

如需配图，优先：
1. 节点关系图；
2. 遍历顺序图；
3. current / workInProgress 只做一句预告图，不抢 M3 主线。

## 复核清单

- [ ] 是否先讲“Fiber 是工作节点”，再讲字段名。
- [ ] 是否清楚解释了 `child / sibling / return` 三者如何共同表示遍历路线。
- [ ] 是否把 `alternate` 控制在“基础认知”层，不提前透支 M3。
- [ ] 是否明确说明 begin / complete 属于同一轮 render 推进。
- [ ] 是否给出最小遍历示意，而不只是抽象定义。
- [ ] 是否把源码引用压缩到最小必要文件与函数。
- [ ] 是否避免把遍历讲成“普通递归换皮”。
- [ ] 是否把 M2 与 M1 的主线连接起来：工作单元化为何重要。
- [ ] 是否避免提前展开 lanes、scheduler、commit 细节。
- [ ] 是否保持中文表达简洁、概念优先、证据导向。

## 一句话主论点

**M2 要建立的核心认识是：Fiber 不只是节点数据，而是 React 用来承载状态、链接树关系并逐单元推进 render 工作的内部工作结构。**
