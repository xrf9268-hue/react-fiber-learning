# M6｜极简图示备注

## 用途
供后续总览图或模块插图使用，只保留最小关系，不扩展新内容。

## 建议画法
一条主线即可：

`render 抛出 wakeable` → `最近 Suspense boundary capture` → `fallback 出场` → `primary tree 进入 hidden Offscreen` → `wakeable resolve / ping` → `retry lane / 重新调度` → `主内容恢复尝试`

旁边补一条 root 视角说明线：
- suspend 后：相关工作记入 `root.suspendedLanes`
- ping 后：相关工作进入 `root.pingedLanes`
- 下一轮仍由 `getNextLanes` + `ensureRootIsScheduled` 选择并安排

## 对比点
可在图边角加一句：
- **M5 关注工作怎样被分配优先级并进入调度；**
- **M6 关注工作中途因 Suspense 暂时做不下去时，系统怎样回退、隐藏、等待与再试。**

## 本 note 的边界
- 不展开 RSC / `use` / 流式 SSR；
- 不展开 Activity / ViewTransition；
- 不细画 hydration 与错误处理支线。
