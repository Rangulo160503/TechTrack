# Install TechTrack development tools (Windows + winget).
#
#   .\scripts\install-dev-tools.ps1
#   .\scripts\install-dev-tools.ps1 -CoreOnly

[CmdletBinding()]
param(
    [switch]$CoreOnly
)

$ErrorActionPreference = "Stop"

function Assert-Winget {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Error "winget no esta disponible. Instala App Installer desde Microsoft Store."
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
    if ($LASTEXITCODE -eq 0 -and ("$list" -match [regex]::Escape($Id))) {
        Write-Host "    Ya instalado. Se omite." -ForegroundColor DarkGray
        return
    }

    winget install --id $Id --exact --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Fallo la instalacion de $Id (codigo $LASTEXITCODE)."
    }
}

Assert-Winget

Write-Host "TechTrack - instalacion de herramientas"
if ($CoreOnly) {
    Write-Host "Modo: solo core"
}
else {
    Write-Host "Modo: completo (core y opcional)"
}

Install-WingetPackage -Id "Git.Git" -Label "Git"
Install-WingetPackage -Id "Microsoft.DotNet.SDK.10" -Label ".NET SDK 10"
Install-WingetPackage -Id "OpenJS.NodeJS.LTS" -Label "Node.js LTS"

if (-not $CoreOnly) {
    Install-WingetPackage -Id "Cloudflare.cloudflared" -Label "cloudflared"
    Install-WingetPackage -Id "Docker.DockerDesktop" -Label "Docker Desktop"
    Install-WingetPackage -Id "Microsoft.SQLServer.2022.Express" -Label "SQL Server 2022 Express"
}

Write-Host ""
Write-Host "Listo. Cierra y abre la terminal para refrescar el PATH." -ForegroundColor Green
Write-Host "Verificacion: git --version ; dotnet --list-sdks ; node -v"
if (-not $CoreOnly) {
    Write-Host "Opcional: cloudflared --version ; docker --version"
}
