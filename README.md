# 杰的 LifeRPG 状态面板

LifeRPG 是一个个人状态、任务和复盘面板。现在的主链路是：

- 前端：静态页面，可本地打开，也可部署到 GitHub Pages。
- 运行数据：Supabase，负责登录、实时读写和多端同步。
- Agent/API：后续通过 Supabase Edge Functions 读写同一套数据。
- 备份：`records/*.md` 和 `data/history.json` 只作为导出/离线备份，不再作为日常实时同步核心。

## 当前状态

- 前端已经接入 Supabase 登录、状态保存、任务实例、属性和历史读取。
- 本地历史数据可以通过 `sync/import-to-supabase.py` 导入 Supabase。
- Supabase 数据可以通过 `sync/export-from-supabase.py` 导出回 Markdown 和 `history.json`。
- 坚果云 WebDAV 已降级为可选备份目标，不再保存硬编码账号或应用密码。

## 项目结构

```text
LifeRPG/
├─ src/                    静态前端源码，GitHub Pages 发布目录
│  ├─ index.html
│  ├─ css/style.css
│  └─ js/
│     ├─ app.js
│     ├─ config.js         前端 Supabase 公共配置
│     └─ remote-store.js   Supabase 读写封装
├─ supabase/
│  ├─ migrations/          数据表、RLS、Realtime 配置
│  └─ functions/           Edge Functions
├─ sync/                   导入、导出、本地 CLI、可选备份脚本
├─ records/                Markdown 备份
├─ data/                   history/profile/tasks 离线备份
└─ start-liferpg.ps1       本地启动脚本
```

## 本地开发

在项目根目录运行：

```powershell
.\start-liferpg.ps1
```

默认访问：

```text
http://127.0.0.1:8899/
```

也可以指定端口：

```powershell
$env:LIFERPG_PORT="8900"
.\start-liferpg.ps1
```

本地服务窗口要保持打开；关闭 PowerShell 后，`127.0.0.1` 页面就会停止。

## Supabase 配置

前端只允许放 Supabase Project URL 和 anon/publishable key。不要把 `service_role` key、WebDAV 密码或任何私密令牌写进前端文件。

`src/js/config.js` 示例：

```js
window.LIFERPG_CONFIG = {
  supabaseUrl: "https://你的项目.supabase.co",
  supabaseAnonKey: "你的 anon/publishable key",
  redirectTo: window.location.origin + window.location.pathname
};
```

需要在 Supabase Auth 的 Redirect URLs 中加入你实际访问的地址，例如：

```text
http://127.0.0.1:8899/
https://wenjaywu.github.io/LifeRPG/
```

## GitHub Pages 发布

本仓库包含 GitHub Actions 工作流：`.github/workflows/pages.yml`。

首次启用：

1. 打开 GitHub 仓库 `Settings -> Pages`。
2. Source 选择 `GitHub Actions`。
3. 推送 `main` 分支后，Actions 会把 `src/` 发布到 GitHub Pages。
4. 发布地址通常是：

```text
https://wenjaywu.github.io/LifeRPG/
```

发布后，把这个地址加入 Supabase Auth Redirect URLs。以后手机和电脑都访问这个固定网址，不需要本地 PowerShell。

## 数据导入

从本地 `data/history.json`、`records/*.md` 和 `data/profile.json` 导入 Supabase：

```powershell
cd D:\Professional\Coding\Codex\LifeRPG

$env:SUPABASE_URL="https://你的项目.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="你的 service_role key"
$env:SUPABASE_USER_ID="你的 auth.users.id"

python sync\import-to-supabase.py
```

`service_role` key 只在当前 PowerShell 窗口里临时使用，不要提交到 Git。

## 数据导出备份

从 Supabase 导出为 `records/*.md` 和 `data/history.json`：

```powershell
cd D:\Professional\Coding\Codex\LifeRPG

$env:SUPABASE_URL="https://你的项目.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="你的 service_role key"

python sync\export-from-supabase.py
```

导出的文件用于备份、审阅或离线 fallback；日常使用不再依赖手动拉取/上传这些文件。

## Edge Functions

已准备的函数：

- `submit_status`
- `generate_daily_plan`
- `complete_task`
- `write_review`
- `run_weekly_analysis`

这些函数用于后续 Agent 闭环。稳定发布完成后，再部署并逐个验证。

## 可选坚果云备份

坚果云现在只作为可选备份目标。使用前在本地终端设置环境变量：

```powershell
$env:NUTSTORE_WEBDAV_URL="https://dav.jianguoyun.com/dav"
$env:NUTSTORE_WEBDAV_USER="你的账号"
$env:NUTSTORE_WEBDAV_PASS="你的应用密码"
```

如果旧版本曾经把坚果云应用密码提交到 GitHub，请先在坚果云后台重置该应用密码。

## 验证清单

本地静态检查：

```powershell
node --check src\js\app.js
node --check src\js\remote-store.js
python -m py_compile sync\build-history.py sync\life-rpg-cli.py sync\deploy.py sync\import-to-supabase.py sync\export-from-supabase.py
```

功能验证：

- 登录后刷新页面，今日状态、复盘、任务和属性仍能恢复。
- 修改状态后，Supabase `daily_entries` 更新。
- 添加/完成任务后，Supabase `task_instances` 更新。
- 完成任务后，`profile_attributes` 更新且 XP 不重复累计。
- 手机和电脑同时打开 Pages 地址时，一个端修改，另一个端能自动更新。
