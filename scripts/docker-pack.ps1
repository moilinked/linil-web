# Local Docker packaging for offline deploy:
#   1. docker build
#   2. docker save
#   3. zip image + compose files
# Server: unzip, then bash load-and-up.sh (docker load && compose up)

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
$StageDir = Join-Path $Root "dist\docker-pack"
$ZipPath = Join-Path $Root "dist\${ImageName}-${ImageTag}-${Stamp}.zip"
$TarName = "${ImageName}.tar"
$TarPath = Join-Path $StageDir $TarName

New-Item -ItemType Directory -Force -Path (Join-Path $Root "dist") | Out-Null
if (Test-Path $StageDir) {
  Remove-Item -Recurse -Force $StageDir
}
New-Item -ItemType Directory -Force -Path $StageDir | Out-Null

Write-Host "docker build -t $FullImage -t $LatestImage ."
docker build -t $FullImage -t $LatestImage .
if ($LASTEXITCODE -ne 0) {
  throw "docker build failed"
}

Write-Host "docker save -o $TarPath $FullImage $LatestImage"
docker save -o $TarPath $FullImage $LatestImage
if ($LASTEXITCODE -ne 0) {
  throw "docker save failed"
}

Copy-Item (Join-Path $Root "docker-compose.yml") (Join-Path $StageDir "docker-compose.yml")
Copy-Item (Join-Path $Root ".env.docker.example") (Join-Path $StageDir "env.example")
Copy-Item (Join-Path $Root "scripts\docker-load-and-up.sh") (Join-Path $StageDir "load-and-up.sh")

if (Test-Path $ZipPath) {
  Remove-Item -Force $ZipPath
}

$ZipFiles = @(
  $TarPath,
  (Join-Path $StageDir "docker-compose.yml"),
  (Join-Path $StageDir "env.example"),
  (Join-Path $StageDir "load-and-up.sh")
)
Compress-Archive -Path $ZipFiles -DestinationPath $ZipPath -CompressionLevel Optimal

Write-Host "packed: $ZipPath"
Write-Host "upload the zip, unzip on the server, then: bash load-and-up.sh"
