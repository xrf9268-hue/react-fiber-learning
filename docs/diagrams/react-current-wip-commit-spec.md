# React current / workInProgress / finishedWork / commit 图示规格

日期：2026-03-12  
状态：text-only spec（未渲染 SVG）
输出目标：`projects/react-fiber-learning/docs/diagrams/react-current-wip-commit.svg`

## 这张图只回答什么
- `finishedWork` 为什么不是第三棵树
- render 主要在哪棵树上推进
- commit 在什么时刻把结果切成新的 `current`

## 图型选择
- 类型：横向阶段图 + 双树关系图
- 阅读方向：左 → 右
- 上半区：root 视角的阶段切换
- 下半区：单个节点在双树中的配对关系（`alternate`）

## 版式草图

### 第一栏：提交前的稳定状态
标题：`提交前：只有 current 对外生效`
内容块：
- Root 小框：
  - `root.current -> Current Tree`
  - `root.finishedWork = null`
- Current Tree 大框（实线、高亮）：
  - 文案：`当前已提交、当前页面真正依赖的树`
- WIP Tree 大框（虚线、次级色）：
  - 文案：`下一版的工作树，尚未对外生效`
- 注释：
  - `此时用户看到的是 current，不是工作中的半成品`

### 第二栏：render 阶段
标题：`render：沿 workInProgress 准备下一版`
内容块：
- Root 小框：
  - `prepareFreshStack(root, lanes)`
  - `createWorkInProgress(root.current, null)`
- 主箭头：`current 派生 -> workInProgress`
- WIP Tree 大框（高亮）：
  - 文案 1：`beginWork / completeWork 在这棵树上推进`
  - 文案 2：`计算下一版结果，记录 flags / subtreeFlags`
- Current Tree 保持显示但弱化：
  - 文案：`仍代表当前生效版本`
- 关键提示框：
  - `render = 准备结果，不等于页面已更新`

### 第三栏：render 完成后的交接态
标题：`render 完成：workInProgress 以 finishedWork 身份挂到 root`
内容块：
- Root 小框：
  - `root.finishedWork = finishedWork`
  - `finishedWork = root.current.alternate`
- 同一棵树双标签表现：
  - 主标签：`workInProgress（刚完成）`
  - 次标签：`此刻也可称 finishedWork（待提交）`
- 强提示框：
  - `finishedWork 不是第三棵树`
  - `它就是这轮 render 已完成的 workInProgress 根`

### 第四栏：commit 切换
标题：`commit：消费 finishedWork，并切成新的 current`
内容块：
- Root 小框：
  - `const finishedWork = root.finishedWork`
  - `root.current = finishedWork`
- 主箭头：`finishedWork -> new current`
- 注释 1：`commit 按 flags 执行真正生效的工作`
- 注释 2：`切换发生在 commit，不发生在 render`
- 结果提示：
  - `旧 current 退场`
  - `刚完成的结果树成为新的 current`

## 下半区：alternate 配对小图
标题：`同一逻辑节点的双树配对`
布局：左右两个小卡片，中间双向箭头
- 左卡：`Current Fiber`
  - 字段点到为止：`memoizedProps / memoizedState`
- 右卡：`WorkInProgress Fiber`
  - 字段点到为止：`pendingProps / flags`
- 中间箭头标签：`alternate`
- 底部一句话：
  - `双树不是两套业务界面，而是同一界面的已提交版本与待提交版本`

## 推荐文案清单（图中短句）
- `current：当前生效版本`
- `workInProgress：正在准备的下一版`
- `finishedWork：已准备好、等待提交的下一版`
- `render 在 workInProgress 上推进`
- `commit 让结果真正生效`
- `root 是交接中心`
- `finishedWork 不是第三棵树`

## 箭头与视觉语义
- 实线粗箭头：主状态流转
  - `current -> workInProgress -> finishedWork -> current`
- 虚线箭头：派生 / 配对关系
  - `current <-> alternate <-> workInProgress`
- 高亮切换边界：`root.current = finishedWork`
- 色彩建议：
  - current：蓝色
  - workInProgress / finishedWork：橙色
  - commit 边界：绿色

## 图中不要做的事
- 不展开 commit 三小阶段细节
- 不塞入字段大全
- 不画成三棵并列大树，避免误导 `finishedWork` 像第三棵树
- 不引入 lanes、scheduler、Suspense 细节

## 与正文的映射
- `current` / `workInProgress` / `finishedWork` 定义：`docs/modules/m3-current-wip-render-commit-draft.md`
- root 交接中心口径：`docs/modules/m3-current-wip-render-commit-draft.md`
- `root.current = finishedWork` 的教学意义：`docs/modules/m3-current-wip-render-commit-draft.md`
- 总览中的统一主线：`docs/final-guide-draft.md`

## 渲染前检查
- 图中是否明确说出 render 在 WIP 树上推进
- 图中是否明确说出 `finishedWork` 只是 WIP 的完成态名称
- 图中是否明确把真正切换时刻放在 commit
- 图中是否让 root 作为交接中心被看见
