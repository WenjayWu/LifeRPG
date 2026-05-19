# 杰的人生 RPG 状态面板

这是一个轻量的生活工作流系统：聊天里汇报状态，AI 给出今日任务；网页负责可视化展示、抽卡、任务库和历史趋势。

## 项目结构

```
LifeRPG/
├── src/                    ← 源码（GitHub）
│   ├── index.html          ← 主入口
│   ├── css/
│   │   └── style.css       ← 全部样式
│   └── js/
│       └── app.js          ← 全部逻辑
├── data/                   ← 运行时数据（坚果云同步，.gitignore）
│   ├── profile.json
│   ├── tasks.json
│   └── history.json
├── records/                ← 日志（坚果云同步，.gitignore）
├── sync/                   ← 同步脚本
│   ├── build-history.ps1   ← 生成 history.json
│   ├── build-and-sync.ps1  ← 构建 + 推送到坚果云
│   ├── pull-from-nutstore.ps1 ← 从坚果云拉取数据
│   └── _webdav-common.ps1   ← WebDAV 公共配置
├── templates/              ← 日志模板
├── docs/                   ← 文档
└── README.md
```

## 怎么打开

### 本地开发
```bash
cd src/
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

### 坚果云访问
坚果云同步后，通过 WebDAV 访问：
```
https://dav.jianguoyun.com/dav/life-rpg/index.html
```

## 每日聊天格式

```text
精力 1-5：
情绪 1-5：
身体 1-5：
专注 1-5：
社交欲 1-5：
现在更像：低能量 / 普通 / 高能量 / 烦躁 / 空虚 / 无聊 / 想社交 / 想创造？
今天有什么硬性安排？
```

回复后，AI 会给出：
- 今日模式判断
- 今日 3 个推荐任务
- 一个反无聊备选
- 今日 Boss 或恢复建议
- XP 归属
- 一句晚上复盘问题

## 同步流程

### 推送到坚果云（发布新版本）
```powershell
.\sync\build-and-sync.ps1
```

### 从坚果云拉取数据（换电脑或数据冲突）
```powershell
.\sync\pull-from-nutstore.ps1
```

### Lyra 集成（聊天录入状态）
```bash
# 在飞书直接发送状态，Lyra 会自动解析并写入 records
# 格式：精力3 情绪4 身体2 专注3 社交欲1 模式无聊 今天休息

# 也可以手动运行 CLI
python3 sync/life-rpg-cli.py '精力3 情绪4 身体2 专注3 社交欲1 模式无聊 今天休息'
```

### 构建 history.json（Linux/WSL）
```bash
python3 sync/build-history.py
```

### 日常开发流程
```powershell
# 1. 修改代码（src/ 目录）
# 2. 提交到 GitHub
git add .
git commit -m "更新..."
git push

# 3. 发布到坚果云
.\sync\build-and-sync.ps1
```

## 数据管理

| 数据类型 | 存储位置 | 同步方式 |
|---------|---------|---------|
| 源码 | GitHub | git |
| 运行时数据 | 坚果云 | WebDAV |
| 日志 | 坚果云 | WebDAV |
| 本地配置 | localStorage | 浏览器 |

## 坚果云 WebDAV 配置

环境变量（不写入代码）：
```powershell
$env:NUTSTORE_WEBDAV_URL = "https://dav.jianguoyun.com/dav"
$env:NUTSTORE_WEBDAV_USER = "你的账号"
$env:NUTSTORE_WEBDAV_PASS = "你的应用密码"
```

## 后续可升级

- [ ] 任务完成系统 + XP 自动累加
- [ ] 成就解锁系统
- [ ] Boss 血条 + 回合进度
- [ ] 技能树系统
- [ ] 周报表生成
- [ ] 与 AI 直接集成（聊天录入状态）

---

*LifeRPG v0.1*