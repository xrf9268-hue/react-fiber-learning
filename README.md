# React Fiber Learning Project

一个面向中文读者的 React Fiber 学习仓库：先建立稳定心智模型，再用最少但关键的官方源码证据做校验，而不是一上来就陷入整仓源码考古。

## 在线阅读

**推荐直接访问站点：[fiber.aixie.de](https://fiber.aixie.de)**

站点包含全部模块正文、证据面板与 SVG 图表，阅读体验优于直接浏览仓库文件。

## 学习内容

本项目不是逐行讲完 React 源码，而是建立一条稳定、可复习、可回查证据的学习路径：

| 模块 | 主题 | 核心问题 |
|------|------|----------|
| M1 | 为什么需要 Fiber | 旧同步渲染模型的控制力为什么不够？ |
| M2 | Fiber 节点与树遍历 | 工作单元长什么样？child/sibling/return 怎么拆？ |
| M3 | 双树与 render/commit | 如何准备下一版又保持界面稳定？ |
| M4 | 一次 setState 全链路 | setState 怎样走到 render/commit？ |
| M5 | lanes / scheduler | 多批更新时先做什么？ |
| M6 | Suspense / Offscreen | 做不下去时怎么处理？ |

全部模块已完成（M1-M6），基线版本 **React v18.2.0**，对照 **React 19** 增量。

## 学习边界

明确不在本项目范围内：RSC、`use`、streaming SSR、hydration、Activity、ViewTransition 等超出 M1-M6 主线的新主题。

## 仓库结构

```
docs/
  modules/*-draft.md        # 教程内容的原始创作源（M1-M6 正文草稿）
  modules/*-evidence-*.md   # 证据笔记、自审记录等过程文档
  diagrams/                 # 图表唯一源（D2 源文件 + 手工 SVG）
    src/                    #   D2 源文件 + 共享主题
    build.sh                #   D2 编译脚本
  final-guide-draft.md      # 总览草稿（站点版见 fiber.aixie.de/learn/overview）
app/                        # 站点源码（Vite 8 + React 19 + TanStack Router + MDX）
  src/content/              #   MDX 教程内容（从 docs/ 派生，做了路由链接适配）
  public/diagrams/          #   SVG 图表（构建时从 docs/diagrams/ 自动同步）
STATUS.md                   # 项目状态
AGENTS.md                   # AI 协作执行规则
```

## 本地开发

```bash
cd app
npm install
npm run dev       # 启动开发服务器
npm run build     # 构建（自动同步图表 + tsc + vite）
npm run deploy    # 部署到 Cloudflare Workers
```

## 状态同步说明

README 只承担仓库入口与阅读导航。模块完成情况与项目状态以 `STATUS.md` 为准。
