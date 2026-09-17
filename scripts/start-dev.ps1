# Start API + frontend + Presence + Cloudflare tunnel.
# Phone link is written to PUBLIC_URL.txt at repo root.
#
#   .\scripts\start-dev.ps1

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $root

function Stop-ListenersOnPorts {
    param([int[]]$Ports)

    foreach ($port in $Ports) {
        $pids = @()
        try {
            $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -Unique
        }
        catch {
            $pids = @()
        }

        foreach ($processId in $pids) {
            if ($processId -and $processId -gt 0) {
                Write-Host "Liberando puerto $port (PID $processId)..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

function Start-DevWindow {
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$Command
    )

    # Single-quoted here-string avoids breaking on spaces in paths.
    $script = @"
`$Host.UI.RawUI.WindowTitle = '$Title'
Set-Location -LiteralPath '$WorkingDirectory'
$Command
"@

    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-EncodedCommand",
        $encoded
    )
}

Write-Host "TechTrack - arranque" -ForegroundColor Cyan
Write-Host "Raiz: $root"

# Previous runs leave API/Vite holding ports; free them first.
Stop-ListenersOnPorts -Ports @(5173, 5176)
Start-Sleep -Seconds 1

$frontendPath = Join-Path $root "frontend"
if (-not (Test-Path -LiteralPath (Join-Path $frontendPath "node_modules"))) {
    Write-Host "npm install (primera vez)..." -ForegroundColor Yellow
    Push-Location -LiteralPath $frontendPath
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

# -File + EncodedCommand wrapper handles paths with spaces (e.g. "New folder").
Start-DevWindow -Title "TechTrack Tunnel" -WorkingDirectory $root `
    -Command "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$tunnelScript`""

Write-Host ""
Write-Host "Cuando el tunel arranque, abre el archivo:" -ForegroundColor Green
Write-Host "  $(Join-Path $root 'PUBLIC_URL.txt')"
Write-Host "Ahi esta el link para los telefonos."
Write-Host ""
Write-Host "Tip: evita carpetas con espacios. Mejor: C:\Users\<tu-usuario>\Documents\TechTrack"
