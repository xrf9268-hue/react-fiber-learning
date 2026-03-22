# React Fiber Learning 站点重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 VitePress 文档站点重构为 Vite + React + TanStack Router + MDX 技术栈，保留全部内容，重新设计 UI。

**Architecture:** React SPA 应用，TanStack Router 提供文件路由和布局路由，MDX 渲染 Markdown 内容。布局路由（`learn.tsx`、`reference.tsx`）取代 spec 中 `Layout.tsx` 的职责，直接承载侧栏和面包屑；`__root.tsx` 提供全局导航栏。MDX 组件映射通过直接传 `components` prop 实现（无需 `MDXProvider`）。静态构建部署到 Cloudflare Pages。

**Tech Stack:** Vite, React 18, TanStack Router, @mdx-js/rollup, motion/react, Cloudflare Pages (Wrangler)

**Spec:** `docs/superpowers/specs/2026-03-21-vite-react-tanstack-redesign-design.md`

---

## File Structure Overview

```
app/
├── src/
│   ├── main.tsx                          # React 入口
│   ├── router.tsx                        # TanStack Router 实例
│   ├── styles/
│   │   ├── tokens.css                    # CSS 设计 token
│   │   └── global.css                    # 全局样式 + 排版 + 代码块
│   ├── components/
│   │   ├── Navbar.tsx                    # 顶部导航栏
│   │   ├── Sidebar.tsx                   # 左侧导航栏
│   │   ├── FiberHero.tsx                 # 首页 Hero（canvas 粒子动画）
│   │   ├── ModuleTimeline.tsx            # 首页模块卡片列表
│   │   ├── FeatureCards.tsx              # 首页学习方法三列卡片
│   │   ├── ModuleNav.tsx                 # 上/下篇导航
│   │   ├── EvidencePanel.tsx             # 可折叠证据回查面板
│   │   ├── ReadingProgress.tsx           # 阅读进度条
│   │   ├── MdxComponents.tsx             # MDX 自定义组件映射
│   │   └── PageTransition.tsx            # Motion 页面过渡包裹器
│   ├── data/
│   │   └── modules.ts                    # 模块元数据（标题/颜色/路径/关键词）
│   ├── routes/
│   │   ├── __root.tsx                    # 根布局
│   │   ├── index.tsx                     # 首页
│   │   ├── learn.tsx                     # 学习路径布局路由
│   │   ├── learn/
│   │   │   ├── overview.tsx
│   │   │   ├── reading-order.tsx
│   │   │   ├── 01-why-fiber.tsx
│   │   │   ├── 02-fiber-node.tsx
│   │   │   ├── 03-dual-tree.tsx
│   │   │   ├── 04-setstate-trace.tsx
│   │   │   ├── 05-lanes-scheduler.tsx
│   │   │   └── 06-suspense-retry.tsx
│   │   ├── reference.tsx                 # 参考资料布局路由
│   │   ├── reference/
│   │   │   ├── fiber-fields.tsx
│   │   │   ├── lane-constants.tsx
│   │   │   └── source-map.tsx
│   │   └── diagrams.tsx
│   └── content/                          # MDX 内容文件（从 docs/ 迁移）
│       ├── modules/
│       │   ├── m1-why-fiber-exists.mdx
│       │   ├── m2-fiber-node-and-traversal.mdx
│       │   ├── m3-current-wip-render-commit.mdx
│       │   ├── m4-one-setstate-trace.mdx
│       │   ├── m5-lanes-priority-scheduler-transition.mdx
│       │   └── m6-suspense-offscreen-react19.mdx
│       ├── evidence/
│       │   ├── m1-evidence.mdx
│       │   ├── m2-evidence.mdx
│       │   ├── m3-evidence.mdx
│       │   ├── m4-evidence.mdx
│       │   ├── m5-evidence.mdx
│       │   └── m6-evidence.mdx
│       ├── reference/
│       │   ├── fiber-fields.mdx
│       │   ├── lane-constants.mdx
│       │   └── source-map.mdx
│       └── guide/
│           ├── final-guide.mdx
│           └── reading-order.mdx
├── public/
│   ├── diagrams/                         # SVG 图表
│   └── favicon.svg
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── wrangler.jsonc
└── package.json
```

---

## Task 1: 项目脚手架与依赖安装

**Files:**
- Create: `app/package.json`
- Create: `app/vite.config.ts`
- Create: `app/tsconfig.json`
- Create: `app/tsconfig.app.json`
- Create: `app/index.html`
- Create: `app/src/main.tsx`

- [ ] **Step 1: 创建 `app/` 目录并初始化 `package.json`**

```bash
mkdir -p app
cd app
```

```json
{
  "name": "react-fiber-learning-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
cd app
npm install react@18 react-dom@18 @tanstack/react-router motion
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @mdx-js/rollup @types/mdx @tanstack/router-plugin remark-gfm rehype-prism-plus prismjs wrangler
```

- [ ] **Step 3: 创建 `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" }
  ]
}
```

- [ ] **Step 4: 创建 `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 5: 创建 `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypePrismPlus from 'rehype-prism-plus'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrismPlus, { ignoreMissing: true }]],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 6: 创建 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Fiber 深入学习</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 `src/main.tsx` 最小入口**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>React Fiber Learning App</div>
  </React.StrictMode>,
)
```

- [ ] **Step 8: 验证 dev server 启动**

```bash
cd app && npm run dev
```

Expected: Vite dev server 启动，浏览器显示 "React Fiber Learning App"。

- [ ] **Step 9: Commit**

```bash
git add app/
git commit -m "feat(app): scaffold Vite + React + TanStack Router project"
```

---

## Task 2: 设计系统 — CSS Token 与全局样式

**Files:**
- Create: `app/src/styles/tokens.css`
- Create: `app/src/styles/global.css`
- Modify: `app/src/main.tsx`

- [ ] **Step 1: 创建 `tokens.css`**

包含 spec 5.2 调色板、5.3 字体系统、5.4 排版参数的全部 CSS 变量。

```css
:root {
  /* 背景层次 */
  --bg-deep:     #0c1220;
  --bg:          #121a2d;
  --bg-card:     #182038;
  --border:      #1e2d3d;
  --border-glow: #1a3a5c;

  /* 主色 */
  --accent:      #61dafb;
  --purple:      #a78bfa;
  --green:       #4ade80;
  --orange:      #fb923c;
  --gold:        #e8d44d;
  --red:         #f87171;

  /* 文字 */
  --text-primary: #edf1f7;
  --text-body:    #c4ceda;
  --text-muted:   #7a8ba0;
  --text-dim:     #4a5568;

  /* 字体 */
  --font-heading: 'Noto Serif SC', Georgia, serif;
  --font-body:    'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* 排版 */
  --content-max-width: 680px;
  --body-font-size:    15px;
  --body-line-height:  2.1;

  /* 间距 */
  --radius:    12px;
  --radius-sm: 6px;

  /* 模块色 */
  --m1-color: #61dafb;
  --m2-color: #4ade80;
  --m3-color: #a78bfa;
  --m4-color: #fb923c;
  --m5-color: #e8d44d;
  --m6-color: #f87171;
}
```

- [ ] **Step 2: 创建 `global.css`**

全局 reset + 排版 + 背景 + 滚动条 + 代码块 + 选中色等样式。参考 spec 5.5 背景处理。内容包括：
- `html, body` reset，暗色 `color-scheme: dark`
- 全局背景：`--bg` + 网格 + 渐变光晕
- 标题（h1-h4）字体和渐变色
- 正文字号/行高/最大宽度
- 代码块样式（深色背景 + 边框 + 圆角）
- 内联代码样式（React 蓝高亮）
- 引用块样式
- 表格样式
- 滚动条样式
- `::selection` 颜色

- [ ] **Step 3: 在 `main.tsx` 中引入样式**

```tsx
import 'prismjs/themes/prism-tomorrow.css'  // 代码高亮主题
import './styles/tokens.css'
import './styles/global.css'
```

注意：`rehype-prism-plus` 需要 Prism CSS 主题才能显示语法高亮。`prism-tomorrow` 是深色主题，与我们的暗色设计系统契合。可以在 `global.css` 中覆写具体颜色以匹配设计 token。

- [ ] **Step 4: 验证样式生效**

```bash
cd app && npm run dev
```

Expected: 页面显示暗色背景 + 网格纹理 + 渐变光晕。

- [ ] **Step 5: Commit**

```bash
git add app/src/styles/
git commit -m "feat(app): add design system CSS tokens and global styles"
```

---

## Task 3: TanStack Router 基础配置 + 根布局

**Files:**
- Create: `app/src/router.tsx`
- Create: `app/src/data/modules.ts`
- Create: `app/src/components/Navbar.tsx`
- Create: `app/src/routes/__root.tsx`
- Create: `app/src/routes/index.tsx`
- Modify: `app/src/main.tsx`

- [ ] **Step 1: 创建 `data/modules.ts` — 模块元数据**

```typescript
export interface ModuleInfo {
  id: string            // 'M1'
  num: string           // '01'
  slug: string          // '01-why-fiber'
  title: string         // '为什么 React 需要 Fiber'
  shortTitle: string    // '为什么需要 Fiber'
  desc: string          // '旧同步渲染模型的控制力问题'
  keyword: string       // '问题意识'
  color: string         // '#61dafb'
}

export const modules: ModuleInfo[] = [
  {
    id: 'M1', num: '01', slug: '01-why-fiber',
    title: '为什么 React 需要 Fiber',
    shortTitle: '为什么需要 Fiber',
    desc: '旧同步渲染模型的控制力问题',
    keyword: '问题意识',
    color: '#61dafb',
  },
  {
    id: 'M2', num: '02', slug: '02-fiber-node',
    title: 'Fiber 节点与树遍历',
    shortTitle: 'Fiber 节点与树遍历',
    desc: '工作单元的结构与遍历骨架',
    keyword: '数据结构',
    color: '#4ade80',
  },
  {
    id: 'M3', num: '03', slug: '03-dual-tree',
    title: '双树与 render/commit',
    shortTitle: '双树与 render/commit',
    desc: 'current / workInProgress / 提交分离',
    keyword: '双树模型',
    color: '#a78bfa',
  },
  {
    id: 'M4', num: '04', slug: '04-setstate-trace',
    title: '一次 setState 全链路',
    shortTitle: '一次 setState 全链路',
    desc: '从组件到 root，再到 commit 的完整过程',
    keyword: '动态过程',
    color: '#fb923c',
  },
  {
    id: 'M5', num: '05', slug: '05-lanes-scheduler',
    title: 'lanes / priority / scheduler',
    shortTitle: 'lanes / priority / scheduler',
    desc: '多条更新并存时的优先级协作',
    keyword: '调度系统',
    color: '#e8d44d',
  },
  {
    id: 'M6', num: '06', slug: '06-suspense-retry',
    title: 'Suspense / Offscreen / retry',
    shortTitle: 'Suspense / Offscreen / retry',
    desc: '工作卡住时的回退、隐藏与恢复',
    keyword: '异常处理',
    color: '#f87171',
  },
]

export function getModuleBySlug(slug: string): ModuleInfo | undefined {
  return modules.find(m => m.slug === slug)
}

export function getAdjacentModules(slug: string) {
  const index = modules.findIndex(m => m.slug === slug)
  return {
    prev: index > 0 ? modules[index - 1] : null,
    next: index < modules.length - 1 ? modules[index + 1] : null,
  }
}
```

- [ ] **Step 2: 创建 `Navbar.tsx`**

导航栏组件：左侧 logo（发光圆点 + "React Fiber 深入学习"），右侧链接（学习路径、参考资料、图表、GitHub）。参考 spec 6.1。

使用 TanStack Router 的 `<Link>` 组件进行导航。

样式：`position: sticky; top: 0`，背景半透明 + `backdrop-filter: blur(16px)`，底部 1px border。

- [ ] **Step 3: 创建 `__root.tsx` — 根布局路由**

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
```

- [ ] **Step 4: 创建 `routes/index.tsx` — 首页占位**

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
    <h1>React Fiber 深入学习</h1>
    <p>首页开发中...</p>
  </div>
}
```

- [ ] **Step 5: 创建 `router.tsx` 并更新 `main.tsx`**

```tsx
// router.tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

```tsx
// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './styles/tokens.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
```

- [ ] **Step 6: 验证路由工作**

```bash
cd app && npm run dev
```

Expected: 导航栏显示，首页占位文字可见，点击导航链接不报错。

- [ ] **Step 7: Commit**

```bash
git add app/src/
git commit -m "feat(app): add TanStack Router setup, Navbar, and root layout"
```

---

## Task 4: 内容迁移 — MDX 文件与 SVG 图表

**Files:**
- Create: `app/src/content/modules/*.mdx` (6 files)
- Create: `app/src/content/evidence/*.mdx` (6 files)
- Create: `app/src/content/reference/*.mdx` (3 files)
- Create: `app/src/content/guide/*.mdx` (2 files)
- Create: `app/public/diagrams/*.svg` (8 files)
- Create: `app/public/favicon.svg`

- [ ] **Step 1: 创建内容目录结构**

```bash
mkdir -p app/src/content/{modules,evidence,reference,guide}
mkdir -p app/public/diagrams
```

- [ ] **Step 2: 复制模块正文（去掉 VitePress frontmatter）**

```bash
# 对每个模块文件，复制源文件并改后缀为 .mdx
cp docs/modules/m1-why-fiber-exists-draft.md app/src/content/modules/m1-why-fiber-exists.mdx
cp docs/modules/m2-fiber-node-and-traversal-draft.md app/src/content/modules/m2-fiber-node-and-traversal.mdx
cp docs/modules/m3-current-wip-render-commit-draft.md app/src/content/modules/m3-current-wip-render-commit.mdx
cp docs/modules/m4-one-setstate-trace-draft.md app/src/content/modules/m4-one-setstate-trace.mdx
cp docs/modules/m5-lanes-priority-scheduler-transition-draft.md app/src/content/modules/m5-lanes-priority-scheduler-transition.mdx
cp docs/modules/m6-suspense-offscreen-react19-draft.md app/src/content/modules/m6-suspense-offscreen-react19.mdx
```

注意：源文件没有 frontmatter，直接复制即可。如果有任何 MDX 不兼容的 HTML 片段（如 `<br class="...">`），需要手动修复为 JSX 兼容格式（`<br className="..." />`）。

- [ ] **Step 3: 复制证据笔记**

```bash
for i in 1 2 3 4 5 6; do
  cp "docs/modules/m${i}-evidence-notes.md" "app/src/content/evidence/m${i}-evidence.mdx"
done
```

- [ ] **Step 4: 复制参考资料**

```bash
cp docs/reference/fiber-fields.md app/src/content/reference/fiber-fields.mdx
cp docs/reference/lane-constants.md app/src/content/reference/lane-constants.mdx
cp docs/source-map.md app/src/content/reference/source-map.mdx
```

- [ ] **Step 5: 复制总览并创建阅读顺序页**

```bash
cp docs/final-guide-draft.md app/src/content/guide/final-guide.mdx
```

从 `site/guide/reading-order.md` 复制内容（去掉 VitePress frontmatter），保存为 `app/src/content/guide/reading-order.mdx`。此文件已存在于 VitePress 站点中（`site/guide/reading-order.md`），直接复制比从 `final-guide-draft.md` 提取更高效。需要将其中的内部链接从 VitePress 路径（如 `/modules/m1`）更新为新路径（如 `/learn/01-why-fiber`）。

- [ ] **Step 5.5: 基本 MDX 兼容性修复**

复制完所有 `.mdx` 文件后，立即扫描并修复常见 HTML-to-JSX 不兼容问题：

```bash
cd app
# 查找需要修复的模式
grep -rn '<br ' src/content/ || true
grep -rn '<img ' src/content/ | grep -v '/>' || true
grep -rn ' class=' src/content/ || true
```

常见修复：
- `<br class="...">` → `<br className="..." />`
- `<img src="..." alt="...">` → `<img src="..." alt="..." />`（自闭合）
- `class=` → `className=`（如果在 HTML 标签中）

注意：大部分 Markdown 内容不含裸 HTML，只需修复少量情况。如果编译时仍报错，在 Task 6 验证步骤中继续修复。

- [ ] **Step 6: 复制 SVG 图表和 favicon**

```bash
cp docs/diagrams/*.svg app/public/diagrams/
cp site/public/favicon.svg app/public/favicon.svg 2>/dev/null || echo "favicon.svg not found, create later"
```

- [ ] **Step 7: 验证 MDX 文件可被 Vite 编译**

在 `routes/index.tsx` 中临时 import 一个 MDX 文件并渲染：

```tsx
import M1Content from '@/content/modules/m1-why-fiber-exists.mdx'

// 在 HomePage 组件中渲染 <M1Content />
```

```bash
cd app && npm run dev
```

Expected: M1 内容正常渲染在首页，无编译错误。如果有 MDX 兼容性问题，在此步骤修复。

- [ ] **Step 8: 移除临时 import，Commit**

```bash
git add app/src/content/ app/public/
git commit -m "feat(app): migrate MDX content and SVG diagrams from docs/"
```

---

## Task 5: 布局路由 — learn.tsx 与 reference.tsx + Sidebar

**Files:**
- Create: `app/src/components/Sidebar.tsx`
- Create: `app/src/routes/learn.tsx`
- Create: `app/src/routes/reference.tsx`

- [ ] **Step 1: 创建 `Sidebar.tsx`**

侧栏组件，接收 props：
- `sections`: 分组列表，每组有 `title` 和 `items`（含 `label`, `href`, `color?`）
- 当前路径高亮（使用 TanStack Router 的 `useRouterState`）
- 模块项前带颜色圆点
- 响应式：移动端默认隐藏，通过 hamburger 菜单切换

样式参考 spec 6.2：宽度 220px，背景 `--bg-deep`，右侧 1px border。

- [ ] **Step 2: 创建 `learn.tsx` — 学习路径布局路由**

```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/Sidebar'
import { modules } from '@/data/modules'

export const Route = createFileRoute('/learn')({
  component: LearnLayout,
})

function LearnLayout() {
  const sections = [
    {
      title: '学习路径',
      items: [
        { label: '总览', href: '/learn/overview' },
        { label: '阅读顺序', href: '/learn/reading-order' },
        ...modules.map(m => ({
          label: `${m.num} ${m.shortTitle}`,
          href: `/learn/${m.slug}`,
          color: m.color,
        })),
      ],
    },
  ]

  return (
    <div className="layout-with-sidebar">
      <Sidebar sections={sections} />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 创建 `reference.tsx` — 参考资料布局路由**

与 `learn.tsx` 结构相同，sidebar 内容为参考资料列表（Fiber 字段速查、Lane 常量表、源码映射表）。

- [ ] **Step 4: 添加 layout CSS**

在 `global.css` 中添加 `.layout-with-sidebar` 和 `.content-area` 样式：
- flex 布局，sidebar 固定宽度 220px
- content-area 填满剩余空间，内部 max-width 680px + 居中
- 移动端 sidebar 隐藏

- [ ] **Step 5: 验证布局路由**

创建一个临时的 `learn/overview.tsx` 路由文件显示占位文字，验证 sidebar + 内容区布局正确。

```bash
cd app && npm run dev
```

Expected: 访问 `/learn/overview` 显示 sidebar + 内容区布局。

- [ ] **Step 6: Commit**

```bash
git add app/src/components/Sidebar.tsx app/src/routes/learn.tsx app/src/routes/reference.tsx app/src/styles/
git commit -m "feat(app): add layout routes with Sidebar for /learn and /reference"
```

---

## Task 6: MDX 组件映射与模块路由页

**Files:**
- Create: `app/src/components/MdxComponents.tsx`
- Create: `app/src/components/ModuleNav.tsx`
- Create: `app/src/components/EvidencePanel.tsx`
- Create: `app/src/routes/learn/01-why-fiber.tsx` ~ `06-suspense-retry.tsx`
- Create: `app/src/routes/learn/overview.tsx`
- Create: `app/src/routes/learn/reading-order.tsx`

- [ ] **Step 1: 创建 `MdxComponents.tsx`**

MDX 自定义组件映射：覆写 `h1, h2, h3, p, a, code, pre, table, blockquote, img, ul, ol, li` 的渲染。

关键样式：
- `h1`: `--font-heading`, 渐变色
- `h2`: 上方 border + padding-top
- `p`: `--text-body`, line-height 2.1, max-width 680px
- `code` (inline): React 蓝背景
- `pre > code`: 深色代码块 + border
- `img[src$=".svg"]`: 特殊背景 + border + padding
- `a`: React 蓝色 + hover 效果
- `blockquote`: 左侧 accent border + 淡背景

导出为 `mdxComponents` 对象，通过 `<MdxContent components={mdxComponents} />` 传入每个 MDX 组件。

- [ ] **Step 2: 创建 `ModuleNav.tsx`**

上/下篇导航组件，接收 `prevModule` 和 `nextModule` props（类型 `ModuleInfo | null`）。

样式参考 spec 6.2 底部导航：flex, justify-content: space-between, 上方 border 分隔。

- [ ] **Step 3: 创建 `EvidencePanel.tsx`**

可折叠面板组件，接收 `children`（MDX 渲染的证据内容）。

- 默认收起，点击标题区域展开
- 标题区域显示 "证据回查" 标签 + 展开/收起箭头
- 使用 `useState` 控制展开状态
- 展开时带平滑动画（`max-height` transition 或 Motion animate）

- [ ] **Step 4: 创建 M1 路由页 `01-why-fiber.tsx` 作为模板**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { mdxComponents } from '@/components/MdxComponents'
import { ModuleNav } from '@/components/ModuleNav'
import { EvidencePanel } from '@/components/EvidencePanel'
import { getModuleBySlug, getAdjacentModules } from '@/data/modules'
import M1Content from '@/content/modules/m1-why-fiber-exists.mdx'
import M1Evidence from '@/content/evidence/m1-evidence.mdx'

export const Route = createFileRoute('/learn/01-why-fiber')({
  component: M1Page,
})

function M1Page() {
  const mod = getModuleBySlug('01-why-fiber')!
  const { prev, next } = getAdjacentModules('01-why-fiber')

  return (
    <article>
      <div className="module-header">
        <span className="module-badge" style={{ color: mod.color, background: `${mod.color}1a` }}>
          {mod.id}
        </span>
        <span className="module-keyword">{mod.keyword}</span>
      </div>

      <M1Content components={mdxComponents} />

      <EvidencePanel>
        <M1Evidence components={mdxComponents} />
      </EvidencePanel>

      <ModuleNav prev={prev} next={next} />
    </article>
  )
}
```

- [ ] **Step 5: 用相同模式创建 M2-M6 路由页**

每个路由页的结构相同，只是 import 的 MDX 文件和 slug 不同：
- `02-fiber-node.tsx` → `m2-fiber-node-and-traversal.mdx` + `m2-evidence.mdx`
- `03-dual-tree.tsx` → `m3-current-wip-render-commit.mdx` + `m3-evidence.mdx`
- `04-setstate-trace.tsx` → `m4-one-setstate-trace.mdx` + `m4-evidence.mdx`
- `05-lanes-scheduler.tsx` → `m5-lanes-priority-scheduler-transition.mdx` + `m5-evidence.mdx`
- `06-suspense-retry.tsx` → `m6-suspense-offscreen-react19.mdx` + `m6-evidence.mdx`

- [ ] **Step 6: 创建 `overview.tsx` 和 `reading-order.tsx`**

`overview.tsx` 渲染 `final-guide.mdx`，无证据面板和 ModuleNav。
`reading-order.tsx` 渲染 `reading-order.mdx`，无证据面板和 ModuleNav。

- [ ] **Step 7: 验证模块页渲染**

```bash
cd app && npm run dev
```

访问 `/learn/01-why-fiber`。

Expected: 侧栏 + 面包屑 + 模块标题 + MDX 正文 + 证据面板（可折叠）+ 底部上/下篇导航。

- [ ] **Step 8: Commit**

```bash
git add app/src/components/ app/src/routes/learn/
git commit -m "feat(app): add MDX rendering, module pages with evidence panels"
```

---

## Task 7: 参考资料页与图表索引页

**Files:**
- Create: `app/src/routes/reference/fiber-fields.tsx`
- Create: `app/src/routes/reference/lane-constants.tsx`
- Create: `app/src/routes/reference/source-map.tsx`
- Create: `app/src/routes/diagrams.tsx`

- [ ] **Step 1: 创建三个参考资料路由页**

每个页面结构相同：import 对应 MDX 文件，通过 `components` prop 传入 `mdxComponents` 渲染。无证据面板和 ModuleNav。

```tsx
// reference/fiber-fields.tsx
import { createFileRoute } from '@tanstack/react-router'
import { mdxComponents } from '@/components/MdxComponents'
import Content from '@/content/reference/fiber-fields.mdx'

export const Route = createFileRoute('/reference/fiber-fields')({
  component: FiberFieldsPage,
})

function FiberFieldsPage() {
  return (
    <article>
      <Content components={mdxComponents} />
    </article>
  )
}
```

`lane-constants.tsx` 和 `source-map.tsx` 同理。

- [ ] **Step 2: 创建 `diagrams.tsx` — 图表索引页**

展示所有 8 个 SVG 图表的列表。每项显示：
- 图表标题
- SVG 缩略图预览（`<img>` 加 max-height 限制）
- 点击查看大图（可以用简单的全屏 modal 或新 tab 打开）

图表数据直接在组件内硬编码：

```typescript
const diagrams = [
  { file: 'react-learning-roadmap.svg', title: 'M1-M6 学习路线总图' },
  { file: 'react-old-sync-vs-fiber.svg', title: '旧同步模型 vs Fiber 能力对比' },
  { file: 'react-fiber-node-traversal.svg', title: 'Fiber 节点与遍历骨架' },
  { file: 'react-current-wip-commit.svg', title: 'current / wIP / commit 关系' },
  { file: 'react-setstate-full-path.svg', title: 'setState 从组件到 commit 完整路径' },
  { file: 'react-lanes-assignment.svg', title: 'lanes 分配与状态流转' },
  { file: 'react-scheduler-render-loop.svg', title: 'Scheduler 与 render loop 协作' },
  { file: 'react-suspense-offscreen-ping-retry.svg', title: 'Suspense 挂起/恢复闭环' },
]
```

此页面不使用 `/learn` 或 `/reference` 布局路由，直接在 `__root` 下渲染，用自己的布局。

- [ ] **Step 3: 验证参考页和图表页**

```bash
cd app && npm run dev
```

Expected: `/reference/fiber-fields`, `/reference/lane-constants`, `/reference/source-map`, `/diagrams` 都能正常渲染。

- [ ] **Step 4: Commit**

```bash
git add app/src/routes/reference/ app/src/routes/diagrams.tsx
git commit -m "feat(app): add reference pages and diagrams index"
```

---

## Task 8: 首页 — Hero + ModuleTimeline + FeatureCards

**Files:**
- Create: `app/src/components/FiberHero.tsx`
- Create: `app/src/components/ModuleTimeline.tsx`
- Create: `app/src/components/FeatureCards.tsx`
- Modify: `app/src/routes/index.tsx`

- [ ] **Step 1: 创建 `FiberHero.tsx`**

从 VitePress 版本 `site/.vitepress/theme/components/FiberHero.vue` 转换为 React。

关键部分：
- Canvas 粒子动画（使用 `useRef` + `useEffect` 替代 Vue 的 `onMounted`）
- 60 个粒子，颜色分布：70% cyan (#61dafb), 30% purple (#a78bfa)
- 粒子间距 < 120px 时画连线
- Hero 内容：版本 badge、标题（渐变色）、副标题、两个 CTA 按钮
- CTA 使用 TanStack Router 的 `<Link>`

- [ ] **Step 2: 创建 `ModuleTimeline.tsx`**

从 VitePress 版本转换。使用 `modules` 数据。

关键部分：
- section header: "LEARNING PATH" label + "六个模块，一条因果链"
- 左侧竖线（彩虹渐变）+ 6 个节点卡片
- IntersectionObserver 触发入场动画（staggered delay）
- 卡片链接到 `/learn/{slug}`

- [ ] **Step 3: 创建 `FeatureCards.tsx`**

三列特性卡片（概念优先 / 证据导向 / 最小必要），参考现有 `site/index.md` 中的 `.home-features` 部分。

- [ ] **Step 4: 更新 `routes/index.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { FiberHero } from '@/components/FiberHero'
import { ModuleTimeline } from '@/components/ModuleTimeline'
import { FeatureCards } from '@/components/FeatureCards'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <FiberHero />
      <ModuleTimeline />
      <FeatureCards />

      {/* 核心引用 */}
      <section className="home-quote">
        <blockquote>
          <p>
            React Fiber 的本质，是把更新从"不可拆分的一整块渲染工作"，
            改造成"可分段推进、可中断、可恢复、可按优先级取舍，
            但最终仍要一致提交"的内部工作系统。
          </p>
        </blockquote>
      </section>

      {/* 底部 CTA */}
      <div className="home-cta">
        <Link to="/learn/overview" className="cta-link">
          从总览开始 →
        </Link>
      </div>
    </>
  )
}
```

- [ ] **Step 5: 添加首页专属样式**

在 `global.css` 中添加 `.home-quote` 和 `.home-cta` 样式，参考现有 `site/index.md` 中的 `<style>` 块。

- [ ] **Step 6: 验证首页完整效果**

```bash
cd app && npm run dev
```

Expected: 首页显示 Hero（粒子动画 + 标题 + CTA）→ 模块时间线 → 学习方法卡片 → 引用 → 底部 CTA。

- [ ] **Step 7: Commit**

```bash
git add app/src/components/ app/src/routes/index.tsx app/src/styles/
git commit -m "feat(app): implement homepage with FiberHero, ModuleTimeline, FeatureCards"
```

---

## Task 9: 交互增强 — 阅读进度条 + 页面过渡

**Files:**
- Create: `app/src/components/ReadingProgress.tsx`
- Create: `app/src/components/PageTransition.tsx`
- Modify: `app/src/routes/__root.tsx`
- Modify: `app/src/routes/learn.tsx`

- [ ] **Step 1: 创建 `ReadingProgress.tsx`**

阅读进度条组件：
- 固定在页面最顶部，4px 高度
- 监听 `scroll` 事件，计算滚动百分比
- 渐变色：从 React 蓝到当前模块色（通过 prop 传入）
- 使用 `useEffect` + `addEventListener('scroll', ...)` + `requestAnimationFrame` 优化性能

```tsx
interface ReadingProgressProps {
  color?: string
}
```

- [ ] **Step 2: 创建 `PageTransition.tsx`**

Motion 页面过渡包裹器：

```tsx
import { motion } from 'motion/react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: 集成到布局路由**

在 `__root.tsx` 中添加 `ReadingProgress`。
在 `learn.tsx` 的 `<Outlet>` 外层包裹 `<PageTransition>`。
在 `reference.tsx` 中同样包裹。

- [ ] **Step 4: 验证交互效果**

```bash
cd app && npm run dev
```

Expected:
- 滚动时顶部显示阅读进度条
- 路由切换时内容区有淡入 + 微滑动过渡

- [ ] **Step 5: Commit**

```bash
git add app/src/components/ app/src/routes/
git commit -m "feat(app): add reading progress bar and page transitions"
```

---

## Task 10: 构建与部署配置

**Files:**
- Create: `app/wrangler.jsonc`
- Modify: `app/package.json` (add deploy scripts)

- [ ] **Step 1: 创建 `app/wrangler.jsonc`**

```jsonc
{
  // React Fiber Learning — Cloudflare Workers Static Assets
  // Domain: aixie.de
  "name": "react-fiber-learning",
  "compatibility_date": "2026-03-20",
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "single-page-application"
  }
}
```

注意：
- `not_found_handling` 改为 `single-page-application`，因为 React SPA 需要把未匹配路径回退到 `index.html`。
- 移除了 `routes` 和 `workers_dev` 字段 — Cloudflare Static Assets 模式下不需要 Worker 脚本，路由由自定义域名 DNS 配置处理。如果需要自定义域名路由，部署后在 Cloudflare Dashboard 中配置。

- [ ] **Step 2: 添加部署脚本到 `package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && wrangler deploy",
    "deploy:preview": "npm run build && wrangler deploy --dry-run"
  }
}
```

- [ ] **Step 3: 验证构建成功**

```bash
cd app && npm run build
```

Expected: 构建成功，`dist/` 目录生成，无 TypeScript 错误。

- [ ] **Step 4: 验证预览**

```bash
cd app && npm run preview
```

Expected: 预览服务器启动，所有页面可正常访问。

- [ ] **Step 5: Commit**

```bash
git add app/wrangler.jsonc app/package.json
git commit -m "feat(app): add Cloudflare Pages deployment configuration"
```

---

## Task 11: MDX 兼容性修复与链接更新

**Files:**
- Modify: `app/src/content/**/*.mdx` (按需修复)

- [ ] **Step 1: 修复 MDX 兼容性问题**

常见问题：
- `<br class="...">` → `<br className="..." />`（自闭合 + className）
- `<strong>` 内含 `<code>` 可能需要调整
- 裸 HTML `<style>` 块需要移除（样式已在全局 CSS 中）
- `<img>` 标签需要自闭合 `<img />`

扫描所有 `.mdx` 文件：

```bash
cd app
grep -rn '<br ' src/content/ || true
grep -rn '<img ' src/content/ || true
grep -rn '<style>' src/content/ || true
```

逐一修复发现的问题。

- [ ] **Step 2: 更新内部链接**

将 VitePress 路径更新为新路由路径。搜索并替换：

| 旧路径 | 新路径 |
|--------|--------|
| `/modules/m1` | `/learn/01-why-fiber` |
| `/modules/m2` | `/learn/02-fiber-node` |
| `/modules/m3` | `/learn/03-dual-tree` |
| `/modules/m4` | `/learn/04-setstate-trace` |
| `/modules/m5` | `/learn/05-lanes-scheduler` |
| `/modules/m6` | `/learn/06-suspense-retry` |
| `/guide/` | `/learn/overview` |
| `/guide/reading-order` | `/learn/reading-order` |
| `/evidence/m1` ~ `/evidence/m6` | 移除（已嵌入模块页） |
| `docs/modules/m*-draft.md` | 移除或更新为相对引用 |
| `docs/diagrams/*.svg` | `/diagrams/*.svg` |

```bash
cd app
grep -rn '/modules/m[1-6]' src/content/ | head -20
grep -rn '/guide/' src/content/ | head -20
grep -rn '/evidence/' src/content/ | head -20
```

逐一替换。

- [ ] **Step 3: 验证所有页面无错误**

```bash
cd app && npm run dev
```

逐一访问所有路由，确认无 404、无渲染错误、内部链接跳转正确。

- [ ] **Step 4: Commit**

```bash
git add app/src/content/
git commit -m "fix(app): fix MDX compatibility issues and update internal links"
```

---

## Task 12: 最终验证与清理

**Files:**
- Modify: `app/.gitignore` (if needed)
- Modify: root `.gitignore` (add `.superpowers/`)

- [ ] **Step 1: 完整构建验证**

```bash
cd app && npm run build && npm run preview
```

逐一检查：
- [ ] 首页：Hero 动画 + 模块列表 + 特性卡片 + 引用 + CTA
- [ ] 所有 6 个模块页：正文 + 证据面板 + 上/下篇导航
- [ ] 总览页和阅读顺序页
- [ ] 3 个参考资料页
- [ ] 图表索引页
- [ ] 阅读进度条工作
- [ ] 页面过渡动画工作
- [ ] 导航栏和侧栏正确高亮
- [ ] 移动端响应式布局

- [ ] **Step 2: 添加 `.gitignore`**

确保 `app/.gitignore` 包含：

```
node_modules/
dist/
*.local
.wrangler/
```

确保根目录 `.gitignore` 包含 `.superpowers/`。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(app): complete Vite + React + TanStack Router site rebuild"
```
