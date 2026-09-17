# Expose frontend (5173) with Cloudflare Quick Tunnel.
# Saves public link to PUBLIC_URL.txt at repo root.

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$urlFile = Join-Path $root "PUBLIC_URL.txt"

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "cloudflared no esta en PATH. Ejecuta antes: .\scripts\install-dev-tools.ps1"
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
    Write-Host "Vite no respondio a tiempo. En otra terminal: cd frontend; npm run dev"
    exit 1
}

Set-Content -Path $urlFile -Value "Esperando URL de Cloudflare..." -Encoding ascii
Write-Host "Tunel activo. El link se guardara en: $urlFile"
Write-Host ""

& cloudflared tunnel --url http://127.0.0.1:5173 2>&1 | ForEach-Object {
    $line = "$_"
    Write-Host $line

    if ($line -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
        $publicLive = "$($Matches[1])/live"
        $content = @(
            $publicLive
            ""
            "Comparte este link desde el telefono (misma sesion del tunel)."
            "Si reinicias el tunel, el link cambia: vuelve a abrir este archivo."
        )
        Set-Content -Path $urlFile -Value $content -Encoding ascii

        Write-Host ""
        Write-Host "URL guardada en PUBLIC_URL.txt:" -ForegroundColor Green
        Write-Host "  $publicLive" -ForegroundColor Green
    }
}
