# TechTrack — CTP Santa Eulalia

En PowerShell, desde tu carpeta de documentos, pegá esto:

```powershell
git clone https://github.com/Rangulo160503/TechTrack.git TechTrack
cd TechTrack
powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
notepad .\PUBLIC_URL.txt
```

`PUBLIC_URL.txt` = link para los teléfonos (se crea solo; no se sube a Git).
