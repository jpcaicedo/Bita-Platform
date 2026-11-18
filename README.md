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

## Equipo

| Frente | Integrante | Pantallas |
|---|---|---|
| A. Acceso y taller | Luis | Onboarding, registro, login, perfil del taller, recepción por placa, registro técnico |
| B. Garaje y mantenimientos | Santiago | Garaje, agregar vehículo, ficha, historial, registrar mantenimiento |
| C. Recordatorios y autorizaciones | Correa | Recordatorios, autorizar y revocar talleres |

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
