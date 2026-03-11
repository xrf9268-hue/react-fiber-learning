# React 一次 setState 到 render / commit 全链路图示规格

日期：2026-03-12  
状态：text-only spec（未渲染 SVG）
输出目标：`projects/react-fiber-learning/docs/diagrams/react-setstate-full-path.svg`

## 这张图只回答什么
- `setState` 为什么不是立刻改页面
- 为什么组件里的更新最后一定要走到 root
- render 与 commit 如何接力让结果生效

## 图型选择
- 类型：时序图 / 泳道图
- 阅读方向：上 → 下
- 建议泳道：
  1. 组件实例
  2. 当前 Fiber
  3. Root
  4. Render（workInProgress）
  5. Commit

## 泳道与职责
- 组件实例：发起 `this.setState(...)`
- 当前 Fiber：承接 update、入队、沿父链冒泡
- Root：接收更新并安排整轮工作
- Render：在 `workInProgress` 树上计算新 state、产出 `finishedWork`
- Commit：消费 `finishedWork`，切成新的 `current`

## 主时序节点

### 1. 组件发起更新
泳道：组件实例
节点文案：
- `this.setState(payload)`
- 注释：`发起一次更新请求，不是立刻改页面`

### 2. 创建 update 并入队
泳道：当前 Fiber
节点文案：
- `enqueueSetState`
- `createUpdate(lane, payload)`
- `enqueueUpdate(fiber, update)`
- 注释：`先登记 update，再等待后续处理`

### 3. 沿父链找到 root
泳道：当前 Fiber -> Root
节点文案：
- `markUpdateLaneFromFiberToRoot(...)`
- `沿 return 向上`
- `到达 HostRoot / 拿到 FiberRoot`
- 强提示框：
  - `组件级更新会被提升为 root 级工作`

### 4. root 安排这轮工作
泳道：Root
节点文案：
- `scheduleUpdateOnFiber(root, fiber, lane, eventTime)`
- `markRootUpdated(root, lane, eventTime)`
- 注释：`root 知道有一轮新工作要开始`
- 辅助说明：`这里是调度，不是提交`

### 5. render 准备工作树
泳道：Render（workInProgress）
节点文案：
- `prepareFreshStack(root, lanes)`
- `createWorkInProgress(root.current, null)`
- 注释：`render 不在 current 上硬改，而是在 WIP 树上准备下一版`

### 6. render 消费 update queue
泳道：Render（workInProgress）
节点文案：
- `processUpdateQueue(...)`
- `从 update queue 算出新的 state`
- `beginWork / completeWork`
- 强提示框：
  - `新 state 不是在 setState 调用点算出来`
  - `而是在 render 阶段处理队列时算出来`

### 7. render 完成，结果挂到 root
泳道：Render -> Root
节点文案：
- `finishedWork = root.current.alternate`
- `root.finishedWork = finishedWork`
- `root.finishedLanes = lanes`
- 注释：`render 产出待提交结果`

### 8. commit 接手并生效
泳道：Commit
节点文案：
- `commitRoot(...)`
- `const finishedWork = root.finishedWork`
- `按 flags 执行提交工作`
- `root.current = finishedWork`
- 结果提示：`这次更新到这里才真正生效`

## 最小闭环总结框
放在图底部，三行即可：
- `setState：登记 update`
- `render：计算下一版结果`
- `commit：让结果真正生效`

## 推荐文案清单（图中短句）
- `setState 先入队，不直接改页面`
- `update 先挂到 Fiber`
- `沿 return 父链找到 root`
- `root 是 render / commit 的总入口`
- `render 在 WIP 树上处理 update queue`
- `finishedWork 先挂到 root，再交给 commit`
- `root.current = finishedWork 是生效时刻`

## 箭头与视觉语义
- 实线箭头：主时序推进
- 回指箭头：`Fiber -> Root` 的向上归并
- 高亮边界 1：`setState != 立刻改页面`
- 高亮边界 2：`root.current = finishedWork`
- 色彩建议：
  - update / queue：橙色
  - root 调度：蓝色
  - render：紫色
  - commit：绿色

## 图中不要做的事
- 不展开 hooks `dispatchSetState`
- 不展开完整 lanes 体系
- 不展开 scheduler 内部时机细节
- 不展开 DOM 细粒度 mutation 细节
- 不把并发/打断/transition 混入这张基础链路图

## 与正文的映射
- `setState` 先登记更新：`docs/modules/m4-one-setstate-trace-draft.md`
- update queue 与 `processUpdateQueue(...)`：`docs/modules/m4-one-setstate-trace-draft.md`
- root 作为总入口：`docs/modules/m4-one-setstate-trace-draft.md`
- render / commit 的衔接口径：`docs/modules/m3-current-wip-render-commit-draft.md`
- 总览中的动态主线：`docs/final-guide-draft.md`

## 渲染前检查
- 图中是否明确区分“登记更新”和“真正生效”
- 图中是否把 root 画成总入口，而不是组件自己闭环完成
- 图中是否明确指出新 state 在 render 阶段处理队列时得出
- 图中是否把 `finishedWork -> commit -> root.current = finishedWork` 画成连续链路
