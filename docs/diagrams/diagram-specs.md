# 最终图示说明（文字规格草案）

## 设计原则
- 先服务理解，再考虑美观。
- 一张图只回答一个问题。
- 所有文字口径与 M1-M6 正文保持一致。
- 首选 SVG，便于版本管理与后续修订。

---

## 1. React Fiber 学习路线总图

### 目的
用一张图把 M1-M6 放进同一条认知链，帮助读者先看到全局，再进入分模块正文。

### 回答的问题
“为什么这个仓库要按 M1-M6 这样的顺序来学？”

### 图形结构
- 从左到右的主流程图。
- 六个顺序节点：M1、M2、M3、M4、M5、M6。
- 每个节点只配一句问题定义与一句核心结论。

### 每个节点建议文案
- M1：为什么需要 Fiber｜把渲染变成可调度工作系统。
- M2：Fiber 节点与遍历｜把树拆成可逐单元推进的工作节点。
- M3：双树与 render/commit｜在新树上准备结果，再统一提交。
- M4：一次更新全链路｜从 `setState` 到 root，再到 commit。
- M5：lanes 与 scheduler｜决定先做什么、何时让位、何时继续。
- M6：Suspense 与 Offscreen｜工作卡住时如何回退、隐藏与重试。

### 图中要强调的关系
- 前一模块是后一模块的前提，不是并列目录。
- M4 是把 M2、M3 动态化；M6 是在 M5 调度系统上的阻塞/恢复延伸。

---

## 2. Fiber 节点结构与遍历骨架图

### 目的
把 `child` / `sibling` / `return` 与“逐单元推进工作”的关系一次讲清。

### 回答的问题
“React 为什么能不靠隐式递归栈，而沿 Fiber 树推进和回退工作？”

### 图形结构
- 左侧：单个 Fiber 节点框。
- 节点框内只保留最关键字段分组：
  - 树链接：`child` / `sibling` / `return`
  - 输入缓存：`pendingProps` / `memoizedProps` / `memoizedState`
  - 工作标记：`flags` / `subtreeFlags`
  - 配对关系：`alternate`
- 右侧：一棵 3 层小树，标明 child 向下、sibling 向右、return 向上。
- 最下方：简化箭头表示 `beginWork` 向下、`completeWork` 回退。

### 图中要强调的关系
- Fiber 不只是“描述 UI 的节点”，还是工作节点。
- 树关系是显式链接，不是只靠 JS 调用栈隐式保存。
- render 推进的最小单位是当前 Fiber，而不是整棵树。

---

## 3. current / workInProgress / finishedWork / commit 关系图

### 目的
解释双树模型与 render/commit 分工，避免把 `finishedWork` 误解成第三棵树。

### 回答的问题
“React 为什么能一边准备下一版，一边维持当前界面稳定？”

### 图形结构
- 左右两棵简化树并排：左为 `current`，右为 `workInProgress`。
- 每对对应节点之间用虚线表示 `alternate`。
- 上方标注：render 在 `workInProgress` 上推进。
- render 结束后，在根节点旁标注：`finishedWork = 已完成的 workInProgress 根`。
- 最右侧用一个粗箭头表示 commit：`root.current = finishedWork`。

### 图中要强调的关系
- `current` 是当前生效版本。
- `workInProgress` 是准备中的下一版。
- `finishedWork` 不是第三棵树，而是 render 完成后的工作树。
- commit 是“真正生效”的边界时刻。

---

## 4. 一次 `setState` 全链路时序图

### 目的
把组件级更新如何上升为 root 级工作，再进入 render/commit 的时间顺序讲清。

### 回答的问题
“一次具体更新为什么不是立刻改 state，而是先登记、再调度、再提交？”

### 图形结构
- 纵向时序图，参与者建议为：Component Instance、Fiber、Root、Render Work Loop、Commit。
- 时序主线：
  1. `setState(...)`
  2. create update
  3. enqueue update queue
  4. 向上找到 root
  5. `scheduleUpdateOnFiber`
  6. `prepareFreshStack`
  7. render 消费 update queue
  8. `root.finishedWork = ...`
  9. `commitRoot`
  10. `root.current = finishedWork`

### 图中要强调的关系
- `setState` 的第一步是登记更新，不是立刻改页面。
- root 是 render/commit 的总入口。
- render 先准备结果，commit 后真正生效。

---

## 5. lanes / root / scheduler 协作图

### 目的
把 lane 分配、root 选批次、scheduler 安排执行机会的分工讲清，避免“并发 = 多线程”误解。

### 回答的问题
“当系统里同时有多批更新时，React 到底怎么决定先做什么？”

### 图形结构
- 三层结构图：
  - 第一层：Update Sources（输入、点击、切换等）
  - 第二层：Lane Assignment
  - 第三层：Root Ledger + `getNextLanes`
  - 旁侧：Scheduler callback opportunity
  - 末端：Render Work Loop
- Root ledger 里只画关键集合：`pendingLanes`、`suspendedLanes`、`pingedLanes`、`expiredLanes`。

### 图中要强调的关系
- 更新先进入 lane。
- root 统一判断“现在最该做哪一批”。
- scheduler 提供执行机会，但不替代 root 做业务优先级决策。
- transition 应标成“可让位的非紧急更新”。

---

## 6. Suspense / Offscreen / ping / retry 主线图

### 目的
把“工作卡住时如何处理”画成一条闭环，不把 Suspense 误讲成单纯 loading 组件。

### 回答的问题
“render 过程中主内容暂时做不下去时，React 怎样保持一致并等待恢复？”

### 图形结构
- 线性闭环图或环形流程图。
- 推荐节点：
  1. render 尝试主内容
  2. 子树 suspend / throw wakeable
  3. 最近 Suspense boundary 捕获
  4. fallback 出场
  5. 主内容进入 hidden Offscreen
  6. root 记录 `suspendedLanes`
  7. wakeable resolve → ping
  8. root 记录 `pingedLanes` 并重新调度
  9. retry 主内容 render

### 图中要强调的关系
- fallback 出现时，主内容往往不是简单删除，而是 hidden Offscreen。
- ping / retry 仍回到 lanes + root scheduler 体系。
- Suspense 是 render 协调与恢复机制，不只是展示 loading。

---

## 图示优先级建议
1. 学习路线总图
2. current / workInProgress / finishedWork / commit 关系图
3. 一次 `setState` 全链路时序图
4. lanes / root / scheduler 协作图
5. Suspense / Offscreen / ping / retry 主线图
6. Fiber 节点结构与遍历骨架图

## 导出建议
- 首版全部先做 SVG。
- README 如需展示，再补少量 PNG。
- 命名建议与文件名保持一致，避免后续口径漂移。
