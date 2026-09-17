# TechTrack — CTP Santa Eulalia

En PowerShell, pegá esto (carpeta **sin espacios**):

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/Rangulo160503/TechTrack.git TechTrack
cd TechTrack
powershell -ExecutionPolicy Bypass -File .\scripts\install-dev-tools.ps1
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

Una sola terminal. Al terminar abre `PUBLIC_URL.txt` con el link para telefonos.
Ctrl+C detiene todo.
