# M6｜Suspense / Offscreen / React 19 deltas：规划稿

## 范围

本模块只回答五个互相关联的问题：

1. **Suspense 在 Fiber 里到底解决什么问题：是“加载组件”问题，还是“渲染阶段遇到暂不可继续的数据/结果”后的协调问题。**
2. **当子树因为 Suspense 暂时无法继续时，React 怎样在当前树、fallback 与重试之间做取舍。**
3. **Offscreen 在内部扮演什么角色：它是不是一个“隐藏 DOM API”，还是一个让某些子树以特殊可见性/优先级语义存在的 Fiber 机制。**
4. **Suspense 与 Offscreen 为什么经常一起出现：fallback、隐藏内容、重试、恢复之间的骨架关系是什么。**
5. **从 React 18.2.0 到 React main / React 19 相关实现，哪些是结构调整，哪些是学习骨架仍然成立的稳定认识。**

纳入范围：
- 以 **React 18.2.0** 为主基线，建立 Suspense / Offscreen 的最小内部教学骨架。
- Suspense 边界、fallback、retry/ping、suspended lanes 与重新调度之间的主线关系。
- `throwException` / `attachPingListener` / `retryTimedOutBoundary` 一类“挂起后如何转入 fallback 或等待重试”的最小证据链。
- `updateSuspenseComponent` / SuspenseContext 的概念位置：边界如何决定展示主内容还是 fallback。
- Offscreen fiber 的最小教学模型：隐藏子树并不等于卸载；它服务于可见性、保留状态、延后工作或配合 Suspense 的场景。
- React main / React 19 的轻量对照：文件拆分和 root 调度组织有变化，但 Suspense 与 Offscreen 依然建立在 lane、root 调度、可中断 render 这套骨架上。
- 与 M5 的衔接：M5 讲“工作如何被按优先级安排”，M6 讲“当工作因为 Suspense 暂时做不下去时，React 怎样隐藏、回退、等待、再试”。

暂不纳入：
- 服务端流式渲染、Flight / RSC、`use` API 的系统化分析。
- 所有 SuspenseList、Cache、Transition tracing、Activity/ViewTransition 等现代扩展的全量展开。
- DOM 层面的逐帧视觉表现、浏览器 paint/布局细节。
- 用户态最佳实践大全；本模块仍以 Fiber 内部机制为主。
- 把 React 19 新文件结构讲成“必须逐文件背诵的源码导游”。

---

## 成功定义

完成 M6 后，学习者应该能用自己的话准确说明：

1. **Suspense 的核心不是“异步组件语法糖”，而是 render 过程中遇到暂时不能继续的工作时，边界如何协调回退与重试。**
2. **当某段子树挂起时，React 不一定立刻失败；它可能转向 fallback、记录 suspended 状态，并等待后续 ping/retry。**
3. **Suspense 边界的职责，是决定当前这轮 render 里主内容是否可继续，还是该先显示 fallback。**
4. **root 上的 suspended / pinged lanes 会直接影响下一轮选哪些工作继续做。**
5. **Offscreen 不是“简单隐藏 DOM”，而是让一棵子树以特殊模式存在：可能隐藏、延后、保留状态，并与 Suspense fallback/恢复流程配合。**
6. **Suspense 与 Offscreen 的关系，不是两个孤立特性，而是同一套“可中断工作 + 可隐藏子树 + 条件恢复”骨架中的相邻部件。**
7. **React 19 / main 的实现位置可能变化，但学习主线仍然是：挂起、记录 lane 状态、安排重试、决定显示哪棵子树。**
8. **M6 的重点不是把每个分支都讲完，而是建立“挂起—回退—隐藏—重试—恢复”这一稳定认知链。**

---

## 关键误解与纠偏

### 误解 1：Suspense 只是“数据没回来时显示 loading”

不够准确。那只是最常见表象。更底层地说，Suspense 处理的是：render 过程中某段工作当前不能完成时，React 如何让整棵树仍然可协调地前进。

### 误解 2：子树一旦 suspend，整棵应用就卡死

不对。是否回退到 fallback、回退到哪一层边界、哪些 lanes 暂时不能做、什么时候重试，都是 React 在 root 和边界层面的协调结果。

### 误解 3：fallback 出现 = 主内容已经卸载没了

不准确。主内容可能未提交、被隐藏、被保留待后续恢复，具体要结合边界与 Offscreen 机制理解，不能直接等同于“彻底销毁”。

### 误解 4：Offscreen 就是一个给 DOM 节点加 `display: none` 的内部别名

不对。Offscreen 是 Fiber 层的子树模式与调度语义，不只是 DOM 样式切换。它关注的是这棵子树在 reconciler 里如何被保留、隐藏、延后或恢复。

### 误解 5：Suspense 与 Offscreen 是两套无关机制

不对。Suspense 的 fallback/主内容切换常常借助 Offscreen 语义来组织隐藏与保留的内容树，两者在教学上应该连起来理解。

### 误解 6：React 19 把文件拆了，所以旧的学习路径失效了

不成立。实现组织会变，但主问题没有变：谁挂起了、root 怎么记账、什么时候重试、当前显示哪棵子树。

### 误解 7：M6 必须把所有 Suspense 相关现代 API 全部读完

没必要。M6 只需要把最小内部骨架讲稳，并明确哪些扩展话题暂不纳入。

---

## 官方证据目标

本模块以 **React 18.2.0** 为主基线，围绕“render 遇到 suspend → 边界决定 fallback/主内容 → root 记录 suspended/pinged lanes → retry/re-schedule → Offscreen 组织隐藏子树 → React main 对照”建立最小证据链。

### 一组：Suspense 边界在 render 中的决策点

1. `packages/react-reconciler/src/ReactFiberBeginWork.old.js`
   - 目标：确认 `updateSuspenseComponent` 在 beginWork 阶段的概念位置。
   - 重点问题：
     - Suspense 边界何时决定走主内容，何时准备 fallback？
     - 边界如何与当前 lanes、上下文、子树状态发生关系？

2. `packages/react-reconciler/src/ReactFiberSuspenseComponent.old.js`
   - 目标：确认 Suspense 边界 tag、state 与辅助判断逻辑的最小骨架。
   - 重点问题：
     - Suspense boundary 在 Fiber 层有哪些关键状态位或辅助判断函数？
     - “已捕获/已超时/需要 fallback”在概念上怎样被表达？

3. `packages/react-reconciler/src/ReactFiberSuspenseContext.old.js`
   - 目标：确认 Suspense context 如何影响边界处理方式。
   - 重点问题：
     - 为什么 Suspense 不只是单点组件逻辑，还需要上下文辅助？

### 二组：render 遇到 suspend 后，React 怎样转入“等待 / 回退 / 重试”

4. `packages/react-reconciler/src/ReactFiberThrow.old.js`
   - 目标：确认 `throwException`、`attachPingListener`、边界捕获流程的主线。
   - 重点问题：
     - render 阶段“抛出 thenable / wakeable”后，React 如何识别这是 Suspense 路径而不是普通错误？
     - ping listener 为什么是重试链的一部分？

5. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - 目标：确认 suspended / pinged lanes、retry 与重新调度如何接回 root work loop。
   - 重点问题：
     - root 如何记录“这些 lanes 现在因为 suspend 暂时不可继续”？
     - ping 之后 root 怎样重新获得执行机会？
     - M5 的 lanes / scheduler 骨架在 Suspense 里怎样被实际利用？

6. `packages/react-reconciler/src/ReactFiberLane.old.js`
   - 目标：确认 suspended / pinged / retry 相关 lane 选择在 `getNextLanes` 中的角色。
   - 重点问题：
     - 为什么被挂起的 lanes 与已 ping 的 lanes 会影响下一批工作选择？

### 三组：Offscreen 在内部是什么

7. `packages/react-reconciler/src/ReactFiberOffscreenComponent.js`
   - 目标：确认 Offscreen fiber 的核心类型与可见性语义。
   - 重点问题：
     - Offscreen 想表达的不是哪种 DOM 操作，而是哪种子树存在状态？
     - hidden / visible / detached（如有）等概念在源码里怎样落地？

8. `packages/react-reconciler/src/ReactFiberBeginWork.old.js`
   - 目标：回查 Offscreen 分支在 beginWork 里的最小处理入口。
   - 重点问题：
     - Offscreen 子树在 render 时是如何被特殊对待的？
     - 它与 Suspense fallback/主内容切换的结构关系是什么？

9. `packages/react-reconciler/src/ReactFiberCompleteWork.old.js`、`packages/react-reconciler/src/ReactFiberCommitWork.old.js`
   - 目标：只做轻量确认，避免把 Offscreen 误讲成纯 beginWork 概念。
   - 重点问题：
     - 隐藏子树在 complete/commit 阶段有哪些最小必要处理？

### 四组：Retry 与 fallback 切换的最小边界证据

10. `packages/react-reconciler/src/ReactFiberCompleteWork.old.js`
11. `packages/react-reconciler/src/ReactFiberCommitWork.old.js`
12. `packages/react-reconciler/src/ReactFiberUnwindWork.old.js`
   - 目标：确认边界捕获后，fallback 标记、unwind、提交期处理的最小证据链。
   - 重点问题：
     - Suspense 边界“捕获之后”怎样影响当前这轮 render 的收束方式？
     - 什么情况下会转向 fallback 并等待后续 retry？

### 五组：必要的官方文档与发布证据

13. React 18 官方文档 / 发布文中关于 Suspense 与 transitions 的公开表述
14. React 19 官方升级文档、博客或发布说明中与 Suspense / prewarming / improved error handling / related rendering behavior 的相关表述
   - 目标：区分“官方公开概念变化”与“源码文件位置变化”。
   - 重点问题：
     - 官方对 Suspense 在 React 19 的新增口径是什么？
     - 哪些可作为 M6 的“delta”，哪些不应强行写进内部主线？

### 六组：必要的 React main 对照

15. `packages/react-reconciler/src/ReactFiberWorkLoop.js`
16. `packages/react-reconciler/src/ReactFiberRootScheduler.js`
17. `packages/react-reconciler/src/ReactFiberSuspenseComponent.js`
18. `packages/react-reconciler/src/ReactFiberSuspenseContext.js`
19. `packages/react-reconciler/src/ReactFiberOffscreenComponent.js`
20. `packages/react-reconciler/src/ReactFiberLane.js`
21. `packages/react-reconciler/src/ReactFiberBeginWork.js`
22. `packages/react-reconciler/src/ReactFiberThrow.js`

用途：
- 只确认主线骨架仍成立：
  - suspend 被捕获
  - root 记录 suspended/pinged lanes
  - 通过 root 调度重试
  - Suspense / Offscreen 共同组织 fallback 与隐藏内容
- 如果 main 中有新拆分或新辅助文件，只备注实现位置变化，不重写整套教学主轴。

---

## 建议教学顺序

1. **先回答“为什么 M5 之后要接 M6”。**
   - M5 已讲清：root 怎样按 lanes 安排工作。
   - M6 接着回答：当某部分工作因为 Suspense 暂时做不下去时，React 怎样不让整棵树失控。

2. **先讲 Suspense 的本质问题，不先讲 API 用法。**
   - 先建立“render 遇到暂不可继续的工作，边界如何协调”的认识。
   - 不要一上来就把 Suspense 讲成 `<Suspense fallback=...>` 的 JSX 语法课。

3. **再讲边界如何决定主内容还是 fallback。**
   - 把边界理解成“协调点”。
   - 重点放在 `updateSuspenseComponent` 一类逻辑的职责，而不是所有分支细节。

4. **再讲 throw / ping / retry 主线。**
   - 说明 suspend 后不是简单报错，而是进入等待与重试机制。
   - 把 ping listener、suspended lanes、重新调度串成一条线。

5. **再讲 Offscreen。**
   - 先破除“只是隐藏 DOM”的误解。
   - 再说明它为什么适合承接“内容先不显示但状态/结构仍保留”的需求。

6. **把 Suspense 与 Offscreen 合起来讲。**
   - 主内容、fallback、隐藏子树、后续恢复，本质上是同一协调系统的不同面。
   - 这一段是 M6 的概念收束点。

7. **最后做 React 19 delta 对照。**
   - 只回答两类问题：
     1. 哪些公开语义值得补充；
     2. 哪些只是文件组织变化。
   - 避免把 M6 结尾写成 React main 源码观光。

---

## 建议交付物形态

M6 正文建议至少包含：
- 一张 Suspense 主线图：render 遇到 suspend → boundary 捕获 → fallback / waiting → ping → retry。
- 一张 root 视角图：`suspendedLanes` / `pingedLanes` 如何影响 `getNextLanes` 与重新调度。
- 一张 Offscreen 关系图：主内容树、fallback 树、隐藏内容树之间的结构关系。
- 一段简明解释：为什么 Offscreen 不是 DOM 技巧，而是 Fiber 子树模式。
- 一段 React 19 delta 小节：只列主线未变点与官方公开变化点。
- 少量源码锚点，重点放在：
  - `updateSuspenseComponent`
  - `throwException`
  - `attachPingListener`
  - root 上 suspended/pinged lanes 的处理
  - `retryTimedOutBoundary`（或等价 retry 入口）
  - Offscreen fiber 关键结构/入口

如需配图，优先：
1. Suspense 挂起—回退—重试时序图；
2. root lanes 在 Suspense 下的状态变化图；
3. Suspense 与 Offscreen 的结构对应图。

---

## 复核清单

- [ ] 是否先讲清 Suspense 解决的是“渲染暂不可继续时的协调问题”，而不只是 loading UI。
- [ ] 是否讲清边界在主内容与 fallback 之间的决策角色。
- [ ] 是否用 root 的 suspended / pinged lanes 把 M5 与 M6 接起来。
- [ ] 是否明确说明 suspend 后会进入 ping / retry / re-schedule 链，而不是普通报错链。
- [ ] 是否把 Offscreen 解释为 Fiber 子树模式，而不是 DOM 样式技巧。
- [ ] 是否讲清 Suspense 与 Offscreen 的结构关系，而不是分成两段互不相干的知识点。
- [ ] 是否把 React 19 / main 对照控制在“主线未变 + 公开 delta”范围内。
- [ ] 是否避免把 RSC、`use`、SSR 流式等更大话题提前混进来。
- [ ] 是否保持中文、概念优先、证据导向，并控制篇幅边界。

---

## 一句话主论点

**M6 要建立的核心认识是：当 React 在 render 中遇到暂时无法继续的工作时，Suspense 边界会把系统从“继续主内容”切到“回退/等待/重试”路径；Offscreen 则为这类内容的隐藏、保留与恢复提供子树级承载方式，而 React 19 相关变化主要是围绕这套骨架的实现演进，不是推翻它。**
