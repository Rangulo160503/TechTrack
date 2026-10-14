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

**¿Olvidaste tu contraseña?** en el login envía un enlace al correo de la cuenta (SMTP externo en `Auth:Email`).

En **Cuenta** podés cerrar sesión. Un **Administrator** puede crear más usuarios (roles: Administrator, Technician, Viewer, Auditor).

### Correo externo (recuperación)

En `src/TechTrack.Api/appsettings.json` (o Development):

```json
"Auth": {
  "Email": {
    "Enabled": true,
    "Host": "smtp.gmail.com",
    "Port": 587,
    "UseStartTls": true,
    "Username": "tu-cuenta@gmail.com",
    "Password": "app-password",
    "FromAddress": "tu-cuenta@gmail.com",
    "FromName": "TechTrack",
    "PublicAppBaseUrl": "http://127.0.0.1:5173"
  }
}
```

Con Gmail usá una [contraseña de aplicación](https://support.google.com/accounts/answer/185833). Si `Enabled` es `false`, el enlace de reset se escribe en el log de la API (útil en pruebas).

Endpoints: `POST /api/auth/login`, `forgot-password`, `reset-password`, `logout`, `refresh`, `GET /me`, `POST /register` (admin).

## Requisitos previos de Windows

- Windows 10/11 con **winget** (App Installer / Instalador de aplicaciones).
- .NET 10 + Node (los instala `INSTALAR.bat`).
