# TechTrack — Sistema de Gestión de Activos Tecnológicos

Sistema web para la administración del inventario tecnológico del **Colegio Técnico Profesional Santa Eulalia**, desarrollado como proyecto de **Trabajo Comunal Universitario (TCU)** de Ingeniería en Sistemas de Computación.

## Objetivo

Permitir a la institución registrar, administrar y dar trazabilidad completa a sus activos tecnológicos: computadoras, laptops, servidores, equipos de red (switches, routers, access points), impresoras, escáneres, proyectores, UPS, monitores, tablets, teléfonos IP, equipo de laboratorio y cualquier otro activo tecnológico. El sistema es totalmente extensible y no se limita a ningún tipo de equipo.

> **Nota de alcance:** el sistema NO gestiona matrícula, notas, asistencia, expedientes estudiantiles ni información académica. Esas funciones pertenecen a las plataformas oficiales del MEP.

## Funcionalidades

- Registro y administración de activos tecnológicos
- Catálogos: categorías, marcas, modelos, ubicaciones, departamentos, proveedores y estados
- Asignación de responsables y trazabilidad completa (historial de movimientos)
- Registro y seguimiento de mantenimientos (preventivos y correctivos)
- Auditoría de cambios (usuario, fecha, valores antes/después, acción, IP)
- Reportes exportables a PDF y Excel
- Dashboard con indicadores y gráficos
- Seguridad: JWT + Refresh Tokens, RBAC (Administrador, Técnico, Consulta, Auditor)

## Stack Tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | .NET 10 LTS, ASP.NET Core Web API, Entity Framework Core, FluentValidation, Serilog, Swagger |
| Base de datos | SQL Server |
| Frontend | React, Vite, TypeScript, TailwindCSS, React Router, TanStack Query, Axios, React Hook Form, Zod |
| DevOps (apoyo) | Docker, Docker Compose, GitHub Actions (CI/CD) |

> **¿Por qué .NET 10 y no .NET 8?** .NET 8 alcanza su fin de soporte el 10 de noviembre de 2026. .NET 10 es la versión LTS vigente, con soporte hasta noviembre de 2028, lo cual garantiza que el sistema nazca sobre una plataforma soportada y segura.

## Arquitectura

Clean Architecture con cuatro capas claramente separadas:

```
TechTrack.slnx                     # Solución .NET (formato slnx del SDK 10)
src/
├── TechTrack.Domain/              # Entidades, enums, eventos, reglas de negocio puras
├── TechTrack.SharedKernel/        # Bloques reutilizables independientes del dominio
├── TechTrack.Application/         # Casos de uso (CQRS/MediatR), validaciones, abstracciones
├── TechTrack.Infrastructure/      # EF Core, repositorios, identidad, servicios externos
└── TechTrack.Api/                 # Presentación: controladores, middleware, Swagger, Serilog
tests/
├── TechTrack.UnitTests/           # Pruebas unitarias + pruebas de arquitectura
└── TechTrack.IntegrationTests/    # Pruebas de integración (WebApplicationFactory)
docs/                              # Documentación del proyecto
scripts/                           # Scripts de automatización
docker/                            # Archivos de contenerización
frontend (se creará en la Fase 4)  # SPA React + TypeScript
```

Configuración global: `global.json` (SDK fijado), `Directory.Build.props` (Nullable, warnings como errores, analizadores) y `Directory.Packages.props` (versiones centralizadas de paquetes NuGet).

Principios aplicados: SOLID, DRY, KISS, Open/Closed, CQRS, Repository Pattern, Unit of Work, Dependency Injection.

## Estado del proyecto

🚧 **En desarrollo activo.** Consultar `.plan` para el plan completo y `.progress` para el avance.

| Fase | Estado |
| --- | --- |
| 0. Fundación del proyecto | ✅ Completada (solución backend creada y compilando) |
| 1. Dominio y persistencia | 🚧 En curso (base del dominio, value objects, enums y catálogos listos) |
| 2. Seguridad y casos de uso | ⏳ Pendiente |
| 3. Reportes y dashboard | ⏳ Pendiente |
| 4. Frontend | ⏳ Pendiente |
| 5. Calidad (tests) | ⏳ Pendiente |
| 6. DevOps (apoyo) | ⏳ Pendiente |
| 7. Documentación | ⏳ Pendiente |

## Requisitos de desarrollo

- .NET SDK 10.x
- Node.js 24.x + npm 11.x
- Docker Desktop (para SQL Server y despliegue)
- Git

## Documentación

La documentación completa (arquitectura, modelo ER, guías de instalación y despliegue, manuales técnico y de usuario) se generará en la carpeta `docs/` conforme avance el desarrollo.

## Convenciones

- Código, variables, métodos, clases y namespaces: **inglés**
- Documentación: **español**
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `build:`, `ci:`)
