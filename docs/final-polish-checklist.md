# 最终收尾检查清单

## 1. 入口与导览
- [ ] README 清楚说明仓库目标、边界、基线版本与推荐阅读顺序。
- [x] README 明确链接到当前稳定入口 `docs/final-guide-draft.md`。
- [x] STATUS、README、roadmap 对 M1-M7 的状态口径一致。

## 2. 主线一致性
- [ ] 最终总览已把 M1-M6 串成单一学习路径，而不是六篇松散文章。
- [ ] 各模块开头结论与最终总览不冲突。
- [ ] React 19 仍保持轻量 delta 位置，不喧宾夺主。

## 3. 证据回指
- [ ] 最终总览中的每段关键结论都能回指到对应模块。
- [ ] 每个模块都保留 evidence notes / source entry points 的最小可用入口。
- [ ] 没有出现“总览说得过满，但模块证据接不住”的断层。

## 4. 图示准备
- [x] 已确定高优先级图示名单与命名。
- [x] 每张图只回答一个核心问题，不重复正文。
- [ ] 优先 SVG，PNG 仅按需导出。

## 5. 语言与术语
- [ ] 中文保持书面、通俗、非黑话。
- [ ] `current` / `workInProgress` / `finishedWork` 用词统一。
- [ ] `render` / `commit`、`lane` / `priority` / `scheduler`、`suspend` / `ping` / `retry` 用词统一。

## 6. 边界控制
- [ ] M7 没有扩写到 RSC、`use`、streaming SSR、hydration、Activity、ViewTransition 等新范围。
- [ ] 没有为了“更完整”而重新打开 M1-M6 做大改写。
- [ ] 收尾工作以统一、收束、可交付为目标，而不是继续扩张主题。
