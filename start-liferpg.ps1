$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $root "src"
$port = if ($env:LIFERPG_PORT) { $env:LIFERPG_PORT } else { "8899" }

Write-Host "LifeRPG local server"
Write-Host "Root: $src"
Write-Host "URL:  http://127.0.0.1:$port/"
Write-Host ""
Write-Host "Keep this PowerShell window open while using the local page."
Write-Host "Press Ctrl+C to stop."

python -m http.server $port -d $src
