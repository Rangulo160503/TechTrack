@echo off
setlocal
cd /d "%~dp0"
title TechTrack INSTALAR

echo.
echo ========================================
echo  TechTrack - INSTALAR (PC nueva)
echo ========================================
echo  Instala: Git, .NET 10, Node.js, cloudflared
echo  NO instala SQL Server ni Docker.
echo  La base es un archivo SQLite (se crea sola).
echo ========================================
echo.

REM Refrescar PATH en esta sesion (por si winget/git ya existen)
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')"

echo [1/3] Verificando / instalando herramientas...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-tools.ps1"
if errorlevel 1 (
  echo.
  echo INSTALACION INCOMPLETA.
  echo Cierra esta ventana, abre una NUEVA y vuelve a ejecutar INSTALAR.bat
  pause
  exit /b 1
)

echo.
echo [2/3] Dependencias del frontend (npm install)...
if not exist "%~dp0frontend\node_modules\" (
  pushd "%~dp0frontend"
  call npm.cmd install
  if errorlevel 1 (
    echo npm install fallo. Cierra, abre terminal nueva y reintenta INSTALAR.bat
    popd
    pause
    exit /b 1
  )
  popd
) else (
  echo    node_modules ya existe. Se omite.
)

echo.
echo [3/3] Listo.
echo.
echo Siguiente paso: doble clic en REFRESH.bat
echo Eso arranca el sistema y genera el link en PUBLIC_URL.txt
echo.
pause
endlocal
