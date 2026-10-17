# Verificaciones offline + (opcional) smoke HTTP/SignalR si los servicios ya corren.
#
#   .\scripts\verify-dev.ps1
#   .\scripts\verify-dev.ps1 -Live
#   .\scripts\verify-dev.ps1 -SkipFrontendBuild

[CmdletBinding()]
param(
    [switch]$Live,
    [switch]$SkipFrontendBuild,
    [int]$FrontendPort = 5173,
    [int]$ApiPort = 5176
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $root
$failed = 0

function Ok([string]$m) { Write-Host "  OK  $m" -ForegroundColor Green }
function Bad([string]$m) { Write-Host "  FAIL $m" -ForegroundColor Red; $script:failed++ }

Write-Host "TechTrack verify-dev"
Write-Host "Root: $root"
Write-Host ""

Write-Host "=== Toolchain ==="
try {
    $dotnet = (Get-Command dotnet).Source
    $node = (Get-Command node).Source
    $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue)
    if (-not $npm) { $npm = Get-Command npm }
    Ok "dotnet=$(& $dotnet --version) node=$(& $node -v) npm=$(& $npm.Source -v)"
}
catch {
    Bad "Toolchain incompleta: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== dotnet restore/build (NuGetAudit ON) ==="
& dotnet restore (Join-Path $root "TechTrack.slnx")
if ($LASTEXITCODE -ne 0) { Bad "dotnet restore" } else { Ok "restore" }

& dotnet build (Join-Path $root "TechTrack.slnx") --no-restore -c Debug
if ($LASTEXITCODE -ne 0) { Bad "dotnet build" } else { Ok "build" }

Write-Host ""
Write-Host "=== Vulnerable packages ==="
$vulnOut = & dotnet list (Join-Path $root "TechTrack.slnx") package --vulnerable --include-transitive 2>&1 | Out-String
Write-Host $vulnOut
if ($vulnOut -match "System\.Security\.Cryptography\.Pkcs\s+9\.0\.4" -or
    $vulnOut -match "has the following vulnerable packages" -and $vulnOut -match "Critical|High|Moderate") {
    # "dotnet list package --vulnerable" prints a header even when empty on some SDKs;
    # treat known fixed package as failure only if still listed as vulnerable.
    if ($vulnOut -match "Vulnerable|severity|NU190") {
        if ($vulnOut -match ">\s+\S+\s+\S+\s+\S+") {
            Bad "Aun hay paquetes vulnerables reportados"
        }
        else {
            Ok "Sin vulnerabilidades listadas (o solo encabezado)"
        }
    }
}
else {
    Ok "Sin Pkcs 9.0.4 vulnerable en el listado"
}

Write-Host ""
Write-Host "=== Frontend ==="
Push-Location -LiteralPath (Join-Path $root "frontend")
try {
    if (-not $SkipFrontendBuild) {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { Bad "npm run build" } else { Ok "npm run build" }
    }
    else {
        Ok "npm run build omitido (-SkipFrontendBuild)"
    }
    & npm.cmd run lint
    if ($LASTEXITCODE -ne 0) { Bad "npm run lint" } else { Ok "npm run lint" }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== Unit tests ==="
& dotnet test (Join-Path $root "tests\TechTrack.UnitTests\TechTrack.UnitTests.csproj") --no-build -c Debug --verbosity minimal
if ($LASTEXITCODE -ne 0) { Bad "unit tests" } else { Ok "unit tests" }

if ($Live) {
    Write-Host ""
    Write-Host "=== Live HTTP / SignalR ==="
    try {
        $h = Invoke-WebRequest -Uri "http://127.0.0.1:$ApiPort/health" -UseBasicParsing -TimeoutSec 5
        if ([int]$h.StatusCode -eq 200) { Ok "/health $($h.StatusCode)" } else { Bad "/health $($h.StatusCode)" }
    }
    catch { Bad "/health: $($_.Exception.Message)" }

    try {
        $f = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort/" -UseBasicParsing -TimeoutSec 5
        Ok "frontend HTTP $($f.StatusCode)"
    }
    catch { Bad "frontend: $($_.Exception.Message)" }

    try {
        $p = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort/api/network/devices" -UseBasicParsing -TimeoutSec 5
        Ok "proxy /api HTTP $($p.StatusCode)"
    }
    catch { Bad "proxy /api: $($_.Exception.Message)" }

    try {
        $n = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort/hubs/presence/negotiate?negotiateVersion=1" -Method POST -UseBasicParsing -TimeoutSec 5
        if ($n.Content -match "connectionToken|connectionId") { Ok "SignalR negotiate" } else { Bad "SignalR negotiate body" }
    }
    catch { Bad "SignalR negotiate: $($_.Exception.Message)" }

    Write-Host "  (API apagada) se espera fallo controlado:"
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:59999/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
        Bad "Deberia fallar contra puerto cerrado"
    }
    catch {
        Ok "Timeout/error contra API inexistente (esperado)"
    }
}

Write-Host ""
if ($failed -gt 0) {
    Write-Host "RESULTADO: $failed comprobacion(es) fallaron" -ForegroundColor Red
    exit 1
}
Write-Host "RESULTADO: todas las comprobaciones pasaron" -ForegroundColor Green
exit 0
