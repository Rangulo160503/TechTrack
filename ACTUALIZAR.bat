@echo off
setlocal
cd /d "%~dp0"
title TechTrack ACTUALIZAR

echo.
echo ========================================
echo  TechTrack - ACTUALIZAR
echo ========================================
echo  Descarga cambios del remote (git pull)
echo  y deja listo el proyecto para REFRESH.
echo ========================================
echo.

REM Refrescar PATH
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')"

where git >nul 2>&1
if errorlevel 1 (
  echo.
  echo Git no esta instalado o no esta en el PATH.
  echo Ejecuta primero INSTALAR.bat, cierra esta ventana
  echo y vuelve a intentar ACTUALIZAR.bat
  pause
  exit /b 1
)

echo [1/3] git pull desde origin...
git pull --ff-only
if errorlevel 1 (
  echo.
  echo git pull --ff-only fallo. Intentando git pull normal...
  git pull
  if errorlevel 1 (
    echo.
    echo No se pudo actualizar. Revisá conflictos o conexión a GitHub.
    echo Repo: https://github.com/Rangulo160503/TechTrack.git
    pause
    exit /b 1
  )
)

echo.
echo [2/3] Dependencias frontend (si hace falta)...
if exist "%~dp0frontend\package.json" (
  if not exist "%~dp0frontend\node_modules\" (
    pushd "%~dp0frontend"
    call npm.cmd install
    if errorlevel 1 (
      echo npm install fallo. Abrí terminal nueva y reintentá.
      popd
      pause
      exit /b 1
    )
    popd
  ) else (
    pushd "%~dp0frontend"
    call npm.cmd install
    popd
  )
) else (
  echo    No se encontro frontend\package.json
)

echo.
echo [3/3] Restore .NET...
where dotnet >nul 2>&1
if %ERRORLEVEL%==0 (
  dotnet restore "%~dp0TechTrack.slnx"
) else (
  echo    dotnet no encontrado - se omite restore. Ejecuta INSTALAR.bat si falta.
)

echo.
echo ========================================
echo  Actualizacion lista.
echo  Siguiente: doble clic en REFRESH.bat
echo ========================================
echo.
pause
endlocal
