# Expose frontend (5173) with Cloudflare Quick Tunnel.
# Saves public link to PUBLIC_URL.txt at repo root.

# cloudflared logs to stderr; Stop would kill this script on the first INF line.
$ErrorActionPreference = "Continue"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$urlFile = Join-Path $root "PUBLIC_URL.txt"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "cloudflared no esta en PATH. Ejecuta antes: .\scripts\install-dev-tools.ps1"
    exit 1
}

Write-Host "Esperando frontend en http://127.0.0.1:5173 ..."
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
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
    Write-Host "Vite no respondio a tiempo. Revisa la ventana TechTrack Frontend."
    exit 1
}

Set-Content -Path $urlFile -Value "Esperando URL de Cloudflare..." -Encoding ascii
Write-Host "Tunel activo. El link se guardara en: $urlFile"
Write-Host "Deja esta ventana abierta mientras compartes el link."
Write-Host ""

$saved = $false
& cloudflared tunnel --url http://127.0.0.1:5173 2>&1 | ForEach-Object {
    # stderr arrives as ErrorRecord; ToString() keeps the log text.
    $line = "$_"
    Write-Host $line

    if (-not $saved -and $line -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
        $publicLive = "$($Matches[1])/live"
        $content = @(
            $publicLive
            ""
            "Comparte este link desde el telefono."
            "Si reinicias el tunel, el link cambia: vuelve a abrir este archivo."
        )
        Set-Content -Path $urlFile -Value $content -Encoding ascii
        $saved = $true

        Write-Host ""
        Write-Host "URL guardada en PUBLIC_URL.txt:" -ForegroundColor Green
        Write-Host "  $publicLive" -ForegroundColor Green
        Write-Host ""
    }
}

if (-not $saved) {
    Set-Content -Path $urlFile -Value "No se obtuvo URL. Revisa la ventana TechTrack Tunnel." -Encoding ascii
}
