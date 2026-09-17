@echo off
setlocal
cd /d "%~dp0"
title TechTrack REFRESH

echo.
echo ========================================
echo  TechTrack - REFRESH
echo ========================================
echo  Actualiza el proyecto, reinicia todo
echo  y genera un link nuevo para telefonos.
echo ========================================
echo.

where git >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [1/2] git pull...
  git pull
  echo.
) else (
  echo [1/2] git no encontrado - se omite pull.
  echo.
)

echo [2/2] Arrancando servicios...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-dev.ps1"
set EXITCODE=%ERRORLEVEL%

echo.
if not %EXITCODE%==0 (
  echo Algo fallo. Codigo: %EXITCODE%
  echo Revisa la salida de arriba o la carpeta logs\
)
echo.
echo Ventana cerrada. Para volver a generar el link, doble clic en REFRESH.bat
pause
endlocal
