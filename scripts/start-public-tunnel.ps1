# Expone el frontend (5173) con Cloudflare Quick Tunnel.
# Guarda el link público en PUBLIC_URL.txt (raíz del repo) para compartir por teléfono.

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$urlFile = Join-Path $root "PUBLIC_URL.txt"

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Host "cloudflared no está en PATH. Ejecutá antes: .\scripts\install-dev-tools.ps1"
    exit 1
}

Write-Host "Esperando frontend en http://127.0.0.1:5173 ..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        break
    }
    catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "Vite no respondió a tiempo. Abrí otra terminal: cd frontend; npm run dev"
    exit 1
}

"Esperando URL de Cloudflare..." | Set-Content -Path $urlFile -Encoding utf8
Write-Host "Túnel activo. El link se guardará en: $urlFile"
Write-Host ""

& cloudflared tunnel --url http://127.0.0.1:5173 2>&1 | ForEach-Object {
    $line = "$_"
    Write-Host $line

    if ($line -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
        $publicLive = "$($Matches[1])/live"
        @(
            $publicLive
            ""
            "Compartí este link desde el teléfono (misma sesión del túnel)."
            "Si reiniciás el túnel, el link cambia: volvé a abrir este archivo."
        ) | Set-Content -Path $urlFile -Encoding utf8

        Write-Host ""
        Write-Host "URL guardada en PUBLIC_URL.txt:" -ForegroundColor Green
        Write-Host "  $publicLive" -ForegroundColor Green
    }
}
