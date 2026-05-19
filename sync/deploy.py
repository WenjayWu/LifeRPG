#!/usr/bin/env python3
"""
LifeRPG 部署脚本 - 推送到坚果云
Linux/WSL 兼容版本
"""

import os
import sys
import shutil
import urllib.request
import base64
from pathlib import Path


class NutstoreUploader:
    def __init__(self, url, username, password):
        self.base_url = url.rstrip('/')
        self.auth = base64.b64encode(f"{username}:{password}".encode()).decode()
        
    def _request(self, method, path, data=None, headers=None):
        """发送 WebDAV 请求"""
        url = f"{self.base_url}/{path.lstrip('/')}"
        req = urllib.request.Request(url, method=method)
        req.add_header("Authorization", f"Basic {self.auth}")
        
        if headers:
            for key, value in headers.items():
                req.add_header(key, value)
        
        if data and method in ['PUT', 'PROPFIND']:
            if isinstance(data, str):
                data = data.encode('utf-8')
            req.data = data
            req.add_header("Content-Length", str(len(data)))
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read().decode('utf-8', errors='ignore')
        except urllib.error.HTTPError as e:
            if e.code == 404 and method == 'PROPFIND':
                return None  # 目录不存在
            if e.code == 409 and method == 'MKCOL':
                return None  # 目录已存在
            print(f"  HTTP {e.code}: {e.reason}")
            return None
        except Exception as e:
            print(f"  错误: {e}")
            return None
    
    def mkdir(self, path):
        """创建目录"""
        result = self._request('MKCOL', path)
        return result is not None
    
    def upload_file(self, local_path, remote_path):
        """上传文件"""
        with open(local_path, 'rb') as f:
            data = f.read()
        
        headers = {"Content-Type": "application/octet-stream"}
        result = self._request('PUT', remote_path, data, headers)
        return result is not None
    
    def upload_dir(self, local_dir, remote_dir):
        """递归上传目录"""
        local_path = Path(local_dir)
        
        for item in local_path.rglob('*'):
            if item.is_file():
                relative = item.relative_to(local_path)
                remote_file = f"{remote_dir}/{relative.as_posix()}"
                
                # 确保父目录存在
                parent = str(relative.parent)
                if parent != '.':
                    self.mkdir(f"{remote_dir}/{parent}")
                
                print(f"  上传 {relative}...", end='')
                if self.upload_file(str(item), remote_file):
                    print(" OK")
                else:
                    print(" 失败")


def build_dist(project_root, dist_dir):
    """构建 dist 目录"""
    src_dir = os.path.join(project_root, 'src')
    data_dir = os.path.join(project_root, 'data')
    records_dir = os.path.join(project_root, 'records')
    
    # 清理并创建 dist
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir)
    
    # 复制 src/
    shutil.copytree(os.path.join(src_dir, 'css'), os.path.join(dist_dir, 'css'))
    shutil.copytree(os.path.join(src_dir, 'js'), os.path.join(dist_dir, 'js'))
    shutil.copy(os.path.join(src_dir, 'index.html'), os.path.join(dist_dir, 'index.html'))
    
    # 复制 data/
    if os.path.exists(data_dir):
        shutil.copytree(data_dir, os.path.join(dist_dir, 'data'))
    
    # 复制 records/
    if os.path.exists(records_dir):
        shutil.copytree(records_dir, os.path.join(dist_dir, 'records'))
    
    print(f"✓ dist/ 构建完成")


def main():
    # 配置
    NUTSTORE_URL = os.environ.get('NUTSTORE_WEBDAV_URL', 'https://dav.jianguoyun.com/dav/agent_lyra')
    NUTSTORE_USER = os.environ.get('NUTSTORE_WEBDAV_USER', '1927046693@qq.com')
    NUTSTORE_PASS = os.environ.get('NUTSTORE_WEBDAV_PASS', 'awafyiarq4uf6ii8')
    REMOTE_ROOT = os.environ.get('LIFERPG_REMOTE_ROOT', '/LifeRPG_DEMO')
    
    # 项目路径
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    dist_dir = os.path.join(project_root, 'dist')
    
    print("=== LifeRPG 部署到坚果云 ===")
    print(f"远端目录: {REMOTE_ROOT}")
    
    # 1. 构建 dist
    print("\n[1/3] 构建 dist/ 目录...")
    build_dist(project_root, dist_dir)
    
    # 2. 运行 build-history.py
    print("\n[2/3] 更新 history.json...")
    build_history_script = os.path.join(script_dir, 'build-history.py')
    if os.path.exists(build_history_script):
        import subprocess
        result = subprocess.run([sys.executable, build_history_script], 
                              capture_output=True, text=True, cwd=project_root)
        print(result.stdout.strip())
        if result.returncode != 0:
            print(f"警告: build-history.py 失败: {result.stderr}")
    
    # 3. 上传到坚果云
    print("\n[3/3] 上传到坚果云...")
    uploader = NutstoreUploader(NUTSTORE_URL, NUTSTORE_USER, NUTSTORE_PASS)
    
    # 创建根目录
    print(f"  创建目录 {REMOTE_ROOT}...")
    uploader.mkdir(REMOTE_ROOT)
    
    # 上传文件
    print(f"  上传文件...")
    uploader.upload_dir(dist_dir, REMOTE_ROOT)
    
    print(f"\n✓ 部署完成！")
    print(f"访问地址: {NUTSTORE_URL}{REMOTE_ROOT}/index.html")


if __name__ == '__main__':
    main()
