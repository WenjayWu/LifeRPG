# LifeRPG 开发日志

更新时间：2026-05-19

## 当前定位

LifeRPG 是一个个人状态、任务和复盘系统。当前稳定方向是：

- GitHub Pages 托管静态前端。
- Supabase 作为唯一运行时数据源，负责登录、实时读写和多端同步。
- PWA 支持手机添加到主屏幕，作为日常使用入口。
- `records/*.md`、`data/history.json`、`data/profile.json` 只作为本地导出、备份或离线 fallback，不再作为实时同步核心。

## 已完成进度

- 完成 Supabase 数据表、RLS 和 Realtime 基础配置。
- 前端已接入 Supabase 登录、今日状态保存、任务实例、属性读取和历史读取。
- 完成本地历史数据导入脚本：`sync/import-to-supabase.py`。
- 完成 Supabase 导出脚本：`sync/export-from-supabase.py`。
- 完成 GitHub Pages 部署工作流，发布目录为 `src/`。
- 完成 PWA 基础能力：manifest、Service Worker、图标和移动端安装入口。
- 完成 Git 隐私收口：个人记录、历史和 profile 不再进入 Git；`data/tasks.json` 继续作为任务模板提交。
- 移除 WebDAV 硬编码凭据，坚果云只保留为可选备份目标。
- 准备了 Edge Functions 脚手架：`submit_status`、`generate_daily_plan`、`complete_task`、`write_review`、`run_weekly_analysis`。

## 当前架构

日常使用链路：

```text
浏览器 / 手机 PWA -> GitHub Pages 前端 -> Supabase -> Realtime 同步
```

Agent/API 目标链路：

```text
Agent / CLI / 外部自动化 -> Supabase Edge Functions -> Supabase -> 前端实时刷新
```

备份链路：

```text
Supabase -> 导出脚本 -> records/*.md + data/history.json
```

职责边界：

- GitHub：源码、静态页面、任务模板、部署工作流。
- Supabase：运行时数据、认证、RLS、Realtime。
- 前端：日常交互、登录、读写 Supabase、离线和同步状态提示。
- Agent/API：后续负责自然语言状态解析、生成计划、写复盘和周报分析。
- 坚果云：可选备份目标，不参与实时数据流。

## 当前可用入口

- GitHub Pages：`https://wenjaywu.github.io/LifeRPG/`
- 本地开发：运行 `.\start-liferpg.ps1` 后访问 `http://127.0.0.1:8899/`
- 手机使用：用手机浏览器打开 GitHub Pages 地址，然后添加到主屏幕。
- 数据导入：通过 `sync/import-to-supabase.py` 把本地历史迁移进 Supabase。
- 数据导出：通过 `sync/export-from-supabase.py` 从 Supabase 导出本地备份。

## 未完成目标

- Agent 闭环：让外部 Agent、CLI 或自动化任务通过同一套 API 读写 Supabase。
- 自动备份：定时从 Supabase 导出 `records/*.md` 和 `data/history.json`。
- 任务数据源收拢：避免前端、CLI 和 Edge Functions 各维护一份任务库。
- 周报增强：让 `weekly_reports` 从简单统计升级为更有行动价值的趋势总结。
- 移动端体验继续优化：减少误触、提升同步状态可见性、优化复盘和任务完成流程。
- 部署工具链补齐：安装并配置 Supabase CLI / Deno 后，再正式部署和验证 Edge Functions。

## 二次开发建议顺序

1. 稳定 Agent/API：先补 `get_today_snapshot`，再打通 `submit_status`、`complete_task` 和 `write_review`。
2. 收拢任务模板：让 `data/tasks.json` 成为前端、CLI、Edge Functions 的共同数据源。
3. 做自动备份：用 GitHub Actions 或本地计划任务定时执行 Supabase 导出。
4. 增强周报：基于最近 7/30 天数据生成趋势、异常和下一步建议。
5. 扩展玩法：在数据链路稳定后，再增加成就、Boss、技能树或更复杂的任务推荐。

## 安全提醒

- 不要提交 `records/`、`data/history.json`、`data/profile.json`。
- 不要把 Supabase `service_role` key、WebDAV 密码、OpenClaw/飞书密钥写进前端或提交到 Git。
- `src/js/config.js` 只能包含 Supabase Project URL 和 anon/publishable key。
- 平台密钥应放在环境变量、Supabase Function Secrets 或 GitHub Secrets。
- 如果仓库曾经公开过个人记录，改为 private 只能阻止后续普通访问，不能保证撤回别人已经拉取、缓存或 fork 的历史内容。
