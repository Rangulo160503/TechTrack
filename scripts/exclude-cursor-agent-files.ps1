# Excluye del repositorio los archivos del flujo Cursor/agente.
# NO los borra del disco: solo deja de versionarlos en Git.
#
# Uso (cuando el usuario lo indique):
#   .\scripts\exclude-cursor-agent-files.ps1
#
# Después conviene hacer un commit, por ejemplo:
#   git add .gitignore
#   git commit -m "chore: stop tracking Cursor and agent workflow files"

$ErrorActionPreference = "Stop"

$files = @(
    ".cursorrules",
    ".plan",
    ".progress",
    ".tracking"
)

Write-Host "Quitando del índice de Git (sin borrar del disco):"
foreach ($file in $files) {
    if (Test-Path -LiteralPath $file) {
        git rm --cached --ignore-unmatch -- $file | Out-Null
        Write-Host "  - $file"
    }
    else {
        Write-Host "  - $file (no existe en disco; se ignora)"
    }
}

# Carpeta opcional de Cursor, si aparece en el futuro
if (Test-Path -LiteralPath ".cursor") {
    git rm -r --cached --ignore-unmatch -- .cursor 2>$null | Out-Null
    Write-Host "  - .cursor/"
}

Write-Host ""
Write-Host "Listo. Los archivos siguen en tu máquina y ya están en .gitignore."
Write-Host "Cuando quieras publicar el cambio, haz commit (o avísame y lo hago yo)."
