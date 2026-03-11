# M6｜源码入口清单：Suspense / Offscreen / React 19 deltas

## 使用原则

- 本清单只保留 **M6 必须读的最小官方源码入口**。
- 目标不是把 Suspense / Offscreen 讲成一份全量源码地图，而是回答：
  1. render 遇到 suspend 时，React 怎样识别并处理它；
  2. Suspense 边界怎样决定主内容与 fallback；
  3. root 怎样记录 suspended / pinged work 并安排 retry；
  4. Offscreen 在内部怎样承接“隐藏但保留”的子树；
  5. React main / React 19 相比 18.2.0，哪些是结构变化，哪些是主线不变。
- 以 **v18.2.0** 为主基线；`main` 只做轻量对照。
- 优先使用本地 upstream mirror：
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-v18.2.0`
  - `/home/pi/.openclaw/workspace/tmp/react-upstream/react-main`

---

## 先定一条本模块主链

M6 建议始终围绕这条最小问题链阅读：

1. Suspense 边界在 beginWork 阶段是在哪里决定“继续主内容还是转向 fallback”的？
2. render 阶段遇到 thenable / wakeable 时，React 怎样把它导入 Suspense 路径，而不是普通错误路径？
3. root 怎样把这些暂时做不下去的工作记成 suspended lanes，又怎样在 ping 后恢复为可重试工作？
4. retry 之后，React 怎样重新获得执行机会并再次进入 work loop？
5. Offscreen fiber 到底表达什么子树状态，它与 Suspense fallback/主内容切换为何经常相邻出现？
6. React main / React 19 中，上述主线是否仍成立；若文件拆分变化，变化点在哪里？

如果正文能把这六个问题答顺，M6 就成立了。

---

## 入口 1：Suspense 边界在 beginWork 阶段如何决策

### v18.2.0 文件
- `packages/react-reconciler/src/ReactFiberBeginWork.old.js`
- 配套回查：`packages/react-reconciler/src/ReactFiberSuspenseComponent.old.js`
- 配套回查：`packages/react-reconciler/src/ReactFiberSuspenseContext.old.js`

### React main 对照
- `packages/react-reconciler/src/ReactFiberBeginWork.js`
- `packages/react-reconciler/src/ReactFiberSuspenseComponent.js`
- `packages/react-reconciler/src/ReactFiberSuspenseContext.js`

### 为什么先读它
M6 的第一步不是“谁抛了 promise”，而是先知道：**Suspense 边界本身在 render 过程中处在什么协调位置。**

### 这轮只回答这些问题
- `updateSuspenseComponent(...)` 的概念职责是什么？
- 边界在什么条件下会走主内容，什么条件下会准备 fallback？
- Suspense context 为什么会影响边界处理？

### 建议盯住的函数 / 片段
- `updateSuspenseComponent`
- 与 `showFallback`、`DidCapture`、dehydrated / timeout / boundary state 直接相关的最小分支
- SuspenseContext 的 push/pop 与判断辅助

### 本入口读完后应回答
- Suspense 边界不是被动 loading 容器，而是当前这轮 render 里决定“内容继续还是先回退”的协调点。

---

## 入口 2：render 遇到 suspend 时，React 怎样识别并捕获它

### v18.2.0 文件
- `packages/react-reconciler/src/ReactFiberThrow.old.js`

### React main 对照
- `packages/react-reconciler/src/ReactFiberThrow.js`

### 为什么它是 M6 第一核心入口
因为 M6 的真正起点是：**render 过程中出现一个“当前不能继续”的结果时，React 如何把它识别成 Suspense 流程。**

### 这轮只回答这些问题
- `throwException(...)` 在概念上做了什么？
- React 怎样区分 Suspense 的 thenable / wakeable 与普通错误？
- `attachPingListener(...)` 为什么是 retry 主线的一部分？

### 建议盯住的函数 / 片段
- `throwException`
- `attachPingListener`
- 与 Suspense boundary 查找、capture 标记、retry listener 直接相关的最小片段

### 本入口读完后应回答
- suspend 不是“报错失败”，而是 render 被导入一条“等待条件满足后再试”的协调路径。

---

## 入口 3：root 怎样记录 suspended / pinged lanes

### v18.2.0 文件
- `packages/react-reconciler/src/ReactFiberLane.old.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
- 配套回查：`packages/react-reconciler/src/ReactFiberRoot.old.js`

### React main 对照
- `packages/react-reconciler/src/ReactFiberLane.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberRoot.js`
- `packages/react-reconciler/src/ReactFiberRootScheduler.js`

### 为什么读它
如果不回到 root，就会把 Suspense 误解成边界局部逻辑。实际上，**一旦子树 suspend，root 的 lanes 账本就会被改写，后续调度也会随之变化。**

### 这轮只回答这些问题
- root 上哪些 lanes 状态与 Suspense 直接相关？
- `suspendedLanes`、`pingedLanes`、retry 相关 lanes 为什么会影响下一轮工作选择？
- ping 之后 root 怎样重新进入调度链？

### 建议盯住的函数 / 片段
- `getNextLanes`
- 与 suspended / pinged lanes 判断相关的条件分支
- `markRootSuspended`、`markRootPinged`、`markRootUpdated` 等最小相关片段
- work loop 中把 ping/retry 接回调度的入口

### 本入口读完后应回答
- Suspense 的“等待与恢复”不是边界内部私事，而是 root 级工作账本与调度策略的一部分。

---

## 入口 4：retry 与重新调度怎样接回 work loop

### v18.2.0 文件
- `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`

### React main 对照
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberRootScheduler.js`

### 为什么它是 M6 的桥梁入口
前面几步解释了“为什么会 suspend、root 怎样记账”；这一层要解释的是：**条件满足后，React 怎样再次安排 root 去重做相关工作。**

### 这轮只回答这些问题
- `retryTimedOutBoundary`（或等价 retry 入口）在概念上做了什么？
- ping 之后 React 怎样重新安排 root？
- 这里如何复用 M5 已建立的 lanes + scheduling 骨架？

### 建议盯住的函数 / 片段
- `retryTimedOutBoundary`
- work loop 中与 ping/retry/schedule directly related 的最小主线
- v18 中 `ensureRootIsScheduled` 的调用位置；main 中 `ReactFiberRootScheduler.js` 对应桥接位置

### 本入口读完后应回答
- Suspense 的恢复依然不是“自动魔法完成”，而是通过 root lanes 更新与重新调度重新获得执行机会。

---

## 入口 5：Offscreen 在 Fiber 层到底表示什么

### v18.2.0 文件
- `packages/react-reconciler/src/ReactFiberOffscreenComponent.js`
- 配套回查：`packages/react-reconciler/src/ReactFiberBeginWork.old.js`

### React main 对照
- `packages/react-reconciler/src/ReactFiberOffscreenComponent.js`
- 配套回查：`packages/react-reconciler/src/ReactFiberBeginWork.js`

### 为什么要单独读它
如果只从 Suspense 边界切换看现象，很容易把“隐藏内容”误讲成 DOM 技巧。这里要补上：**Offscreen 是 Fiber 如何承载“隐藏但保留”的子树模式。**

### 这轮只回答这些问题
- Offscreen fiber 主要承载什么语义？
- hidden / visible 等状态在内部更接近“子树模式”，还是“DOM 样式命令”？
- 为什么它适合与 Suspense 主内容/fallback 结构配合出现？

### 建议盯住的函数 / 片段
- Offscreen instance / state / visibility 相关定义
- beginWork 里处理 Offscreen 的最小分支
- 与 subtree hidden / deferred work 直接相关的辅助逻辑

### 本入口读完后应回答
- Offscreen 关注的是子树在 reconciler 中如何存在与被调度，而不只是屏幕上是否看得见。

---

## 入口 6：fallback / 隐藏内容在 complete / commit 阶段怎样收束

### v18.2.0 文件
- `packages/react-reconciler/src/ReactFiberCompleteWork.old.js`
- `packages/react-reconciler/src/ReactFiberCommitWork.old.js`
- 可选回查：`packages/react-reconciler/src/ReactFiberUnwindWork.old.js`

### React main 对照
- `packages/react-reconciler/src/ReactFiberCompleteWork.js`
- `packages/react-reconciler/src/ReactFiberCommitWork.js`
- 可选回查：`packages/react-reconciler/src/ReactFiberUnwindWork.js`

### 为什么要补这一层
M6 如果只讲 beginWork 和 throw，会让人误以为 Suspense/Offscreen 只是 render 中途分支。这里需要最小确认：**边界捕获之后，fallback 与隐藏子树最终怎样在后续阶段被收束与提交。**

### 这轮只回答这些问题
- Suspense 边界捕获后，当前 render 结果如何转向 fallback 路径？
- Offscreen / hidden subtree 在 commit 阶段有哪些最小必要处理？
- 为什么这进一步说明它不是单纯“少渲染一点”的语法糖？

### 建议盯住的函数 / 片段
- Suspense / Offscreen tag 在 completeWork 与 commitWork 里的最小相关分支
- unwind 中与 boundary capture 相关的最小收尾片段

### 本入口读完后应回答
- Suspense / Offscreen 影响的不只是中途控制流，也会贯穿当前 render 的收束与提交方式。

---

## 入口 7：官方文档如何描述 Suspense 与 React 19 相关 delta

### 证据类型
- React 18 官方 Suspense / concurrent features 文档与发布文
- React 19 官方升级文档、博客、发布说明

### 为什么要补它
M6 很容易被源码细节带偏。这里需要官方公开口径来钉牢两件事：
1. Suspense 的用户可见语义；
2. React 19 值得写进 M6 的 delta 到底是什么。

### 这轮只回答这些问题
- 官方如何描述 Suspense 的基本职责？
- 官方在 React 19 中，对 Suspense 相关行为有哪些公开变化说明？
- 哪些属于“教学应补充的公开 delta”，哪些只是实现组织变化？

### 本入口读完后应回答
- M6 的 React 19 小节应以“公开语义与稳定骨架”为主，而不是源码文件迁移记录。

---

## 可选轻量对照：React main

### 建议核对文件
- `packages/react-reconciler/src/ReactFiberBeginWork.js`
- `packages/react-reconciler/src/ReactFiberThrow.js`
- `packages/react-reconciler/src/ReactFiberLane.js`
- `packages/react-reconciler/src/ReactFiberRootScheduler.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberSuspenseComponent.js`
- `packages/react-reconciler/src/ReactFiberSuspenseContext.js`
- `packages/react-reconciler/src/ReactFiberOffscreenComponent.js`

### 对照目的
- 确认 M6 主线骨架仍然成立：
  - beginWork 中的边界决策
  - throw / ping / retry 主线
  - root 级 suspended / pinged lanes 调度
  - Offscreen 承接隐藏内容
- 如果实现位置变化，只备注“组织方式变化，但教学主线未变”。

### 不要做的事
- 不为了追 main 的辅助文件拆分，而重写 M6 的稳定讲解结构。
- 不把 Activity、ViewTransition、RSC、`use` 等更大主题混入本模块主线。

---

## 本模块最小阅读顺序

1. `ReactFiberBeginWork.old.js`（`updateSuspenseComponent`）
2. `ReactFiberThrow.old.js`
3. `ReactFiberLane.old.js`
4. `ReactFiberWorkLoop.old.js`
5. `ReactFiberOffscreenComponent.js`
6. `ReactFiberSuspenseComponent.old.js`
7. `ReactFiberSuspenseContext.old.js`
8. `ReactFiberCompleteWork.old.js`（按需补读）
9. `ReactFiberCommitWork.old.js`（按需补读）
10. React 18 / React 19 官方文档证据
11. React main 对照文件（只做轻量核验）

> 说明：这里把 `ReactFiberBeginWork.old.js` 与 `ReactFiberThrow.old.js` 放在最前面，是因为 M6 的最大门槛不是字段数量，而是先建立“Suspense 是 render 控制流与边界协调机制”的认识。root lanes 与 Offscreen 应该在这层认识建立后再补上。

---

## 读完后应能回答的最小问题集

- `updateSuspenseComponent` 为什么是理解 M6 的第一入口？
- render 抛出 thenable / wakeable 后，React 为什么不会直接走普通报错路径？
- `attachPingListener` 为什么能把“等待条件满足后重试”接回系统？
- root 为什么必须维护 `suspendedLanes`、`pingedLanes` 等状态？
- `getNextLanes` 在 Suspense 情况下为什么仍然是关键选择函数？
- retry 之后 root 怎样重新获得执行机会？
- Offscreen 为什么不是“隐藏 DOM”的小技巧，而是 Fiber 子树模式？
- Suspense 与 Offscreen 为什么应该放在同一模块里理解？
- React main / React 19 中，哪些变化只是组织变化，哪些值得作为公开 delta 写进教学正文？
