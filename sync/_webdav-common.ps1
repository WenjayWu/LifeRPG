$ErrorActionPreference = "Stop"

function Get-LifeRpgRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Get-WebDavBaseUrl {
  $base = $env:NUTSTORE_WEBDAV_URL
  if ([string]::IsNullOrWhiteSpace($base)) {
    throw "Missing environment variable: NUTSTORE_WEBDAV_URL"
  }
  return $base.TrimEnd("/")
}

function Get-WebDavHeaders {
  if ([string]::IsNullOrWhiteSpace($env:NUTSTORE_WEBDAV_USER)) {
    throw "Missing environment variable: NUTSTORE_WEBDAV_USER"
  }
  if ([string]::IsNullOrWhiteSpace($env:NUTSTORE_WEBDAV_PASS)) {
    throw "Missing environment variable: NUTSTORE_WEBDAV_PASS"
  }
  $pair = "{0}:{1}" -f $env:NUTSTORE_WEBDAV_USER, $env:NUTSTORE_WEBDAV_PASS
  $token = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($pair))
  return @{ Authorization = "Basic $token" }
}

function Join-WebDavUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$RelativePath
  )
  $segments = $RelativePath -split "[\\/]+" | Where-Object { $_ }
  $encoded = $segments | ForEach-Object { [Uri]::EscapeDataString($_) }
  if ($encoded.Count -eq 0) { return $Base.TrimEnd("/") }
  return "{0}/{1}" -f $Base.TrimEnd("/"), ($encoded -join "/")
}

function Invoke-WebDavRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [byte[]]$Body,
    [hashtable]$ExtraHeaders = @{}
  )
  $headers = Get-WebDavHeaders
  foreach ($key in $ExtraHeaders.Keys) {
    $headers[$key] = $ExtraHeaders[$key]
  }

  $request = [Net.WebRequest]::Create($Url)
  $request.Method = $Method
  foreach ($key in $headers.Keys) {
    $request.Headers[$key] = $headers[$key]
  }

  if ($Body) {
    $request.ContentLength = $Body.Length
    $requestStream = $request.GetRequestStream()
    try {
      $requestStream.Write($Body, 0, $Body.Length)
    } finally {
      $requestStream.Dispose()
    }
  } else {
    $request.ContentLength = 0
  }

  $response = $request.GetResponse()
  $memory = New-Object IO.MemoryStream
  try {
    $stream = $response.GetResponseStream()
    if ($stream) {
      $stream.CopyTo($memory)
    }
    $bytes = $memory.ToArray()
    return [pscustomobject]@{
      StatusCode = [int]$response.StatusCode
      Content = [Text.Encoding]::UTF8.GetString($bytes)
      Bytes = $bytes
      RawContentStream = New-Object IO.MemoryStream @(,$bytes)
    }
  } finally {
    $memory.Dispose()
    $response.Dispose()
  }
}

function Ensure-WebDavDirectory {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$RelativePath
  )
  $current = ""
  foreach ($segment in ($RelativePath -split "[\\/]+" | Where-Object { $_ })) {
    $current = if ($current) { "$current/$segment" } else { $segment }
    $url = Join-WebDavUrl -Base $Base -RelativePath $current
    try {
      Invoke-WebDavRequest -Method "MKCOL" -Url $url | Out-Null
      Write-Host "Created remote directory: $current"
    } catch {
      $status = $_.Exception.Response.StatusCode.value__
      if ($status -ne 405 -and $status -ne 409) {
        throw
      }
    }
  }
}

function Upload-WebDavFile {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$LocalPath,
    [Parameter(Mandatory = $true)][string]$RemotePath
  )
  $parent = Split-Path $RemotePath -Parent
  if ($parent) {
    Ensure-WebDavDirectory -Base $Base -RelativePath $parent
  }
  $bytes = [IO.File]::ReadAllBytes($LocalPath)
  $url = Join-WebDavUrl -Base $Base -RelativePath $RemotePath
  Invoke-WebDavRequest -Method "PUT" -Url $url -Body $bytes | Out-Null
  Write-Host "Uploaded: $RemotePath"
}

function Download-WebDavFile {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$RemotePath,
    [Parameter(Mandatory = $true)][string]$LocalPath
  )
  $url = Join-WebDavUrl -Base $Base -RelativePath $RemotePath
  $response = Invoke-WebDavRequest -Method "GET" -Url $url
  $dir = Split-Path $LocalPath -Parent
  if ($dir) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  [IO.File]::WriteAllBytes($LocalPath, $response.Bytes)
  Write-Host "Downloaded: $RemotePath"
}

function Get-WebDavDirectoryItems {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$RemotePath
  )
  $url = Join-WebDavUrl -Base $Base -RelativePath $RemotePath
  $response = Invoke-WebDavRequest -Method "PROPFIND" -Url $url -Body ([Text.Encoding]::UTF8.GetBytes("")) -ExtraHeaders @{ Depth = "1" }
  [xml]$xml = $response.Content
  $hrefs = @()
  foreach ($node in $xml.GetElementsByTagName("href")) {
    $hrefs += [Uri]::UnescapeDataString($node.InnerText)
  }
  return $hrefs
}
