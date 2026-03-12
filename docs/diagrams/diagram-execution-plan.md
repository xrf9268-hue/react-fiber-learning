# 图示执行计划（首轮）

日期：2026-03-12
目的：先完成 2 张 React 教学图 + 1 张长任务工作流图的首轮文字到 SVG 执行准备，保证范围小、路径清、可直接进入下一工作包。

## 本轮先做哪 3 张

### 1. React 双树与提交关系图
- 主题：`current / workInProgress / finishedWork / commit` 关系图
- 优先级：P1
- 原因：这是整套 React Fiber 主线里最关键、最容易误解的一张图；也最适合先建立统一视觉语言。
- 输出路径：`projects/react-fiber-learning/docs/diagrams/react-current-wip-commit.svg`
- 主要来源：
  - `projects/react-fiber-learning/docs/diagrams/diagram-specs.md`
  - `projects/react-fiber-learning/docs/final-guide-draft.md`
  - `projects/react-fiber-learning/docs/modules/m3-current-wip-render-commit-draft.md`（渲染时再补读）
- 图中必须回答：
  - 为什么 `finishedWork` 不是第三棵树
  - render 在哪棵树上推进
  - commit 何时把结果切成新的 `current`

### 2. 一次 setState 全链路时序图
- 主题：从 `setState` 到 root，再到 render / commit
- 优先级：P1
- 原因：它能把 M2/M3 的静态结构串成动态过程，教学价值高，且与总览稿口径已基本稳定。
- 输出路径：`projects/react-fiber-learning/docs/diagrams/react-setstate-full-path.svg`
- 主要来源：
  - `projects/react-fiber-learning/docs/diagrams/diagram-specs.md`
  - `projects/react-fiber-learning/docs/final-guide-draft.md`
  - `projects/react-fiber-learning/docs/modules/m4-one-setstate-trace-draft.md`（渲染时再补读）
- 图中必须回答：
  - `setState` 为什么不是立刻改页面
  - root 为什么是总入口
  - render 与 commit 如何接力

### 3. 长任务自动续跑控制流图
- 主题：长任务从“定义工作包”到“完成后进入后继动作”的控制流
- 优先级：P1
- 原因：这是本次方法验证的核心图，且范围可控，适合先做一张流程闭环图验证图示表达。
- 输出路径：`notes/diagrams/openclaw-long-task-workflow.svg`
- 主要来源：
  - `notes/2026-03-12-openclaw-long-task-auto-continuation-index.md`
  - `notes/2026-03-12-openclaw-long-task-auto-continuation-sop-v2.md`
  - `notes/2026-03-12-openclaw-long-task-state-object-minimal-template.md`
  - `task-states/2026-03-12-diagram-pass.md`
- 图中必须回答：
  - 什么才算真正开始
  - 汇报为什么不是暂停点
  - 一个工作包完成后如何进入下一包 / review / commit-readiness / commit

## 本轮执行顺序
1. 先补长任务工作流图的文字规格，锁定节点、分支、文案口径。
2. 再补 React 双树关系图的文字规格与版式草图。
3. 再补 `setState` 全链路时序图的文字规格与时序泳道草图。
4. 三张图文字规格稳定后，再进入首轮 SVG 渲染。

## 成功定义
本轮不要求把所有图画完；首轮成功标准是：
- 已明确 3 张图的唯一输出路径；
- 已锁定每张图的主问题、核心节点、来源文档；
- 已形成可直接渲染的文字规格；
- 文案与 `diagram-specs.md`、`final-guide-draft.md`、长任务 SOP 保持一致；
- 不把范围扩展到其余低优先级图。

## 风格规则

### 通用规则
- 先讲因果，再讲实现细节。
- 一张图只回答一个主问题。
- 图中文字尽量短句，避免源码级术语堆叠。
- 术语口径必须与正文一致，不额外发明新名字。
- 首版优先结构正确、关系清楚，不追求装饰效果。

### React 图规则
- 用“当前生效 / 正在准备 / 提交切换”这类教学语言辅助源码术语。
- 强调关系，不强调字段大全。
- 箭头方向必须稳定：准备流程、回退流程、提交边界要一眼可区分。

### 长任务图规则
- 必须画出“启动后 2 到 5 分钟首次活性核验”。
- 必须显式区分：执行、汇报、阻断、后继动作。
- 必须把“包完成后默认继续后继动作”画成硬分支，而不是备注。
- 必须体现“状态对象 + 证据”是控制流基础，而不是附属说明。

## 暂不做
- 暂不渲染 SVG 之外的 PNG。
- 暂不扩展学习路线总图、lanes 图、Suspense 图。
- 暂不改写 React 正文模块，只在图示需要时最小补读来源文档。

## 下一工作包入口
- 为 3 张首轮图分别补文字规格；其中长任务工作流图先落独立 spec 文件。
- 然后进入 SVG 首稿产出。