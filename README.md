# TechTrack — CTP Santa Eulalia

## PC nueva (desde cero)

1. Descargá el ZIP del repo (no hace falta tener Git todavía):  
   https://github.com/Rangulo160503/TechTrack/archive/refs/heads/main.zip  
2. Extraelo en `Documents` (carpeta **sin espacios**).  
3. Doble clic en **`INSTALAR.bat`** (Git, .NET 10, Node, cloudflared + npm install).  
4. Si pide cerrar la terminal: abrí una nueva y volvé a ejecutar `INSTALAR.bat`.  
5. Doble clic en **`REFRESH.bat`**.

`REFRESH.bat` genera `PUBLIC_URL.txt` con el link para telefonos.  
Ctrl+C en esa ventana detiene todo.

## Ya tenés Git

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/Rangulo160503/TechTrack.git TechTrack
cd TechTrack
.\INSTALAR.bat
.\REFRESH.bat
```

## Requisitos previos de Windows

- Windows 10/11 con **winget** (App Installer / Instalador de aplicaciones).
