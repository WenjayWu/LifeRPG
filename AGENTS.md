# AGENTS.md

> 本文件为 agent 工作规则；项目说明见 [`README.md`](README.md)。

## 提交信息

遵循 Conventional Commits 精简版：`type[(scope)]: 描述`。

- type ∈ `feat` `fix` `docs` `refactor` `perf` `test` `build` `ci` `chore` `style` `revert`；scope 可选（`fix(viewer): ...`）
- 描述语言不限（中文如 `fix: 修复……` 合规）；动词开头、不加句号；body 可补充动机与影响
- 禁止 `update:` `change:` `final:` 等模糊前缀与裸描述；禁止 `[verified]` 等流程标记写入 subject（写入 body）
- 豁免 git 自动生成：`Merge ...`、`Revert ...`、`fixup!`、`squash!`、`Initial commit`
