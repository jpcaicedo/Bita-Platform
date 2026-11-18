# BITA Platform

Bitácora digital de mantenimiento vehicular. Los **dueños** registran sus
vehículos, mantenimientos y recordatorios, y autorizan a **talleres** para que
consulten la bitácora o registren servicios.

El repositorio tiene dos proyectos hermanos, cada uno con sus dependencias y su `.env`:

```
Bita-Platform/
├── backend/      API en NestJS + TypeORM (PostgreSQL), desplegada en Render
├── frontend/     App móvil en Next.js 16 (se corre en local)
├── design-ref/   Recursos del diseño (Figma)
├── compose.yaml  PostgreSQL local con Docker
└── render.yaml   Blueprint de Render (usa rootDir: backend)
```

- **API en producción**: <https://bita-api-gz56.onrender.com/api>
- Detalle del backend: [`backend/README.md`](./backend/README.md) y [`backend/DEPLOY.md`](./backend/DEPLOY.md)
- Detalle del frontend: [`frontend/README.md`](./frontend/README.md)

## Módulos

| Módulo | Rol | Pantallas |
|---|---|---|
| Acceso | Todos | Onboarding, registro, login |
| Garaje y mantenimientos | Dueño | Garaje con estado por color, agregar vehículo, ficha, historial con filtros, registrar mantenimiento |
| Recordatorios | Dueño | Lista por vehículo, crear y completar recordatorios |
| Autorizaciones | Dueño | Talleres autorizados, otorgar acceso a uno o varios vehículos, revocar |
| Taller | Taller | Perfil, recepción por placa, historial del vehículo, registro técnico del servicio |

## Puesta en marcha local

Requisitos: Node.js 22.x y Docker. Cada paso en su propia terminal, desde la raíz del repo.

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend → http://localhost:3000/api
cd backend
cp .env.example .env
npm install
npm run start:dev

# 3. Frontend → http://localhost:3001
cd frontend
cp .env.example .env.local   # BITA_API_URL=http://localhost:3000/api
npm install
npm run dev
```

## Pruebas

```bash
cd backend
npm test        # 97 pruebas unitarias
```
