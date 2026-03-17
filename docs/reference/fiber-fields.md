# FiberNode 关键字段速查表（React 18.2.0）

> 本表使用 M2 模块的 4 分类框架，覆盖 12 个最重要的字段。
> 完整心智模型见：`docs/modules/m2-fiber-node-and-traversal-draft.md`
> 字段定义源码：`packages/react-reconciler/src/ReactFiber.new.js`（`FiberNode` 构造函数）

---

## 分类一：树链接（Tree Links）

> 显式记录"往哪走"，让 work loop 无需依赖 JS 调用栈即可遍历整棵 Fiber 树。

| 字段 | 类型 | 一句话职责 | 写入时机 | 读取时机 |
|------|------|-----------|---------|---------|
| `child` | `Fiber \| null` | 指向第一个子节点 | `beginWork` 返回子节点时写入 | work loop 决定是否向下深入时读取 |
| `sibling` | `Fiber \| null` | 指向右侧同层兄弟节点 | reconcile 子节点列表时写入 | `completeWork` 后寻找下一个待处理节点时读取 |
| `return` | `Fiber \| null` | 指向父节点（"做完后回哪里"） | 创建 Fiber 时由父节点写入 | `completeWork` 向上冒泡 effect 时读取 |

---

## 分类二：输入与缓存（Input & Cache）

> 记录"这次输入是什么、上次真正生效的是什么"，是 bailout 优化与 state 读取的基础。

| 字段 | 类型 | 一句话职责 | 写入时机 | 读取时机 |
|------|------|-----------|---------|---------|
| `pendingProps` | `mixed` | 本轮 render 传入的新 props | 创建 workInProgress 时从父节点传入 | `beginWork` 开始处理该节点时读取 |
| `memoizedProps` | `mixed` | 上次成功提交后的 props | `completeWork` 完成后写入 | `beginWork` 对比新旧 props 决定是否 bailout |
| `memoizedState` | `mixed` | 上次成功提交后的 state（或 hooks 链表头） | commit 后由 `processUpdateQueue` / hooks 写入 | 组件 render 时读取当前 state |

---

## 分类三：副作用与结果（Effects & Results）

> render 阶段把"需要 commit 做什么"编码进这三个字段，commit 按标记执行，无需重新计算。

| 字段 | 类型 | 一句话职责 | 写入时机 | 读取时机 |
|------|------|-----------|---------|---------|
| `flags` | `Flags` | 标记该节点本身需要的 commit 操作（Placement、Update、Deletion 等） | `beginWork` / `completeWork` 过程中写入 | commit 三阶段遍历时读取并执行 |
| `subtreeFlags` | `Flags` | 该节点所有后代的 flags 合集 | `completeWork` 向上冒泡时用 `\|=` 合并子树 flags | commit 阶段快速跳过无副作用子树 |
| `deletions` | `Array<Fiber> \| null` | 需要从 DOM 卸载的子节点列表 | reconcile 时发现需要删除的子节点写入父节点的 `deletions` | commit mutation 阶段遍历并卸载 |

---

## 分类四：优先级与双树配对（Priority & Pairing）

> 记录"这个节点当前的更新紧迫程度"以及"在 current / workInProgress 之间如何找到配对节点"。

| 字段 | 类型 | 一句话职责 | 写入时机 | 读取时机 |
|------|------|-----------|---------|---------|
| `lanes` | `Lanes` | 该节点上挂着的待处理 update 所在的 lane 集合 | `enqueueUpdate` 时由 `markUpdateLaneFromFiberToRoot` 写入 | `beginWork` 判断该节点是否需要处理本轮 lanes |
| `childLanes` | `Lanes` | 该节点所有后代的 lanes 合集 | `markUpdateLaneFromFiberToRoot` 沿父链向上写入 | work loop 判断是否需要深入子树 |
| `alternate` | `Fiber \| null` | 指向另一棵树中的配对节点（current ↔ workInProgress） | `createWorkInProgress` 建立双向链接时写入 | `beginWork` 拿到旧版本对比、commit 后切换 current |

---

## 一张图理解字段生命周期

```
setState 触发
    │
    ▼
[lanes / childLanes]  ← markUpdateLaneFromFiberToRoot 写入
    │
    ▼  beginWork
[pendingProps]        ← 从父节点传入
[memoizedState]       ← processUpdateQueue 读取旧值，计算新值
[flags]               ← 标记本节点变更类型
    │
    ▼  completeWork
[subtreeFlags]        ← 合并子树 flags
[memoizedProps]       ← 写入本轮确认的 props
    │
    ▼  commit
[deletions]           ← mutation 阶段卸载
[alternate]           ← root.current = finishedWork 完成后，双树完成切换
```
