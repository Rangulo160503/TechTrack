# TechTrack - un solo proceso, una sola terminal.
# Arranca API + frontend + Presence + tunel Cloudflare.
# El link para telefonos queda en PUBLIC_URL.txt
#
#   .\scripts\start-dev.ps1
#   .\scripts\start-dev.ps1 -SkipTunnel
#   .\scripts\start-dev.ps1 -HealthTimeoutSec 180
#
# Exit codes:
#   0  OK (servicios detenidos limpio al salir)
#   1  herramienta / ruta / restore / build / arranque fallido
#   2  puerto ocupado por proceso ajeno a TechTrack

[CmdletBinding()]
param(
    [switch]$SkipTunnel,
    [switch]$SkipPresence,
    [int]$HealthTimeoutSec = 120,
    [int]$FrontendPort = 5173,
    [int]$ApiPort = 5176
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $root

$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$urlFile = Join-Path $root "PUBLIC_URL.txt"
$pidFile = Join-Path $logDir "dev-pids.json"
$script:children = @()
$script:startedOk = $false

function Write-Step([string]$Message, [string]$Color = "Cyan") {
    Write-Host ""
    Write-Host ">>> $Message" -ForegroundColor $Color
}

function Write-Fail([string]$Message) {
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Get-CommandPath([string[]]$Names) {
    foreach ($n in $Names) {
        $cmd = Get-Command $n -ErrorAction SilentlyContinue
        if ($cmd) { return $cmd.Source }
    }
    return $null
}

function Test-IsTechTrackProcess([int]$ProcessId) {
    try {
        $p = Get-Process -Id $ProcessId -ErrorAction Stop
        $name = $p.ProcessName.ToLowerInvariant()
        if ($name -in @("dotnet", "node", "cloudflared")) { return $true }

        # Fallback: command line contains repo path or known project names.
        try {
            $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
            $line = [string]$cim.CommandLine
            if ([string]::IsNullOrWhiteSpace($line)) { return $false }
            $markers = @(
                [regex]::Escape($root),
                "TechTrack\.Api",
                "TechTrack\.PresenceClient",
                "vite",
                "frontend"
            )
            foreach ($m in $markers) {
                if ($line -match $m) { return $true }
            }
        }
        catch { }
        return $false
    }
    catch {
        return $false
    }
}

function Get-ListenersOnPort([int]$Port) {
    try {
        return @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            Where-Object { $_ -and $_ -gt 0 })
    }
    catch {
        return @()
    }
}

function Stop-TechTrackListeners([int[]]$Ports) {
    foreach ($port in $Ports) {
        foreach ($processId in (Get-ListenersOnPort -Port $port)) {
            if (Test-IsTechTrackProcess -ProcessId $processId) {
                Write-Host "  Liberando puerto $port (TechTrack PID $processId)"
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
            else {
                throw "Puerto $port ocupado por PID $processId (no es TechTrack). Libera el puerto o cambia el perfil de arranque."
            }
        }
    }
}

function Assert-PortsAvailableOrOwn([int[]]$Ports) {
    foreach ($port in $Ports) {
        foreach ($processId in (Get-ListenersOnPort -Port $port)) {
            if (-not (Test-IsTechTrackProcess -ProcessId $processId)) {
                Write-Fail "Puerto $port en uso por proceso ajeno (PID $processId)."
                Write-Host "  Cierra ese proceso o usa otro puerto. No se terminaran procesos ajenos."
                exit 2
            }
        }
    }
}

function Start-LoggedProcess {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$FileName,
        [Parameter(Mandatory)][string[]]$ArgumentList,
        [Parameter(Mandatory)][string]$WorkingDirectory
    )

    $outLog = Join-Path $logDir "$Name.out.log"
    $errLog = Join-Path $logDir "$Name.err.log"
    # Truncate previous run logs so diagnostics match this attempt.
    Set-Content -LiteralPath $outLog -Value "" -Encoding utf8
    Set-Content -LiteralPath $errLog -Value "" -Encoding utf8

    # Start-Process does not reliably quote ArgumentList entries that contain spaces
    # (e.g. C:\Users\Mario Lenovo\...). Build a single escaped command line.
    $escapedArgs = foreach ($a in $ArgumentList) {
        if ($null -eq $a) { '""'; continue }
        $s = [string]$a
        if ($s -match '[\s"]') {
            '"' + ($s.Replace('"', '\"')) + '"'
        }
        else {
            $s
        }
    }
    $argLine = [string]::Join(' ', $escapedArgs)

    $p = Start-Process -FilePath $FileName `
        -ArgumentList $argLine `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -PassThru `
        -WindowStyle Hidden

    if (-not $p) {
        throw "No se pudo iniciar proceso '$Name'."
    }

    $script:children += $p
    Write-Host "  $Name iniciado (PID $($p.Id))  logs: logs\$Name.out.log / logs\$Name.err.log"
    return $p
}

function Wait-HttpReady {
    param(
        [Parameter(Mandatory)][string]$Url,
        [Parameter(Mandatory)][string]$Label,
        [Parameter(Mandatory)][int]$TimeoutSec,
        [int]$ExpectStatus = 200
    )

    Write-Host "  Esperando $Label (timeout ${TimeoutSec}s) -> $Url"
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $lastError = $null
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ([int]$resp.StatusCode -eq $ExpectStatus) {
                Write-Host "  $Label OK (HTTP $($resp.StatusCode)) -> $Url" -ForegroundColor Green
                return $true
            }
            $lastError = "HTTP $($resp.StatusCode) (se esperaba $ExpectStatus)"
        }
        catch {
            $lastError = $_.Exception.Message
        }
        Start-Sleep -Seconds 2
    }

    Write-Fail "$Label no respondio a tiempo. Ultimo error: $lastError"
    return $false
}

function Show-Tail([string]$Path, [int]$Lines = 40) {
    if (Test-Path -LiteralPath $Path) {
        Write-Host "----- tail $Path -----" -ForegroundColor DarkYellow
        Get-Content -LiteralPath $Path -Tail $Lines -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
    }
}

function Stop-AllChildren {
    Write-Step "Deteniendo servicios..." "Yellow"
    foreach ($p in $script:children) {
        if ($null -eq $p) { continue }
        try {
            if (-not $p.HasExited) {
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            }
        }
        catch { }
    }
    foreach ($port in @($FrontendPort, $ApiPort)) {
        foreach ($processId in (Get-ListenersOnPort -Port $port)) {
            if (Test-IsTechTrackProcess -ProcessId $processId) {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
    if (Test-Path -LiteralPath $pidFile) {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  Listo."
}

function Save-PidManifest {
    $entries = @()
    foreach ($p in $script:children) {
        if ($null -eq $p) { continue }
        $entries += [pscustomobject]@{ Id = $p.Id; Name = $p.ProcessName }
    }
    $entries | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding utf8
}

# --- Preconditions -----------------------------------------------------------

Write-Host "========================================"
Write-Host " TechTrack - arranque (1 terminal)"
Write-Host "========================================"
Write-Host "Carpeta: $root"

$required = @(
    (Join-Path $root "TechTrack.slnx"),
    (Join-Path $root "src\TechTrack.Api\TechTrack.Api.csproj"),
    (Join-Path $root "frontend\package.json"),
    (Join-Path $root "frontend\vite.config.ts")
)
foreach ($path in $required) {
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Fail "Falta archivo requerido: $path"
        exit 1
    }
}

$ensure = Join-Path $PSScriptRoot "ensure-tools.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ensure
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Faltan herramientas. Ejecuta INSTALAR.bat y abre una terminal nueva."
    exit 1
}
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")

$npm = Get-CommandPath @("npm.cmd", "npm")
$dotnet = Get-CommandPath @("dotnet")
$node = Get-CommandPath @("node")
$cloudflared = Get-CommandPath @("cloudflared")

if (-not $npm) { Write-Fail "npm no encontrado. Ejecuta INSTALAR.bat"; exit 1 }
if (-not $dotnet) { Write-Fail "dotnet no encontrado. Ejecuta INSTALAR.bat"; exit 1 }
if (-not $node) { Write-Fail "node no encontrado. Ejecuta INSTALAR.bat"; exit 1 }
if (-not $SkipTunnel -and -not $cloudflared) {
    Write-Fail "cloudflared no encontrado. Ejecuta INSTALAR.bat o usa -SkipTunnel"
    exit 1
}

Write-Step "0/6 Versiones"
& $dotnet --version
& $node -v
& $npm -v

# Ensure frontend env example strategy: empty VITE_API_BASE_URL => Vite proxy
$envExample = Join-Path $root "frontend\.env.example"
$envLocal = Join-Path $root "frontend\.env"
if ((-not (Test-Path -LiteralPath $envLocal)) -and (Test-Path -LiteralPath $envExample)) {
    Copy-Item -LiteralPath $envExample -Destination $envLocal
    Write-Host "  Creado frontend\.env desde .env.example (VITE_API_BASE_URL vacio = proxy Vite)."
}

Write-Step "1/6 Puertos $FrontendPort / $ApiPort"
Assert-PortsAvailableOrOwn -Ports @($FrontendPort, $ApiPort)
try {
    Stop-TechTrackListeners -Ports @($FrontendPort, $ApiPort)
}
catch {
    Write-Fail $_.Exception.Message
    exit 2
}
Start-Sleep -Seconds 1

$frontendPath = Join-Path $root "frontend"
if (-not (Test-Path -LiteralPath (Join-Path $frontendPath "node_modules"))) {
    Write-Step "npm install (primera vez)" "Yellow"
    Push-Location -LiteralPath $frontendPath
    try {
        & $npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install fallo (exit $LASTEXITCODE)." }
    }
    finally {
        Pop-Location
    }
}

try {
    Write-Step "2/6 Restore + build (NuGetAudit activo)"
    & $dotnet restore (Join-Path $root "TechTrack.slnx")
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet restore fallo (exit $LASTEXITCODE). No se desactivo NuGetAudit."
    }
    & $dotnet build (Join-Path $root "TechTrack.slnx") --no-restore -c Debug
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet build fallo (exit $LASTEXITCODE). Corrige el error de compilacion antes de arrancar."
    }

    Write-Step "3/6 API"
    $apiProj = Join-Path $root "src\TechTrack.Api\TechTrack.Api.csproj"
    [void](Start-LoggedProcess -Name "api" -FileName $dotnet `
        -ArgumentList @("run", "--project", $apiProj, "--no-build", "--launch-profile", "http") `
        -WorkingDirectory $root)

    if (-not (Wait-HttpReady -Url "http://127.0.0.1:$ApiPort/health" -Label "API /health" -TimeoutSec $HealthTimeoutSec)) {
        Show-Tail (Join-Path $logDir "api.err.log")
        Show-Tail (Join-Path $logDir "api.out.log")
        throw "API no respondio en /health. Revisa logs\api.*.log"
    }

    Write-Step "4/6 Frontend"
    [void](Start-LoggedProcess -Name "frontend" -FileName $npm `
        -ArgumentList @("run", "dev") `
        -WorkingDirectory $frontendPath)

    if (-not (Wait-HttpReady -Url "http://127.0.0.1:$FrontendPort/" -Label "Frontend" -TimeoutSec $HealthTimeoutSec)) {
        Show-Tail (Join-Path $logDir "frontend.err.log")
        Show-Tail (Join-Path $logDir "frontend.out.log")
        throw "Frontend no respondio. Revisa logs\frontend.*.log"
    }

    # Proxy smoke: HTTP API via Vite
    $proxyUrl = "http://127.0.0.1:$FrontendPort/api/network/devices"
    Write-Host "  Comprobando proxy HTTP -> $proxyUrl"
    try {
        $proxyResp = Invoke-WebRequest -Uri $proxyUrl -UseBasicParsing -TimeoutSec 10
        if ([int]$proxyResp.StatusCode -ge 500) {
            throw "Proxy devolvio HTTP $($proxyResp.StatusCode)"
        }
        Write-Host "  Proxy HTTP OK (HTTP $($proxyResp.StatusCode))" -ForegroundColor Green
    }
    catch {
        Show-Tail (Join-Path $logDir "api.err.log")
        throw "Fallo la comunicacion frontend→API por proxy ($proxyUrl): $($_.Exception.Message)"
    }

    # SignalR negotiate via proxy (WebSocket upgrade negotiated after this)
    $negotiateUrl = "http://127.0.0.1:$FrontendPort/hubs/presence/negotiate?negotiateVersion=1"
    Write-Host "  Comprobando SignalR negotiate -> $negotiateUrl"
    try {
        $neg = Invoke-WebRequest -Uri $negotiateUrl -Method POST -UseBasicParsing -TimeoutSec 10
        if ([int]$neg.StatusCode -ne 200) {
            throw "negotiate HTTP $($neg.StatusCode)"
        }
        if ($neg.Content -notmatch "connectionToken|connectionId") {
            throw "Respuesta negotiate inesperada"
        }
        Write-Host "  SignalR negotiate OK (HTTP $($neg.StatusCode))" -ForegroundColor Green
    }
    catch {
        Show-Tail (Join-Path $logDir "api.err.log")
        throw "Fallo SignalR negotiate via proxy: $($_.Exception.Message)"
    }

    if (-not $SkipPresence) {
        Write-Step "5/6 Presence Client"
        $presenceProj = Join-Path $root "src\TechTrack.PresenceClient\TechTrack.PresenceClient.csproj"
        [void](Start-LoggedProcess -Name "presence" -FileName $dotnet `
            -ArgumentList @("run", "--project", $presenceProj, "--no-build") `
            -WorkingDirectory $root)
    }
    else {
        Write-Step "5/6 Presence Client (omitido)" "Yellow"
    }

    $publicLive = $null
    if (-not $SkipTunnel) {
        Write-Step "6/6 Tunel Cloudflare"
        Set-Content -LiteralPath $urlFile -Value "Esperando URL de Cloudflare..." -Encoding ascii

        $tunnelOut = Join-Path $logDir "tunnel.out.log"
        $tunnelErr = Join-Path $logDir "tunnel.err.log"
        Set-Content -LiteralPath $tunnelOut -Value "" -Encoding utf8
        Set-Content -LiteralPath $tunnelErr -Value "" -Encoding utf8

        $tunnel = Start-Process -FilePath $cloudflared `
            -ArgumentList "tunnel --url http://127.0.0.1:$FrontendPort" `
            -WorkingDirectory $root `
            -RedirectStandardOutput $tunnelOut `
            -RedirectStandardError $tunnelErr `
            -PassThru `
            -WindowStyle Hidden
        $script:children += $tunnel

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
            Set-Content -LiteralPath $urlFile -Value "No se obtuvo URL. Mira logs\tunnel.err.log" -Encoding ascii
            Show-Tail $tunnelErr
            throw "No se obtuvo URL de Cloudflare dentro del timeout."
        }

        @(
            $publicLive
            ""
            "Comparte este link desde el telefono."
            "Si reinicias, el link cambia."
            ""
            "Local UI : http://127.0.0.1:$FrontendPort"
            "API      : http://127.0.0.1:$ApiPort/health"
        ) | Set-Content -LiteralPath $urlFile -Encoding ascii
    }
    else {
        Write-Step "6/6 Tunel Cloudflare (omitido)" "Yellow"
        @(
            "Tunel omitido (-SkipTunnel)."
            "Local UI : http://127.0.0.1:$FrontendPort"
            "Live     : http://127.0.0.1:$FrontendPort/live"
            "API      : http://127.0.0.1:$ApiPort/health"
        ) | Set-Content -LiteralPath $urlFile -Encoding ascii
    }

    Save-PidManifest
    $script:startedOk = $true

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " LISTO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Local UI : http://127.0.0.1:$FrontendPort"
    Write-Host "Live     : http://127.0.0.1:$FrontendPort/live"
    Write-Host "API      : http://127.0.0.1:$ApiPort/health"
    Write-Host "Proxy API: http://127.0.0.1:$FrontendPort/api/..."
    Write-Host "SignalR  : http://127.0.0.1:$FrontendPort/hubs/presence"
    if ($publicLive) {
        Write-Host "Publico  : $publicLive"
    }
    Write-Host "Archivo  : $urlFile"
    Write-Host "Logs     : $logDir"
    Write-Host ""
    Write-Host "Deja esta ventana abierta."
    Write-Host "Ctrl+C para detener todo."
    Write-Host ""

    if (-not $SkipTunnel) {
        try { notepad $urlFile } catch { }
    }

    while ($true) {
        Start-Sleep -Seconds 5
        $dead = @($script:children | Where-Object { $_ -and $_.HasExited })
        if ($dead.Count -gt 0) {
            Write-Host "Un servicio se detuvo (PIDs: $($dead.Id -join ', ')). Cerrando todo..." -ForegroundColor Yellow
            foreach ($d in $dead) {
                $nameGuess = switch -Regex ($d.ProcessName) {
                    "dotnet|node|cloudflared" { $d.ProcessName }
                    default { $d.ProcessName }
                }
                Show-Tail (Join-Path $logDir "api.err.log") 15
                Show-Tail (Join-Path $logDir "frontend.err.log") 15
                break
            }
            exit 1
        }
    }
}
catch {
    Write-Fail $_.Exception.Message
    exit 1
}
finally {
    if ($script:startedOk -or $script:children.Count -gt 0) {
        Stop-AllChildren
    }
}
