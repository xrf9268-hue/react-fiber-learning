# 仓库索引

这是一份面向读者的最小导航页，用来回答三个问题：

1. 先从哪里开始读；
2. M1-M6 各自解决什么问题；
3. 需要回查证据或项目状态时，该去哪里。

## 推荐入口

### 首次阅读
1. `final-guide-draft.md` — 当前稳定总入口；先建立整条学习主线
2. `diagrams/index.md` — 图示总览入口；先决定该看哪张图
3. 对应模块正文 — 再展开理解局部机制
4. evidence notes / source entry points — 最后回查官方证据

### 仓库级辅助文档
- `../README.md` — 仓库目标、边界、推荐读法
- `../STATUS.md` — 当前整体状态与模块完成情况
- `roadmap.md` — 项目路线与模块成功定义
- `final-polish-checklist.md` — 最终收尾检查清单
- `final-commit-readiness.md` — 前一轮收尾时记录的剩余缺口
- `final-release-readiness.md` — 当前是否已具备最终本地里程碑提交条件的总结
- `diagrams/index.md` — 图示总览入口
- `diagrams/diagram-specs.md` — 图示的文字规格与优先级

## 学习路径

整套仓库的主线是：

**为什么需要 Fiber → Fiber 节点与遍历 → 双树与 render/commit → 一次更新全链路 → lanes 与 scheduler → Suspense / Offscreen / retry**

配套学习路线总图：`diagrams/react-learning-roadmap.svg`

这不是六个并列主题，而是一条逐步加骨架的解释路径。

## 模块导航

### M1｜为什么需要 Fiber
- 正文：`modules/m1-why-fiber-exists-draft.md`
- 证据：`modules/m1-evidence-notes.md`
- 对比补充：`modules/m1-compare-notes.md`
- 配套 SVG：`diagrams/react-old-sync-vs-fiber.svg`
- 作用：建立“为什么旧同步渲染模型不够用”的问题意识

### M2｜Fiber 节点与树遍历
- 正文：`modules/m2-fiber-node-and-traversal-draft.md`
- 证据：`modules/m2-evidence-notes.md`
- 最小源码入口：`modules/m2-source-entry-points.md`
- 配套 SVG：`diagrams/react-fiber-node-traversal.svg`
- 作用：建立 Fiber 作为工作单元与树遍历骨架的认识

### M3｜current / workInProgress / render / commit
- 正文：`modules/m3-current-wip-render-commit-draft.md`
- 证据：`modules/m3-evidence-notes.md`
- 最小源码入口：`modules/m3-source-entry-points.md`
- 图示说明补充：`modules/m3-compare-diagram-note.md`
- 配套 SVG：`diagrams/react-current-wip-commit.svg`
- 作用：理解双树模型与 render / commit 分工

### M4｜一次 `setState` 全链路
- 正文：`modules/m4-one-setstate-trace-draft.md`
- 证据：`modules/m4-evidence-notes.md`
- 最小源码入口：`modules/m4-source-entry-points.md`
- 配套 SVG：`diagrams/react-setstate-full-path.svg`
- 作用：把前面的静态结构第一次串成动态过程

### M5｜lanes / priority / scheduler / transition
- 正文：`modules/m5-lanes-priority-scheduler-transition-draft.md`
- 证据：`modules/m5-evidence-notes.md`
- 最小源码入口：`modules/m5-source-entry-points.md`
- 图示说明补充：`modules/m5-compare-diagram-note.md`
- 配套 SVG：`diagrams/react-lanes-assignment.svg`、`diagrams/react-scheduler-render-loop.svg`
- 作用：理解“当更新不止一条时，React 怎样决定先做什么”

### M6｜Suspense / Offscreen / React 19 轻量对照
- 正文：`modules/m6-suspense-offscreen-react19-draft.md`
- 证据：`modules/m6-evidence-notes.md`
- 最小源码入口：`modules/m6-source-entry-points.md`
- 图示说明补充：`modules/m6-compare-diagram-note.md`
- 配套 SVG：`diagrams/react-suspense-offscreen-ping-retry.svg`
- 作用：理解工作卡住时的回退、隐藏、恢复与重试机制

## M7 收尾相关文档

- 规划：`modules/m7-final-guide-diagrams-polish-plan.md`
- 来源映射：`modules/m7-source-and-output-map.md`
- 最终总览稳定入口（文件名暂保留 draft）：`final-guide-draft.md`
- 图示文字规格：`diagrams/diagram-specs.md`
- 收尾检查清单：`final-polish-checklist.md`
- 提交前就绪记录：`final-commit-readiness.md`
- 最终发布就绪说明：`final-release-readiness.md`

## 如果你只想快速复习

建议只看这四项：

1. `final-guide-draft.md`
2. `modules/m3-current-wip-render-commit-draft.md`
3. `modules/m4-one-setstate-trace-draft.md`
4. `modules/m5-lanes-priority-scheduler-transition-draft.md`

这样可以先抓住双树、单次更新链路与 lanes 调度这三段最核心骨架。

## 如果你要核对可信度

按下面顺序回查：

1. 模块正文中的关键结论
2. 对应 `*-evidence-notes.md`
3. 对应 `*-source-entry-points.md`
4. `STATUS.md` 与 checkpoint，确认仓库当前完成状态

## 说明

这份索引页只做导航，不承担新的教学展开，也不引入 M1-M6 之外的新 React 主题。
