# TechTrack — CTP Santa Eulalia

Plataforma .NET 10 + React/Vite para inventario y presencia de red.

## PC nueva (desde cero)

1. Descarga el ZIP del repo:  
   https://github.com/Rangulo160503/TechTrack/archive/refs/heads/main.zip  
2. Extrae donde quieras (**soporta rutas con espacios**, p. ej. `Documents\Nueva carpeta\TechTrack-main`).  
3. Doble clic en **`INSTALAR.bat`** (Git, .NET 10, Node, cloudflared + npm install).  
4. Si pide cerrar la terminal: abre una nueva y vuelve a ejecutar `INSTALAR.bat`.  
5. Doble clic en **`REFRESH.bat`** (o `.\scripts\start-dev.ps1`).

`REFRESH.bat` genera `PUBLIC_URL.txt` con el link para teléfonos.  
**Ctrl+C** en esa ventana detiene todo.

Guía detallada: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

## Ya tienes Git

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/Rangulo160503/TechTrack.git TechTrack
cd TechTrack
.\INSTALAR.bat
.\REFRESH.bat
```

## Un comando (desarrollo)

```powershell
.\scripts\start-dev.ps1
# Sin túnel Cloudflare:
.\scripts\start-dev.ps1 -SkipTunnel
```

El script restaura/compila el backend (NuGetAudit activo), arranca API + frontend, comprueba `/health`, el proxy `/api` y SignalR `negotiate`, y falla con código ≠ 0 si algo no responde.

## URLs locales

| Qué | URL |
|-----|-----|
| UI | http://127.0.0.1:5173 |
| Live | http://127.0.0.1:5173/live |
| API health | http://127.0.0.1:5176/health |
| API vía Vite | http://127.0.0.1:5173/api/... |
| SignalR | http://127.0.0.1:5173/hubs/presence |

Frontend: deja `VITE_API_BASE_URL` vacío (ver `frontend/.env.example`) para usar el proxy de Vite.

## Verificar

```powershell
.\scripts\verify-dev.ps1          # build, lint, tests
.\scripts\verify-dev.ps1 -Live    # + health / proxy / SignalR (servicios arriba)
```

## Logs

Carpeta `logs\` (`api.*.log`, `frontend.*.log`, `tunnel.*.log`, Serilog `techtrack-*.log`).

## Requisitos previos de Windows

- Windows 10/11 con **winget** (App Installer).
- .NET SDK 10, Node.js, npm; cloudflared si usas túnel público.

## Seguridad de paquetes

No desactives NuGetAudit. Las vulnerabilidades transitivas se corrigen con *transitive pinning* en `Directory.Packages.props` (ver [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)).
