#!/usr/bin/env python3
"""
把当前本地 LifeRPG 数据导入 Supabase。

需要环境变量：
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_USER_ID
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path


def rest_request(path, method="POST", payload=None, prefer="resolution=merge-duplicates"):
    base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base_url or not key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    url = f"{base_url}/rest/v1/{path}"
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", f"{prefer},return=representation")
    with urllib.request.urlopen(req, timeout=30) as response:
        body = response.read().decode("utf-8")
        return json.loads(body) if body else None


def parse_tasks_from_record(path):
    if not path.exists():
        return []
    tasks = []
    pattern = re.compile(r"- \[(?P<done>[ xX])\]\s*(?P<type>[^：:]+)任务[：:](?P<title>[^｜|]+)[｜|](?P<attr>[^｜|]+)[｜|]\+(?P<xp>\d+)\s*XP")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.search(line)
        if not match:
            continue
        tasks.append({
            "completed": match.group("done").lower() == "x",
            "task_type": match.group("type").strip(),
            "title": match.group("title").strip(),
            "attribute": match.group("attr").strip(),
            "xp": int(match.group("xp")),
        })
    return tasks


def load_task_key_map(root):
    tasks_path = root / "data" / "tasks.json"
    if not tasks_path.exists():
        return {}
    tasks = json.loads(tasks_path.read_text(encoding="utf-8"))
    return {
        task.get("title"): task.get("key")
        for task in tasks
        if task.get("title") and task.get("key")
    }


def main():
    user_id = os.environ.get("SUPABASE_USER_ID")
    if not user_id:
        raise RuntimeError("Missing SUPABASE_USER_ID")

    root = Path(__file__).resolve().parent.parent
    history_path = root / "data" / "history.json"
    profile_path = root / "data" / "profile.json"
    history_payload = json.loads(history_path.read_text(encoding="utf-8"))
    records = history_payload.get("records", history_payload if isinstance(history_payload, list) else [])
    key_by_title = load_task_key_map(root)

    entries = []
    task_rows = []
    for record in records:
        date = record["date"]
        entries.append({
            "user_id": user_id,
            "entry_date": date,
            "energy": record.get("energy", 3),
            "mood": record.get("mood", 3),
            "body": record.get("body", 3),
            "focus": record.get("focus", 3),
            "social": record.get("social", 3),
            "mode": record.get("mode", "普通"),
        })
        for task in parse_tasks_from_record(root / "records" / f"{date}.md"):
            task_rows.append({
                "user_id": user_id,
                "task_date": date,
                "task_key": key_by_title.get(task["title"], task["title"]),
                "title": task["title"],
                "task_type": task["task_type"],
                "attribute": task["attribute"],
                "xp": task["xp"],
                "completed": task["completed"],
            })

    if entries:
        rest_request("daily_entries?on_conflict=user_id,entry_date", payload=entries)
    if task_rows:
        rest_request("task_instances?on_conflict=user_id,task_date,task_key", payload=task_rows)

    if profile_path.exists():
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        attrs = []
        for index, item in enumerate(profile.get("attributes", [])):
            attrs.append({
                "user_id": user_id,
                "name": item["name"],
                "level": item.get("level", 1),
                "xp": item.get("xp", 0),
                "next_xp": item.get("next", 100),
                "sort_order": index,
            })
        if attrs:
            rest_request("profile_attributes?on_conflict=user_id,name", payload=attrs)

    print(f"✓ imported {len(entries)} daily entries, {len(task_rows)} task instances")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        sys.exit(1)
