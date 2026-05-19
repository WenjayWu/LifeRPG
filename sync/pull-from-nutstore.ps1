# 从坚果云拉取数据
# 用法: .\sync\pull-from-nutstore.ps1 [-RemoteRoot "/life-rpg/"]
param(
    [string]$RemoteRoot = "/life-rpg/"
)

$ErrorActionPreference = "Stop"

# 加载公共配置
. "$PSScriptRoot\_webdav-common.ps1"

$LocalRoot = Split-Path $PSScriptRoot -Parent

Write-Host "=== 从坚果云拉取数据 ===" -ForegroundColor Cyan

# 拉取 data/
$RemoteData = Join-WebDavUri "$RemoteRoot/data"
$LocalData = Join-Path $LocalRoot "data"

Write-Host "[1/2] 拉取 data/ ..." -ForegroundColor Yellow

# 列出远端文件
$response = Invoke-WebDav -Method PROPFIND -Uri $RemoteData
$files = $response | Select-String -Pattern '<d:href>([^<]+)</d:href>' | ForEach-Object { $_.Matches[0].Groups[1].Value }

foreach ($file in $files) {
    $fileName = Split-Path $file -Leaf
    if (-not $fileName) { continue }
    
    $localFile = Join-Path $LocalData $fileName
    $remoteFile = Join-WebDavUri $file
    
    Write-Host "      拉取 $fileName..." -ForegroundColor DarkGray -NoNewline
    
    # 下载文件
    $content = Invoke-WebDav -Method GET -Uri $remoteFile
    
    # 检查冲突（本地文件存在且内容不同）
    if (Test-Path $localFile) {
        $localContent = [System.IO.File]::ReadAllBytes($localFile)
        $remoteBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
        
        if ($localContent.Length -ne $remoteBytes.Length -or 
            -not [System.Linq.Enumerable]::SequenceEqual($localContent, $remoteBytes)) {
            # 冲突：保留远端副本
            $backupName = "$fileName.remote-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            $backupPath = Join-Path $LocalData $backupName
            Copy-Item $localFile $backupPath -Force
            Write-Host " 冲突! 备份为 $backupName" -ForegroundColor Yellow
        }
    }
    
    [System.IO.File]::WriteAllText($localFile, $content, [System.Text.Encoding]::UTF8)
    Write-Host " OK" -ForegroundColor Green
}

# 拉取 records/
$RemoteRecords = Join-WebDavUri "$RemoteRoot/records"
$LocalRecords = Join-Path $LocalRoot "records"

Write-Host "[2/2] 拉取 records/ ..." -ForegroundColor Yellow

$response = Invoke-WebDav -Method PROPFIND -Uri $RemoteRecords
$files = $response | Select-String -Pattern '<d:href>([^<]+)</d:href>' | ForEach-Object { $_.Matches[0].Groups[1].Value }

foreach ($file in $files) {
    $fileName = Split-Path $file -Leaf
    if (-not $fileName -or -not $fileName.EndsWith('.md')) { continue }
    
    $localFile = Join-Path $LocalRecords $fileName
    $remoteFile = Join-WebDavUri $file
    
    Write-Host "      拉取 $fileName..." -ForegroundColor DarkGray -NoNewline
    
    $content = Invoke-WebDav -Method GET -Uri $remoteFile
    
    # 检查冲突
    if (Test-Path $localFile) {
        $localContent = Get-Content $localFile -Raw -Encoding UTF8
        if ($localContent -ne $content) {
            $backupName = "$fileName.remote-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            $backupPath = Join-Path $LocalRecords $backupName
            Copy-Item $localFile $backupPath -Force
            Write-Host " 冲突! 备份为 $backupName" -ForegroundColor Yellow
        }
    }
    
    [System.IO.File]::WriteAllText($localFile, $content, [System.Text.Encoding]::UTF8)
    Write-Host " OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "拉取完成！" -ForegroundColor Green
