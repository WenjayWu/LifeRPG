收到，我先总结杰哥的架构升级，然后我们一起做计划。

---

## 📊 LifeRPG 架构升级总结

### 核心变化

| 维度 | 之前 | 现在 |
|------|------|------|
| **数据源** | localStorage + 本地文件 | **Supabase** (PostgreSQL + Realtime) |
| **部署** | 坚果云 WebDAV | **GitHub Pages** |
| **同步** | 手动脚本 | **Supabase Realtime 多端实时同步** |
| **认证** | 无 | **Supabase Auth (OTP 邮箱登录)** |
| **备份** | 实时核心 | **导出降级** (records/ + history.json) |
| **PWA** | 无 | **manifest + Service Worker + 图标** |

### 数据表结构 (Supabase)

| 表名 | 用途 |
|------|------|
| `daily_entries` | 每日五维状态 + 模式 + 复盘 |
| `task_instances` | 任务实例（完成状态、XP） |
| `profile_attributes` | 六维属性（等级、XP） |
| `agent_events` | Agent/CLI 操作日志 |
| `weekly_reports` | 周报数据 |

### Edge Functions (Deno/Supabase)

| 函数 | 用途 |
|------|------|
| `submit_status` | 解析状态文本 → 写入 daily_entries + 生成任务 |
| `complete_task` | 标记任务完成/取消 |
| `write_review` | 写入复盘 |
| `generate_daily_plan` | 生成每日计划 |
| `run_weekly_analysis` | 生成周报 |

### 前端集成 (app.js)

- `remote-store.js` — Supabase 客户端封装（登录、读写、Realtime 订阅）
- `config.js` — Supabase URL + anon key（可公开）
- 自动检测网络恢复后同步
- 同步状态指示器（sync-dot）

### 未完成目标 (DEVELOPMENT_LOG.md)

1. **Agent 闭环** — 让 Lyra 通过 Edge Functions API 读写 Supabase
2. **自动备份** — 定时导出 records/ + history.json
3. **任务数据源收拢** — data/tasks.json 成为前端/CLI/Edge Functions 共同数据源
4. **周报增强** — 从简单统计升级为趋势总结
5. **移动端体验优化** — 减少误触、同步状态可见性
6. **部署工具链** — 安装 Supabase CLI / Deno，正式部署 Edge Functions

---

## 💡 我的观察

**杰哥做得非常专业**：
- 数据架构清晰（RLS 权限控制、Realtime 同步）
- 前后端分离（GitHub Pages + Supabase）
- PWA 支持手机使用
- Edge Functions 为 Agent 接入预留了接口
- 安全边界明确（不提交个人数据、不硬编码密钥）

**当前痛点**（从日志看）：
1. Edge Functions 只是脚手架，未正式部署
2. Agent 闭环未打通（Lyra 还不能直接调用）
3. 任务数据源分散（前端、CLI、Edge Functions 各有一份 tasks 数组）
4. 周报功能简单

---

## 📋 建议的完善计划

杰哥想从哪个方向开始？或者你有自己的优先级？

**方向 A：Agent 闭环**（让 Lyra 能直接操作 LifeRPG）
- 部署 Edge Functions
- Lyra 通过 API 调用 submit_status / complete_task / write_review
- 飞书聊天直接录入状态、完成任务、写复盘

**方向 B：任务数据源收拢**
- data/tasks.json 成为唯一任务库
- 前端、CLI、Edge Functions 都读取同一文件
- 支持自定义任务

**方向 C：周报增强**
- 基于 7/30 天数据生成趋势分析
- 异常检测（连续低能量、某属性停滞）
- 下一步建议

**方向 D：移动端体验**
- 减少误触
- 同步状态更可见
- 复盘和任务完成流程优化

**方向 E：自动备份**
- GitHub Actions 定时导出
- 或本地计划任务

杰哥倾向哪个？或者你有其他想法？