# BITA Platform

Bitácora digital de mantenimiento vehicular. El repositorio tiene dos proyectos
hermanos, cada uno con sus dependencias, su `.env` y su despliegue:

```
Bita-Platform/
├── backend/      API en NestJS + TypeORM (PostgreSQL) → Render
├── frontend/     App móvil en Next.js 16 → Vercel
├── design-ref/   Recursos del diseño (Figma)
├── compose.yaml  PostgreSQL local con Docker
└── render.yaml   Blueprint de Render (usa rootDir: backend)
```

- **API en producción**: <https://bita-api-gz56.onrender.com/api>
- Detalle del backend: [`backend/README.md`](./backend/README.md) y
  [`backend/DEPLOY.md`](./backend/DEPLOY.md)
- Detalle del frontend: [`frontend/README.md`](./frontend/README.md)

## Puesta en marcha local

Requisitos: Node.js 22.x y Docker.

```bash
# 1. Base de datos (desde la raíz)
docker compose up -d

# 2. Backend → http://localhost:3000/api
cd backend
cp .env.example .env        # ajusta JWT_SECRET (mínimo 64 caracteres)
npm install
npm run start:dev

# 3. Frontend → http://localhost:3001 (en otra terminal)
cd frontend
cp .env.example .env.local  # BITA_API_URL=http://localhost:3000/api
npm install
npm run dev
```
