---
outline: [2, 3]
prev:
  text: '总览'
  link: /guide/
next:
  text: 'M1 | 为什么需要 Fiber'
  link: /modules/m1
---

# 推荐阅读顺序

## 读法一：先抓全局主线

1. [最终总览](/guide/) — 先建立整条学习主线
2. 按需回看对应模块正文
3. 需要校验时查阅证据笔记

## 读法二：按模块顺读

| 序号 | 模块 | 核心问题 |
|:---:|------|----------|
| 1 | [M1：为什么需要 Fiber](/modules/m1) | 旧的同步渲染模型哪里不够用 |
| 2 | [M2：Fiber 节点与树遍历](/modules/m2) | Fiber 作为工作单元长什么样 |
| 3 | [M3：双树与 render/commit](/modules/m3) | render 怎样把结果交给 commit |
| 4 | [M4：一次 setState 全链路](/modules/m4) | 一次更新怎样从组件走到提交 |
| 5 | [M5：lanes / priority / scheduler](/modules/m5) | 多条更新并存时如何取舍 |
| 6 | [M6：Suspense / Offscreen / retry](/modules/m6) | 工作卡住时如何回退恢复 |

## 如果你只想快速复习

只看这四项即可抓住最核心骨架：

1. [最终总览](/guide/)
2. [M3：双树与 render/commit](/modules/m3)
3. [M4：一次 setState 全链路](/modules/m4)
4. [M5：lanes / priority / scheduler](/modules/m5)

## 学习边界

- 基线版本：**React v18.2.0**
- 对照目标：**React main / React 19 相关增量**
- 方法：**概念优先，证据导向，最小必要源码入口**

明确不在范围内：RSC、`use`、streaming SSR、hydration、Activity、ViewTransition。
