# Instala las herramientas de desarrollo de TechTrack (Windows + winget).
#
# Uso (PowerShell como usuario normal; algunos paquetes piden UAC):
#   .\scripts\install-dev-tools.ps1
#
# Solo lo obligatorio (.NET, Node, Git):
#   .\scripts\install-dev-tools.ps1 -CoreOnly
#
# Fuentes de IDs winget:
#   https://learn.microsoft.com/en-us/dotnet/core/install/windows
#   Git.Git · OpenJS.NodeJS.LTS · Cloudflare.cloudflared · Docker.DockerDesktop

[CmdletBinding()]
param(
    [switch]$CoreOnly
)

$ErrorActionPreference = "Stop"

function Assert-Winget {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Error @"
winget no está disponible.
Instalá 'App Installer' desde Microsoft Store y volvé a ejecutar este script.
https://learn.microsoft.com/windows/package-manager/winget/
"@
    }
}

function Install-WingetPackage {
    param(
        [Parameter(Mandatory)][string]$Id,
        [Parameter(Mandatory)][string]$Label
    )

    Write-Host ""
    Write-Host "==> $Label ($Id)" -ForegroundColor Cyan

    $list = winget list --id $Id --exact --accept-source-agreements 2>$null
    if ($LASTEXITCODE -eq 0 -and $list -match [regex]::Escape($Id)) {
        Write-Host "    Ya instalado. Se omite." -ForegroundColor DarkGray
        return
    }

    winget install --id $Id --exact --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Falló la instalación de $Id (código $LASTEXITCODE). Revisá el mensaje de winget."
    }
}

Assert-Winget

Write-Host "TechTrack — instalación de herramientas de desarrollo"
Write-Host "Modo: $(if ($CoreOnly) { 'solo core' } else { 'completo (core + opcional)' })"

# --- Core ---
Install-WingetPackage -Id "Git.Git" -Label "Git"
Install-WingetPackage -Id "Microsoft.DotNet.SDK.10" -Label ".NET SDK 10"
Install-WingetPackage -Id "OpenJS.NodeJS.LTS" -Label "Node.js LTS (+ npm)"

# --- Opcional ---
if (-not $CoreOnly) {
    Install-WingetPackage -Id "Cloudflare.cloudflared" -Label "cloudflared (túnel público)"
    Install-WingetPackage -Id "Docker.DockerDesktop" -Label "Docker Desktop"
    # Express incluye herramientas útiles en lab; LocalDB puro no siempre está como paquete winget estable.
    Install-WingetPackage -Id "Microsoft.SQLServer.2022.Express" -Label "SQL Server 2022 Express"
}

Write-Host ""
Write-Host "Listo. Cerrá y abrí la terminal (o reiniciá) para refrescar el PATH." -ForegroundColor Green
Write-Host "Verificación sugerida:"
Write-Host "  git --version"
Write-Host "  dotnet --list-sdks"
Write-Host "  node -v ; npm -v"
if (-not $CoreOnly) {
    Write-Host "  cloudflared --version"
    Write-Host "  docker --version"
}
