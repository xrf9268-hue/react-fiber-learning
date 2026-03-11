# M3｜current / workInProgress / render → commit：规划稿

## 范围

本模块只回答四个互相关联的问题：

1. **`current`、`workInProgress`、`finishedWork` 各自代表什么状态。**
2. **为什么 React 要同时维护“已提交树”和“正在准备的新树”。**
3. **render 阶段产出的结果，如何在概念上交给 commit 阶段。**
4. **为什么 `render` 不等于“直接改界面”，而是“先准备，再提交”。**

纳入范围：
- Fiber 双份结构的最小教学模型：`current` 与 `workInProgress`。
- `alternate` 在 M3 层面的完整基础含义：同一逻辑节点的双向配对，以及新树如何基于旧树创建或复用。
- `createWorkInProgress` / `workInProgress` 树的生成与推进。
- `finishedWork` 作为“本轮 render 完成后待提交的整棵新树”的含义。
- render 与 commit 的职责边界：render 负责计算与标记，commit 负责真正生效。
- 从 root 视角理解：`root.current`、`workInProgress`、`finishedWork`、`commitRoot` 之间的基本连接。

暂不纳入：
- lanes、优先级抢占、transition、scheduler 细节。
- 一次具体 `setState` 从触发到提交的全链路追踪（那是 M4）。
- commit 三小阶段的完整展开（before mutation / mutation / layout 只做轻触，不做主线）。
- 各类组件分支在 begin/complete 中的细节差异。
- effect list 历史演变、React 19 细节重构，只做必要对照。

---

## 成功定义

完成 M3 后，学习者应该能用自己的话准确说明：

1. **`current` 是当前已经对外生效的 Fiber 树。**
2. **`workInProgress` 是 React 正在构建、但尚未对外生效的新树。**
3. **两棵树不是两套业务含义，而是同一套界面在“已提交版本”和“待提交版本”上的两份工作表示。**
4. **render 阶段的核心任务不是直接改 DOM，而是沿着 `workInProgress` 树计算下一版结果，并记录需要提交的变化。**
5. **当 render 完成后，root 会拿到 `finishedWork`，它表示“这轮已经准备好进入 commit 的新树根节点”。**
6. **commit 的关键作用是把 render 准备好的结果真正应用出去，并让 root 的 current 指针切换到新树。**
7. **`alternate` 不是“额外备份”，而是 current / workInProgress 配对关系的链接基础。**

---

## 关键误解与纠偏

### 误解 1：`current` 和 `workInProgress` 是两个不同页面

不准确。它们描述的是**同一套界面的两个时间态**：一个已经提交，一个正在准备。

### 误解 2：render 阶段已经在“改界面”

不准确。更准确地说，render 主要是在**计算下一版树、生成更新结果、收集提交信息**；真正对外生效发生在 commit。

### 误解 3：`finishedWork` 是一种新的第三棵树结构

不准确。`finishedWork` 通常就是**本轮 render 完成后的那棵 workInProgress 根 Fiber**。它不是独立体系，而是“已经准备好提交”的命名阶段。

### 误解 4：`alternate` 只是为了回头查旧数据

不完整。`alternate` 更重要的意义，是让 React 能把**当前已提交版本**与**正在构建的新版本**配对起来，从而进行复用、比较与切换。

### 误解 5：只要 render 跑完，界面就已经更新了

不成立。render 完成只意味着“结果准备好了”；只有 commit 执行并完成 current 切换，这轮更新才真正成为对外可见状态。

### 误解 6：M3 必须把 commit 全部源码细节一次讲透

不必。M3 的重点是**讲清 render 与 commit 的连接关系**，不是一次性吃完整个 commit 子系统。

---

## 官方证据目标

本模块以 **React 18.2.0** 为主基线，围绕“双树关系 + 根节点状态 + render/commit 连接”找最小官方证据。

### 一组：双树与 workInProgress 的创建逻辑

1. `packages/react-reconciler/src/ReactFiber.js`
   - 目标：确认 `createWorkInProgress` 如何从 current Fiber 派生或复用 workInProgress。
   - 重点问题：
     - 哪些字段会被保留、重置或复制？
     - `alternate` 如何在创建过程中建立？
     - 为什么这能说明 React 是在“旧树基础上准备新树”？

2. `packages/react-reconciler/src/ReactInternalTypes.js`
   - 目标：确认 Fiber 与 FiberRoot 类型上，与 `alternate`、`stateNode`、root 连接有关的最小结构。
   - 使用边界：只抓 M3 需要的类型锚点，不回到 M2 那种字段大全。

### 二组：root 如何维护 current、finishedWork 与渲染现场

3. `packages/react-reconciler/src/ReactFiberRoot.old.js`
   - 目标：确认 root 上有哪些关键槽位与本模块有关。
   - 重点问题：
     - `root.current` 表示什么？
     - `finishedWork` / `finishedLanes` 这类字段在 root 上承担什么角色？
     - 为什么 root 是 render 与 commit 的交接处？

4. `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - 目标：确认 renderRoot、prepareFreshStack、complete render、进入 commit 的主干流程。
   - 重点函数：
     - `prepareFreshStack`
     - `renderRootSync` / `renderRootConcurrent`
     - `performUnitOfWork`
     - `commitRoot`
     - 与 `finishedWork` 赋值和消费相关的主干逻辑
   - 重点问题：
     - render 从哪里拿到 workInProgress 根？
     - render 完成后，结果怎样挂到 root 上？
     - commit 是如何接过这份结果的？

### 三组：commit 只读“连接点”，不深挖全细节

5. `packages/react-reconciler/src/ReactFiberCommitWork.old.js`
   - 目标：只确认 commit 阶段确实是在消费 render 产出的 Fiber 结果，而不是重新计算整棵树。
   - 使用边界：不展开所有 commit 分支，不陷入宿主环境细节。

6. `packages/react-reconciler/src/ReactFiberFlags.js`
   - 目标：确认 render 阶段记录下来的 flags，为什么能作为 commit 的输入线索。
   - 使用边界：只抓“render 做标记，commit 按标记执行”的概念证据。

### 四组：必要的现代对照（可选，非主线）

7. `packages/react-reconciler/src/ReactFiber.js`
8. `packages/react-reconciler/src/ReactFiberRoot.js`
9. `packages/react-reconciler/src/ReactFiberWorkLoop.js`
10. `packages/react-reconciler/src/ReactFiberCommitWork.js` / `ReactFiberCommitEffects.js`

用途：
- 确认在 `main` 中，主叙事仍然成立：
  - 从 current 派生 workInProgress
  - render 产出 finishedWork
  - commit 消费 finishedWork 并切换 current
- 如果实现拆分更细，只备注“文件拆分了，但概念骨架没变”。

---

## 建议教学顺序

1. **先把三个名字放进同一个时间轴里讲。**
   - `current`：现在生效的版本。
   - `workInProgress`：正在准备的版本。
   - `finishedWork`：已经准备完、等待提交的版本。

2. **再从 M2 的 `alternate` 自然过渡。**
   - M2 只说“它们成对存在”；
   - M3 要补上“为什么必须成对存在，以及如何在更新时复用”。

3. **用 root 视角统一全局。**
   - 让读者先接受：不是每个节点自己决定“是否提交”，而是 root 统一掌管当前树与待提交结果。

4. **讲 render：不是修改界面，而是生产下一版树。**
   - work loop 在 `workInProgress` 树上推进。
   - begin / complete 仍然重要，但此处重点不再是遍历骨架本身，而是“它在准备下一版结果”。

5. **讲 `finishedWork`：render 的完成态。**
   - 强调这是“已准备好交给 commit 的结果”，不是又一套新概念。

6. **讲 commit：把结果生效，并切换 current。**
   - 到这里给出最关键一句话：
   - **render 负责准备，commit 负责生效；current 的切换是两者衔接的关键瞬间。**

7. **最后为 M4 铺路。**
   - 让读者知道：下一步只需再补“是谁触发了这轮 render、root 为什么会开始这轮工作”，就能串起一次 `setState` 全流程。

---

## 建议交付物形态

M3 正文建议至少包含：
- 一张双树关系图：current ↔ workInProgress。
- 一张 root 视角图：`root.current -> render -> finishedWork -> commit -> new current`。
- 一段简明解释：为什么 React 不在 render 过程中直接改界面。
- 少量源码锚点，重点放在 `createWorkInProgress`、root 状态、`commitRoot` 连接点。

如需配图，优先：
1. 双树配对图；
2. root 交接图；
3. render 与 commit 边界图。

---

## 复核清单

- [ ] 是否先把 `current / workInProgress / finishedWork` 放到同一时间轴里解释。
- [ ] 是否讲清 `alternate` 在 M3 中的完整基础含义，而不止停留在“有两份”。
- [ ] 是否明确说明 render 主要是在 workInProgress 树上准备结果，而不是直接改外部界面。
- [ ] 是否讲清 `finishedWork` 与 workInProgress 的关系，避免把它误讲成第三棵独立树。
- [ ] 是否以 root 为交接中心讲清 render → commit 的连接。
- [ ] 是否至少给出一条“render 做标记，commit 按标记生效”的证据链。
- [ ] 是否避免提前滑入 lanes、scheduler 或一次具体 `setState` 追踪。
- [ ] 是否保持中文表达简洁、概念优先、证据导向。
- [ ] 是否为 M4 留出自然接口，而不是提前把 M4 内容吃掉。

---

## 一句话主论点

**M3 要建立的核心认识是：React 会在 current 之外构建一棵 workInProgress 树，render 负责把这棵树准备完成，形成 finishedWork；随后 commit 再把它真正生效，并把 root 的 current 切换到新树。**
