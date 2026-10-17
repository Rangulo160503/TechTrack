@echo off
setlocal
cd /d "%~dp0"
title TechTrack REFRESH

echo.
echo ========================================
echo  TechTrack - REFRESH
echo ========================================
echo  Comprueba herramientas, hace git pull,
echo  arranca y genera link nuevo para telefonos.
echo  Tip: ACTUALIZAR.bat solo descarga cambios.
echo ========================================
echo.

REM Refrescar PATH (importante despues de INSTALAR.bat)
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')"

echo [1/3] Herramientas...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-tools.ps1"
if errorlevel 1 (
  echo.
  echo Faltan herramientas. Ejecuta primero INSTALAR.bat
  pause
  exit /b 1
)

echo.
echo [2/3] git pull...
where git >nul 2>&1
if %ERRORLEVEL%==0 (
  git pull
) else (
  echo    git no encontrado - se omite pull.
)

echo.
echo [3/3] Arrancando servicios...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-dev.ps1"
set EXITCODE=%ERRORLEVEL%

echo.
if not %EXITCODE%==0 (
  echo Algo fallo. Codigo: %EXITCODE%
  echo Revisa la salida de arriba o la carpeta logs\
  echo Si faltan herramientas, ejecuta INSTALAR.bat
)
echo.
echo Ventana cerrada. Para otro link: doble clic en REFRESH.bat
pause
endlocal
