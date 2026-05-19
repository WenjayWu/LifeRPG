#!/usr/bin/env python3
"""
从 Supabase 导出 LifeRPG 运行数据到本地备份文件。

需要环境变量：
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY 或 SUPABASE_ACCESS_TOKEN
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path


def request_json(path, query):
    base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    token = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ACCESS_TOKEN")
    if not base_url or not token:
        raise RuntimeError("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ACCESS_TOKEN")

    url = f"{base_url}/rest/v1/{path}?{urllib.parse.urlencode(query, doseq=True)}"
    req = urllib.request.Request(url)
    req.add_header("apikey", token)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def xp_summary(tasks):
    totals = {}
    for task in tasks:
        if not task.get("completed"):
            continue
        attr = task.get("attribute") or "未分类"
        totals[attr] = totals.get(attr, 0) + int(task.get("xp") or 0)
    return totals


def write_record(record, tasks, records_dir):
    lines = [
        "# Daily RPG",
        "",
        f"日期：{record['entry_date']}",
        "",
        "## 状态评分",
        "",
        f"- 精力 1-5：{record['energy']}",
        f"- 情绪 1-5：{record['mood']}",
        f"- 身体 1-5：{record['body']}",
        f"- 专注 1-5：{record['focus']}",
        f"- 社交欲 1-5：{record['social']}",
        "",
        "## 今日模式",
        "",
        record.get("mode") or "普通",
        "",
        "## 硬性安排",
        "",
        record.get("schedule") or "-",
        "",
        "## 今日任务",
        "",
    ]
    if tasks:
        for task in tasks:
            mark = "x" if task.get("completed") else " "
            lines.append(f"- [{mark}] {task['task_type']}任务：{task['title']}｜{task['attribute']}｜+{task['xp']} XP")
    else:
        lines.append("- [ ] 暂无")

    lines.extend(["", "## XP 归属", ""])
    totals = xp_summary(tasks)
    if totals:
        lines.extend([f"- {attr}：{xp}" for attr, xp in totals.items()])
    else:
        lines.append("- 暂无")

    lines.extend(["", "## 一句复盘", "", record.get("review") or ""])
    path = records_dir / f"{record['entry_date']}.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    root = Path(__file__).resolve().parent.parent
    records_dir = root / "records"
    data_dir = root / "data"
    records_dir.mkdir(exist_ok=True)
    data_dir.mkdir(exist_ok=True)

    entries = request_json("daily_entries", {
        "select": "*",
        "order": "entry_date.asc",
    })
    tasks = request_json("task_instances", {
        "select": "*",
        "order": "task_date.asc,created_at.asc",
    })
    tasks_by_date = {}
    for task in tasks:
        tasks_by_date.setdefault(task["task_date"], []).append(task)

    history_records = []
    for entry in entries:
        day_tasks = tasks_by_date.get(entry["entry_date"], [])
        write_record(entry, day_tasks, records_dir)
        history_records.append({
            "date": entry["entry_date"],
            "energy": entry["energy"],
            "mood": entry["mood"],
            "body": entry["body"],
            "focus": entry["focus"],
            "social": entry["social"],
            "mode": entry.get("mode") or "普通",
            "xp": xp_summary(day_tasks),
            "completedTasks": len([task for task in day_tasks if task.get("completed")]),
        })

    history = {
        "generatedAt": entries[-1]["entry_date"] if entries else "",
        "source": "supabase",
        "records": history_records,
    }
    (data_dir / "history.json").write_text(json.dumps(history, ensure_ascii=False, indent=4), encoding="utf-8")
    print(f"✓ exported {len(history_records)} days from Supabase")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Export failed: {exc}", file=sys.stderr)
        sys.exit(1)
