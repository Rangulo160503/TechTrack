# Levanta API + frontend + Presence + túnel Cloudflare.
# El link para teléfonos queda en PUBLIC_URL.txt (raíz del repo).
#
#   .\scripts\start-dev.ps1

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

function Start-DevWindow {
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$Command
    )

    $escaped = $Command.Replace("'", "''")
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "Set-Location '$root'; `$Host.UI.RawUI.WindowTitle = '$Title'; $escaped"
    )
}

Write-Host "TechTrack — arranque" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $root "frontend/node_modules"))) {
    Write-Host "npm install (primera vez)..." -ForegroundColor Yellow
    Push-Location (Join-Path $root "frontend")
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install falló." }
    Pop-Location
}

Start-DevWindow -Title "TechTrack API" -Command `
    "dotnet run --project src/TechTrack.Api --launch-profile http"

Start-Sleep -Seconds 2

Start-DevWindow -Title "TechTrack Frontend" -Command `
    "Set-Location frontend; npm run dev"

Start-Sleep -Seconds 2

Start-DevWindow -Title "TechTrack Presence" -Command `
    "dotnet run --project src/TechTrack.PresenceClient"

Start-Sleep -Seconds 3

Start-DevWindow -Title "TechTrack Tunnel" -Command `
    "& '$root\scripts\start-public-tunnel.ps1'"

Write-Host ""
Write-Host "Cuando el túnel arranque, abrí el archivo:" -ForegroundColor Green
Write-Host "  $root\PUBLIC_URL.txt"
Write-Host "Ahí está el link para los teléfonos."
