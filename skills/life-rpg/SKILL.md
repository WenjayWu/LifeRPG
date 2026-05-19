# LifeRPG Agent Skill

## 触发条件

当用户发送的消息包含以下意图时激活：
- 提交状态/打卡（"精力3 情绪4..."）
- 完成任务（"完成了收拾桌面"）
- 写复盘（"今天复盘..."）
- 查询今日状态（"今天怎么样"）
- 查询属性（"我多少级了"）

## 执行流程

1. **解析意图** — 判断用户想做什么
2. **调用 agent-bridge.py** — 通过 exec 执行本地脚本
3. **格式化输出** — 将 JSON 结果转为自然语言回复

## 命令映射

| 意图 | CLI 命令 |
|------|----------|
| 提交状态 | `python3 sync/agent-bridge.py submit_status "<text>" [date]` |
| 完成任务 | `python3 sync/agent-bridge.py complete_task <date> <task_key>` |
| 写复盘 | `python3 sync/agent-bridge.py write_review "<text>" [date]` |
| 今日快照 | `python3 sync/agent-bridge.py snapshot [date]` |
| 属性查询 | `python3 sync/agent-bridge.py profile` |

## 自然语言解析规则

### 状态提交
- 格式：`精力X 情绪X 身体X 专注X 社交欲X [模式XX] [今天安排...]`
- 示例：`精力3 情绪4 身体2 专注3 社交欲1 模式无聊`
- 缺失字段默认 3，模式默认"普通"

### 任务完成
- 关键词："完成了"、"做完"、"搞定" + 任务名
- 需要匹配 task_key 或 title
- 示例：`完成了收拾桌面` → complete_task tidy_desk

### 复盘
- 关键词："复盘"、"review"、"总结"
- 示例：`今天复盘：完成了收拾桌面，感觉不错`

## 输出格式

### 状态提交成功
```
📊 状态已记录（2026-05-19）
模式：无聊
推荐任务：
1. 收拾桌面 10 分钟 [秩序 +5]
2. 画一张速写 [创造 +20]
3. 城市探索半天副本 [创造 +60]
```

### 任务完成
```
✅ 收拾桌面 10 分钟 — 完成！
秩序 +5 XP（84/100）
```

### 属性查询
```
🏆 当前等级
体能 Lv.2 (57/100)
智识 Lv.5 (3/225)
创造 Lv.2 (55/100)
工程 Lv.3 (115/150)
社交 Lv.1 (48/100)
秩序 Lv.2 (84/100)
```

## 安全

- service_role key 仅存储在本地 `.env`
- 文件权限 600
- 不上传任何云端
- 不显示 key 在对话中

## 依赖

- `sync/agent-bridge.py` — 本地桥接脚本
- `.env` — Supabase 配置（本地 only）
- `data/tasks.json` — 任务库
