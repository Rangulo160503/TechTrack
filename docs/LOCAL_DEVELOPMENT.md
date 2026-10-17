# TechTrack — desarrollo local

Guía para arrancar, verificar y depurar el entorno en Windows (incluye rutas con espacios).

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Windows | 10/11 con **winget** |
| .NET SDK | **10.x** (`global.json` recomienda 10.0.203; rollForward `latestFeature`) |
| Node.js | 20+ (probado con 24.x) |
| npm | viene con Node |
| cloudflared | solo si usas túnel público (REFRESH / `start-dev.ps1` sin `-SkipTunnel`) |
| Git | recomendado para `ACTUALIZAR.bat` / `git pull` en REFRESH |

Instalación automática en PC nueva: doble clic en `INSTALAR.bat` (ejecuta `scripts/ensure-tools.ps1`).

## Actualizar código (PC que ya tiene el repo)

```powershell
.\ACTUALIZAR.bat   # git pull + npm install + dotnet restore
.\REFRESH.bat      # arranca con el código nuevo
```

`REFRESH.bat` también hace `git pull` antes de arrancar; `ACTUALIZAR.bat` sirve cuando solo querés traer cambios sin levantar servicios.

## Instalación y restauración

```powershell
cd "C:\ruta\con espacios\TechTrack-main"
.\INSTALAR.bat
# o manualmente:
dotnet restore .\TechTrack.slnx
Push-Location .\frontend; npm install; Pop-Location
```

## Variables de entorno (frontend)

Archivo de referencia: `frontend/.env.example` (sin secretos).

| Variable | Uso |
|----------|-----|
| `VITE_API_BASE_URL` vacío | **Recomendado en local.** Axios y SignalR usan rutas relativas; Vite hace proxy a `http://127.0.0.1:5176` para `/api` y `/hubs` (WebSocket). |
| `VITE_API_BASE_URL=https://...` | Solo si apuntas directo a la API (otro host/HTTPS). Entonces aplica CORS en la API. |

`start-dev.ps1` crea `frontend/.env` desde `.env.example` si no existe. No commits de `.env` con secretos.

## Puertos y rutas

| Servicio | URL |
|----------|-----|
| Frontend (Vite) | http://127.0.0.1:5173 |
| Live UI | http://127.0.0.1:5173/live |
| API | http://127.0.0.1:5176 |
| Health | http://127.0.0.1:5176/health |
| API vía proxy | http://127.0.0.1:5173/api/... |
| SignalR hub | `/hubs/presence` (directo en :5176 o vía proxy en :5173) |

Perfil de lanzamiento API: `http` → `applicationUrl: http://0.0.0.0:5176`.

## Base de datos

- **Development** (`appsettings.Development.json`): `Database:UseInMemory = true` → no hace falta SQL Server para el día a día.
- **SQL Server**: pon `UseInMemory` en `false`, configura `ConnectionStrings:DefaultConnection` y (Docker opcional en carpeta `docker/`). Migraciones se aplican al arrancar si `ApplyMigrationsOnStartup` es true o estás en Development.

## Un solo comando

```powershell
# Completo (API + FE + Presence + túnel Cloudflare → PUBLIC_URL.txt)
.\REFRESH.bat
# o:
.\scripts\start-dev.ps1

# Solo local, sin túnel (útil en CI/diagnóstico)
.\scripts\start-dev.ps1 -SkipTunnel

# Sin PresenceClient
.\scripts\start-dev.ps1 -SkipTunnel -SkipPresence
```

El script:

1. Comprueba herramientas y archivos.
2. Restaura y **compila** con NuGetAudit activo (falla si hay vulnerabilidades tratadas como error).
3. Libera puertos **solo** si el proceso es de TechTrack; si hay un ajeno → exit 2.
4. Arranca API y espera `/health`.
5. Arranca Vite y comprueba HTTP + proxy `/api` + SignalR `negotiate`.
6. Escribe URLs en consola y `PUBLIC_URL.txt`.
7. Ctrl+C detiene los procesos hijos de forma controlada.

## Verificar comunicación FE ↔ API

Con servicios arriba:

```powershell
.\scripts\verify-dev.ps1 -Live
```

Manual:

```powershell
Invoke-WebRequest http://127.0.0.1:5176/health
Invoke-WebRequest http://127.0.0.1:5173/api/network/devices
Invoke-WebRequest -Method POST "http://127.0.0.1:5173/hubs/presence/negotiate?negotiateVersion=1"
```

## Detener

- En la ventana de `start-dev.ps1` / `REFRESH.bat`: **Ctrl+C**.
- El script termina listeners TechTrack en 5173/5176 y borra `logs/dev-pids.json`.

## Logs

| Archivo | Contenido |
|---------|-----------|
| `logs/api.out.log` / `api.err.log` | stdout/stderr API |
| `logs/frontend.*.log` | Vite |
| `logs/presence.*.log` | PresenceClient |
| `logs/tunnel.*.log` | cloudflared |
| `logs/techtrack-*.log` | Serilog (API) |

## Errores comunes

| Síntoma | Qué hacer |
|---------|-----------|
| NU1902/NU1903 en Pkcs | No uses `-p:NuGetAudit=false`. Actualiza el pin en `Directory.Packages.props` (ver abajo). |
| “Esperando API” / timeout | Mira `logs/api.err.log`. Suele ser build fallido o DB. |
| Puerto ocupado (exit 2) | Otro programa usa 5173/5176; ciérralo. El script no mata procesos ajenos. |
| SignalR disconnected | Confirma API en :5176, `VITE_API_BASE_URL` vacío, y proxy `ws: true` en `vite.config.ts`. |
| Ruta con espacios | Usa `.\scripts\start-dev.ps1` (LiteralPath); no copies comandos sin comillas. |

## Actualizar dependencias vulnerables (sin desactivar auditoría)

1. Identifica el paquete: `dotnet list .\TechTrack.slnx package --vulnerable --include-transitive`
2. Si es transitivo (p. ej. `Microsoft.Data.SqlClient` → `System.Security.Cryptography.Pkcs`), añade `<PackageVersion>` en `Directory.Packages.props` y un `<PackageReference>` directo en el proyecto que arrastra la dependencia (regla *direct-dependency-wins*). Evita activar `CentralPackageTransitivePinningEnabled` a ciegas: puede forzar downgrades de otros paquetes (NU1109).
3. `dotnet restore` + `dotnet build` (con `TreatWarningsAsErrors` y NuGetAudit **activos**).
4. Referencias: [NuGet auditing](https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages), [dependency resolution](https://learn.microsoft.com/en-us/nuget/concepts/dependency-resolution), advisories Pkcs [GHSA-2fmv-rv2c-59x7](https://github.com/dotnet/runtime/security/advisories/GHSA-2fmv-rv2c-59x7) / [GHSA-846f-f764-76mx](https://github.com/advisories/GHSA-846f-f764-76mx).

## Comprobaciones offline

```powershell
.\scripts\verify-dev.ps1
```

Incluye restore/build, listado de vulnerables, `npm run build`, lint y tests unitarios.
