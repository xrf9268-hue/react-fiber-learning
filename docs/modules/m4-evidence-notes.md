# M4｜官方证据笔记：一次 class `setState` 如何走到 commit

## 范围与口径

- 基线版本：**React v18.2.0**
- 本文只追一条最小主线：
  - `enqueueSetState`
  - update queue
  - `markUpdateLaneFromFiberToRoot`
  - `scheduleUpdateOnFiber`
  - render
  - `finishedWork`
  - commit
- 目标不是讲完整 lanes / scheduler，而是用官方源码把“一次 `setState` 为什么会变成一次 root 级 render 并最终 commit”这件事钉牢。

---

## 证据 1：`setState` 的第一步是创建 update 并入队，不是直接改 state 或 DOM

### 文件
- `packages/react-reconciler/src/ReactFiberClassComponent.old.js`

### 关键代码
```js
const classComponentUpdater = {
  enqueueSetState(inst, payload, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();
    const lane = requestUpdateLane(fiber);

    const update = createUpdate(eventTime, lane);
    update.payload = payload;
    ...
    const root = enqueueUpdate(fiber, update, lane);
    if (root !== null) {
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
      entangleTransitions(root, fiber, lane);
    }
  },
}
```

### 结论
- 类组件调用 `this.setState(...)` 后，进入的是 `classComponentUpdater.enqueueSetState`。
- 这一步的核心顺序非常清楚：
  1. 找到实例对应的 `fiber`
  2. 为这次更新申请 `lane`
  3. `createUpdate(...)` 创建 update 对象
  4. `enqueueUpdate(...)` 把 update 放入队列
  5. `scheduleUpdateOnFiber(...)` 把它升级为 root 级调度
- 这已经足以说明：**`setState` 首先做的是登记一次更新，而不是立刻改 DOM。**

---

## 证据 2：update 先进入 update queue，render 时才被消费

### 文件
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.old.js`
- `packages/react-reconciler/src/ReactFiberClassComponent.old.js`

### 关键代码 A：`createUpdate`
```js
export function createUpdate(eventTime, lane) {
  const update = {
    eventTime,
    lane,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null,
  };
  return update;
}
```

### 关键代码 B：`enqueueUpdate`
```js
export function enqueueUpdate(fiber, update, lane) {
  const updateQueue = fiber.updateQueue;
  ...
  const sharedQueue = updateQueue.shared;
  ...
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}
```

### 关键代码 C：render 路径中的 `processUpdateQueue`
```js
const oldState = workInProgress.memoizedState;
let newState = (instance.state = oldState);
processUpdateQueue(workInProgress, newProps, instance, renderLanes);
newState = workInProgress.memoizedState;
```

### 结论
- `createUpdate` 说明 React 会把这次 `setState` 包装成一个标准 update 记录，里面至少带有：时间、lane、tag、payload、callback、next。
- `enqueueUpdate` 说明这条 update 会先进入当前 fiber 的 `updateQueue.shared`，而不是当场变成最终 state。
- 在 class 组件的 render 更新路径里，React 会调用 `processUpdateQueue(...)`，再从 `workInProgress.memoizedState` 读出新的 state。
- 因而更准确的说法是：
  - **调用 `setState` 时：登记 update**
  - **render 时：消费 update，计算新 state**

---

## 证据 3：组件上的 update 会沿 `return` 链一路冒泡到 root

### 文件
- `packages/react-reconciler/src/ReactFiberConcurrentUpdates.old.js`

### 关键代码
```js
function markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let alternate = sourceFiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }

  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    }
    node = parent;
    parent = parent.return;
  }

  if (node.tag === HostRoot) {
    const root = node.stateNode;
    return root;
  } else {
    return null;
  }
}
```

### 结论
- 这段代码是 M4 的关键证据点。
- React 不会把更新只留在当前组件对应的 fiber 上，而是会沿着 `return` 父链持续向上走。
- 向上过程中：
  - 当前节点及其 alternate 记录 `lanes`
  - 祖先节点及其 alternate 记录 `childLanes`
- 走到 `HostRoot` 后，取 `node.stateNode`，就得到这棵树对应的 `FiberRoot`。
- 这证明：**组件级更新最终必须被提升为 root 级工作，React 的 render/commit 总入口是 root。**

---

## 证据 4：`scheduleUpdateOnFiber` 把“root 上有更新”变成真正的调度起点

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 关键代码
```js
export function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
  ...
  // Mark that the root has a pending update.
  markRootUpdated(root, lane, eventTime);
  ...
}
```

### 结论
- `enqueueSetState` 拿到 root 之后，并不是直接开始渲染当前组件，而是调用 `scheduleUpdateOnFiber(root, fiber, lane, eventTime)`。
- `scheduleUpdateOnFiber` 的第一层关键语义是：**把这次更新登记到 root，表明这棵树有待处理工作。**
- 因此，从这里开始，问题已经从“某个组件调用了 `setState`”转成“某个 root 需要开始一轮新工作”。

---

## 证据 5：render 仍然是在 `workInProgress` 树上展开

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 关键代码 A：`prepareFreshStack`
```js
function prepareFreshStack(root, lanes) {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;
  ...
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  ...
}
```

### 关键代码 B：`renderRootSync`
```js
function renderRootSync(root, lanes) {
  ...
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    ...
    prepareFreshStack(root, lanes);
  }
  ...
}
```

### 结论
- root 被调度后，render 并不是直接在当前树上原地修改。
- `prepareFreshStack(root, lanes)` 会从 `root.current` 派生出新的 `workInProgress` 树。
- `renderRootSync` 在真正进入同步 render 前，会确保这轮 render 使用的是为当前 root 和 lanes 准备好的新工作栈。
- 这与 M3 完全衔接：**render 的工作仍然发生在 workInProgress 树上。**

---

## 证据 6：render 完成后，会把结果直接写回 `root.finishedWork`，commit 再消费它

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### 关键代码 A：同步 render 完成后的写回
```js
const finishedWork: Fiber = (root.current.alternate: any);
root.finishedWork = finishedWork;
root.finishedLanes = lanes;
commitRoot(
  root,
  workInProgressRootRecoverableErrors,
  workInProgressTransitions,
);
```

### 关键代码 B：并发路径得到一致树后的写回
```js
root.finishedWork = finishedWork;
root.finishedLanes = lanes;
finishConcurrentRender(root, exitStatus, lanes);
```

### 关键代码 C：commit 读取并清空
```js
function commitRootImpl(root, ...) {
  ...
  const finishedWork = root.finishedWork;
  const lanes = root.finishedLanes;
  ...
  root.finishedWork = null;
  root.finishedLanes = NoLanes;
  ...
}
```

### 结论
- 这里补上了一个更直接的源码锚点：**render 结束后，React 会把结果写回 `root.finishedWork`，而不是等 commit 再现算。**
- 同步路径里，`finishedWork` 直接取自 `root.current.alternate`，随后写回 root 并进入 `commitRoot(...)`。
- 并发路径里，拿到一致树后，也会先写入 `root.finishedWork` / `root.finishedLanes`，再进入后续提交流程。
- commit 阶段读取的，正是这份 render 已经准备好的结果；读完后再把字段清空。
- 因而 `finishedWork` 可以更准确地理解为：**render 已完成、已挂到 root、等待 commit 消费的下一版树。**

---

## 证据 7：commit 在 mutation 之后把 `finishedWork` 扶正为新的 `current`

### 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
- `packages/react-reconciler/src/ReactFiberFlags.js`

### 关键代码 A：commit 中的切换点
```js
commitMutationEffects(root, finishedWork, lanes);
...
root.current = finishedWork;
...
commitLayoutEffects(finishedWork, root, lanes);
```

### 关键代码 B：flags 的最小角色
```js
export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Ref |
  Hydrating |
  Visibility;

export const LayoutMask = Update | Callback | Ref | Visibility;
```

### 结论
- commit 会先根据 render 阶段留下的 flags 执行 mutation 相关工作。
- 然后，`root.current = finishedWork` 把刚刚准备好的新树扶正为当前树。
- 随后进入 layout effects 阶段。
- 对 M4 来说，最重要的理解是：**一次 `setState` 真正完成，不是在调用 API 时，而是在 render 产出 `finishedWork` 后，由 commit 把它切换成新的 current。**

---

## 最小闭环结论

把一次 class 组件 `setState` 压缩成最小主链，可以写成：

1. `enqueueSetState` 收到更新请求
2. `createUpdate` 创建 update 对象
3. `enqueueUpdate` 把 update 放入 fiber 的 update queue
4. `markUpdateLaneFromFiberToRoot` 沿 `return` 链一路标记到 root
5. `scheduleUpdateOnFiber` 把这次局部更新升级为 root 级工作
6. render 期间在 `workInProgress` 树上调用 `processUpdateQueue`，算出新的 state
7. render 结束后，root 持有 `finishedWork`
8. commit 消费 `finishedWork`，并通过 `root.current = finishedWork` 让结果真正生效

一句话概括：

> `setState` 不是“直接改页面”，而是“把一条 update 挂到 fiber 上，沿树冒泡到 root，由 root 发起 render，最后再由 commit 生效”。
