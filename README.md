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

```bash
docker compose up -d      # PostgreSQL en localhost:5433
cp .env.example .env      # ajusta JWT_SECRET (mínimo 64 caracteres)
npm install
npm run start:dev         # http://localhost:3000/api
```

Endpoints útiles: `GET /api/health`, `POST /api/auth/register`,
`POST /api/auth/login`, `GET /api/auth/me`.

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
