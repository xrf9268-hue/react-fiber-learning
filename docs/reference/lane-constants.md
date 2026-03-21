# Lane 常量速查表（React 18.2.0）

> 本表只覆盖 95% 以上真实流量的 6 个语义代表 lane。
> 完整 31 个 lane 定义见源码：`packages/react-reconciler/src/ReactFiberLane.old.js`
> 注意：18.2.0 中 `.old.js` 和 `.new.js` 两个版本内容相同，本文档统一引用 `.old.js`。

---

## 六个关键 Lane

| 常量名 | 十六进制 | 分配时机 | 现实触发场景 |
|--------|----------|----------|--------------|
| `SyncLane` | `0x1` | `flushSync` 包裹的更新 / legacy 模式同步渲染 | `ReactDOM.flushSync(() => setState(...))` |
| `InputContinuousLane` | `0x4` | 连续输入事件（mousemove、scroll 等） | 拖拽处理器、滚动联动动画 |
| `DefaultLane` | `0x10` | 普通 `setState` / `useState` 触发的更新 | 绝大多数组件状态更新 |
| `TransitionLane1` | `0x40` | `startTransition` 包裹的更新 | 搜索框实时过滤（search-as-you-type） |
| `RetryLane1` | `0x400000` | Suspense 边界在 ping 后触发的重试 | 数据请求 resolve，重新尝试渲染主内容 |
| `IdleLane` | `0x20000000` | React 内部最低优先级任务 | Offscreen 预渲染、空闲期资源预取等内部机制触发 |

---

## 一句话理解 Lane

> Lane 是 React 给每次更新打的**优先级位字段**。root 通过 `requestUpdateLane`（`ReactFiberWorkLoop.old.js`）在创建 update 时分配 lane，再由 `getNextLanes` 从 `pendingLanes` 中选出当前最值得处理的一批，优先级判断就发生在这里。

---

## 为什么是位字段而非整数

React 不用 1、2、3 这样的数字表示优先级，而是用位掩码（bitmask），是因为一次调度可能同时处理**多个 lane 的合集**。例如：

```js
// root.pendingLanes 可以同时记录多条更新在不同 lane 上挂着
pendingLanes = SyncLane | DefaultLane  // = 0x1 | 0x10 = 0x11
```

这让 React 可以用单个 `&` 操作快速判断"某条更新是否在当前要处理的 lanes 集合内"，而不需要遍历数组。

---

## 优先级排序（高 → 低）

```
SyncLane (0x1) > InputContinuousLane (0x4) > DefaultLane (0x10)
> TransitionLane1 (0x40) > RetryLane1 (0x400000) > IdleLane (0x20000000)
```

**位位置越低（最低有效位），优先级越高。** 更准确地说，源码注释写道 "bits decrease in priority as you go left"。`getHighestPriorityLane(lanes)` 通过 `lanes & -lanes` 提取最低有效位（isolate lowest set bit），即最高优先级的 lane。数值越小只是这条位规则的结果。

---

## 对照 M5

Lane 常量是 M5（lanes / priority / scheduler / transition）的具体化：

- M5 讲的是"更新如何进入 lane、root 如何选下一批"
- 本表给出的是"每种触发场景实际落在哪个 lane"

两者结合后，优先级调度的完整图才清晰：**触发 → 分配 lane → root 记账 → getNextLanes 选下一批 → scheduler 提供执行机会**。
