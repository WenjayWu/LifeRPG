#!/usr/bin/env python3
"""
LifeRPG Skill Parser
解析自然语言意图，调用 agent-bridge.py
"""

import sys
import json
import re
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BRIDGE = PROJECT_ROOT / "sync" / "agent-bridge.py"


def _call(action, *args):
    """调用 agent-bridge.py"""
    cmd = [sys.executable, str(BRIDGE), action] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)


def parse_intent(text):
    """解析用户意图"""
    text = text.strip()
    
    # 状态提交: 精力X 情绪X ...
    if any(kw in text for kw in ["精力", "情绪", "身体", "专注", "社交欲"]):
        return "submit_status", [text]
    
    # 任务完成: 完成了/做完/搞定 + 任务名
    complete_patterns = [
        r"完成了(.+)",
        r"做完(.+)",
        r"搞定(.+)",
        r"(.+)完成了",
    ]
    for pat in complete_patterns:
        m = re.search(pat, text)
        if m:
            task_name = m.group(1).strip()
            return "complete_task", [task_name]
    
    # 复盘
    if any(kw in text for kw in ["复盘", "review", "总结"]):
        return "write_review", [text]

    # 属性查询
    if any(kw in text for kw in ["多少级", "等级", "属性"]):
        return "profile", []
    
    # 查询
    if any(kw in text for kw in ["今天怎么样", "状态", "任务", "多少级"]):
        return "snapshot", []
    
    return "unknown", []


def resolve_task_key(snapshot, query):
    """从今日快照中把自然语言任务名解析为 task_key。"""
    tasks = snapshot.get("tasks", [])
    query = query.strip()
    exact = [
        task for task in tasks
        if query == task.get("task_key") or query == task.get("title")
    ]
    if len(exact) == 1:
        return exact[0]["task_key"]

    fuzzy = [
        task for task in tasks
        if query and query in task.get("title", "")
    ]
    if len(fuzzy) == 1:
        return fuzzy[0]["task_key"]

    if not exact and not fuzzy:
        raise RuntimeError(f"今日任务中没有匹配项：{query}")

    names = "、".join(task.get("title", task.get("task_key", "")) for task in (exact or fuzzy))
    raise RuntimeError(f"任务匹配不唯一：{query} -> {names}")


def format_submit_status(result):
    """格式化状态提交结果"""
    lines = [
        f"📊 状态已记录（{result['date']}）",
        f"模式：{result['mode']}",
        "推荐任务：",
    ]
    for i, task in enumerate(result["tasks"], 1):
        lines.append(f"{i}. {task['title']} [{task['attr']} +{task['xp']}]")
    return "\n".join(lines)


def format_complete_task(result):
    """格式化任务完成结果"""
    icon = "✅" if result["completed"] else "❌"
    return f"{icon} {result['task']} — {'完成！' if result['completed'] else '已取消'}\n属性 +{result['xp']} XP"


def format_snapshot(result):
    """格式化快照结果"""
    entry = result.get("entry")
    tasks = result.get("tasks", [])
    
    if not entry:
        return "📭 今日暂无记录"
    
    lines = [
        f"📊 {result['date']} 状态",
        f"精力{entry['energy']} 情绪{entry['mood']} 身体{entry['body']} 专注{entry['focus']} 社交欲{entry['social']}",
        f"模式：{entry['mode']}",
        "",
        "📋 今日任务：",
    ]
    
    for task in tasks:
        icon = "✅" if task["completed"] else "⬜"
        lines.append(f"{icon} {task['title']} [{task['attribute']} +{task['xp']}]")
    
    if entry.get("review"):
        lines.extend(["", f"📝 复盘：{entry['review']}"])
    
    return "\n".join(lines)


def format_profile(result):
    """格式化属性结果"""
    lines = ["🏆 当前等级"]
    for attr in result:
        lines.append(f"{attr['name']} Lv.{attr['level']} ({attr['xp']}/{attr['next_xp']})")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("用法: python3 skill-parser.py '<用户消息>'")
        sys.exit(1)
    
    text = sys.argv[1]
    intent, args = parse_intent(text)
    
    if intent == "unknown":
        print("🤔 没听懂，试试：\n- 精力3 情绪4 身体2...\n- 完成了收拾桌面\n- 今天复盘...")
        sys.exit(0)
    
    try:
        if intent == "submit_status":
            result = _call("submit_status", args[0])
            print(format_submit_status(result))
        
        elif intent == "complete_task":
            snapshot = _call("snapshot")
            task_key = resolve_task_key(snapshot, args[0])
            result = _call("complete_task", snapshot["date"], task_key)
            print(format_complete_task(result))
        
        elif intent == "write_review":
            result = _call("write_review", args[0])
            print(f"📝 复盘已保存（{result['date']}）")
        
        elif intent == "snapshot":
            result = _call("snapshot")
            print(format_snapshot(result))
        
        elif intent == "profile":
            result = _call("profile")
            print(format_profile(result))
    
    except Exception as e:
        print(f"❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
