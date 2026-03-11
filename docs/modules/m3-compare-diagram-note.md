# M3｜对照/示意图备忘

这不是正式正文，只是为后续画图保留一个最小骨架。

## 图 1：双树配对关系

建议表达：

- 左侧：`current` 树（当前生效版本）
- 右侧：`workInProgress` 树（准备中的下一版本）
- 中间用 `alternate` 把同一逻辑位置的节点一一连起来

图上最好强调一句：

**不是两套业务页面，而是同一界面的已提交版与待提交版。**

---

## 图 2：一次更新的最小流转

建议画成一条时间线：

1. `root.current`
2. `createWorkInProgress(root.current, null)`
3. render 在工作树上推进
4. `root.finishedWork = finishedWork`
5. commit 消费 `finishedWork`
6. `root.current = finishedWork`

图上最好强调两点：

- render 负责准备，不直接等于界面已经更新
- `root.current = finishedWork` 是切换关键点

---

## 图 3：命名流转

可以额外做一张极简状态图：

- 更新进行中：`workInProgress`
- render 完成后：`finishedWork`
- commit 切换后：新的 `current`

这张图的作用，是专门防止读者把 `finishedWork` 误解成第三棵树。
