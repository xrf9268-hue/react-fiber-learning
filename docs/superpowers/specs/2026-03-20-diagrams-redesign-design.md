# React Fiber 图表重设计方案

> 日期：2026-03-20
> 范围：docs/diagrams/ 下全部 7 张 SVG 图的审查与重建
> 目标：修正正确性错误、解决文本溢出、统一设计系统、提升对外发布品质

---

## 1. 审查结论

### 1.1 正确性

概念层面整体准确（A+），但有一个结构性错误：

- **react-fiber-node-traversal.svg**：A 节点同时画了 3 条 child 箭头指向 B/C/D。Fiber 的 child 指针只指向第一个子节点（A.child → B），其余兄弟通过 sibling 串联（B.sibling → C → D）。同理 B 节点也错误地画了 2 条 child 指向 E 和 F。

### 1.2 系统性布局问题

- **文本溢出**：7 张图全部存在。根源是卡片宽度设计时未充分考虑中文 + mono 混排的实际渲染宽度。
- **字体 fallback 不可控**：依赖 Inter/Noto Sans SC/JetBrains Mono，未安装时宽度偏移。
- **信息密度过高**：多张图把大段文字塞进图表，应属于正文的内容没有回归正文。
- **圆角/阴影不统一**：rx 值从 8 到 26 共 7 种，视觉噪音。
- **图例过小或位置冲突**：多张图的图例与内容区重叠。

### 1.3 规格偏差与步骤数变更说明

原 `react-setstate-full-path-spec.md` 和 M4 正文定义了 8 步链路。本次重设计将其拆分为 **10 步**，以更精确匹配源码链路：原步骤 2 拆为 enqueueSetState 和 createUpdate+enqueueUpdate 两步，原步骤 3 拆为"沿 return 冒泡"和"到达 HostRoot"两步，原步骤 7-8 拆为 root.finishedWork 赋值和 commitRoot 两步。

原 `diagram-specs.md` 第 6 节 Suspense 图定义了 9 个节点。本次重设计将其扩展为 **10 步**，把原步骤 8 "root 记录 pingedLanes 并重新调度" 拆为 pingSuspendedRoot（步骤 8）和 ensureRootIsScheduled（步骤 9）两步，更准确地反映源码中 ping 和 reschedule 是两个独立操作。

交付时需同步更新：
- `diagram-specs.md`：M4 改为 10 步，M6 改为 10 步
- `m4-one-setstate-trace-draft.md`：正文中"共八步"改为"共十步"，并补充拆分后的步骤描述
- `m4-one-setstate-trace-plan.md`：如有步骤数引用，同步更新

---

## 2. 技术方案：D2 + 手工 SVG 混合

按图表特点分配技术：

| 图表 | 技术 | 原因 |
|------|------|------|
| react-learning-roadmap（总览） | D2 | 纯线性流程，D2 从左到右布局完美匹配 |
| react-old-sync-vs-fiber（M1） | D2 | 压缩为左右对比结构，D2 grid layout 适合 |
| react-fiber-node-traversal（M2） | 手工 SVG | 需精确控制 child/sibling/return 三种箭头方向和颜色 |
| react-current-wip-commit（M3） | 手工 SVG | 四阶段 + 树形图 + alternate 虚线，布局复杂度高 |
| react-setstate-full-path（M4） | 手工 SVG | 时序图，泳道 + 步骤编号 + 多色箭头 |
| react-lanes-assignment（M5 上，新增） | D2 | 更新源 → lane → root ledger 是标准流程图 |
| react-scheduler-render-loop（M5 下，新增） | D2 | ensureRootIsScheduled → scheduler → render 也是流程图 |
| react-suspense-offscreen-ping-retry（M6） | 手工 SVG | 闭环回流箭头 + 10 步阶梯结构 |

结果：D2 x 4 张 + 手工 SVG x 4 张。原 M5 单张图拆为 2 张。

---

## 3. SVG 设计系统

### 3.1 画布

| 属性 | 值 |
|------|-----|
| 基础宽度 | 1600px |
| 高度 | 按内容定，最小 900，最大 1500 |
| 背景 | #f8fafc（slate-50） |
| 内边距 | 上 40 / 左右 48 / 下 48 |

### 3.2 栅格与最小尺寸

| 元素 | 最小宽度 | 最小高度 | 内边距 |
|------|---------|---------|--------|
| 纯中文描述卡片 | 280px | 96px | 上下 20 / 左右 24 |
| 含 mono 代码卡片 | 340px | 96px | 上下 20 / 左右 24 |
| 泳道列（M4） | 300-340px | — | 左右 16 |
| 步骤节点（M6） | 280px | 110px | 上下 16 / 左右 20 |
| 图例框 | 240px | 自适应 | 上下 12 / 左右 16 |
| 底部总结栏 | 全宽 - 96px | 自适应 | 上下 20 / 左右 28 |

### 3.3 字体体系

| 用途 | CSS font | 尺寸 | 行高 |
|------|----------|------|------|
| 图标题 | 700 Inter/Noto Sans SC | 26px | 34px |
| 副标题 | 400 Inter/Noto Sans SC | 13px | 20px |
| 区域标题 | 700 Inter/Noto Sans SC | 16px | 24px |
| 正文标签 | 700 Inter/Noto Sans SC | 13px | 20px |
| 正文描述 | 400 Inter/Noto Sans SC | 13px | 20px |
| 辅助说明 | 400 Inter/Noto Sans SC | 11px | 16px |
| 代码 | 600 JetBrains Mono | 12px | 18px |

所有中文文本行宽上限 = 卡片宽度 - 48px（内边距），超出时必须手动 `<tspan>` 换行。不使用 `textLength` 属性。

### 3.3.1 字体 fallback 策略

采用**系统 fallback + 预留宽度余量**策略，不嵌入字体子集：

- SVG 中 font-family 声明保持 `'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif`，代码用 `'JetBrains Mono','Fira Code','SFMono-Regular',monospace`
- 当首选字体不可用时，浏览器使用系统 sans-serif/monospace 渲染
- 为应对 fallback 字体的宽度差异，所有文本行实际宽度预留 **10% 余量**：即 280px 卡片的文本区只使用 ~210px（而非 232px）
- 发布文档中注明推荐安装 Noto Sans SC + JetBrains Mono 以获得最佳显示效果
- 不嵌入 woff2 的原因：SVG 内嵌字体会显著增大文件体积（每个字体子集 50-200KB），对 Git 仓库不友好

### 3.4 配色方案

| 语义 | 色值 | 用途 | 选色原则 |
|------|------|------|---------|
| 结构/child/current | #2563eb（blue-600） | child 指针、current 树、常态结构关系 | 蓝色 = 已确立的结构 |
| WIP/工作推进 | #ea580c（orange-600） | WIP 树上的 beginWork/completeWork 推进、fallback 路径、ping 回调 | 橙色 = 正在进行中的工作 |
| 调度决策/transition | #7c3aed（violet-600） | ensureRootIsScheduled、transition 标记、suspendedLanes 记账 | 紫色 = 调度层面的决策与状态 |
| 提交/恢复 | #16a34a（green-600） | commit 生效、Offscreen 恢复、retry 成功 | 绿色 = 结果确认与恢复 |
| 紧急/错误/阻断 | #dc2626（red-600） | 旧模型限制、suspend throw、Sync/Input lanes | 红色 = 阻断或最高紧急度 |
| 中性/sibling | #475569（slate-600） | sibling 指针、中性箭头、辅助线 | 灰色 = 辅助关系 |
| 过期/警告 | #ca8a04（yellow-600） | expiredLanes | 黄色 = 需要注意的退化状态 |
| 卡片边框 | #cbd5e1（slate-300） | 通用中性边框 | — |
| 卡片背景 | #ffffff | 默认白色 | — |

**选色速查**：当犹豫用哪个颜色时，问"这个元素代表的是结构（蓝）、进行中的工作（橙）、调度决策（紫）、还是已确认的结果（绿）？"

### 3.5 圆角标准（3 档）

| 层级 | rx | 用途 |
|------|-----|------|
| 大面板 | 20px | 泳道、大区域容器 |
| 内容卡片 | 14px | 步骤节点、描述框 |
| 小标签 | 8px | pill 标签、图例框 |

### 3.6 阴影

统一为 `drop-shadow(0 4px 12px rgba(15,23,42,0.06))`，仅用于大面板，卡片不加阴影。

### 3.7 箭头规范

| 类型 | stroke-width | 样式 |
|------|-------------|------|
| 主流程箭头 | 2.4px | 实线 + 三角箭头 |
| 指针箭头（child/sibling/return） | 2.0px | 实线 + 三角箭头 |
| 配对关系（alternate） | 2.0px | 虚线 7,6 + 双向箭头 |
| 回流箭头（retry 等） | 2.4px | 实线 + 三角箭头，走外侧绕行 |

### 3.8 图例规范

- 统一放在右下角，不与内容区重叠
- 最小尺寸 240px 宽
- 每行：圆点（r=5）+ 12px 间距 + 说明文字
- 行距 18px

---

## 4. D2 主题配置

布局引擎：ELK（对从左到右分层布局控制更好）。

共享 theme.d2 定义 classes：card、emphasis-blue、emphasis-red、emphasis-green、emphasis-purple、emphasis-orange、emphasis-yellow，配色与 SVG 设计系统完全对齐。

### 4.1 theme.d2 引入机制

D2 不支持自动加载同目录文件。采用构建脚本预处理 concat 方式：每个 `.d2` 源文件不需要自行 import，构建脚本在编译前自动将 `theme.d2` 拼接到源文件头部。

### 4.2 构建命令

```bash
#!/usr/bin/env bash
set -euo pipefail

# 检查 D2 是否安装（要求 >= 0.6.0）
if ! command -v d2 &>/dev/null; then
  echo "Error: d2 not found. Install: https://d2lang.com/install" >&2
  exit 1
fi

THEME="docs/diagrams/src/theme.d2"

for f in docs/diagrams/src/*.d2; do
  [ "$(basename "$f")" = "theme.d2" ] && continue
  name=$(basename "$f" .d2)
  # 拼接 theme + 源文件，通过 stdin 传给 d2
  cat "$THEME" "$f" | d2 --layout elk --theme 0 - "docs/diagrams/${name}.svg"
done

echo "Done: all D2 diagrams generated."
```

### 4.3 D2 后处理说明

D2 生成的 SVG 在配色上通过 classes 可以精确控制，但以下方面可能需要手动微调：
- 背景色：D2 默认白色背景，如需 #f8fafc 需在生成后用 sed 替换或接受 D2 默认值
- 字体：D2 使用系统默认字体渲染，无法指定 Inter/Noto Sans SC，接受 D2 默认字体
- 阴影：D2 不支持 drop-shadow，D2 图表不使用阴影（与 SVG 手工图的差异可接受，因为 D2 图结构更简单）

如果 D2 默认样式与 SVG 设计系统差异过大，可在构建后用后处理脚本统一调整 SVG 根元素的背景色和字体 family。

---

## 5. 逐张图重设计规格

### 5.1 react-learning-roadmap（D2，总览）

布局：从左到右，6 个模块节点线性串联。

与现有版本的变化：
- 删除底部大段"最需要记住的关系"文字块，改为一行精简提示
- 每个模块节点只保留：编号 + 标题 + 一句问题 + 一句结论
- 不再有内部小卡片和关键词行

### 5.2 react-old-sync-vs-fiber（D2，M1 简化版）

布局：grid 两列对比。

与现有版本的变化：
- 从两个 700px+ 大面板简化为结构化对比
- 左侧"旧模型"：4 个节点纵向串联（开始 → 持续执行 → 控制力弱 → 根本限制）
- 右侧"Fiber"：4 个节点纵向串联（开始 → 可暂停/让位/放弃 → 统一 commit → 关键边界）
- 删除"三类压力"展开区和"关键外显能力"面板（回归正文）

### 5.3 react-fiber-node-traversal（手工 SVG，M2）

尺寸：1600 x 1150px。三层布局：

**上层（40%）— 树结构与三种指针**：

```
        A (HostRoot)
        |
        | child（蓝色，唯一）
        v
        B --sibling（灰色）--> C --sibling--> D
        |                                     |
        | child                               | child
        v                                     v
        E --sibling--> F                      G
```

关键修正：A 只有 1 条 child 指向 B，B/C/D 通过 sibling 串联。return 箭头走弧线绕行。右侧放指针说明框。

**中层（25%）— 单节点字段分组**：

4 组卡片横排（各 280px）：
- 树链接：child / sibling / return
- 输入缓存：pendingProps / memoizedProps / memoizedState
- 工作标记：flags / subtreeFlags
- 双树配对：alternate

**下层（35%）— beginWork / completeWork 工作循环**：

左右两个框 + 循环箭头：
- beginWork 向下推进：返回 child 继续向下，返回 null 转入 completeWork
- completeWork 向上回退：先找 sibling，没有则沿 return 上溯

### 5.4 react-current-wip-commit（手工 SVG，M3）

尺寸：1600 x 1000px。从 4 列并排改为 2x2 网格：

```
+---------------------------+---------------------------+
| 1. 提交前                  | 2. render 阶段             |
| 只有 current 对外生效       | WIP 从 current 派生并推进    |
| [current 树图]             | [current 树(淡)] [WIP 树]  |
+---------------------------+---------------------------+
| 3. render 完成             | 4. commit                 |
| WIP 以 finishedWork       | root.current =            |
| 身份挂到 root              | finishedWork              |
| [WIP 树 + 绿标签]          | [新 current 树(绿)]        |
+---------------------------+---------------------------+
```

每格约 740 x 360px，比现有 340px 宽一倍以上。底部保留 alternate 配对说明 + 一行总结。

### 5.5 react-setstate-full-path（手工 SVG，M4）

尺寸：1600 x 1400px。4 泳道 10 步时序图。

泳道：

| 泳道 | 宽度 | 步骤 |
|------|------|------|
| 组件 → Fiber | 340px | 1, 2, 3 |
| Root | 300px | 4, 5, 8 |
| Render (WIP) | 340px | 6, 7 |
| Commit | 300px | 9, 10 |

10 步：

| # | 泳道 | 内容 |
|---|------|------|
| 1 | 组件→Fiber | setState(payload) — 发起更新请求 |
| 2 | 组件→Fiber | enqueueSetState → createUpdate + enqueueUpdate |
| 3 | 组件→Fiber | 沿 return 父链 markUpdateLaneFromFiberToRoot |
| 4 | Root | 到达 HostRoot，拿到 FiberRoot |
| 5 | Root | scheduleUpdateOnFiber → markRootUpdated |
| 6 | Render | prepareFreshStack → createWorkInProgress |
| 7 | Render | processUpdateQueue — 算出新 state |
| 8 | Root | root.finishedWork = finishedWork |
| 9 | Commit | commitRoot — 按 flags 执行 DOM 操作 |
| 10 | Commit | root.current = finishedWork — 真正生效 |

跨泳道箭头：3→4（Fiber→Root）、5→6（Root→Render）、7→8（Render→Root）、8→9（Root→Commit）。

图例移到左下角。底部保留 3 格闭环：登记 → 计算 → 生效。

### 5.6 react-lanes-assignment（D2，M5 上）

布局：从左到右 3 层。

第 1 层 Update Sources：输入/点击、普通 setState、startTransition。

第 2 层 Lane Assignment：Sync/Input lanes、Default lanes、Transition lanes。

第 3 层 Root Ledger（内部含状态机）：
- 所有更新统一进入 pendingLanes
- pendingLanes --render 中 suspend--> suspendedLanes
- suspendedLanes --wakeable resolve--> pingedLanes
- pendingLanes --超时未完成--> expiredLanes
- 出口：getNextLanes 综合判断最该处理哪一批

### 5.7 react-scheduler-render-loop（D2，M5 下）

布局：从左到右 3 节点 + 注释框。

- ensureRootIsScheduled（内部调用 getNextLanes 判断本轮最该做的 lanes，以对应优先级向 scheduler 注册 callback）
- Scheduler（提供 callback 执行机会，不决定业务优先级）
- Render Work Loop（沿 workInProgress 逐 Fiber 推进，可让位/继续/放弃）

注释框"最易误解的边界"：
1. 优先级判断在 getNextLanes，不在 scheduler
2. 并发 = 可中断可恢复，不是多线程
3. startTransition 表示"可让位"，不是独立渲染引擎

### 5.8 react-suspense-offscreen-ping-retry（手工 SVG，M6）

尺寸：1600 x 1000px。3 行阶梯形闭环：

```
第 1 行（左→右）：1.尝试render → 2.suspend → 3.boundary捕获 → 4.fallback出场
                                                                    |
第 2 行（右→左）：             6.记录suspendedLanes <-- 5.hidden Offscreen
                                    | 7.wakeable resolve
第 3 行（左→右）：10.retry <-- 9.ensureRootIsScheduled <-- 8.pingSuspendedRoot
  |
  回到步骤 1（闭环）
```

色彩分配：
- 第 1 行：红/橙色调（挂起路径）
- 第 2 行：紫色调（状态转换 + 等待）
- 第 3 行：蓝/绿色调（恢复路径）

底部保留 3 条关键口径 + 图例。

---

## 6. 文件组织

```
docs/diagrams/
  src/                          <- D2 源文件（维护用）
    theme.d2                    <- 共享主题
    react-learning-roadmap.d2
    react-old-sync-vs-fiber.d2
    react-lanes-assignment.d2
    react-scheduler-render-loop.d2
  *.svg                         <- 最终产出（D2 生成 + 手工）
  BUILD.md                      <- 构建说明
  diagram-specs.md              <- 更新
  index.md                      <- 更新
```

文件变化：
- 新增：src/ 目录及 5 个 D2 文件、2 张新 SVG（M5 拆分）、BUILD.md
- 重写：4 张手工 SVG
- 删除：react-old-sync-vs-fiber-capabilities.svg、react-lanes-root-scheduler.svg
- 更新：diagram-specs.md、index.md

---

## 7. 交付清单

| # | 文件 | 技术 | 模块 |
|---|------|------|------|
| 1 | react-learning-roadmap.svg | D2 | 总览 |
| 2 | react-old-sync-vs-fiber.svg | D2 | M1 |
| 3 | react-fiber-node-traversal.svg | SVG | M2 |
| 4 | react-current-wip-commit.svg | SVG | M3 |
| 5 | react-setstate-full-path.svg | SVG | M4 |
| 6 | react-lanes-assignment.svg | D2 | M5 上 |
| 7 | react-scheduler-render-loop.svg | D2 | M5 下 |
| 8 | react-suspense-offscreen-ping-retry.svg | SVG | M6 |

依赖顺序：
1. 先完成 SVG defs 模板 + D2 theme.d2（共享基础）
2. D2 图并行构建（4 张互不依赖）
3. SVG 图并行手写（4 张互不依赖）
4. 最后更新 diagram-specs.md、index.md、BUILD.md
5. 全局搜索并更新旧文件名引用（见下方检查清单）

---

## 8. SVG defs 共享模板

所有 4 张手工 SVG 共享以下 `<defs>` 模板，确保箭头、阴影、字体 class 一致：

```xml
<defs>
  <style><![CDATA[
    /* 字体 */
    .title   { font: 700 26px 'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; fill: #0f172a; }
    .sub     { font: 400 13px 'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; fill: #475569; }
    .heading { font: 700 16px 'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; fill: #0f172a; }
    .label   { font: 700 13px 'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; fill: #0f172a; }
    .body    { font: 400 13px 'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; fill: #0f172a; }
    .hint    { font: 400 11px 'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; fill: #475569; }
    .mono    { font: 600 12px 'JetBrains Mono','Fira Code','SFMono-Regular',monospace; fill: #0f172a; }
    /* 阴影（仅大面板使用） */
    .shadow  { filter: url(#shadow-filter); }
  ]]></style>

  <!-- 阴影 filter -->
  <filter id="shadow-filter" x="-4%" y="-4%" width="108%" height="108%">
    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(15,23,42,0.06)"/>
  </filter>

  <!-- 箭头 markers（每种颜色一个） -->
  <marker id="arr-blue"   viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#2563eb"/></marker>
  <marker id="arr-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ea580c"/></marker>
  <marker id="arr-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#7c3aed"/></marker>
  <marker id="arr-green"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#16a34a"/></marker>
  <marker id="arr-red"    viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#dc2626"/></marker>
  <marker id="arr-slate"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#475569"/></marker>
  <marker id="arr-yellow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ca8a04"/></marker>
</defs>
```

实现时将此模板复制到每张 SVG 的 `<defs>` 中，按需裁剪未使用的 marker。

---

## 9. 文件名变更引用更新检查清单

删除和重命名文件后，需全局搜索并更新以下引用：

| 旧文件名 | 新文件名 | 需检查的文件 |
|---------|---------|-------------|
| `react-old-sync-vs-fiber-capabilities.svg` | `react-old-sync-vs-fiber.svg` | `index.md`、`diagram-specs.md`、M1 正文、`final-guide-draft.md` |
| `react-lanes-root-scheduler.svg` | `react-lanes-assignment.svg` + `react-scheduler-render-loop.svg` | `index.md`、`diagram-specs.md`、M5 正文、`final-guide-draft.md` |

验证命令：

```bash
# 确认旧文件名不再被引用
grep -r "react-old-sync-vs-fiber-capabilities" docs/
grep -r "react-lanes-root-scheduler" docs/
# 两条命令应该返回空结果
```
