param(
  [string]$RemoteRoot = "life-rpg"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_webdav-common.ps1"

$root = Get-LifeRpgRoot
$base = Get-WebDavBaseUrl
$remoteRecords = "$RemoteRoot/records"
$localRecords = Join-Path $root "records"
New-Item -ItemType Directory -Path $localRecords -Force | Out-Null

Write-Host "Pulling records from WebDAV: $remoteRecords"

try {
  $hrefs = Get-WebDavDirectoryItems -Base $base -RemotePath $remoteRecords
} catch {
  Write-Host "Remote records directory is not available yet. Nothing to pull."
  return
}

$markdownFiles = $hrefs | Where-Object { $_ -match "\.md$" } | ForEach-Object { Split-Path $_ -Leaf } | Sort-Object -Unique

foreach ($fileName in $markdownFiles) {
  $remotePath = "$remoteRecords/$fileName"
  $localPath = Join-Path $localRecords $fileName
  $tempPath = "$localPath.remote.tmp"
  Download-WebDavFile -Base $base -RemotePath $remotePath -LocalPath $tempPath

  if (Test-Path $localPath) {
    $localHash = (Get-FileHash $localPath -Algorithm SHA256).Hash
    $remoteHash = (Get-FileHash $tempPath -Algorithm SHA256).Hash
    if ($localHash -ne $remoteHash) {
      $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
      $conflictPath = Join-Path $localRecords ($fileName -replace "\.md$", ".remote-$stamp.md")
      Move-Item -LiteralPath $tempPath -Destination $conflictPath
      Write-Host "Conflict preserved: $conflictPath"
    } else {
      Remove-Item -LiteralPath $tempPath
    }
  } else {
    Move-Item -LiteralPath $tempPath -Destination $localPath
  }
}

Write-Host "Pull complete."
