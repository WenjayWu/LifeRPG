$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$recordsDir = Join-Path $root "records"
$historyPath = Join-Path $root "data/history.json"

function New-Text {
  param([int[]]$Codes)
  return -join ($Codes | ForEach-Object { [char]$_ })
}

function Get-Sections {
  param([Parameter(Mandatory = $true)][string]$Text)
  $matches = [regex]::Matches($Text, "(?m)^##\s+.+$")
  $sections = @()
  for ($i = 0; $i -lt $matches.Count; $i++) {
    $start = $matches[$i].Index + $matches[$i].Length
    $end = if ($i + 1 -lt $matches.Count) { $matches[$i + 1].Index } else { $Text.Length }
    $sections += $Text.Substring($start, $end - $start).Trim()
  }
  return $sections
}

function Get-LineNumber {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [int]$Default = 0
  )
  $matches = [regex]::Matches($Text, "(-?\d+)")
  if ($matches.Count -gt 0) { return [int]$matches[$matches.Count - 1].Groups[1].Value }
  return $Default
}

function Get-ScoreList {
  param([Parameter(Mandatory = $true)][string]$Section)
  $values = @()
  foreach ($line in ($Section -split "\r?\n")) {
    if ($line -match "^\s*-\s+") {
      $values += Get-LineNumber -Text $line
    }
  }
  while ($values.Count -lt 5) { $values += 0 }
  return $values
}

function Get-XpMap {
  param([Parameter(Mandatory = $true)][string]$Section)
  $names = @(
    (New-Text @(0x4F53, 0x80FD)),
    (New-Text @(0x667A, 0x8BC6)),
    (New-Text @(0x521B, 0x9020)),
    (New-Text @(0x5DE5, 0x7A0B)),
    (New-Text @(0x793E, 0x4EA4)),
    (New-Text @(0x79E9, 0x5E8F))
  )
  $values = @()
  foreach ($line in ($Section -split "\r?\n")) {
    if ($line -match "^\s*-\s+") {
      $values += Get-LineNumber -Text $line
    }
  }
  while ($values.Count -lt 6) { $values += 0 }
  $map = [ordered]@{}
  for ($i = 0; $i -lt $names.Count; $i++) {
    $map[$names[$i]] = [int]$values[$i]
  }
  return $map
}

$records = @()
if (Test-Path $recordsDir) {
  Get-ChildItem -Path $recordsDir -Filter "*.md" -File | Sort-Object Name | ForEach-Object {
    $text = Get-Content $_.FullName -Raw -Encoding UTF8
    $dateMatch = [regex]::Match($text, "(\d{4}-\d{2}-\d{2})")
    $date = if ($dateMatch.Success) { $dateMatch.Groups[1].Value } else { $_.BaseName }
    $sections = Get-Sections -Text $text
    $scores = Get-ScoreList -Section $sections[0]
    $mode = (($sections[1] -split "\r?\n") | Where-Object { $_.Trim() } | Select-Object -First 1).Trim()
    $taskSection = if ($sections.Count -gt 3) { $sections[3] } else { "" }
    $xpSection = if ($sections.Count -gt 5) { $sections[5] } else { "" }
    $completed = ([regex]::Matches($taskSection, "(?m)^-\s+\[[xX]\]")).Count

    $records += [ordered]@{
      date = $date
      energy = [int]$scores[0]
      mood = [int]$scores[1]
      body = [int]$scores[2]
      focus = [int]$scores[3]
      social = [int]$scores[4]
      mode = $mode
      xp = Get-XpMap -Section $xpSection
      completedTasks = $completed
    }
  }
}

$payload = [ordered]@{
  generatedAt = (Get-Date -Format "yyyy-MM-dd")
  source = "records/*.md"
  records = $records
}

$json = $payload | ConvertTo-Json -Depth 8
Set-Content -Path $historyPath -Value $json -Encoding UTF8
Write-Host "History built: $historyPath ($($records.Count) records)"
