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
