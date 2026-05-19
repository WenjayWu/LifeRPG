# 构建并推送到坚果云
# 用法: .\sync\build-and-sync.ps1 [-RemoteRoot "/life-rpg/"]
param(
    [string]$RemoteRoot = "/life-rpg/",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# 加载公共配置
. "$PSScriptRoot\_webdav-common.ps1"

# 本地路径
$LocalRoot = Split-Path $PSScriptRoot -Parent
$DistDir = Join-Path $LocalRoot "dist"

Write-Host "=== LifeRPG 构建 & 同步 ===" -ForegroundColor Cyan

# 1. 构建：复制运行时文件到 dist/
if (-not $SkipBuild) {
    Write-Host "[1/4] 构建 dist/ 目录..." -ForegroundColor Yellow
    
    if (Test-Path $DistDir) {
        Remove-Item $DistDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $DistDir | Out-Null
    
    # 复制 index.html
    Copy-Item (Join-Path $LocalRoot "src\index.html") (Join-Path $DistDir "index.html")
    
    # 复制 css/
    Copy-Item (Join-Path $LocalRoot "src\css") (Join-Path $DistDir "css") -Recurse
    
    # 复制 js/
    Copy-Item (Join-Path $LocalRoot "src\js") (Join-Path $DistDir "js") -Recurse
    
    # 复制 data/（运行时数据）
    if (Test-Path (Join-Path $LocalRoot "data")) {
        Copy-Item (Join-Path $LocalRoot "data") (Join-Path $DistDir "data") -Recurse
    }
    
    # 复制 records/（日志）
    if (Test-Path (Join-Path $LocalRoot "records")) {
        Copy-Item (Join-Path $LocalRoot "records") (Join-Path $DistDir "records") -Recurse
    }
    
    Write-Host "      dist/ 构建完成" -ForegroundColor Green
} else {
    Write-Host "[1/4] 跳过构建（使用现有 dist/）" -ForegroundColor Yellow
}

# 2. 运行 build-history.ps1（如果存在）
$BuildHistoryScript = Join-Path $LocalRoot "sync\build-history.ps1"
if (Test-Path $BuildHistoryScript) {
    Write-Host "[2/4] 运行 build-history.ps1..." -ForegroundColor Yellow
    & $BuildHistoryScript
    # 重新复制更新后的 history.json
    if (Test-Path (Join-Path $LocalRoot "data\history.json")) {
        Copy-Item (Join-Path $LocalRoot "data\history.json") (Join-Path $DistDir "data\history.json") -Force
    }
    Write-Host "      history.json 已更新" -ForegroundColor Green
} else {
    Write-Host "[2/4] build-history.ps1 不存在，跳过" -ForegroundColor DarkGray
}

# 3. 推送到坚果云
Write-Host "[3/4] 推送到坚果云 $RemoteRoot ..." -ForegroundColor Yellow

# 确保远端目录存在
$null = Invoke-WebDav -Method MKCOL -Uri (Join-WebDavUri $RemoteRoot)

# 上传文件（递归）
function Upload-Dir($LocalPath, $RemotePath) {
    $items = Get-ChildItem $LocalPath
    foreach ($item in $items) {
        $remoteItemPath = $RemotePath + "/" + $item.Name
        if ($item.PSIsContainer) {
            $null = Invoke-WebDav -Method MKCOL -Uri (Join-WebDavUri $remoteItemPath)
            Upload-Dir $item.FullName $remoteItemPath
        } else {
            Write-Host "      上传 $($item.Name)..." -ForegroundColor DarkGray -NoNewline
            $bytes = [System.IO.File]::ReadAllBytes($item.FullName)
            $null = Invoke-WebDav -Method PUT -Uri (Join-WebDavUri $remoteItemPath) -Body $bytes
            Write-Host " OK" -ForegroundColor Green
        }
    }
}

Upload-Dir $DistDir $RemoteRoot

Write-Host "[4/4] 同步完成！" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址: https://dav.jianguoyun.com/dav$RemoteRoot" -ForegroundColor Cyan
