# BITA Platform — API

API en NestJS + TypeORM (PostgreSQL) para vehículos, talleres, mantenimientos,
autorizaciones y recordatorios inteligentes.

- **Producción**: <https://bita-api-gz56.onrender.com/api>
- **Health check**: <https://bita-api-gz56.onrender.com/api/health>
- **Guía de despliegue**: [DEPLOY.md](./DEPLOY.md)

## Requisitos

- Node.js 22.x
- Docker (solo para el PostgreSQL local)

## Desarrollo local

Desde la raíz del repo se levanta la base de datos y el resto se corre dentro
de `backend/`:

```bash
docker compose up -d      # PostgreSQL en localhost:5433 (desde la raíz)
cd backend
cp .env.example .env      # ajusta JWT_SECRET (mínimo 64 caracteres)
npm install
npm run start:dev         # http://localhost:3000/api
```

Endpoints útiles: `GET /api/health`, `POST /api/auth/register`,
`POST /api/auth/login`, `GET /api/auth/me`.

## Frontend

La aplicación móvil está en [`frontend/`](../frontend/README.md) y usa Next.js 16
con Server Components y Server Actions. Consume esta API por HTTP.

```bash
cd ../frontend
npm install
cp .env.example .env.local   # BITA_API_URL=http://localhost:3000/api
npm run dev                  # http://localhost:3001
```

El detalle de rutas, roles y decisiones técnicas está en
[`frontend/README.md`](../frontend/README.md).

## Endpoints

Todas las rutas van bajo el prefijo `/api`. Salvo `POST /auth/register`,
`POST /auth/login` y `GET /health`, requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio (público) |
| POST | `/auth/register` | Crea usuario (`email`, `password`, `username` opcional) |
| POST | `/auth/login` | Devuelve `access_token` (JWT de 15 min) |
| GET | `/auth/me` | Usuario autenticado (`id`, `email`, `waid`, `phone`, `username`) |
| PATCH | `/auth/me` | Actualiza el perfil propio (`username`, `email`, `phone`) |
| PATCH | `/auth/me/password` | Cambia la contraseña verificando la actual |
| GET | `/maintenance-types` | Catálogo de tipos de mantenimiento activos |
| POST | `/maintenance-types` | Crea un tipo de mantenimiento |
| GET | `/maintenance-types/:id` | Detalle de un tipo |
| PATCH | `/maintenance-types/:id` | Actualiza un tipo |
| POST | `/workshops` | Crea el perfil de taller del usuario autenticado |
| GET | `/workshops/me` | Perfil del taller (404 si el usuario no es taller) |
| PATCH | `/workshops/me` | Actualiza el perfil del taller |
| GET | `/workshops/vehicles` | Vehículos con autorización activa del taller |
| GET | `/workshops/vehicles/plate/:plate` | Recepción: vehículo + autorización por placa |
| POST | `/vehicles` | Crea un vehículo del dueño autenticado |
| GET | `/vehicles` | Vehículos del dueño autenticado |
| GET | `/vehicles/:id` | Detalle de un vehículo del dueño |
| PATCH | `/vehicles/:id` | Actualiza un vehículo del dueño |
| POST | `/vehicles/:vehicleId/authorizations` | Autoriza un taller (`workshopId` = id del usuario taller) |
| GET | `/vehicles/:vehicleId/authorizations` | Autorizaciones de un vehículo |
| PATCH | `/authorizations/:id/revoke` | Revoca una autorización |
| POST | `/vehicles/:vehicleId/maintenance` | Registra mantenimiento como dueño |
| POST | `/workshops/vehicles/:vehicleId/maintenance` | Registra mantenimiento como taller autorizado |
| GET | `/vehicles/:vehicleId/maintenance` | Historial de mantenimientos |
| GET | `/vehicles/:vehicleId/maintenance/status` | Próximos vencimientos por tipo |

El archivo [`src/request.http`](./src/request.http) tiene ejemplos listos para
probar el flujo completo (registro, perfil de taller, autorización y servicio).


## Scripts

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta `dist/main` (usado por Render) |
| `npm run lint` | ESLint con `--fix` |
| `npm test` | Tests unitarios con Jest |

## Nota sobre `argon2`

La dependencia está fijada en `^0.44.0`. La versión `0.45.x` incluye un binario
precompilado para Windows que provoca un *segfault* al cargarse; al fallar,
`npm install` intenta compilar desde código y exige el Windows SDK (error
`MSB8036`). Si se actualiza, verificar que `node -e "require('argon2')"` siga
funcionando en Windows.
