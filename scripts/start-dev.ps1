# TechTrack - un solo proceso, una sola terminal.
# Arranca API + frontend + Presence + tunel Cloudflare.
# El link para telefonos queda en PUBLIC_URL.txt
#
#   .\scripts\start-dev.ps1

$ErrorActionPreference = "Continue"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $root

$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$urlFile = Join-Path $root "PUBLIC_URL.txt"
$script:children = @()

function Write-Step([string]$Message, [string]$Color = "Cyan") {
    Write-Host ""
    Write-Host ">>> $Message" -ForegroundColor $Color
}

function Stop-ListenersOnPorts([int[]]$Ports) {
    foreach ($port in $Ports) {
        $pids = @()
        try {
            $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -Unique
        }
        catch { }

        foreach ($processId in $pids) {
            if ($processId -and $processId -gt 0) {
                Write-Host "  Liberando puerto $port (PID $processId)"
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

function Start-LoggedProcess {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$FileName,
        [Parameter(Mandatory)][string]$Arguments,
        [Parameter(Mandatory)][string]$WorkingDirectory
    )

    $outLog = Join-Path $logDir "$Name.out.log"
    $errLog = Join-Path $logDir "$Name.err.log"

    $p = Start-Process -FilePath $FileName `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -PassThru `
        -WindowStyle Hidden

    $script:children += $p
    Write-Host "  $Name iniciado (PID $($p.Id))"
    return $p
}

function Wait-HttpReady {
    param(
        [Parameter(Mandatory)][string]$Url,
        [Parameter(Mandatory)][string]$Label,
        [int]$Attempts = 90
    )

    Write-Host "  Esperando $Label..."
    for ($i = 0; $i -lt $Attempts; $i++) {
        try {
            $null = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            Write-Host "  $Label OK -> $Url" -ForegroundColor Green
            return $true
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    Write-Host "  $Label no respondio a tiempo." -ForegroundColor Red
    return $false
}

function Stop-AllChildren {
    Write-Step "Deteniendo servicios..." "Yellow"
    foreach ($p in $script:children) {
        if ($p -and -not $p.HasExited) {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Stop-ListenersOnPorts -Ports @(5173, 5176)
    Write-Host "  Listo."
}

# Resolve npm.cmd on Windows
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCmd) { $npmCmd = Get-Command npm -ErrorAction SilentlyContinue }
if (-not $npmCmd) { throw "npm no encontrado. Ejecuta .\scripts\install-dev-tools.ps1" }
$npm = $npmCmd.Source

$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd) { throw "dotnet no encontrado. Ejecuta .\scripts\install-dev-tools.ps1" }
$dotnet = $dotnetCmd.Source

$cloudflaredCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredCmd) { throw "cloudflared no encontrado. Ejecuta .\scripts\install-dev-tools.ps1" }
$cloudflared = $cloudflaredCmd.Source

Write-Host "========================================"
Write-Host " TechTrack - arranque (1 terminal)"
Write-Host "========================================"
Write-Host "Carpeta: $root"

Write-Step "1/5 Liberar puertos"
Stop-ListenersOnPorts -Ports @(5173, 5176)
Start-Sleep -Seconds 1

$frontendPath = Join-Path $root "frontend"
if (-not (Test-Path -LiteralPath (Join-Path $frontendPath "node_modules"))) {
    Write-Step "npm install (primera vez)" "Yellow"
    Push-Location -LiteralPath $frontendPath
    & $npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install fallo." }
    Pop-Location
}

try {
    Write-Step "2/5 API"
    [void](Start-LoggedProcess -Name "api" -FileName $dotnet `
        -Arguments "run --project src/TechTrack.Api --launch-profile http" `
        -WorkingDirectory $root)
    if (-not (Wait-HttpReady -Url "http://127.0.0.1:5176/health" -Label "API")) {
        throw "API no arranco. Mira logs\api.err.log"
    }

    Write-Step "3/5 Frontend"
    [void](Start-LoggedProcess -Name "frontend" -FileName $npm `
        -Arguments "run dev" `
        -WorkingDirectory $frontendPath)
    if (-not (Wait-HttpReady -Url "http://127.0.0.1:5173/" -Label "Frontend")) {
        throw "Frontend no arranco. Mira logs\frontend.err.log"
    }

    Write-Step "4/5 Presence Client"
    [void](Start-LoggedProcess -Name "presence" -FileName $dotnet `
        -Arguments "run --project src/TechTrack.PresenceClient" `
        -WorkingDirectory $root)

    Write-Step "5/5 Tunel Cloudflare"
    Set-Content -Path $urlFile -Value "Esperando URL de Cloudflare..." -Encoding ascii

    $tunnelOut = Join-Path $logDir "tunnel.out.log"
    $tunnelErr = Join-Path $logDir "tunnel.err.log"
    $tunnel = Start-Process -FilePath $cloudflared `
        -ArgumentList "tunnel --url http://127.0.0.1:5173" `
        -WorkingDirectory $root `
        -RedirectStandardOutput $tunnelOut `
        -RedirectStandardError $tunnelErr `
        -PassThru `
        -WindowStyle Hidden
    $script:children += $tunnel

    $publicLive = $null
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        foreach ($logPath in @($tunnelErr, $tunnelOut)) {
            if (-not (Test-Path -LiteralPath $logPath)) { continue }
            $text = Get-Content -LiteralPath $logPath -Raw -ErrorAction SilentlyContinue
            if ($text -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
                $publicLive = "$($Matches[1])/live"
                break
            }
        }
        if ($publicLive) { break }
    }

    if (-not $publicLive) {
        Set-Content -Path $urlFile -Value "No se obtuvo URL. Mira logs\tunnel.err.log" -Encoding ascii
        throw "No se obtuvo URL de Cloudflare."
    }

    @(
        $publicLive
        ""
        "Comparte este link desde el telefono."
        "Si reinicias, el link cambia."
    ) | Set-Content -Path $urlFile -Encoding ascii

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " LISTO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Local UI : http://127.0.0.1:5173"
    Write-Host "Live     : http://127.0.0.1:5173/live"
    Write-Host "API      : http://127.0.0.1:5176/health"
    Write-Host "Publico  : $publicLive"
    Write-Host "Archivo  : $urlFile"
    Write-Host ""
    Write-Host "Deja esta ventana abierta."
    Write-Host "Ctrl+C para detener todo."
    Write-Host ""

    try { notepad $urlFile } catch { }

    while ($true) {
        Start-Sleep -Seconds 5
        $dead = $script:children | Where-Object { $_.HasExited }
        if ($dead) {
            Write-Host "Un proceso se detuvo. Cerrando todo..." -ForegroundColor Yellow
            break
        }
    }
}
finally {
    Stop-AllChildren
}
