# AGENTS.md

> 本文件为 agent 工作规则；项目说明见 [`README.md`](README.md)。

## 提交信息

遵循 Conventional Commits 精简版：`type[(scope)]: 描述`。首行 ≤ 72 字符；一个提交只做一类事，混合变更拆分。

- 语言档位：默认档——描述语言不限（中文可用）；动词开头、不加句号；body 可补充动机与影响
- type ∈ `feat` `fix` `docs` `refactor` `perf` `test` `build` `ci` `chore` `style` `revert`；scope 可选（`fix(viewer): ...`），限 ASCII 字母数字与 `.` `_` `/` `-`
- 破坏性变更用 `!`：`feat(api)!: ...`
- 禁止 `update:` `change:` `final:` 等模糊前缀与裸描述；禁止 `[verified]` 等流程标记写入 subject（写入 body）
- 豁免 git 自动生成：`Merge ...`、`Revert ...`、`fixup!`、`squash!`、`amend!`、裸 `Initial commit`
