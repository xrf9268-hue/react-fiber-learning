# M1｜自评：为什么 React 需要 Fiber

## 评审对象

- 主文稿：`docs/modules/m1-why-fiber-exists-draft.md`
- 证据笔记：`docs/modules/m1-evidence-notes.md`
- 评审基准：`docs/modules/m1-why-fiber-exists-plan.md` 中的 compact review checklist

---

## 总体结论

**结论：基本通过，可进入 first-commit-ready 状态。**

M1 现在已经具备：
- 明确的问题导向开头
- 以 React 18 官方文档为主的证据支撑
- React 16 / 2018 历史官方材料作为时间线与语义补证
- 对常见误解的主动澄清
- 与后续模块的清晰边界

当前剩余工作已经不属于结构性缺口，主要是提交前的微调项。

---

## 清单逐项评审

### 1. Opens with the problem Fiber solves, not a definition dump.
**结果：PASS**

说明：
- 主文稿从“旧的同步渲染模型有什么根问题”切入，而不是先讲 Fiber 节点或内部字段。
- 第一段结论直接说明：旧模型控制力不够，React 需要可中断、可恢复、可排序、可放弃的工作流程。

---

### 2. Uses official React 18 sources as the main evidence base.
**结果：PASS**

说明：
- 主证据来自：
  - `react.dev/blog/2022/03/29/react-v18`
  - `react.dev/blog/2022/03/08/react-18-upgrade-guide`
- 历史文章只作为辅助补证，没有喧宾夺主。

---

### 3. States clearly that Fiber is an internal foundation, not a public feature.
**结果：PASS**

说明：
- 主文稿明确写出：Fiber 不是单独面向用户的新功能，而是内部协调架构变化。
- 证据使用了 React 18 发布文中的 `behind-the-scenes change` 表述，支撑充分。

---

### 4. Explains interruptible rendering in plain language.
**结果：PASS**

说明：
- 主文稿已经用“开始、暂停、继续、放弃”四个动作把 interruptible rendering 讲清楚。
- 语言保持概念优先，没有被源码术语拖走。

---

### 5. Explains why React delays DOM mutations until commit.
**结果：PASS**

说明：
- 主文稿明确强调：render 可中断，但 DOM mutations 会延后到整棵树评估完成之后。
- 同时引用了 Suspense 一致性段落，说明 React 不会把不完整树直接挂到界面上。

---

### 6. Connects Fiber to responsiveness and stale-work cancellation/prioritization.
**结果：PASS**

说明：
- 已明确连接到：
  - 响应用户输入
  - urgent / non-urgent updates
  - 丢弃 stale rendering work
- 这部分有 React 18 transitions 官方表述直接支撑。

---

### 7. Avoids overstating “performance” as raw speed.
**结果：PASS**

说明：
- 主文稿多次强调主线是“控制力、响应性、一致性、工作取舍”，不是笼统的“更快”。
- 目前没有出现把 Fiber 简化成性能优化补丁的表述。

---

### 8. Notes React 16 timeline and React 18 visibility without conflating them.
**结果：PASS**

说明：
- 已明确区分：
  - React 16：Fiber 落地时间点
  - React 18：Fiber 价值更容易被看懂的时间点
- 没有把 Fiber 错写成 React 18 才出现的机制。

---

### 9. Keeps source-code details secondary to conceptual clarity.
**结果：PASS**

说明：
- M1 没有引入不必要的源码函数名、文件名、内部字段细节。
- 证据主要来自官方博文，而不是直接拿 reconciler 源码做第一解释面。

---

### 10. Leaves lanes/scheduler/fiber fields for later modules.
**结果：PASS**

说明：
- 文稿已明确声明这些内容留到后续模块。
- 模块边界清楚，没有提前透支 M2/M3/M5 的讲解空间。

---

## 目前仍存在的轻微缺口

### Gap 1：还没有把证据编号做成脚注式短引文
**严重度：低**

说明：
- 现在主文稿采用 `[证据 1]` 这类轻量索引，已经足够 first-commit-ready。
- 如果后续要公开发布或增强可审阅性，可以把关键原话做成脚注或引用块，提升可核验性。

### Gap 2：还没有加入一张“旧模型 vs Fiber 能力”对照图
**严重度：低**

说明：
- 文字已经足够成立，但如果下一轮打磨，希望教学性更强，可以补一张简单图示。
- 这不阻碍当前提交。

### Gap 3：术语层面仍可再统一一次
**严重度：低**

说明：
- 例如“并发渲染 / concurrent rendering”“后台准备 / background preparation”可以在全仓后续统一措辞。
- 目前不影响 M1 的正确性。

---

## 建议的提交前微调

1. 检查全文标点与中英文空格是否统一。
2. 检查证据索引编号在正文中是否都被实际引用。
3. 若要更利于首个 commit 审阅，可在 `STATUS.md` 或下一次 checkpoint 中注明：
   - M1 draft completed with official evidence notes and self-review.

---

## 最终判断

**M1 已达到本工作包目标：**
- 已补齐官方证据笔记；
- 已把草稿改为“概念优先 + 证据可回溯”；
- 已完成按 checklist 的自评；
- 可作为首个里程碑提交前状态。

未完成项主要是美化与后续模块衔接，不影响 M1 作为 first-commit-ready 成果成立。
