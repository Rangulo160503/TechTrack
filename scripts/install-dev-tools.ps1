# Instala las herramientas obligatorias de TechTrack (Windows + winget).
# Obligatorias: Git, .NET SDK 10, Node.js LTS, cloudflared.
# Opcional: Docker Desktop con -WithDocker
#
#   .\scripts\install-dev-tools.ps1
#   .\scripts\install-dev-tools.ps1 -WithDocker

[CmdletBinding()]
param(
    [switch]$WithDocker,
    # Compatibilidad con llamadas viejas: -CoreOnly = sin Docker (igual al default).
    [switch]$CoreOnly
)

$ErrorActionPreference = "Continue"

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
        [System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Assert-Winget {
    Refresh-Path
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        return
    }

    Write-Host ""
    Write-Host "ERROR: winget no esta disponible." -ForegroundColor Red
    Write-Host "En Windows 10/11 instala 'Instalador de aplicaciones' (App Installer)"
    Write-Host "desde Microsoft Store, reinicia la PC y vuelve a ejecutar INSTALAR.bat"
    Write-Host "https://apps.microsoft.com/detail/9nblggh4nns1"
    exit 1
}

function Test-DotNetSdk10 {
    Refresh-Path
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        return $false
    }
    $sdks = & dotnet --list-sdks 2>$null
    return ("$sdks" -match '(^|\s)10\.')
}

function Test-Tool([string]$Name) {
    Refresh-Path
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-WingetPackage {
    param(
        [Parameter(Mandatory)][string]$Id,
        [Parameter(Mandatory)][string]$Label
    )

    Write-Host ""
    Write-Host "==> $Label ($Id)" -ForegroundColor Cyan

    Refresh-Path
    $list = winget list --id $Id --exact --accept-source-agreements 2>$null
    if ($LASTEXITCODE -eq 0 -and ("$list" -match [regex]::Escape($Id))) {
        Write-Host "    Ya instalado. Se omite." -ForegroundColor DarkGray
        return $true
    }

    winget install --id $Id --exact --accept-package-agreements --accept-source-agreements --disable-interactivity
    Refresh-Path

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "winget reporto codigo $LASTEXITCODE para $Id. Se verificara si igual quedo usable."
        return $false
    }

    return $true
}

Assert-Winget

Write-Host "========================================"
Write-Host " TechTrack - instalacion de herramientas"
Write-Host "========================================"
Write-Host "Se instalaran: Git, .NET SDK 10, Node.js LTS, cloudflared"
if ($WithDocker -and -not $CoreOnly) {
    Write-Host "Tambien: Docker Desktop (-WithDocker)"
}

# --- Obligatorias ---
Install-WingetPackage -Id "Git.Git" -Label "Git" | Out-Null

Write-Host ""
Write-Host "==> .NET SDK 10 (Microsoft.DotNet.SDK.10)" -ForegroundColor Cyan
if (Test-DotNetSdk10) {
    Write-Host "    Ya hay un SDK 10 en PATH. Se omite winget." -ForegroundColor DarkGray
}
else {
    Install-WingetPackage -Id "Microsoft.DotNet.SDK.10" -Label ".NET SDK 10" | Out-Null
}

Install-WingetPackage -Id "OpenJS.NodeJS.LTS" -Label "Node.js LTS" | Out-Null
Install-WingetPackage -Id "Cloudflare.cloudflared" -Label "cloudflared" | Out-Null

if ($WithDocker -and -not $CoreOnly) {
    Install-WingetPackage -Id "Docker.DockerDesktop" -Label "Docker Desktop" | Out-Null
}

Refresh-Path

Write-Host ""
Write-Host "==> Verificacion final" -ForegroundColor Cyan
$failed = @()

if (Test-Tool "git") {
    Write-Host ("    git: " + (git --version 2>$null))
}
else {
    Write-Host "    git: FALTA" -ForegroundColor Red
    $failed += "Git"
}

if (Test-DotNetSdk10) {
    Write-Host ("    dotnet SDK 10: OK")
}
else {
    Write-Host "    dotnet SDK 10: FALTA" -ForegroundColor Red
    $failed += ".NET SDK 10"
}

if (Test-Tool "node") {
    Write-Host ("    node: " + (node --version 2>$null))
}
else {
    Write-Host "    node: FALTA" -ForegroundColor Red
    $failed += "Node.js"
}

if (Test-Tool "npm") {
    Write-Host ("    npm: " + (npm --version 2>$null))
}
else {
    Write-Host "    npm: FALTA" -ForegroundColor Red
    $failed += "npm"
}

if (Test-Tool "cloudflared") {
    Write-Host ("    cloudflared: " + (cloudflared --version 2>$null | Select-Object -First 1))
}
else {
    Write-Host "    cloudflared: FALTA" -ForegroundColor Red
    $failed += "cloudflared"
}

Write-Host ""
if ($failed.Count -gt 0) {
    Write-Host "Faltan herramientas: $($failed -join ', ')" -ForegroundColor Red
    Write-Host "Cierra esta ventana, abre una NUEVA PowerShell y vuelve a ejecutar INSTALAR.bat"
    Write-Host "(Windows a veces no actualiza el PATH hasta abrir terminal nueva)."
    exit 1
}

Write-Host "Todas las herramientas obligatorias estan listas." -ForegroundColor Green
Write-Host "Si acabas de instalar, cierra y abre la terminal antes de REFRESH.bat"
exit 0
