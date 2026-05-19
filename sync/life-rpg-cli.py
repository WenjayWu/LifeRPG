#!/usr/bin/env python3
"""
LifeRPG CLI - Lyra 集成脚本
解析状态输入，写入 records，生成任务推荐
"""

import os
import re
import json
import sys
import urllib.request
from datetime import datetime


def parse_status_input(text):
    """解析杰哥的状态输入"""
    scores = {}
    
    # 五维评分
    for metric in ['精力', '情绪', '身体', '专注', '社交欲']:
        # 支持多种格式："精力 1-5：3" 或 "精力：3" 或 "精力 3"
        patterns = [
            rf'{metric}\s*1-5?[：:]\s*(\d)',
            rf'{metric}[：:]\s*(\d)',
            rf'{metric}\s+(\d)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                scores[metric] = int(match.group(1))
                break
        
        # 如果没匹配到，尝试更宽松的格式
        if metric not in scores:
            # 匹配 "精力3" 或 "精力 3" 或 "精力：3"
            loose_match = re.search(rf'{metric}[：:\s]*(\d)', text)
            if loose_match:
                scores[metric] = int(loose_match.group(1))
    
    # 模式判断（按优先级顺序）
    mode_patterns = {
        '低能量': ['低能量', '累', '疲惫', '没劲', '想睡觉'],
        '烦躁': ['烦躁', '烦', '焦虑', '不安', '焦躁'],
        '空虚': ['空虚', '迷茫', '无意义'],
        '无聊': ['无聊', '没意思', '没劲', '闲'],
        '想社交': ['想社交', '想找人', '想聊天', '想说话'],
        '想创造': ['想创造', '有灵感', '想做事', '想做'],
        '高能量': ['高能量', '精力充沛', '状态好', '有劲']
    }
    
    mode = '普通'
    text_lower = text.lower()
    # 先检查是否明确指定了模式
    mode_explicit = re.search(r'(?:状态|模式)[：:]\s*(\S+)', text)
    if mode_explicit:
        explicit_mode = mode_explicit.group(1)
        # 检查是否是已知模式
        for mode_name, keywords in mode_patterns.items():
            if explicit_mode in keywords or any(kw in explicit_mode for kw in keywords):
                mode = mode_name
                break
        else:
            # 如果明确指定但不在列表中，直接使用
            if explicit_mode in ['低能量', '普通', '高能量', '烦躁', '空虚', '无聊', '想社交', '想创造']:
                mode = explicit_mode
    
    # 如果没有明确指定，从关键词推断
    if mode == '普通':
        for mode_name, keywords in mode_patterns.items():
            if any(kw in text_lower for kw in keywords):
                mode = mode_name
                break
    
    # 硬性安排
    schedule_match = re.search(r'(?:硬性安排|今天安排|计划)[：:]\s*(.+?)(?:\n|$)', text)
    schedule = schedule_match.group(1).strip() if schedule_match else ''
    
    return {
        'scores': scores,
        'mode': mode,
        'schedule': schedule
    }


def generate_tasks(mode, scores):
    """根据模式生成推荐任务"""
    tasks_db = [
        {"title": "晒太阳或散步 12 分钟", "attr": "体能", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["低能量", "烦躁", "空虚"], "type": "恢复", "note": "先让身体离开原地，别急着变强。"},
        {"title": "收拾桌面 10 分钟", "attr": "秩序", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["低能量", "无聊", "空虚"], "type": "恢复", "note": "只收 10 分钟，结束后允许停止。"},
        {"title": "读一页论文或一本书", "attr": "智识", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["普通", "低能量"], "type": "成长", "note": "把门槛压低，目标是恢复进入状态的能力。"},
        {"title": "跑步或快走 25 分钟", "attr": "体能", "energy": "中", "time": "30 分钟", "xp": 20, "states": ["烦躁", "普通", "高能量"], "type": "成长", "note": "适合脑子乱、身体钝的时候。"},
        {"title": "做一个代码/AI 小功能", "attr": "工程", "energy": "中", "time": "45 分钟", "xp": 20, "states": ["普通", "想创造", "高能量"], "type": "成长", "note": "只做一个可见的小改动，别开大坑。"},
        {"title": "画一张速写或 UI 草图", "attr": "创造", "energy": "中", "time": "30 分钟", "xp": 20, "states": ["想创造", "无聊", "普通"], "type": "娱乐", "note": "重点是动手，不追求成品。"},
        {"title": "给一个朋友发近况", "attr": "社交", "energy": "低", "time": "10 分钟", "xp": 5, "states": ["想社交", "空虚", "普通"], "type": "社交", "note": "一句真诚近况就够，不需要组织大型聊天。"},
        {"title": "约一顿饭或一次散步", "attr": "社交", "energy": "中", "time": "60 分钟", "xp": 20, "states": ["想社交", "高能量"], "type": "社交", "note": "优先约低压力的人。"},
        {"title": "完成一个两小时 Boss 回合", "attr": "智识", "energy": "高", "time": "2 小时", "xp": 60, "states": ["高能量"], "type": "Boss", "note": "选择论文、实验复盘、代码项目中的一个推进。"},
        {"title": "城市探索半天副本", "attr": "创造", "energy": "高", "time": "半天", "xp": 60, "states": ["无聊", "高能量", "想创造"], "type": "娱乐", "note": "带着一个主题出门，比如拍 12 张有结构感的照片。"},
        {"title": "洗澡 + 换衣 + 清理 5 件物品", "attr": "秩序", "energy": "低", "time": "30 分钟", "xp": 20, "states": ["低能量", "空虚"], "type": "恢复", "note": "低谷日的重启组合。"},
        {"title": "3D 打印/电子小项目推进一格", "attr": "工程", "energy": "高", "time": "60 分钟", "xp": 20, "states": ["想创造", "高能量", "无聊"], "type": "成长", "note": "只推进建模、焊接、测试中的一个步骤。"}
    ]
    
    # 匹配任务
    matched = [t for t in tasks_db if mode in t['states']]
    fallback = [t for t in tasks_db if any(s in t['states'] for s in ['普通', '低能量'])]
    pool = matched if len(matched) >= 3 else matched + fallback
    
    # 选择任务组合
    wanted = ['恢复', '成长', '社交' if mode == '想社交' else '娱乐']
    selected = []
    for task_type in wanted:
        found = next((t for t in pool if t['type'] == task_type and t not in selected), None)
        if found:
            selected.append(found)
    
    # 补充到3个
    for t in pool:
        if len(selected) >= 3:
            break
        if t not in selected:
            selected.append(t)
    
    return selected[:3]


def generate_xp_summary(tasks):
    """计算 XP 归属"""
    attrs = ['体能', '智识', '创造', '工程', '社交', '秩序']
    totals = {attr: 0 for attr in attrs}
    for task in tasks:
        totals[task['attr']] = totals.get(task['attr'], 0) + task['xp']
    return totals


def write_record(status, tasks, xp_summary, records_dir='records'):
    """写入 Markdown 日志"""
    today = datetime.now().strftime('%Y-%m-%d')
    os.makedirs(records_dir, exist_ok=True)
    
    task_lines = '\n'.join([
        f"- [ ] {task['type']}任务：{task['title']}｜{task['attr']}｜+{task['xp']} XP"
        for task in tasks
    ])
    
    xp_lines = '\n'.join([
        f"- {attr}：{xp}"
        for attr, xp in xp_summary.items() if xp > 0
    ])
    
    content = f"""# Daily RPG

日期：{today}

## 状态评分

- 精力 1-5：{status['scores'].get('精力', 3)}
- 情绪 1-5：{status['scores'].get('情绪', 3)}
- 身体 1-5：{status['scores'].get('身体', 3)}
- 专注 1-5：{status['scores'].get('专注', 3)}
- 社交欲 1-5：{status['scores'].get('社交欲', 3)}

## 今日模式

{status['mode']}

## 硬性安排

{status['schedule'] or '-'}

## 今日任务

{task_lines}

## 反无聊抽卡

如果无聊，现在可以做：{tasks[1]['title'] if len(tasks) > 1 else '画一张速写或 UI 草图'}

## XP 归属

{xp_lines or '- 暂无'}

## 一句复盘

今天什么事让状态变好了？
"""
    
    filepath = os.path.join(records_dir, f'{today}.md')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ 已写入 {filepath}")
    return filepath


def submit_to_remote(input_text):
    """如果配置了 Supabase Edge Function，则直接写入远端实时数据源。"""
    supabase_url = os.environ.get('SUPABASE_URL', '').rstrip('/')
    anon_key = os.environ.get('SUPABASE_ANON_KEY')
    access_token = os.environ.get('SUPABASE_ACCESS_TOKEN')
    if not (supabase_url and anon_key and access_token):
        return False

    endpoint = f"{supabase_url}/functions/v1/submit_status"
    payload = json.dumps({'text': input_text}, ensure_ascii=False).encode('utf-8')
    request = urllib.request.Request(endpoint, data=payload, method='POST')
    request.add_header('Content-Type', 'application/json')
    request.add_header('apikey', anon_key)
    request.add_header('Authorization', f'Bearer {access_token}')

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
    except Exception as exc:
        print(f"远端提交失败，回退到本地写入: {exc}")
        return False

    print("✓ 已写入 Supabase 实时数据源")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return True


def main():
    """主入口"""
    if len(sys.argv) < 2:
        print("用法: python3 life-rpg-cli.py '精力3 情绪4 身体2...'")
        sys.exit(1)
    
    input_text = sys.argv[1]
    if submit_to_remote(input_text):
        return
    
    # 解析状态
    status = parse_status_input(input_text)
    print(f"解析结果: {status}")
    
    # 生成任务
    tasks = generate_tasks(status['mode'], status['scores'])
    
    # 计算 XP
    xp_summary = generate_xp_summary(tasks)
    
    # 写入记录
    write_record(status, tasks, xp_summary)
    
    # 构建 history.json
    import importlib.util
    spec = importlib.util.spec_from_file_location("build_history", os.path.join(os.path.dirname(__file__), "build-history.py"))
    build_history_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build_history_module)
    build_history_module.build_history()
    
    # 输出任务推荐
    print("\n=== 今日任务推荐 ===")
    for i, task in enumerate(tasks, 1):
        print(f"{i}. [{task['type']}] {task['title']} ({task['attr']} +{task['xp']} XP)")
        print(f"   {task['note']}")
    
    total_xp = sum(t['xp'] for t in tasks)
    print(f"\n今日推荐 XP：{total_xp}")
    print(f"\n模式：{status['mode']}")
    if status['schedule']:
        print(f"硬性安排：{status['schedule']}")


if __name__ == '__main__':
    main()
