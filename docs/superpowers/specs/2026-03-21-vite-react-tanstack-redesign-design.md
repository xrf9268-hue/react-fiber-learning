# React Fiber Learning 站点重构设计文档

**日期：** 2026-03-21
**状态：** 待实施
**范围：** 将现有 VitePress 站点重构为 Vite + React + TanStack Router

---

## 1. 背景与动机

现有站点基于 VitePress 构建，部署在 Cloudflare Pages (aixie.de)。重构动机：

- **学以致用**：内容讲 React Fiber，用 React 构建站点本身更有教学一致性
- **功能扩展**：VitePress 静态文档模式限制了未来交互式可视化的可能性
- **技术偏好**：采用 React + TanStack Router 等现代工具链

## 2. 技术栈

| 类别 | 选型 | 理由 |
|------|------|------|
| 构建工具 | Vite | 现有基础，快速 HMR |
| UI 框架 | React 18 | 与学习内容版本一致 |
| 路由 | TanStack Router | 类型安全，文件路由 |
| 内容渲染 | MDX (`@mdx-js/rollup`) | 支持在 Markdown 中嵌入 React 组件，未来扩展性好 |
| 动画 | Motion (`motion/react`) | 页面过渡和微交互 |
| 部署 | Cloudflare Pages (Wrangler) | 保持现有部署流程 |

## 3. 路由结构

从 VitePress 的扁平结构重组为语义化路径：

```
/                           → 首页（Hero + 模块时间线 + 学习方法）
/learn/overview             → 总览（原 final-guide-draft）
/learn/reading-order        → 阅读顺序建议
/learn/01-why-fiber         → M1
/learn/02-fiber-node        → M2
/learn/03-dual-tree         → M3
/learn/04-setstate-trace    → M4
/learn/05-lanes-scheduler   → M5
/learn/06-suspense-retry    → M6
/reference/fiber-fields     → Fiber 字段参考
/reference/lane-constants   → Lane 常量参考
/reference/source-map       → 源码地图
/diagrams                   → 图表索引
```

Evidence notes 不再作为独立页面，嵌入对应模块页面中作为可展开的"证据回查"区域。

## 4. 项目目录结构

```
app/
├── src/
│   ├── routes/              # TanStack Router 文件路由
│   │   ├── __root.tsx       # 根布局（导航栏 + 全局样式）
│   │   ├── index.tsx        # 首页
│   │   ├── learn.tsx        # 学习路径布局路由（侧栏 + 面包屑）
│   │   ├── learn/
│   │   │   ├── overview.tsx
│   │   │   ├── reading-order.tsx
│   │   │   ├── 01-why-fiber.tsx
│   │   │   ├── 02-fiber-node.tsx
│   │   │   ├── 03-dual-tree.tsx
│   │   │   ├── 04-setstate-trace.tsx
│   │   │   ├── 05-lanes-scheduler.tsx
│   │   │   └── 06-suspense-retry.tsx
│   │   ├── reference.tsx    # 参考资料布局路由（侧栏 + 面包屑）
│   │   ├── reference/
│   │   │   ├── fiber-fields.tsx
│   │   │   ├── lane-constants.tsx
│   │   │   └── source-map.tsx
│   │   └── diagrams.tsx
│   ├── components/          # 共享组件
│   │   ├── Layout.tsx       # 根布局（导航栏 + 侧栏 + 内容区）
│   │   ├── Navbar.tsx       # 顶部导航栏
│   │   ├── Sidebar.tsx      # 左侧导航栏
│   │   ├── FiberHero.tsx    # 首页 Hero（粒子 canvas 动画）
│   │   ├── ModuleTimeline.tsx # 首页模块时间线
│   │   ├── ModuleNav.tsx    # 上/下篇导航
│   │   ├── EvidencePanel.tsx # 可折叠证据回查面板
│   │   ├── ReadingProgress.tsx # 页面顶部阅读进度条
│   │   └── MdxComponents.tsx # MDX 自定义组件映射
│   ├── content/             # MDX 内容文件
│   │   ├── modules/
│   │   │   ├── m1-why-fiber-exists.mdx
│   │   │   ├── m2-fiber-node-and-traversal.mdx
│   │   │   ├── m3-current-wip-render-commit.mdx
│   │   │   ├── m4-one-setstate-trace.mdx
│   │   │   ├── m5-lanes-priority-scheduler-transition.mdx
│   │   │   └── m6-suspense-offscreen-react19.mdx
│   │   ├── evidence/
│   │   │   ├── m1-evidence.mdx
│   │   │   ├── m2-evidence.mdx
│   │   │   ├── m3-evidence.mdx
│   │   │   ├── m4-evidence.mdx
│   │   │   ├── m5-evidence.mdx
│   │   │   └── m6-evidence.mdx
│   │   ├── reference/
│   │   │   ├── fiber-fields.mdx
│   │   │   ├── lane-constants.mdx
│   │   │   └── source-map.mdx
│   │   └── guide/
│   │       ├── final-guide.mdx
│   │       └── reading-order.mdx
│   ├── styles/
│   │   ├── tokens.css       # CSS 设计 token（变量）
│   │   └── global.css       # 全局样式
│   └── main.tsx             # 应用入口
├── public/
│   └── diagrams/            # SVG 图表（直接复制）
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 5. 视觉设计系统

### 5.1 美学方向

**电路蓝图氛围 + 杂志编辑排版纪律**

- 暗色基调呈现 Fiber 节点/连线的电路蓝图感
- 排版遵循编辑杂志的纪律：清晰的字号层级、充足的行距和留白

### 5.2 调色板（护眼调整版）

```css
:root {
  /* 背景层次 */
  --bg-deep:     #0c1220;
  --bg:          #121a2d;
  --bg-card:     #182038;
  --border:      #1e2d3d;
  --border-glow: #1a3a5c;

  /* 主色 */
  --accent:      #61dafb;    /* React 蓝 */
  --purple:      #a78bfa;
  --green:       #4ade80;
  --orange:      #fb923c;
  --gold:        #e8d44d;
  --red:         #f87171;

  /* 文字（护眼提亮） */
  --text-primary: #edf1f7;   /* 标题 */
  --text-body:    #c4ceda;   /* 正文，对比度 ~9:1 */
  --text-muted:   #7a8ba0;   /* 次要文字 */
}
```

### 5.3 字体系统

| 用途 | 字体 | 备注 |
|------|------|------|
| 标题 | Noto Serif SC | 衬线，有重量感，适合章节标题 |
| 正文 | Noto Sans SC | 无衬线，清晰可读 |
| 代码/标签 | JetBrains Mono | 等宽，辨识度高 |

### 5.4 排版参数（护眼优化）

| 参数 | 值 | 说明 |
|------|-----|------|
| 正文字号 | 15px | 中文阅读舒适 |
| 正文行高 | 2.1 | 长段落呼吸空间 |
| 内容区最大宽度 | 680px | 控制视线扫描距离 |
| 段间距 | 20px | 段落清晰分隔 |

### 5.5 背景处理

- 全局背景：极淡网格线（`rgba(97,218,251,0.03)`）+ 渐变光晕
- 首页 Hero：canvas 粒子动画（Fiber 节点连线效果）
- 内容页：纯净背景，不加干扰元素

### 5.6 模块专属色

每个模块有独立颜色标识，贯穿侧栏、卡片、标签、引用块：

| 模块 | 颜色 | 色值 |
|------|------|------|
| M1 | 蓝 | `#61dafb` |
| M2 | 绿 | `#4ade80` |
| M3 | 紫 | `#a78bfa` |
| M4 | 橙 | `#fb923c` |
| M5 | 金 | `#e8d44d` |
| M6 | 红 | `#f87171` |

## 6. 页面设计

### 6.1 首页

1. **导航栏**：logo（发光节点 + 站名）+ 学习路径/参考资料/图表/GitHub 链接，背景模糊
2. **Hero 区域**：canvas 粒子动画背景 + 版本标签 + 标题 + 副标题 + CTA 按钮
3. **模块时间线**：六个模块的卡片列表，带编号、颜色标识、标题、描述
4. **学习方法**：三列特性卡片（概念优先/证据导向/最小必要）
5. **核心引用**：React Fiber 本质的一句话总结
6. **底部 CTA**：引导进入总览

### 6.2 模块阅读页

1. **左侧边栏**（220px）：学习路径导航 + 参考资料导航，当前页高亮，模块带颜色圆点
2. **面包屑**：`学习路径 / 02 Fiber 节点与树遍历`
3. **模块头部**：模块标签（M2 + 关键词）+ 标题
4. **正文区域**：MDX 渲染，最大宽度 680px
5. **证据面板**：可折叠，嵌入对应模块的 evidence notes
6. **底部导航**：上一篇 / 下一篇

### 6.3 参考资料页

与模块阅读页共享布局，无证据面板和底部模块导航。

### 6.4 图表索引页

图表列表 + SVG 预览缩略图，点击查看大图。

## 7. 交互功能

### 7.1 阅读进度条

- 页面顶部 4px 细条，随滚动位置更新
- 渐变色从 React 蓝到当前模块色

### 7.2 页面过渡

- Motion 驱动，淡入 + 微滑动（translateY 10px）
- 持续时间 300ms，ease-out 曲线

### 7.3 模块间导航

- 底部上一篇/下一篇链接
- 模块颜色标识贯穿

### 7.4 证据面板

- 默认收起，点击展开
- 展开时显示对应模块的 evidence notes 内容
- 带源码文件名标注

## 8. 内容迁移策略

### 8.1 Markdown → MDX

1. 将 `docs/modules/*-draft.md` 复制到 `app/src/content/modules/` 并改名为 `.mdx`
2. 将 `docs/modules/*-evidence-notes.md` 复制到 `app/src/content/evidence/`，重命名为 `m1-evidence.mdx` ~ `m6-evidence.mdx`
3. 将 `docs/reference/fiber-fields.md` 和 `docs/reference/lane-constants.md` 复制到 `app/src/content/reference/`
4. 将 `docs/source-map.md`（位于 docs 根目录）复制到 `app/src/content/reference/source-map.mdx`
5. 将 `docs/final-guide-draft.md` 复制到 `app/src/content/guide/final-guide.mdx`
6. `reading-order.mdx` 为新建内容，从 `final-guide-draft.md` 中提取"推荐复习顺序"章节，独立成页
7. 大部分 `.md` 内容可直接作为 `.mdx` 使用，仅需处理少量 HTML 片段兼容性

### 8.2 SVG 图表

- 将 `docs/diagrams/*.svg` 复制到 `app/public/diagrams/`
- MDX 中通过 `<img>` 或自定义组件引用

### 8.3 同步脚本

不再需要 VitePress 的 `sync-content.sh`。内容直接在 `app/src/content/` 目录维护。

## 9. 构建与部署

- `vite build` 输出静态文件到 `app/dist/`
- 将 `wrangler.jsonc` 移动到 `app/` 目录下，`assets.directory` 指向 `dist`
- Wrangler 在 `app/` 目录中运行部署
- 过渡期间保留 `site/` 目录用于回滚，新站点验证通过后可删除

## 10. 不在本次范围

- 交互式 Fiber 树可视化（未来迭代）
- 代码演练/playground（未来迭代）
- 亮色主题切换（未来迭代）
- 搜索功能（未来迭代）
- 国际化（未来迭代）
