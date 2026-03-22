# M1｜官方证据笔记：为什么 React 需要 Fiber

## 使用原则

- 本文件只记录 **M1 所需的官方证据**，不展开源码实现细节。
- 证据优先级：**React 18 官方博文 > React 官方升级文 > 历史官方博文**。
- 目标不是堆引文，而是提炼可支撑 M1 论点的最小证据集。

---

## 核心结论（供 M1 正文引用）

1. **旧的同步渲染模型，一旦开始更新，基本要一路做完。**
2. **React 需要可中断的渲染能力，才能暂停、继续、放弃旧工作，并让高优先级交互先响应。**
3. **可中断的是 render，不是对用户可见的最终提交；React 会等整棵树评估完成后再做 DOM mutations。**
4. **Fiber 是这类能力的内部架构基础，不是一个直接面向用户的单一功能。**
5. **React 18 中的 concurrent rendering、transitions、Suspense、streaming SSR，是这套架构价值最清楚的现代证据。**

---

## 证据 1：React 18 发布文是 M1 的主证据

### 来源
- React v18
- https://react.dev/blog/2022/03/29/react-v18

### 关键原话

> Many of the features in React 18 are built on top of our new concurrent renderer, a behind-the-scenes change that unlocks powerful new capabilities.

> A key property of Concurrent React is that rendering is interruptible.

> With synchronous rendering, once an update starts rendering, nothing can interrupt it until the user can see the result on screen.

> React may start rendering an update, pause in the middle, then continue later. It may even abandon an in-progress render altogether.

> React guarantees that the UI will appear consistent even if a render is interrupted. To do this, it waits to perform DOM mutations until the end, once the entire tree has been evaluated.

> With this capability, React can prepare new screens in the background without blocking the main thread. This means the UI can respond immediately to user input even if it’s in the middle of a large rendering task.

### 对 M1 的可用结论

- React 官方明确把 concurrent renderer 描述为 **behind-the-scenes change**，这支持“**Fiber/并发渲染基础首先是内部架构变化**”这一点。
- 官方明确对比了两种模型：
  - **旧模型**：一旦开始同步渲染，就无法打断。
  - **新模型**：可以开始、暂停、继续，甚至放弃进行中的渲染。
- 官方明确给出一致性约束：**render 可以被打断，但 DOM mutations 会等到整棵树评估完成后再执行**。
- 官方把收益直接指向 **不阻塞主线程、让用户输入及时响应、后台准备新界面**，这说明 Fiber 的主线不是“纯粹更快”，而是“**更好的工作控制与响应性**”。

### 对 M1 的一句话支撑

> React 之所以需要 Fiber，本质上是因为它需要把渲染从“不可打断的一次性事务”变成“可中断、可恢复、可放弃、且最终一致提交”的工作流程。

---

## 证据 2：React 18 发布文同时证明“优先级”和“丢弃陈旧工作”

### 来源
- React v18
- https://react.dev/blog/2022/03/29/react-v18

### 关键原话

> A transition is a new concept in React to distinguish between urgent and non-urgent updates.

> Urgent updates like typing, clicking, or pressing, need immediate response...

> Updates wrapped in startTransition are handled as non-urgent and will be interrupted if more urgent updates like clicks or key presses come in.

> If a transition gets interrupted by the user ... React will throw out the stale rendering work that wasn’t finished and render only the latest update.

### 对 M1 的可用结论

- React 官方不只是说“能中断”，还明确说了 **为什么要中断**：为了让更紧急的用户交互先得到响应。
- 官方还明确说了 **陈旧工作可以被丢弃**，这直接支撑“Fiber 的目标之一是避免继续做已经过时的渲染工作”。
- 这也解释了为什么“Fiber 只是为了更快”这个说法不准确：这里强调的是 **优先级调度和响应顺序**，不是单一吞吐速度。

---

## 证据 3：React 18 升级文证明并发能力是渐进启用的，并强化一致性约束

### 来源
- How to Upgrade to React 18
- https://react.dev/blog/2022/03/08/react-18-upgrade-guide

### 关键原话

> The new root API also enables the new concurrent renderer, which allows you to opt-into concurrent features.

> React yields to the browser during concurrent rendering...

> Suspense trees are always consistent:

> If a component suspends before it’s fully added to the tree, React will not add it to the tree in an incomplete state or fire its effects.

> Instead, React will throw away the new tree completely, wait for the asynchronous operation to finish, and then retry rendering again from scratch. React will render the retry attempt concurrently, and without blocking the browser.

### 对 M1 的可用结论

- 并发渲染不是“升级到 React 18 后全局自动切换”的粗暴模式，而是 **通过新能力逐步启用**；这有助于避免把 Fiber、concurrent rendering、React 18 三者混成同一件事。
- 官方明确说 React 在 concurrent rendering 中会 **yield to the browser**，这与“可中断、避免长时间霸占主线程”的问题意识一致。
- Suspense 段落再次证明：**React 不会把未完成的新树以不一致状态挂上去**，而是直接丢弃并重试。
- 这为 M1 中“render 可中断，但界面不展示半成品”提供了第二份官方证据。

---

## 证据 4：React 16 发布文提供时间线与早期动机

### 来源
- React v16.0
- https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html

### 关键原话

> Perhaps the most exciting area we’re working on is async rendering — a strategy for cooperatively scheduling rendering work by periodically yielding execution to the browser.

> The upshot is that, with async rendering, apps are more responsive because React avoids blocking the main thread.

### 对 M1 的可用结论

- 时间线上，Fiber 在 React 16 时代落地；因此 **Fiber 不是 React 18 才出现的产物**。
- React 官方当时就已经把重点放在：
  - **cooperatively scheduling rendering work**
  - **periodically yielding execution to the browser**
  - **avoids blocking the main thread**
  - **apps are more responsive**
- 这些表述和 React 18 的解释是前后呼应的：早期叫 async rendering，后来在 React 18 的公开叙事里更系统地体现为 concurrent rendering 能力。

### 使用边界

- 该文适合用于 **时间线和早期问题意识**。
- 不适合作为 M1 的唯一主证据，因为 React 18 文档对今天的读者更清晰、更接近当前术语。

---

## 证据 5：2018 官方 Async Rendering 文章证明 render/commit 分离会改变组件假设

### 来源
- Update on Async Rendering
- https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html

### 关键原话

> ...async rendering (where rendering might be interrupted before it completes...)

> However with async rendering, there may be delays between “render” phase lifecycles ... and “commit” phase lifecycles ...

### 对 M1 的可用结论

- React 官方明确指出：在 async rendering 下，**render 可能在完成前就被打断**。
- 官方还明确指出：**render phase 与 commit phase 之间可能存在延迟**。
- 这说明“render/commit 分离”不是教学中的人为抽象，而是会真实影响组件语义和生命周期假设的架构事实。
- 因而，M1 中强调“可中断的是 render，最终对用户可见的一致提交发生在 commit”是有官方历史证据支撑的。

---

## 可直接落到 M1 正文的论点映射

### 论点 A：旧模式的问题不是一句“慢”，而是渲染一旦开始就不易打断
- 主证据：React 18 发布文
- 支撑原话：
  - “With synchronous rendering, once an update starts rendering, nothing can interrupt it...”

### 论点 B：React 需要的是工作控制能力，而不是只追求更高吞吐
- 主证据：React 18 发布文、React 16 发布文
- 支撑原话：
  - “rendering is interruptible”
  - “pause ... continue later ... abandon...”
  - “cooperatively scheduling rendering work”
  - “apps are more responsive because React avoids blocking the main thread”

### 论点 C：React 必须保证界面一致，因此不会把半成品树直接提交给用户
- 主证据：React 18 发布文、React 18 升级文
- 支撑原话：
  - “it waits to perform DOM mutations until the end...”
  - “will not add it to the tree in an incomplete state...”
  - “throw away the new tree completely...”

### 论点 D：Fiber 是底层基础，React 18 只是让其价值更容易被观察到
- 主证据：React 18 发布文、React 16 发布文
- 支撑原话：
  - “behind-the-scenes change that unlocks powerful new capabilities”
  - React 16 对 async rendering / scheduling / responsiveness 的表述

### 论点 E：优先级与丢弃陈旧工作，是 Fiber 存在的重要原因
- 主证据：React 18 发布文
- 支撑原话：
  - “urgent and non-urgent updates”
  - “will be interrupted if more urgent updates ... come in”
  - “throw out the stale rendering work...”

---

## M1 写作时应避免的失真表述

1. **不要写成“Fiber 主要是为了让 React 更快”。**
   - 更准确：它主要是为了让 React 能更细粒度地安排渲染工作，从而提升响应性并保持一致性。

2. **不要写成“Fiber = Concurrent React = React 18”。**
   - 更准确：Fiber 是底层架构基础；React 18 则让基于它的并发能力更明确地进入主流 API 与文档叙事。

3. **不要写成“render 可中断，所以 DOM 会边算边改”。**
   - 官方恰恰强调相反：为了保证一致性，DOM mutations 会延后到末尾统一执行。

4. **不要把历史文章里的 async rendering 术语，直接等同于今天所有并发实现细节。**
   - M1 只需要把它作为“问题意识与架构方向”的官方历史证据。

---

## M1 建议引用顺序

1. **先用 React 18 发布文定主论点。**
2. **再用 React 18 升级文补“渐进启用”和“一致性约束”。**
3. **最后用 React 16 / 2018 历史文补时间线与 render/commit 语义背景。**

这样既符合当前术语，也能避免把历史背景讲成主线。
