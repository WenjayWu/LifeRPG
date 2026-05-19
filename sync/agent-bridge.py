#!/usr/bin/env python3
"""
LifeRPG Agent Bridge
本地脚本直连 Supabase，供 Lyra skill 调用
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from pathlib import Path

# ── 配置 ──
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE = PROJECT_ROOT / ".env"

SUPABASE_URL = None
SUPABASE_KEY = None


def _load_env():
    """从 .env 加载配置"""
    global SUPABASE_URL, SUPABASE_KEY
    if not ENV_FILE.exists():
        print("错误: .env 文件不存在", file=sys.stderr)
        sys.exit(1)
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                if key == "SUPABASE_URL":
                    SUPABASE_URL = val.strip()
                elif key == "SUPABASE_SERVICE_ROLE_KEY":
                    SUPABASE_KEY = val.strip()
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("错误: .env 中缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        sys.exit(1)


# ── Supabase REST API 封装 ──

def _request(method, path, data=None, headers=None):
    """发送 HTTP 请求到 Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        req.data = body
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_body = resp.read().decode("utf-8")
            if resp_body:
                try:
                    return json.loads(resp_body)
                except json.JSONDecodeError:
                    return resp_body
            return []
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        raise RuntimeError(f"HTTP {e.code}: {err_body}")
    except Exception as e:
        raise RuntimeError(f"Request failed: {type(e).__name__}: {e}")


def _select(table, columns="*", filters=None, order=None, limit=None):
    """查询数据"""
    params = []
    if columns != "*":
        params.append(f"select={urllib.parse.quote(columns)}")
    if filters:
        for col, val in filters.items():
            params.append(f"{col}=eq.{urllib.parse.quote(str(val))}")
    if order:
        params.append(f"order={urllib.parse.quote(order)}")
    if limit:
        params.append(f"limit={limit}")
    path = table
    if params:
        path += "?" + "&".join(params)
    return _request("GET", path)


def _upsert(table, data, on_conflict=None):
    """插入或更新"""
    headers = {}
    if on_conflict:
        headers["Prefer"] = f"resolution=merge-duplicates,return=representation,on_conflict={on_conflict}"
    else:
        headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    # 先尝试 POST（upsert）
    try:
        return _request("POST", table, data, headers)
    except RuntimeError as e:
        err_str = str(e)
        # 如果冲突，改用 PATCH 更新
        if "23505" in err_str or "duplicate" in err_str.lower() or "already exists" in err_str.lower():
            # 构建过滤条件
            filters = {}
            if on_conflict:
                for col in on_conflict.split(","):
                    col = col.strip()
                    if col in data:
                        filters[col] = data[col]
            if filters:
                result = _update(table, data, filters)
                # PATCH 可能返回空列表或字符串，统一处理
                if isinstance(result, list) and len(result) > 0:
                    return result[0]
                elif isinstance(result, dict):
                    return result
                else:
                    # 返回原始数据作为 fallback
                    return data
        raise



def _update(table, data, filters):
    """更新数据"""
    params = []
    for col, val in filters.items():
        params.append(f"{col}=eq.{urllib.parse.quote(str(val))}")
    path = table + "?" + "&".join(params)
    return _request("PATCH", path, data)


def _insert(table, data):
    """插入数据"""
    headers = {"Prefer": "return=representation"}
    return _request("POST", table, data, headers)


# ── 任务库 ──

def _load_tasks():
    """从 data/tasks.json 加载任务库"""
    tasks_file = PROJECT_ROOT / "data" / "tasks.json"
    if tasks_file.exists():
        with open(tasks_file, "r", encoding="utf-8") as f:
            return json.load(f)
    # fallback: 内置任务
    return [
        {"key": "sun_walk", "title": "晒太阳或散步 12 分钟", "attr": "体能", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["低能量", "烦躁", "空虚"], "type": "恢复", "note": "先让身体离开原地，别急着变强。"},
        {"key": "tidy_desk", "title": "收拾桌面 10 分钟", "attr": "秩序", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["低能量", "无聊", "空虚"], "type": "恢复", "note": "只收 10 分钟，结束后允许停止。"},
        {"key": "read_page", "title": "读一页论文或一本书", "attr": "智识", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["普通", "低能量"], "type": "成长", "note": "把门槛压低，目标是恢复进入状态的能力。"},
        {"key": "run_25min", "title": "跑步或快走 25 分钟", "attr": "体能", "energy": "中", "time": "30 分钟", "xp": 20, "states": ["烦躁", "普通", "高能量"], "type": "成长", "note": "适合脑子乱、身体钝的时候。"},
        {"key": "code_snippet", "title": "做一个代码/AI 小功能", "attr": "工程", "energy": "中", "time": "45 分钟", "xp": 20, "states": ["普通", "想创造", "高能量"], "type": "成长", "note": "只做一个可见的小改动，别开大坑。"},
        {"key": "sketch", "title": "画一张速写或 UI 草图", "attr": "创造", "energy": "中", "time": "30 分钟", "xp": 20, "states": ["想创造", "无聊", "普通"], "type": "娱乐", "note": "重点是动手，不追求成品。"},
        {"key": "social_msg", "title": "给一个朋友发近况", "attr": "社交", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["想社交", "空虚", "普通"], "type": "社交", "note": "一句真诚近况就够，不需要组织大型聊天。"},
        {"key": "social_meal", "title": "约一顿饭或一次散步", "attr": "社交", "energy": "中", "time": "60 分钟", "xp": 20, "states": ["想社交", "高能量"], "type": "社交", "note": "优先约低压力的人。"},
        {"key": "boss_round", "title": "完成一个两小时 Boss 回合", "attr": "智识", "energy": "高", "time": "2 小时", "xp": 60, "states": ["高能量"], "type": "Boss", "note": "选择论文、实验复盘、代码项目中的一个推进。"},
        {"key": "city_explore", "title": "城市探索半天副本", "attr": "创造", "energy": "高", "time": "半天", "xp": 60, "states": ["无聊", "高能量", "想创造"], "type": "娱乐", "note": "带着一个主题出门，比如拍 12 张有结构感的照片。"},
        {"key": "shower_reset", "title": "洗澡 + 换衣 + 清理 5 件物品", "attr": "秩序", "energy": "低", "time": "30 分钟", "xp": 20, "states": ["低能量", "空虚"], "type": "恢复", "note": "低谷日的重启组合。"},
        {"key": "3d_print", "title": "3D 打印/电子小项目推进一格", "attr": "工程", "energy": "高", "time": "60 分钟", "xp": 20, "states": ["想创造", "高能量", "无聊"], "type": "成长", "note": "只推进建模、焊接、测试中的一个步骤。"},
    ]


TASKS = _load_tasks()


# ── 解析 ──

def parse_status_input(text):
    """解析状态输入文本"""
    scores = {}
    for metric in ["精力", "情绪", "身体", "专注", "社交欲"]:
        patterns = [
            rf"{metric}\s*1-5?[：:]\s*(\d)",
            rf"{metric}[：:]\s*(\d)",
            rf"{metric}\s+(\d)",
            rf"{metric}[：:\s]*(\d)",
        ]
        for pat in patterns:
            m = re.search(pat, text)
            if m:
                scores[metric] = int(m.group(1))
                break
        if metric not in scores:
            scores[metric] = 3

    mode_patterns = {
        "低能量": ["低能量", "累", "疲惫", "没劲", "想睡觉"],
        "烦躁": ["烦躁", "烦", "焦虑", "不安", "焦躁"],
        "空虚": ["空虚", "迷茫", "无意义"],
        "无聊": ["无聊", "没意思", "没劲", "闲"],
        "想社交": ["想社交", "想找人", "想聊天", "想说话"],
        "想创造": ["想创造", "有灵感", "想做事", "想做"],
        "高能量": ["高能量", "精力充沛", "状态好", "有劲"],
    }

    mode = "普通"
    text_lower = text.lower()
    mode_explicit = re.search(r"(?:状态|模式)[：:]\s*(\S+)", text)
    if mode_explicit:
        explicit = mode_explicit.group(1)
        for mode_name, keywords in mode_patterns.items():
            if explicit in keywords or any(kw in explicit for kw in keywords):
                mode = mode_name
                break
        else:
            if explicit in ["低能量", "普通", "高能量", "烦躁", "空虚", "无聊", "想社交", "想创造"]:
                mode = explicit

    if mode == "普通":
        for mode_name, keywords in mode_patterns.items():
            if any(kw in text_lower for kw in keywords):
                mode = mode_name
                break

    schedule_match = re.search(r"(?:硬性安排|今天安排|计划)[：:]\s*(.+?)(?:\n|$)", text)
    schedule = schedule_match.group(1).strip() if schedule_match else ""

    return {"scores": scores, "mode": mode, "schedule": schedule}


def pick_tasks(mode, count=3):
    """根据模式推荐任务"""
    matched = [t for t in TASKS if mode in t.get("states", [])]
    fallback = [t for t in TASKS if any(s in t.get("states", []) for s in ["普通", "低能量"])]
    pool = matched if len(matched) >= count else matched + fallback
    import random
    random.shuffle(pool)
    return pool[:count]


# ── 用户 ID ──
_USER_ID = None

def _get_user_id():
    """从 profile_attributes 获取用户 ID（假设单用户）"""
    global _USER_ID
    if _USER_ID:
        return _USER_ID
    rows = _select("profile_attributes", limit=1)
    if rows:
        _USER_ID = rows[0]["user_id"]
        return _USER_ID
    raise RuntimeError("无法获取用户 ID，请先通过前端登录并创建属性")


# ── 动作 ──

def submit_status(text, date=None):
    """解析状态并写入 Supabase"""
    date = date or datetime.now().strftime("%Y-%m-%d")
    status = parse_status_input(text)
    scores = status["scores"]

    # 写入 daily_entries
    user_id = _get_user_id()
    entry = {
        "user_id": user_id,
        "entry_date": date,
        "energy": scores.get("精力", 3),
        "mood": scores.get("情绪", 3),
        "body": scores.get("身体", 3),
        "focus": scores.get("专注", 3),
        "social": scores.get("社交欲", 3),
        "mode": status["mode"],
        "schedule": status["schedule"],
    }
    _upsert("daily_entries", entry, on_conflict="user_id,entry_date")

    # 生成任务
    tasks = pick_tasks(status["mode"])
    for task in tasks:
        task_row = {
            "user_id": user_id,
            "task_date": date,
            "task_key": task["key"],
            "title": task["title"],
            "task_type": task["type"],
            "attribute": task["attr"],
            "xp": task["xp"],
            "time_label": task["time"],
            "note": task["note"],
            "completed": False,
        }
        _upsert("task_instances", task_row, on_conflict="user_id,task_date,task_key")

    # 记录 agent event
    _insert("agent_events", {
        "user_id": user_id,
        "event_type": "submit_status",
        "payload": {"date": date, "text": text, "status": status, "tasks": [t["key"] for t in tasks]},
    })

    return {"date": date, "mode": status["mode"], "tasks": tasks}


def complete_task(date, task_key):
    """标记任务完成"""
    # 先查询任务
    rows = _select("task_instances", filters={"task_date": date, "task_key": task_key})
    if not rows:
        raise RuntimeError(f"任务不存在: {task_key} on {date}")
    task = rows[0]

    # 更新完成状态
    completed = not task.get("completed", False)
    _update("task_instances", {
        "completed": completed,
        "completed_at": datetime.now().isoformat() if completed else None,
    }, {"id": task["id"]})

    # 更新属性 XP
    if completed:
        attr = task.get("attribute")
        xp = task.get("xp", 0)
        if attr and xp > 0:
            _update_profile_xp(attr, xp)

    return {"task": task["title"], "completed": completed, "xp": task.get("xp", 0)}


def _update_profile_xp(attr_name, xp_delta):
    """更新属性 XP"""
    user_id = _get_user_id()
    rows = _select("profile_attributes", filters={"name": attr_name, "user_id": user_id})
    if rows:
        current = rows[0]
        new_xp = current.get("xp", 0) + xp_delta
        # 检查升级
        next_xp = current.get("next_xp", 100)
        level = current.get("level", 1)
        while new_xp >= next_xp:
            new_xp -= next_xp
            level += 1
            next_xp = round(next_xp * 1.5)
        _update("profile_attributes", {
            "xp": new_xp,
            "level": level,
            "next_xp": next_xp,
        }, {"id": current["id"]})
    else:
        # 创建新属性
        _insert("profile_attributes", {
            "user_id": user_id,
            "name": attr_name,
            "xp": max(0, xp_delta),
            "level": 1,
            "next_xp": 100,
        })


def write_review(text, date=None):
    """写入复盘"""
    date = date or datetime.now().strftime("%Y-%m-%d")
    user_id = _get_user_id()
    _update("daily_entries", {"review": text}, {"entry_date": date, "user_id": user_id})
    _insert("agent_events", {
        "user_id": user_id,
        "event_type": "write_review",
        "payload": {"date": date, "review": text},
    })
    return {"date": date, "review": text}


def get_today_snapshot(date=None):
    """获取今日完整数据"""
    date = date or datetime.now().strftime("%Y-%m-%d")
    user_id = _get_user_id()

    entries = _select("daily_entries", filters={"entry_date": date, "user_id": user_id})
    entry = entries[0] if entries else None

    tasks = _select("task_instances", filters={"task_date": date, "user_id": user_id}, order="created_at")

    attrs = _select("profile_attributes", filters={"user_id": user_id}, order="sort_order")

    return {
        "date": date,
        "entry": entry,
        "tasks": tasks,
        "attributes": attrs,
    }


def get_profile():
    """获取属性等级"""
    user_id = _get_user_id()
    return _select("profile_attributes", filters={"user_id": user_id}, order="sort_order")


# ── CLI 入口 ──

def main():
    _load_env()

    if len(sys.argv) < 2:
        print("用法: python3 agent-bridge.py <action> [args...]")
        print("")
        print("actions:")
        print("  submit_status <text> [date]     解析状态并生成任务")
        print("  complete_task <date> <task_key> 标记任务完成/取消")
        print("  write_review <text> [date]      写入复盘")
        print("  snapshot [date]                 获取今日快照")
        print("  profile                         获取属性等级")
        sys.exit(1)

    action = sys.argv[1]

    try:
        if action == "submit_status":
            text = sys.argv[2]
            date = sys.argv[3] if len(sys.argv) > 3 else None
            result = submit_status(text, date)
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif action == "complete_task":
            if len(sys.argv) < 4:
                print("错误: 需要 date 和 task_key", file=sys.stderr)
                sys.exit(1)
            date = sys.argv[2]
            task_key = sys.argv[3]
            result = complete_task(date, task_key)
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif action == "write_review":
            text = sys.argv[2]
            date = sys.argv[3] if len(sys.argv) > 3 else None
            result = write_review(text, date)
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif action == "snapshot":
            date = sys.argv[2] if len(sys.argv) > 2 else None
            result = get_today_snapshot(date)
            print(json.dumps(result, ensure_ascii=False, indent=2))

        elif action == "profile":
            result = get_profile()
            print(json.dumps(result, ensure_ascii=False, indent=2))

        else:
            print(f"错误: 未知 action: {action}", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
