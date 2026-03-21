# React Fiber 图表重设计实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重建 docs/diagrams/ 下全部图表，修正正确性错误、解决文本溢出、统一设计系统，产出 8 张对外发布级品质的图表（4 D2 + 4 手工 SVG）。

**Architecture:** D2 + 手工 SVG 混合方案。简单流程图用 D2（ELK 布局引擎）生成，复杂图（含精确指针箭头、多泳道时序、闭环回流）用手工 SVG 按统一设计系统规范手写。共享配色方案和 SVG defs 模板保证视觉一致性。

**Tech Stack:** D2 (>= 0.6.0, ELK layout), 手工 SVG, Bash 构建脚本

**Spec:** `docs/superpowers/specs/2026-03-20-diagrams-redesign-design.md`

---

## Chunk 1: 共享基础设施

### Task 1: 创建 D2 共享主题文件

**Files:**
- Create: `docs/diagrams/src/theme.d2`

- [ ] **Step 1: 创建 src 目录**

```bash
mkdir -p docs/diagrams/src
```

- [ ] **Step 2: 编写 theme.d2**

创建 `docs/diagrams/src/theme.d2`，内容：

```d2
vars: {
  d2-config: {
    layout-engine: elk
  }
}

classes: {
  emphasis-blue: {
    style: {
      fill: "#eff6ff"
      stroke: "#2563eb"
      stroke-width: 2
      border-radius: 14
      font-size: 13
    }
  }
  emphasis-red: {
    style: {
      fill: "#fee2e2"
      stroke: "#dc2626"
      stroke-width: 2
      border-radius: 14
      font-size: 13
    }
  }
  emphasis-green: {
    style: {
      fill: "#f0fdf4"
      stroke: "#16a34a"
      stroke-width: 2
      border-radius: 14
      font-size: 13
    }
  }
  emphasis-purple: {
    style: {
      fill: "#f5f3ff"
      stroke: "#7c3aed"
      stroke-width: 2
      border-radius: 14
      font-size: 13
    }
  }
  emphasis-orange: {
    style: {
      fill: "#fff7ed"
      stroke: "#ea580c"
      stroke-width: 2
      border-radius: 14
      font-size: 13
    }
  }
  emphasis-yellow: {
    style: {
      fill: "#fef9c3"
      stroke: "#ca8a04"
      stroke-width: 2
      border-radius: 14
      font-size: 13
    }
  }
  emphasis-cyan: {
    style: {
      fill: "#ecfeff"
      stroke: "#06b6d4"
      stroke-width: 2
      border-radius: 14
      font-size: 13
    }
  }
  card: {
    style: {
      fill: "#ffffff"
      stroke: "#cbd5e1"
      stroke-width: 1.5
      border-radius: 14
      font-size: 13
    }
  }
  note: {
    style: {
      fill: "#f8fafc"
      stroke: "#cbd5e1"
      stroke-width: 1.2
      border-radius: 14
      font-size: 12
    }
  }
}
```

- [ ] **Step 3: 验证 theme.d2 语法**

```bash
# 用一个最小 D2 文件测试 theme 是否能被 concat 使用
echo 'a -> b' > /tmp/test-theme.d2
cat docs/diagrams/src/theme.d2 /tmp/test-theme.d2 | d2 --layout elk - /tmp/test-theme.svg
echo "Exit code: $?"
# Expected: Exit code: 0
rm /tmp/test-theme.d2 /tmp/test-theme.svg
```

---

### Task 2: 创建构建脚本和 BUILD.md

**Files:**
- Create: `docs/diagrams/build.sh`
- Create: `docs/diagrams/BUILD.md`

- [ ] **Step 1: 编写 build.sh**

创建 `docs/diagrams/build.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

# 检查 D2 是否安装
if ! command -v d2 &>/dev/null; then
  echo "Error: d2 not found. Install: https://d2lang.com/install" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SCRIPT_DIR}/src"
OUT_DIR="${SCRIPT_DIR}"
THEME="${SRC_DIR}/theme.d2"

if [ ! -f "$THEME" ]; then
  echo "Error: theme.d2 not found at $THEME" >&2
  exit 1
fi

count=0
for f in "${SRC_DIR}"/*.d2; do
  [ "$(basename "$f")" = "theme.d2" ] && continue
  name=$(basename "$f" .d2)
  echo "Building ${name}.svg ..."
  cat "$THEME" "$f" | d2 --layout elk --theme 0 - "${OUT_DIR}/${name}.svg"
  count=$((count + 1))
done

echo "Done: ${count} D2 diagrams generated."
```

```bash
chmod +x docs/diagrams/build.sh
```

- [ ] **Step 2: 编写 BUILD.md**

创建 `docs/diagrams/BUILD.md`：

```markdown
# 图表构建说明

## 前置条件

- D2 >= 0.6.0（安装：https://d2lang.com/install）
- 推荐字体：Noto Sans SC + JetBrains Mono（未安装时使用系统 fallback）

## 构建 D2 图表

```bash
bash docs/diagrams/build.sh
```

此脚本会将 `src/` 下所有 `.d2` 文件（除 `theme.d2`）编译为同名 `.svg`，输出到 `docs/diagrams/` 目录。

## 手工 SVG

以下 4 张图为手工编写，不经过 build 脚本：
- `react-fiber-node-traversal.svg`（M2）
- `react-current-wip-commit.svg`（M3）
- `react-setstate-full-path.svg`（M4）
- `react-suspense-offscreen-ping-retry.svg`（M6）

修改这些文件直接编辑 SVG 即可。所有手工 SVG 共享 spec 第 8 节定义的 defs 模板。

## 设计系统参考

详见 `docs/superpowers/specs/2026-03-20-diagrams-redesign-design.md`
```

---

## Chunk 2: D2 图表（4 张）

### Task 3: 编写 react-learning-roadmap.d2（总览图）

**Files:**
- Create: `docs/diagrams/src/react-learning-roadmap.d2`
- Overwrite: `docs/diagrams/react-learning-roadmap.svg`（由 build 生成）

- [ ] **Step 1: 编写 D2 源文件**

创建 `docs/diagrams/src/react-learning-roadmap.d2`：

```d2
direction: right

title: "React Fiber 学习路线总图" {
  style: {
    font-size: 22
    bold: true
    fill: "#f8fafc"
    stroke: "#f8fafc"
  }
}

M1: |md
  **M1 为什么需要 Fiber**
  问题：旧同步渲染为什么不够？
  结论：把渲染改造成可调度的工作系统
| {
  class: emphasis-cyan
}

M2: |md
  **M2 Fiber 节点与遍历**
  问题：工作单元长什么样？
  结论：child / sibling / return 把树拆成显式工作节点
| {
  class: emphasis-blue
}

M3: |md
  **M3 双树与 render / commit**
  问题：如何一边准备下一版，一边保持当前界面稳定？
  结论：current 与 WIP 分工，commit 统一切换
| {
  class: emphasis-orange
}

M4: |md
  **M4 一次更新全链路**
  问题：setState 怎样走到 root 再进入 render / commit？
  结论：先登记，再调度，再提交
| {
  class: emphasis-purple
}

M5: |md
  **M5 lanes 与 scheduler**
  问题：同时有多批更新时，先做什么？
  结论：lane 归类，root 选批次，scheduler 给执行机会
| {
  class: emphasis-green
}

M6: |md
  **M6 Suspense 与 Offscreen**
  问题：主内容暂时做不下去时怎么处理？
  结论：suspend → fallback → ping → retry
| {
  class: emphasis-red
}

M1 -> M2: "" { style.stroke: "#475569" }
M2 -> M3: "" { style.stroke: "#475569" }
M3 -> M4: "" { style.stroke: "#475569" }
M4 -> M5: "" { style.stroke: "#475569" }
M5 -> M6: "" { style.stroke: "#475569" }

hint: "M1-M6 不是并列目录，而是一条从问题意识到阻塞恢复机制的连续解释链" {
  class: note
}
```

- [ ] **Step 2: 构建并验证**

```bash
bash docs/diagrams/build.sh
# Expected: "Building react-learning-roadmap.svg ..."、"Done: 1 D2 diagrams generated."
```

在浏览器中打开 `docs/diagrams/react-learning-roadmap.svg` 验证：
- 6 个模块从左到右排列
- 每个模块有标题、问题、结论
- 底部有提示文字
- 配色与 spec 3.4 节一致

---

### Task 4: 编写 react-old-sync-vs-fiber.d2（M1 对比图）

**Files:**
- Create: `docs/diagrams/src/react-old-sync-vs-fiber.d2`
- Generate: `docs/diagrams/react-old-sync-vs-fiber.svg`

- [ ] **Step 1: 编写 D2 源文件**

创建 `docs/diagrams/src/react-old-sync-vs-fiber.d2`：

```d2
direction: right

title: "旧同步渲染模型 vs Fiber 能力对比" {
  style: {
    font-size: 22
    bold: true
    fill: "#f8fafc"
    stroke: "#f8fafc"
  }
}

old: "旧同步渲染模型" {
  style: {
    fill: "#ffffff"
    stroke: "#dc2626"
    stroke-width: 2
    border-radius: 20
  }

  a: "开始更新\n组件触发渲染后，主线程形成一整块连续工作" { class: emphasis-red }
  b: "持续执行\n期间难以让位给更急的输入或点击" { class: emphasis-red }
  c: "中途控制力弱\n不擅长暂停、恢复、丢弃过时工作" { class: emphasis-red }
  d: "根本限制\n对渲染工作的控制粒度不够细" {
    style: {
      fill: "#fef2f2"
      stroke: "#dc2626"
      stroke-width: 2
      border-radius: 14
      bold: true
    }
  }

  a -> b { style.stroke: "#dc2626" }
  b -> c { style.stroke: "#dc2626" }
  c -> d { style.stroke: "#dc2626" }
}

fiber: "Fiber 工作模型" {
  style: {
    fill: "#ffffff"
    stroke: "#16a34a"
    stroke-width: 2
    border-radius: 20
  }

  a: "开始更新\n不是立刻做到底，先组织成可推进的工作" { class: emphasis-green }
  b: "中途可控\n可暂停、可让位、可放弃过时工作" { class: emphasis-green }
  c: "统一 commit\n整棵结果准备好后再一次性提交" { class: emphasis-green }
  d: "关键边界\n可中断的是 render，不是 commit" {
    style: {
      fill: "#f0fdf4"
      stroke: "#16a34a"
      stroke-width: 2
      border-radius: 14
      bold: true
    }
  }

  a -> b { style.stroke: "#16a34a" }
  b -> c { style.stroke: "#16a34a" }
  c -> d { style.stroke: "#16a34a" }
}

old -> fiber: "Fiber 解决了什么" {
  style: {
    stroke-dash: 5
    stroke: "#475569"
  }
}
```

- [ ] **Step 2: 构建并验证**

```bash
bash docs/diagrams/build.sh
```

验证：左右两列对比结构，旧模型红色调、Fiber 绿色调，节点间流向清晰。

---

### Task 5: 编写 react-lanes-assignment.d2（M5 上）

**Files:**
- Create: `docs/diagrams/src/react-lanes-assignment.d2`
- Generate: `docs/diagrams/react-lanes-assignment.svg`

- [ ] **Step 1: 编写 D2 源文件**

创建 `docs/diagrams/src/react-lanes-assignment.d2`：

```d2
direction: right

title: "更新如何进入 lanes — root 统一记账" {
  style: {
    font-size: 22
    bold: true
    fill: "#f8fafc"
    stroke: "#f8fafc"
  }
}

sources: "Update Sources" {
  style.border-radius: 20
  input: "输入 / 点击\n离用户最近，通常更急" { class: emphasis-red }
  setState: "普通 setState\n默认更新" { class: emphasis-blue }
  transition: "startTransition\n可让位给更急工作" { class: emphasis-purple }
}

lanes: "Lane Assignment" {
  style.border-radius: 20
  sync: "Sync / Input lanes" { class: emphasis-red }
  default: "Default lanes" { class: emphasis-blue }
  trans: "Transition lanes" { class: emphasis-purple }
}

sources.input -> lanes.sync { style.stroke: "#dc2626" }
sources.setState -> lanes.default { style.stroke: "#2563eb" }
sources.transition -> lanes.trans { style.stroke: "#7c3aed" }

root: "Root Ledger — 所有更新统一入口" {
  style.border-radius: 20

  pending: "pendingLanes\nmarkRootUpdated(root, lane)\n所有更新都先到这里" { class: emphasis-blue }

  suspended: "suspendedLanes\n暂时做不下去" { class: emphasis-red }
  pinged: "pingedLanes\n恢复候选" { class: emphasis-orange }
  expired: "expiredLanes\n饿死保护" { class: emphasis-yellow }

  pending -> suspended: "render 中\nsuspend" { style.stroke: "#dc2626" }
  suspended -> pinged: "wakeable\nresolve" { style.stroke: "#ea580c" }
  pending -> expired: "超时\n未完成" { style.stroke: "#ca8a04" }
}

lanes.sync -> root.pending { style.stroke: "#475569" }
lanes.default -> root.pending { style.stroke: "#475569" }
lanes.trans -> root.pending { style.stroke: "#475569" }

next: "getNextLanes(root, wipLanes)\n综合判断最该处理哪一批" {
  class: card
}

root.pending -> next { style.stroke: "#475569" }
root.pinged -> next: "恢复候选\n也参与" { style.stroke: "#ea580c"; style.stroke-dash: 5 }
root.expired -> next: "优先纳入" { style.stroke: "#ca8a04"; style.stroke-dash: 5 }
```

- [ ] **Step 2: 构建并验证**

```bash
bash docs/diagrams/build.sh
```

验证：三层结构（sources → lanes → root ledger），root ledger 内部含 pending/suspended/pinged/expired 状态机，出口为 getNextLanes。

---

### Task 6: 编写 react-scheduler-render-loop.d2（M5 下）

**Files:**
- Create: `docs/diagrams/src/react-scheduler-render-loop.d2`
- Generate: `docs/diagrams/react-scheduler-render-loop.svg`

- [ ] **Step 1: 编写 D2 源文件**

创建 `docs/diagrams/src/react-scheduler-render-loop.d2`：

```d2
direction: right

title: "scheduler 与 render work loop 协作" {
  style: {
    font-size: 22
    bold: true
    fill: "#f8fafc"
    stroke: "#f8fafc"
  }
}

ensure: |md
  **ensureRootIsScheduled**
  调用 getNextLanes 判断本轮最该做的 lanes
  以对应优先级向 scheduler 注册 callback
| {
  class: emphasis-blue
}

scheduler: |md
  **Scheduler**
  提供 callback 执行机会
  不决定业务优先级
  只决定"何时再给 root 一轮执行窗口"
| {
  class: emphasis-purple
}

render: |md
  **Render Work Loop**
  沿 workInProgress 逐 Fiber 推进
  可让位、可继续、可放弃过时工作
| {
  class: emphasis-green
}

ensure -> scheduler: "注册 callback" { style.stroke: "#475569" }
scheduler -> render: "安排执行窗口" { style.stroke: "#16a34a" }

note: |md
  **最易误解的边界**

  1. 优先级判断在 getNextLanes，不在 scheduler
  2. 并发模式意味着 render 可被中断和恢复，但仍运行在单个主线程上
  3. startTransition 表示"可让位"，不是独立渲染引擎
| {
  style: {
    fill: "#f0fdf4"
    stroke: "#16a34a"
    border-radius: 14
    font-size: 12
  }
}
```

- [ ] **Step 2: 构建并验证**

```bash
bash docs/diagrams/build.sh
# Expected: "Done: 4 D2 diagrams generated."
```

验证：3 个节点从左到右，注释框位于下方，配色准确。

---

## Chunk 3: 手工 SVG 图表 — M2 和 M3

### Task 7: 重写 react-fiber-node-traversal.svg（M2）

**Files:**
- Overwrite: `docs/diagrams/react-fiber-node-traversal.svg`

此图为 1600x1150 三层布局。以下给出完整 SVG 内容。

- [ ] **Step 1: 编写完整 SVG**

创建/覆盖 `docs/diagrams/react-fiber-node-traversal.svg`，完整内容见下方。

**关键设计要点（对照 spec 5.3 节）**：
- 上层（40%, y=120-580）：7 节点树，A.child→B（唯一 child），B.sibling→C→D，B.child→E，E.sibling→F，D.child→G。return 箭头走弧线。右侧指针说明框。
- 中层（25%, y=600-880）：4 组字段卡片横排，各 280px。
- 下层（35%, y=900-1100）：beginWork/completeWork 两个框 + 循环箭头。
- 使用 spec 第 8 节 defs 模板（裁剪到只保留 blue/orange/slate 三色 marker）。

由于完整 SVG 内容较长（约 300 行），实现时按以下骨架逐部分手写：

```
1. <svg> + <defs>（从 spec 第 8 节模板裁剪）
2. 背景 rect + 标题/副标题 text
3. 上层大面板 rect（shadow）
   - 7 个 circle 节点（A=r34, B/C/D=r30, E/F/G=r26）
   - child 箭头（蓝色）：A→B, B→E, D→G（各 1 条，只指向第一个子节点）
   - sibling 箭头（灰色）：B→C, C→D, E→F
   - return 箭头（橙色弧线）：B→A, C→A(经B上方弧线), D→A, E→B, F→B, G→D
   - 右侧指针说明框
4. 中层标题 + 4 个字段分组卡片
5. 下层标题 + beginWork 框 + completeWork 框 + 循环箭头
6. 底部总结栏 + 图例
```

- [ ] **Step 2: 在浏览器中验证**

打开 SVG 检查：
- A 只有 1 条 child 箭头指向 B（不是 3 条）
- B→C→D 是灰色 sibling 箭头
- 所有 return 箭头是橙色弧线，不与 child 箭头重叠
- 4 组字段卡片文字不溢出（卡片宽 280px）
- beginWork/completeWork 描述清晰，循环关系可见
- 图例在右下角

---

### Task 8: 重写 react-current-wip-commit.svg（M3）

**Files:**
- Overwrite: `docs/diagrams/react-current-wip-commit.svg`

此图为 1600x1000，2x2 网格布局。

- [ ] **Step 1: 编写完整 SVG**

**关键设计要点（对照 spec 5.4 节）**：
- 2x2 网格，每格约 740x360（含间距）
- 格 1（左上）：①提交前 — current 树图（蓝色节点，实线），WIP 虚线框（表示尚未存在）
- 格 2（右上）：②render — current 树（淡化蓝色 opacity=0.5），WIP 树（橙色节点），箭头标注"current 派生"
- 格 3（左下）：③render 完成 — WIP 树（橙色）+ 绿色标签"finishedWork 不是第三棵树"
- 格 4（右下）：④commit — 新 current 树（绿色节点），标注"root.current = finishedWork"
- 格间有方向箭头标注（①→②"派生 WIP"，②→③"render 完成"，③→④"切成新 current"）
- 底部：alternate 配对说明（虚线双向箭头），一行总结
- 使用 spec defs 模板（blue/orange/green/slate markers）

骨架：

```
1. <svg 1600x1000> + <defs>
2. 背景 + 标题/副标题
3. 4 个大面板 rect（shadow, 各有彩色标题栏）
4. 每格内：Root 信息框 + 树形图（circle 节点 + 连线）+ 说明文字
5. 格间箭头 + pill 标签
6. 底部 alternate 说明区 + 图例 + 总结
```

- [ ] **Step 2: 在浏览器中验证**

检查：
- 4 格清晰可辨，阅读顺序 ①②③④（Z 形）
- 每格标题不溢出（740px 足够）
- finishedWork 标签可读
- alternate 虚线双向箭头正确
- 图例在右下角

---

## Chunk 4: 手工 SVG 图表 — M4 和 M6

### Task 9: 重写 react-setstate-full-path.svg（M4）

**Files:**
- Overwrite: `docs/diagrams/react-setstate-full-path.svg`

此图为 1600x1500（允许弹性到 1500 以容纳 10 步），4 泳道 10 步时序图。

- [ ] **Step 1: 编写完整 SVG**

**关键设计要点（对照 spec 5.5 节）**：
- 4 泳道：组件→Fiber(340px) | Root(300px) | Render/WIP(340px) | Commit(300px)
- 泳道 x 坐标：48, 412, 736, 1100（含 24px 间距）
- 每个步骤：带色圆圈编号 + 标题 + mono 代码 + hint 说明
- 10 步分配：步骤 1-3 在泳道 1，步骤 4/5/8 在泳道 2，步骤 6/7 在泳道 3，步骤 9/10 在泳道 4
- 跨泳道箭头：3→4(orange), 5→6(purple), 7→8(blue), 8→9(green)
- 泳道内步骤用垂直连接线
- 图例在左下角
- 底部 3 格闭环：登记(orange) → 计算(purple) → 生效(green)

骨架：

```
1. <svg 1600x1500> + <defs>（所有 6 色 marker）
2. 背景 + 标题/副标题
3. 4 个泳道背景 rect + 泳道标题
4. 图例框（左下角，y>1300）
5. 步骤 1：圆圈①(orange) + "setState(payload)" + hint
6. 步骤 2：圆圈②(orange) + "enqueueSetState" + mono 代码
7. 步骤 3：圆圈③(orange) + "markUpdateLaneFromFiberToRoot" + hint
   → 跨泳道箭头到步骤 4
8. 步骤 4：圆圈④(blue) + "到达 HostRoot" + hint
9. 步骤 5：圆圈⑤(blue) + "scheduleUpdateOnFiber" + mono 代码
   → 跨泳道箭头到步骤 6
10. 步骤 6：圆圈⑥(purple) + "prepareFreshStack" + mono 代码
11. 步骤 7：圆圈⑦(purple) + "processUpdateQueue" + hint
    → 跨泳道箭头回到步骤 8（Root）
12. 步骤 8：圆圈⑧(blue) + "root.finishedWork = finishedWork"
    → 跨泳道箭头到步骤 9
13. 步骤 9：圆圈⑨(green) + "commitRoot" + mono 代码
14. 步骤 10：圆圈⑩(green) + "root.current = finishedWork" + hint
15. 底部总结栏（3 格）
```

- [ ] **Step 2: 在浏览器中验证**

检查：
- 10 个步骤全部可见，编号连续
- mono 代码在 340px 泳道内不溢出（如 `markUpdateLaneFromFiberToRoot(...)` 约需 290px，340-48padding=292px，刚好）
- 跨泳道箭头方向正确：3→4 向右，5→6 向右，7→8 向左（回流！），8→9 向右
- 步骤 8 在 Root 泳道（不在 Render 泳道）
- 图例在左下角，不与内容重叠
- 底部 3 格闭环配色正确

---

### Task 10: 重写 react-suspense-offscreen-ping-retry.svg（M6）

**Files:**
- Overwrite: `docs/diagrams/react-suspense-offscreen-ping-retry.svg`

此图为 1600x1000，3 行阶梯形闭环。

- [ ] **Step 1: 编写完整 SVG**

**关键设计要点（对照 spec 5.8 节）**：
- 3 行阶梯布局：
  - 第 1 行 y≈200（左→右）：步骤 1→2→3→4，红/橙色调
  - 第 2 行 y≈420（右→左）：步骤 5←→6，紫色调，右侧步骤 7（wakeable resolve 触发点）
  - 第 3 行 y≈620（右→左）：步骤 8→9→10，蓝/绿色调
- 闭环箭头：步骤 10（左侧）→ 步骤 1（左侧），短距离垂直连接
- 每步骤节点：280px 宽 x 110px 高，rx=14，含标题 + 2 行说明
- 步骤 3 标题拆分："boundary 捕获"为标题，"最近 Suspense boundary"为副文字

骨架：

```
1. <svg 1600x1000> + <defs>（all markers）
2. 背景 + 标题/副标题
3. 主面板 rect（shadow）
4. 第 1 行：步骤 1(blue) → 2(red) → 3(orange) → 4(orange)
   箭头：1→2(blue), 2→3(red), 3→4(orange)
   步骤 3→4 还有分支箭头到步骤 5(green)
5. 第 2 行：步骤 5(green, hidden Offscreen) → 6(purple, suspendedLanes)
   右侧 步骤 7(purple, wakeable resolve) 从步骤 6 区域垂直向下指向第 3 行
6. 第 3 行：步骤 8(orange, pingSuspendedRoot) ← 步骤 9(blue, ensureRootIsScheduled) ← 步骤 10(green, retry)
   注意第 3 行从右到左布局
7. 闭环箭头：步骤 10 → 步骤 1（左侧短距离连接）
8. 底部"三条关键口径"区
9. 图例（右下角）
10. 一句话总结栏
```

- [ ] **Step 2: 在浏览器中验证**

检查：
- 10 步全部可见，闭环箭头清晰
- 步骤 3 标题不溢出
- 3 行色彩分明：上行红/橙，中行紫，下行蓝/绿
- 回流箭头（10→1）不穿越其他节点
- 底部口径文字和图例不溢出

---

## Chunk 5: 文档更新与清理

### Task 11: 删除旧 SVG 文件

**Files:**
- Delete: `docs/diagrams/react-old-sync-vs-fiber-capabilities.svg`
- Delete: `docs/diagrams/react-lanes-root-scheduler.svg`

- [ ] **Step 1: 删除旧文件**

```bash
rm docs/diagrams/react-old-sync-vs-fiber-capabilities.svg
rm docs/diagrams/react-lanes-root-scheduler.svg
```

- [ ] **Step 2: 确认旧文件已删除、新文件已就位**

```bash
ls docs/diagrams/*.svg
# Expected: 8 个 SVG 文件
# react-learning-roadmap.svg
# react-old-sync-vs-fiber.svg
# react-fiber-node-traversal.svg
# react-current-wip-commit.svg
# react-setstate-full-path.svg
# react-lanes-assignment.svg
# react-scheduler-render-loop.svg
# react-suspense-offscreen-ping-retry.svg
```

---

### Task 12: 更新 docs/diagrams/index.md

**Files:**
- Modify: `docs/diagrams/index.md`

- [ ] **Step 1: 更新文件名引用**

需要修改的内容：

1. 第 14 行：`react-old-sync-vs-fiber-capabilities.svg` → `react-old-sync-vs-fiber.svg`
2. 第 24 行：同上
3. 第 36 行：`react-lanes-root-scheduler.svg` → 拆为两行
4. M5 部分增加第二张图的入口

替换后的 M1 部分：
```
- M1 旧模型 vs Fiber 能力对比：`react-old-sync-vs-fiber.svg`
```

替换后的 M5 部分：
```
### M5｜lanes / root / scheduler
- `react-lanes-assignment.svg` — 更新如何归类进入 lanes，root 内部 lanes 状态流转
- `react-scheduler-render-loop.svg` — ensureRootIsScheduled、scheduler、render work loop 的协作分工
```

- [ ] **Step 2: 验证引用**

```bash
grep -c "react-old-sync-vs-fiber-capabilities" docs/diagrams/index.md
# Expected: 0
grep -c "react-lanes-root-scheduler" docs/diagrams/index.md
# Expected: 0
```

---

### Task 13: 更新 docs/index.md

**Files:**
- Modify: `docs/index.md:43,73`

- [ ] **Step 1: 更新文件名引用**

第 43 行：`diagrams/react-old-sync-vs-fiber-capabilities.svg` → `diagrams/react-old-sync-vs-fiber.svg`

第 73 行：`diagrams/react-lanes-root-scheduler.svg` → 改为两行：
```
- 配套 SVG：`diagrams/react-lanes-assignment.svg`、`diagrams/react-scheduler-render-loop.svg`
```

- [ ] **Step 2: 验证引用**

```bash
grep -c "react-old-sync-vs-fiber-capabilities" docs/index.md
# Expected: 0
grep -c "react-lanes-root-scheduler" docs/index.md
# Expected: 0
```

---

### Task 14: 更新 docs/final-guide-draft.md

**Files:**
- Modify: `docs/final-guide-draft.md:79`

- [ ] **Step 1: 更新文件名引用**

第 79 行：`docs/diagrams/react-old-sync-vs-fiber-capabilities.svg` → `docs/diagrams/react-old-sync-vs-fiber.svg`

- [ ] **Step 2: 验证引用**

```bash
grep -c "react-old-sync-vs-fiber-capabilities" docs/final-guide-draft.md
# Expected: 0
```

---

### Task 15: 更新 M4 相关文件步骤数

**Files:**
- Modify: `docs/modules/m4-one-setstate-trace-draft.md:7,287`
- Modify: `docs/modules/m4-one-setstate-trace-plan.md:201`

- [ ] **Step 1: 更新 draft 步骤数描述**

第 7 行：`共八步` → `共十步`
第 287 行：`压缩成八步` → `压缩成十步`

- [ ] **Step 2: 更新 plan 步骤数描述**

`docs/modules/m4-one-setstate-trace-plan.md` 第 201 行：`九步` → `十步`

- [ ] **Step 3: 验证无遗漏**

```bash
grep -rn "八步\|九步" docs/modules/m4-*
# Expected: 返回空（所有旧步骤数引用已更新）
```

注意：仅修改步骤数计数文字。具体的 10 步展开描述暂不在本轮修改范围内（图表已包含完整 10 步，正文后续可对照图表补充）。

---

### Task 16: 更新 diagram-specs.md

**Files:**
- Modify: `docs/diagrams/diagram-specs.md`

- [ ] **Step 1: 更新 M1 图名（如存在）**

检查并将所有 `react-old-sync-vs-fiber-capabilities` 引用替换为 `react-old-sync-vs-fiber`。如果该文件中不存在此引用，跳过此步。

- [ ] **Step 2: 更新 M5 描述**

将原来的单张 M5 图描述替换为 2 张图的描述（lanes-assignment + scheduler-render-loop）。

- [ ] **Step 3: 更新 M6 步骤数**

Suspense 图从 9 个节点扩展为 10 个节点，增加 pingSuspendedRoot 和 ensureRootIsScheduled 分开的说明。

- [ ] **Step 4: 更新图示优先级建议**

从 6 张更新为 8 张。

---

### Task 17: 全局引用验证

- [ ] **Step 1: 运行全局文件名验证**

```bash
grep -r "react-old-sync-vs-fiber-capabilities" docs/
grep -r "react-lanes-root-scheduler" docs/
# Expected: 两条命令都返回空（或只出现在 spec 文档的历史说明中）
```

- [ ] **Step 2: 运行步骤数验证**

```bash
grep -rn "八步\|九步" docs/modules/ docs/diagrams/diagram-specs.md
# Expected: 返回空（所有旧步骤数引用已更新）
```

- [ ] **Step 3: 确认最终文件清单**

```bash
echo "=== D2 源文件 ==="
ls docs/diagrams/src/
# Expected: theme.d2, react-learning-roadmap.d2, react-old-sync-vs-fiber.d2,
#           react-lanes-assignment.d2, react-scheduler-render-loop.d2

echo "=== SVG 产出 ==="
ls docs/diagrams/*.svg
# Expected: 8 个 SVG 文件

echo "=== 构建和文档 ==="
ls docs/diagrams/build.sh docs/diagrams/BUILD.md
# Expected: 两个文件都存在
```
