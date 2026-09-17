# Start API + frontend + Presence + Cloudflare tunnel.
# Phone link is written to PUBLIC_URL.txt at repo root.
#
#   .\scripts\start-dev.ps1

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

function Start-DevWindow {
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$Command
    )

    $cmd = "Set-Location -LiteralPath '$WorkingDirectory'; `$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        $cmd
    )
}

Write-Host "TechTrack - arranque" -ForegroundColor Cyan

$frontendPath = Join-Path $root "frontend"
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "npm install (primera vez)..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install fallo."
    }
    Pop-Location
}

$tunnelScript = Join-Path $root "scripts\start-public-tunnel.ps1"

Start-DevWindow -Title "TechTrack API" -WorkingDirectory $root `
    -Command "dotnet run --project src/TechTrack.Api --launch-profile http"

Start-Sleep -Seconds 2

Start-DevWindow -Title "TechTrack Frontend" -WorkingDirectory $frontendPath `
    -Command "npm run dev"

Start-Sleep -Seconds 2

Start-DevWindow -Title "TechTrack Presence" -WorkingDirectory $root `
    -Command "dotnet run --project src/TechTrack.PresenceClient"

Start-Sleep -Seconds 3

Start-DevWindow -Title "TechTrack Tunnel" -WorkingDirectory $root `
    -Command "powershell.exe -ExecutionPolicy Bypass -File `"$tunnelScript`""

Write-Host ""
Write-Host "Cuando el tunel arranque, abre el archivo:" -ForegroundColor Green
Write-Host "  $(Join-Path $root 'PUBLIC_URL.txt')"
Write-Host "Ahi esta el link para los telefonos."
