param(
  [string]$RemoteRoot = "life-rpg"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_webdav-common.ps1"

$root = Get-LifeRpgRoot
$base = Get-WebDavBaseUrl

Ensure-WebDavDirectory -Base $base -RelativePath $RemoteRoot
Ensure-WebDavDirectory -Base $base -RelativePath "$RemoteRoot/data"
Ensure-WebDavDirectory -Base $base -RelativePath "$RemoteRoot/records"
Ensure-WebDavDirectory -Base $base -RelativePath "$RemoteRoot/templates"

$files = @(
  "index.html",
  "README.md",
  "data/tasks.json",
  "data/profile.json",
  "data/history.json",
  "templates/daily-rpg.md"
)

foreach ($relative in $files) {
  $localPath = Join-Path $root $relative
  if (Test-Path $localPath) {
    Upload-WebDavFile -Base $base -LocalPath $localPath -RemotePath "$RemoteRoot/$relative"
  }
}

Get-ChildItem -Path (Join-Path $root "records") -Filter "*.md" -File | ForEach-Object {
  Upload-WebDavFile -Base $base -LocalPath $_.FullName -RemotePath "$RemoteRoot/records/$($_.Name)"
}

Write-Host "Push complete."
