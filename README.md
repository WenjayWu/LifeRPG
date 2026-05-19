# 杰的人生 RPG 状态面板

这是一个轻量的生活工作流系统：聊天里汇报状态，我给出今日任务；网页负责可视化展示、抽卡、任务库和历史趋势。

## 怎么打开

直接用浏览器打开：

```text
life-rpg/index.html
```

页面是单文件静态网页，内置演示数据，双击打开也能使用。`data/tasks.json` 和 `data/profile.json` 是任务库和角色档案，`data/history.json` 是由 Markdown 日志生成的趋势数据。

## 每日聊天格式

```text
老板，今天状态打个分：
精力 1-5：
情绪 1-5：
身体 1-5：
专注 1-5：
社交欲 1-5：
现在更像：低能量 / 普通 / 高能量 / 烦躁 / 空虚 / 无聊 / 想社交 / 想创造？
今天有什么硬性安排？
```

你回复后，我会给出：

- 今日模式判断
- 今日 3 个推荐任务
- 一个反无聊备选
- 今日 Boss 或恢复建议
- XP 归属
- 一句晚上复盘问题

## 长期记录与趋势

每天在 `records/YYYY-MM-DD.md` 里保存一篇日志，格式参考 `templates/daily-rpg.md`。日志是长期可信源数据，`data/history.json` 可以随时重新生成：

```powershell
.\sync\build-history.ps1
```

如果浏览器直接打开 `index.html` 时不能自动读取 `data/history.json`，用页面里的“导入 history.json”按钮手动导入即可。

## 早晚更新闭环

当前线程配置了一个 Codex 自动提醒：每天 08:30 和 21:30 触发。

- 08:30：我会问五维状态、当前模式和硬性安排，然后生成今日任务。
- 21:30：我会问任务完成情况、状态变化和一句复盘。

你可以直接聊天回复，也可以在面板调好状态后点“复制给 Codex”，把复制文本发给我。收到后我会更新当天 `records/YYYY-MM-DD.md`，再运行：

```powershell
.\sync\build-history.ps1
```

任务在早上默认记为 `[ ]`，晚上你反馈完成情况后再改成 `[x]`。坚果云客户端会负责同步当前 `life-rpg` 文件夹。

## 坚果云 WebDAV 同步

凭证只放在本机环境变量，不写入网页和数据文件：

```powershell
$env:NUTSTORE_WEBDAV_URL = "https://dav.jianguoyun.com/dav"
$env:NUTSTORE_WEBDAV_USER = "你的账号"
$env:NUTSTORE_WEBDAV_PASS = "你的应用密码"
```

推荐日常流程：

```powershell
.\sync\pull.ps1
# 让 Codex 更新 records/YYYY-MM-DD.md
.\sync\build-history.ps1
.\sync\push.ps1
```

远端目录默认是 `/life-rpg/`。如果要换目录：

```powershell
.\sync\pull.ps1 -RemoteRoot "LifeRPG"
.\sync\push.ps1 -RemoteRoot "LifeRPG"
```

冲突策略：拉取时如果同一天日志本地和远端内容不同，脚本会保留远端副本为 `*.remote-时间戳.md`，之后让 Codex 合并。

手机端建议只查看同步后的面板和趋势；主要编辑和同步仍由电脑端 Codex 执行。

## 后续可升级

- 更强的周报和 XP 曲线
- 增加成就解锁、Boss 血条和技能树
