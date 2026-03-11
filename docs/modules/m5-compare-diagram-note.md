# M5｜极简图示备注

## 用途
供后续总览图或模块插图使用，只保留最小关系，不扩展新内容。

## 建议画法
一条主线即可：

`update` → `requestUpdateLane` → `root.pendingLanes / suspended / pinged / expired` → `getNextLanes` → `ensureRootIsScheduled` → `performConcurrentWorkOnRoot` → `render / commit`

旁边补一条说明线：
- `startTransition` 影响的是 **lane 分配**；
- 它不是直接“开始一次低优先级 render”，而是把更新放进 **可让位的 transition lanes**。

## 对比点
可在图边角加一句：
- **M4 关注一条更新怎样走完全链路；**
- **M5 关注多类工作同时存在时，React 怎样决定“下一批先做什么”。**

## 本 note 的边界
- 不展开 Suspense / Offscreen；
- 不展开 React 19 / main 新语义；
- 不细画 Scheduler 宿主实现。
