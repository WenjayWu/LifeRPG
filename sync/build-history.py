#!/usr/bin/env python3
"""
LifeRPG 历史数据生成器
从 records/*.md 解析日志，生成 data/history.json
"""

import os
import re
import json
import glob
from datetime import datetime


def parse_record(md_path):
    """解析单个 Markdown 日志文件"""
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取日期
    date_match = re.search(r'日期[：:]\s*(\d{4}-\d{2}-\d{2})', content)
    date = date_match.group(1) if date_match else os.path.basename(md_path).replace('.md', '')
    
    # 提取五维评分
    scores = {}
    for metric in ['精力', '情绪', '身体', '专注', '社交欲']:
        match = re.search(rf'{metric}\s*1-5[：:]\s*(\d)', content)
        scores[metric] = int(match.group(1)) if match else 3
    
    # 映射到英文键
    key_map = {
        '精力': 'energy',
        '情绪': 'mood',
        '身体': 'body',
        '专注': 'focus',
        '社交欲': 'social'
    }
    
    # 提取模式
    mode_match = re.search(r'(?:状态|模式)[：:]\s*(\S+)', content)
    mode = mode_match.group(1) if mode_match else '普通'
    
    # 提取 XP 归属
    xp = {}
    xp_section = re.search(r'XP\s*归属[：:](.*?)(?:##|一句复盘|$)', content, re.DOTALL)
    if xp_section:
        xp_text = xp_section.group(1)
        for line in xp_text.split('\n'):
            match = re.search(r'[\-\*]\s*(\S+)[：:]\s*(\d+)', line)
            if match:
                xp[match.group(1)] = int(match.group(2))
    
    # 计算完成任务数
    completed = len(re.findall(r'- \[x\]', content))
    
    return {
        'date': date,
        'energy': scores['精力'],
        'mood': scores['情绪'],
        'body': scores['身体'],
        'focus': scores['专注'],
        'social': scores['社交欲'],
        'mode': mode,
        'xp': xp,
        'completedTasks': completed
    }


def build_history(records_dir='records', output_path='data/history.json'):
    """构建 history.json"""
    records = []
    
    # 解析所有 md 文件
    md_files = sorted(glob.glob(os.path.join(records_dir, '*.md')))
    for md_path in md_files:
        try:
            record = parse_record(md_path)
            records.append(record)
        except Exception as e:
            print(f"解析失败 {md_path}: {e}")
    
    # 按日期排序
    records.sort(key=lambda x: x['date'])
    
    # 生成输出
    output = {
        'generatedAt': datetime.now().strftime('%Y-%m-%d'),
        'source': 'records/*.md',
        'records': records
    }
    
    # 写入文件
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=4)
    
    print(f"✓ 已生成 {output_path} ({len(records)} 条记录)")
    return output


if __name__ == '__main__':
    import sys
    records_dir = sys.argv[1] if len(sys.argv) > 1 else 'records'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'data/history.json'
    build_history(records_dir, output_path)
