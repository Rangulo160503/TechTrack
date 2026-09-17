# TechTrack — CTP Santa Eulalia

En PowerShell, pegá esto (usa una carpeta **sin espacios**):

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/Rangulo160503/TechTrack.git TechTrack
cd TechTrack
powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
notepad .\PUBLIC_URL.txt
```

`PUBLIC_URL.txt` = link para los telefonos (se crea solo; no se sube a Git).
