# Local Docker packaging for offline deploy:
#   1. docker build
#   2. docker save
# Server: docker load -i chat-agent-web-<version>-<timestamp>.tar

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$Package = Get-Content (Join-Path $Root "package.json") -Raw | ConvertFrom-Json
$ImageName = "chat-agent-web"
$ImageTag = [string]$Package.version
if (-not $ImageTag) {
  $ImageTag = "latest"
}

$FullImage = "${ImageName}:${ImageTag}"
$LatestImage = "${ImageName}:latest"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TarPath = Join-Path $Root "dist\${ImageName}-${ImageTag}-${Stamp}.tar"

New-Item -ItemType Directory -Force -Path (Join-Path $Root "dist") | Out-Null

Write-Host "docker build --load -t $FullImage -t $LatestImage ."
docker build --load -t $FullImage -t $LatestImage .
if ($LASTEXITCODE -ne 0) {
  throw "docker build failed"
}

Write-Host "docker save -o $TarPath $FullImage $LatestImage"
docker save -o $TarPath $FullImage $LatestImage
if ($LASTEXITCODE -ne 0) {
  throw "docker save failed"
}

Write-Host "packed: $TarPath"
Write-Host "deploy: docker load -i $(Split-Path $TarPath -Leaf)"
