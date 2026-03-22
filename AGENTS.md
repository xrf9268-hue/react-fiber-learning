# AGENTS.md — React Fiber 学习项目

本文件定义了本长期 React Fiber 学习仓库的项目级执行规则。

## 项目目标

基于 React 18/19 官方源码，构建一套高质量的中文 Fiber 学习资料。采用"概念优先 + 最小但精确的源码验证"路线。

## 权威状态来源

始终以以下对象作为项目连续性的主要依据：

1. `STATUS.md`
2. `docs/modules/*.md`
3. `app/` — 站点源码与部署配置
4. 本仓库的 Git 历史

不要仅凭对话记忆判断项目状态。

## 学习基线

- 主基线：**React v18.2.0**
- 对比目标：**React main**
- 先学稳定骨架，再比较新版扩展。

## 本地上游源码镜像

查阅 React 内部实现时，优先使用本地镜像，避免临时远程浏览：

- `../tmp/react-upstream/react-v18.2.0`
- `../tmp/react-upstream/react-main`

如果镜像落后或缺失，先刷新再做深入源码工作。

## 模块执行规则

- 逐模块推进。
- 每个工作包保持有界。
- 每个模块视情况应产出：
  - 计划（plan）
  - 证据笔记（evidence notes）
  - 正文草稿（draft）
  - 自审笔记（self-review）
  - 比对笔记或图表笔记
  - 提交就绪检查（commit-readiness）

## 持续推进规则

这些规则的存在是因为本项目是长期项目，不能静默停滞。

1. **不要把进度汇报当成实际推进。** 一段简短报告本身不算进展。
2. **当一个有界子任务完成、而项目仍未结束时，立即开始下一个具体工作包或审查/提交就绪包。** 在任何简短汇报之前或之后马上执行。
3. **仅在以下至少一项为真时，才视为项目真正在推进：**
   - 有专门的 worker 正在运行，或
   - 近期有实质性项目文件更新，或
   - 作为实际工作的一部分创建了新的状态更新。
4. **如果没有活跃 worker 且剩余任务是多步骤的，用专门的 subagent 恢复，而不是试图在主会话中全部完成。**
5. **如果某模块已达到可提交的里程碑，就提交，不要无限打磨。**

## 进度定义

用明确证据衡量，而非意愿。

有效进度信号：
- `docs/modules/` 中有新增或更新的文件
- `STATUS.md` 有更新
- 创建了本地里程碑提交

无效信号：
- 只说"我会继续"
- 只讨论下一步但没有开始
- 子任务已完成但没有启动下一个工作包

## 提交边界规则

- 优先做干净的本地里程碑提交。
- 每次提交应对应一个完整的模块里程碑。
- 不要把半成品的未来模块混入当前里程碑，除非是明确有意为之。

## 教学风格规则

- 中文书面语、通俗易懂
- 概念优先、证据导向
- 不要过早用大量源码细节淹没读者
- 保持模块边界清晰：
  - M1 = 为什么需要 Fiber
  - M2 = Fiber 节点与遍历
  - M3 = current / workInProgress / render / commit
  - M4 = 一次 `setState` 全链路
  - M5+ = 优先级 / lanes / scheduler / 高级主题

## 质量标准

在判定某模块"就绪"之前，检查：
- 范围是否仍然有界？
- 是否引用了官方源码或官方源文件？
- 不读整个 React 仓库也能看懂吗？
- 是否显式处理了常见误解？
- 是否有自审笔记？
- 下一步行动是否明确：打磨、提交、还是进入下一模块？

## 图表编写规则

本项目有两类图表，工作流不同：

- **D2 编译型**（4 张）：源文件在 `docs/diagrams/src/*.d2`，共享 `theme.d2`，通过 `docs/diagrams/build.sh` 或手动 `cat theme.d2 <name>.d2 | d2 --layout=elk - <name>.svg` 编译。
- **手工 SVG**（4 张）：直接编辑 `docs/diagrams/*.svg`。

参考文档：`docs/diagrams/BUILD.md`、`docs/diagrams/diagram-specs.md`。

### D2 + ELK 引擎注意事项

- **编译验证**：每次修改 `.d2` 后必须编译并检查 `viewBox` 尺寸比例，确认布局合理后再提交。
- **theme.d2 是共享主题**：修改 `theme.d2` 后必须运行 `bash docs/diagrams/build.sh` 重编译**全部** D2 图，不能只编译当前正在改的那一张，否则会导致图表间样式不一致。
- **手动坐标调整会被覆盖**：如果某些 SVG 在编译后做过手动间距压缩（Python 脚本修改坐标），重编译会覆盖这些调整，需要在编译后重新应用。
- **外边距控制**：使用 `--pad N`（默认 100）控制编译后 SVG 四周的像素边距。推荐 `--pad 20`。
- **节点间距不可直接配置**：D2 不暴露 ELK 的 `spacing.nodeNode` 等属性。如需压缩节点间距，需在编译后手动调整 SVG 坐标（Python 脚本批量替换）。
- **ELK direction 限制**：`direction: down/right` 仅对有边连接的节点生效。断开的顶层节点需用隐形边（`stroke-width: 0`）强制布局方向。
- **Grid 与边互斥**：`grid-columns`/`grid-rows` 容器内不能定义边，否则 grid 布局失效回退为普通布局。边必须放到容器外部，或改用文本标注顺序。
- **中文文本不自动换行**：D2 不对中文做 word-wrap，必须手动用 `\n` 控制每行宽度。Markdown 块（`|md ... |`）会忽略 `width` 约束，纯文本标签配合 `width` 更可控。
- **嵌套容器风险**：ELK 下嵌套容器设为不可见（fill/stroke 同背景色）时，子节点可能不渲染。优先用 grid 或 flat 结构代替深层嵌套。

### 手工 SVG 检查清单

历史上手工 SVG 反复出现以下问题（同一张图连续 2-3 次修复），提交前务必逐项检查：

- **z-order**：箭头/连线必须在所有矩形/面板之后绘制，否则会被遮挡裁剪。
- **文本与图形重叠**：检查 text 元素的 y 坐标是否与相邻 rect/path 冲突，尤其是多行文本。
- **容器溢出**：note box、legend box 等子元素不得超出父 panel 边界。
- **图例/注释框位置**：不要将 legend box 放在泳道内部，容易与泳道标题重叠；应放在泳道边界之外的空白区域。
- **跨泳道箭头中间路径**：箭头连接非相邻步骤时，垂直/水平段可能穿过中间其他步骤的圆圈或文本；需逐段检查路径经过的坐标区域是否与已有元素碰撞。
- **箭头曲线**：return/回退箭头使用虚线区分，曲线控制点需保持在容器范围内。
- **viewBox 比例**：修改后检查整体 viewBox，避免出现极端宽高比（如 12:1）。

### 部署同步

- **不要直接编辑 `app/public/diagrams/`**：该目录是 `docs/diagrams/` 的自动复制品，每次 `npm run build` 会被 `sync:diagrams` 覆盖。
- **编辑完 `docs/diagrams/` 后无需手动复制**：构建流程会自动同步。但如需本地 dev server 即时预览，可单独运行 `cd app && npm run sync:diagrams`。

### 通用原则

- **先打开预览确认再提交**：不要仅凭 viewBox 数值判断，实际渲染可能有意外问题。
- **SVG 预览方法**：CLI 环境无法直接渲染 SVG，可用 headless Chromium 转 PNG 后通过 Read 工具查看：
  ```bash
  chromium --headless=new --disable-gpu --screenshot="$HOME/preview.png" --window-size=800,1000 "file:///absolute/path/to/file.svg"
  ```
  然后用 Read 工具读取 PNG 进行视觉检查。检查完毕后删除临时 PNG。
- **图表修改易连锁**：一次布局调整可能引发多处溢出/重叠，修完后全图扫一遍。

## 源码准确性规则（2026-03-20 审查教训）

本项目曾因以下问题导致多处严重/中等错误，后续涉及源码引用时务必遵守：

### 1. React 18.2.0 的 fork 机制

reconciler 核心文件采用 `.old.js` / `.new.js` 双版本 fork 机制。**不存在**无后缀的 `.js` 版本。
- 正确：`ReactFiberWorkLoop.old.js`
- 错误：`ReactFiberWorkLoop.js`
- 本项目统一引用 `.old.js` 版本

以下文件**没有** fork 后缀（直接使用 `.js`）：`ReactInternalTypes.js`、`ReactWorkTags.js`、`ReactFiberFlags.js`、`ReactRootTags.js`、`ReactFiberOffscreenComponent.js`

### 2. 版本差异：18.2.0 vs React 19

以下文件/结构**仅存在于 React 19 开发期间**，18.2.0 中不存在：
- `ReactFiberRootScheduler.js`（18.2.0 中 `ensureRootIsScheduled` 在 `ReactFiberWorkLoop` 内）
- `ReactFiberCommitEffects.js` / `ReactFiberCommitHostEffects.js`（18.2.0 中全在 `ReactFiberCommitWork` 内）
- `ReactFiberThenable.js`（18.2.0 中逻辑在 `ReactFiberThrow` 内）

引用源码路径时，必须先确认该文件在 18.2.0 中存在。

### 3. Fiber 字段写入时机的常见误判

| 字段 | 常见错误 | 正确时机 |
|------|---------|---------|
| `memoizedProps` | "completeWork 写入" | `performUnitOfWork` 中 `beginWork` 返回后立即写入 |
| `memoizedState` | "commit 后写入" | render 阶段 `beginWork` 内部写入（`processUpdateQueue` / hooks） |

### 4. 调用链描述原则

描述函数调用链时，必须区分"外部顺序调用"和"内部嵌套调用"。例如：
- `enqueueUpdate` 内部调用 `markUpdateLaneFromFiberToRoot`，不应将两者描述为独立的顺序步骤
- 描述步骤数量时必须与实际列出的步骤数一致（如"八步"就列八步）

### 5. 不要虚构 API 名称

描述触发场景时，不得使用不存在的 API 名称（如 `useIdleCallback`）。如果不确定，先查证源码。

## 站点与部署

- 技术栈：Vite 8 + React 19 + TanStack Router + MDX
- 域名：`fiber.aixie.de`（Cloudflare Workers 自定义域名）
- 源码目录：`app/`
- 内容源：`app/src/content/`（modules / evidence / reference / guide）
- 构建：`cd app && npm run build`（sync:diagrams → tsc → vite，输出 `app/dist/`）
- 部署：`cd app && npm run deploy`（wrangler deploy）
- 配置文件：`app/wrangler.jsonc`、`app/vite.config.ts`、`app/package.json`

### 内容与图表的源与派生关系

本项目有两类内容资产，**同步策略不同**：

| 资产 | 创作源 | 站点使用 | 同步方式 |
|------|--------|----------|----------|
| SVG 图表 | `docs/diagrams/*.svg` | `app/public/diagrams/`（纯复制品） | `npm run build` 自动执行 `sync:diagrams`（`cp`） |
| 文本教程 | `docs/modules/*-draft.md` | `app/src/content/*.mdx`（链接适配后的派生版本） | 目前手动同步（需改 docs/ 后再更新 MDX 中的链接） |

关键规则：
- **图表只改 `docs/diagrams/`**（D2 源或手工 SVG），不要直接改 `app/public/diagrams/`，否则下次构建会被覆盖。
- **`docs/modules/*-draft.md` 是教程内容的原始创作源**。`app/src/content/*.mdx` 是站点重建时从 `docs/` 派生的版本，做了链接适配（如文件路径 → 路由路径 `/learn/01-why-fiber`）。
- 如果教程内容需要修改，**先改 `docs/modules/*-draft.md`，再将变更同步到对应的 MDX 文件**（注意保留 MDX 中已适配的路由链接）。
- 未来可考虑将文本教程也纳入自动同步（构建时从 `docs/` 转换），但目前因链接适配差异，仍需手动处理。

## 默认下一步逻辑

不确定下一步做什么时，按以下优先级：
1. 完成当前模块的工作包
2. 产出提交就绪检查
3. 如果就绪，创建本地里程碑提交
4. 规划下一个模块
5. 执行下一个模块
