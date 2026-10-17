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

## Actualizar (PC que ya tiene el proyecto)

1. Doble clic en **`ACTUALIZAR.bat`** (`git pull` + dependencias si hace falta).  
2. Doble clic en **`REFRESH.bat`** para arrancar con el código nuevo.

Guía detallada: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

El menú **Uso de dispositivos por clase** registra sesiones de clase y snapshots de equipos en línea (Presence).

En **Inicio**, las clases tienen **fecha de calendario** + horario. Presence llena sola la lista con las PCs conectadas ese día en esa franja. Si editás fecha/hora, borrás la clase o termina la franja, la interacción pasa a **Historial** (inmutable).

Tocá una computadora (Inicio, Editar clase o Historial) para abrir la **ficha de troubleshooting**: MAC, sistema (Windows), componentes (CPU/RAM/discos) y vínculo a inventario. Vista **Resumen** (dirección) o **Técnico** (TI). El perfil completo lo reporta el Presence Client en esa PC; vecinos solo por red muestran IP/MAC.

Menú: **Principal** (Inicio, Equipos en vivo, Inventario de activos) y **Más** (Uso de dispositivos por clase, Historial de clases, Catálogos del inventario, Reportes de uso). En móvil, etiquetas cortas en la barra inferior.

**Activos** es el inventario institucional con vista **Resumen** (Equipo 1, Equipo 2… para administración) y **Técnico** (MAC, IP, códigos para TI). Presence/Historial descubren equipos; en la ficha se completan marca, modelo, serie, ubicación y componentes.

**Reportes de uso** va en secciones colapsables: logro cuando una clase cumple el **100% del horario** (`window_ended`), situación ahora en la red, y movimiento del historial. Técnico y CSV aparte.

## Ya tenés Git

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/Rangulo160503/TechTrack.git TechTrack
cd TechTrack
.\INSTALAR.bat
.\REFRESH.bat
```

## Base de datos (sin instalar SQL Server)

Por defecto TechTrack usa **SQLite**: un archivo local `src/TechTrack.Api/data/techtrack.db` que se crea solo al arrancar la API. No hay que instalar SQL Server, LocalDB ni Docker. En una PC nueva alcanza con PowerShell vía `INSTALAR.bat` y luego `REFRESH.bat`.

Opcional (avanzado): en `appsettings.json`, `Database:Provider` = `Sqlite` (default) | `SqlServer` | `InMemory`.

## Acceso (login / logout)

Al abrir la UI pedirá iniciar sesión. Podés entrar con **usuario** o con **correo**:

- Usuario: `admin` · Correo: `joelangulo750@outlook.com`
- Contraseña: `Admin123!`

**¿Olvidaste tu contraseña?** en el login genera un enlace al correo de la cuenta (SMTP en `Auth:Email`). Si SMTP está apagado, el enlace queda en el log de la API.

En **Cuenta** podés cerrar sesión. Un **Administrator** puede crear más usuarios (roles: Administrator, Technician, Viewer, Auditor).

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
