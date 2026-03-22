# React Fiber Learning Project

一个面向中文读者的 React Fiber 学习仓库：先建立稳定心智模型，再用最少但关键的官方源码证据做校验，而不是一上来就陷入整仓源码考古。

## 这套仓库现在到什么状态了

- M0-M6 已完成，并已形成连续的学习主线。
- M1-M6 对应的本地里程碑提交已存在，提交号已在 `STATUS.md` 中完整记录。
- M7 的文本收尾包已完成；当前重点只剩可选的图示成品化与未来如需对外展示时的命名美化。
- 当前稳定总入口：`docs/final-guide-draft.md`

## 仓库目标

这套仓库的目标不是逐行讲完 React 源码，而是建立一条稳定、可复习、可回查证据的学习路径，帮助读者理解：

1. 为什么 React 需要 Fiber。
2. Fiber 节点、树遍历、双树、render / commit 的骨架关系。
3. 一次更新怎样从组件进入 root，再进入 render / commit。
4. lanes / priority / scheduler 怎样协作决定下一批工作。
5. Suspense / Offscreen / ping / retry 怎样处理“暂时做不下去”的工作。

## 学习边界

- 基线版本：**React v18.2.0**
- 对照目标：**React main / React 19 相关增量**
- 方法：**概念优先，证据导向，最小必要源码入口**

明确不在本轮收尾范围内：
- RSC
- `use`
- streaming SSR
- hydration
- Activity
- ViewTransition
- 其他超出 M1-M6 主线的新主题

## 在线阅读

本项目已部署至 [fiber.aixie.de](https://fiber.aixie.de)，可直接在线浏览全部模块与图表。

## 推荐阅读顺序

### 读法一：先抓全局主线
1. `docs/final-guide-draft.md`
2. `docs/index.md`
3. 按需回看对应模块正文与 evidence notes

### 读法二：按模块顺读
1. M1：`docs/modules/m1-why-fiber-exists-draft.md`
2. M2：`docs/modules/m2-fiber-node-and-traversal-draft.md`
3. M3：`docs/modules/m3-current-wip-render-commit-draft.md`
4. M4：`docs/modules/m4-one-setstate-trace-draft.md`
5. M5：`docs/modules/m5-lanes-priority-scheduler-transition-draft.md`
6. M6：`docs/modules/m6-suspense-offscreen-react19-draft.md`
7. 最后回到：`docs/final-guide-draft.md`

## 模块状态一览

- M0：项目框架与学习地图 — 完成
- M1：为什么需要 Fiber — 完成
- M2：Fiber 节点与树遍历 — 完成
- M3：current / workInProgress / render / commit — 完成
- M4：一次 `setState` 全链路 — 完成
- M5：lanes / priority / scheduler / transition — 完成
- M6：Suspense / Offscreen / React 19 轻量对照 — 完成
- M7：最终总览 / 图示 / 仓库收尾 — 文本交付基线已完成，站点已构建部署至 fiber.aixie.de

## 仓库导航

- 总体状态：`STATUS.md`
- 项目路线：`docs/roadmap.md`
- 仓库索引：`docs/index.md`
- 最终总览入口：`docs/final-guide-draft.md`
- 图示文字规格：`docs/diagrams/diagram-specs.md`
- 最终收尾检查清单：`docs/final-polish-checklist.md`
- 最终提交前就绪记录：`docs/final-commit-readiness.md`
- 最终发布就绪说明：`docs/final-release-readiness.md`
- 站点源码：`app/`（Vite 8 + React 19 + TanStack Router + MDX）
- 历史检查点：`checkpoints/2026-03-11-progress.md`

## 产物分层说明

### 1. 入口层
- `README.md`
- `docs/index.md`
- `docs/final-guide-draft.md`

### 2. 模块正文层
- `docs/modules/*-draft.md`

### 3. 证据层
- `docs/modules/*-evidence-notes.md`
- `docs/modules/*-source-entry-points.md`
- 少量 compare / self-review / commit-readiness 文档

### 4. 状态层
- `STATUS.md`
- `checkpoints/*.md`

### 5. 站点层
- `app/` — 基于 Vite + React 19 + TanStack Router 的 SPA 站点
- 部署目标：Cloudflare Workers → `fiber.aixie.de`
- 内容源：`app/src/content/` 下的 MDX 文件（从 `docs/modules/` 转写）

## 当前建议

如果你是第一次进入这个仓库，最省力的路径是：

**先看 `docs/final-guide-draft.md` 抓住主线，再通过 `docs/index.md` 回到对应模块与证据文件。**

## 状态同步说明

README 只承担仓库入口与阅读导航，不单独维护细粒度进度。模块完成情况、M7 收尾状态与后续决定，以 `STATUS.md` 为准。
