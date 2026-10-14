# Comprueba herramientas obligatorias. Si faltan, ejecuta install-dev-tools.ps1.
# Usado por INSTALAR.bat y REFRESH.bat.
#
#   .\scripts\ensure-tools.ps1

$ErrorActionPreference = "Continue"

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
        [System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Test-DotNetSdk10 {
    Refresh-Path
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        return $false
    }
    $sdks = & dotnet --list-sdks 2>$null
    return ("$sdks" -match '(^|\s)10\.')
}

function Test-RequiredTools {
    Refresh-Path
    $ok = $true
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { $ok = $false }
    if (-not (Test-DotNetSdk10)) { $ok = $false }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $ok = $false }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue) -and -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { $ok = $false }
    if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) { $ok = $false }
    return $ok
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$installer = Join-Path $PSScriptRoot "install-dev-tools.ps1"

Refresh-Path

if (Test-RequiredTools) {
    Write-Host "Herramientas OK (git, dotnet 10, node, npm, cloudflared)." -ForegroundColor Green
    exit 0
}

Write-Host "Faltan herramientas. Ejecutando instalacion automatica..." -ForegroundColor Yellow
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer
$code = $LASTEXITCODE
Refresh-Path

if (-not (Test-RequiredTools)) {
    Write-Host ""
    Write-Host "ERROR: despues de instalar, siguen faltando herramientas." -ForegroundColor Red
    Write-Host "1) Cierra esta ventana"
    Write-Host "2) Abre una terminal NUEVA"
    Write-Host "3) Ejecuta INSTALAR.bat de nuevo"
    Write-Host "Carpeta: $root"
    exit 1
}

if ($code -ne 0) {
    # Tools are usable even if winget returned a non-zero for a package already present.
    Write-Host "Instalacion con advertencias, pero las herramientas obligatorias responden." -ForegroundColor Yellow
}

exit 0
