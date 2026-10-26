# Despliegue: GitHub → Render → Neon

Guía para publicar la API de BITA. El repositorio ya está en GitHub y Render
despliega automáticamente en cada push a `main`.

```
GitHub (jpcaicedo/Bita-Platform)
        │  push a main
        ▼
Render  (servicio web Node, lee render.yaml)
        │  DATABASE_URL (pooled, SSL)
        ▼
Neon    (Postgres serverless)
```

---

## 0. Estado actual

| Recurso | Valor |
|---|---|
| Servicio Render | `bita-api` — <https://bita-api-gz56.onrender.com> |
| Health check | <https://bita-api-gz56.onrender.com/api/health> |
| Proyecto Neon | `holy-term-52243612` (`bita-db`), `aws-us-west-2`, Postgres 17 |
| Región Render | `oregon` (`us-west-2`) |
| Deploy | Automático en cada push a `main` |

La base ya tiene las 9 tablas creadas por TypeORM (`DB_SYNC=true`).

> **Auto-deploy pendiente de un clic**: el servicio se creó por API, así que el
> webhook de GitHub no quedó registrado. En Render entra a `bita-api` →
> **Settings → Build & Deploy → Repository** y reconecta el repositorio una vez.
> Mientras tanto, los deploys se lanzan desde el dashboard con **Manual Deploy**
> o con `POST /v1/services/{id}/deploys`. Alternativa: borrar el servicio y
> crearlo con **New → Blueprint** (render.yaml) para que el webhook quede atado
> desde el inicio.

## 1. Crear la base de datos en Neon

1. Entra a <https://console.neon.tech> y crea un proyecto.
2. Nombre sugerido: `bita-db`.
3. **Región**: elige la misma región del servicio de Render
   (`Oregon (us-west-2)` si usas el `region: oregon` del `render.yaml`).
   Si las regiones no coinciden, cada consulta cruza el continente y la latencia
   sube mucho.
4. Neon crea la base `neondb`; puedes usarla o crear `bita_db`.
5. En **Dashboard → Connect** copia la cadena de conexión **Pooled connection**
   (el host contiene `-pooler`). Se ve así:

   ```
   postgresql://usuario:password@ep-xxx-pooler.us-west-2.aws.neon.tech/bita_db?sslmode=require
   ```

   > Usa la versión *pooled*: Render abre varias conexiones y el pooler de Neon
   > evita agotar el límite de conexiones del plan gratuito.

6. (Opcional) borra `&channel_binding=require` de la cadena si aparece. El driver
   `pg` 8.23 lo soporta, pero si ves un error de autenticación es lo primero a
   descartar.

## 2. Crear el servicio en Render

1. Entra a <https://dashboard.render.com> e inicia sesión con GitHub.
2. **New → Blueprint** y autoriza el repositorio `jpcaicedo/Bita-Platform`.
   Render detecta `render.yaml` y muestra el servicio `bita-api`.
3. Completa las variables que Render solicita (marcadas `sync: false`):
   - `DATABASE_URL`: la cadena pooled de Neon del paso anterior.
   - `JWT_SECRET`: genera uno de al menos 64 caracteres:

     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
     ```

4. Aplica el blueprint y espera el primer build (`npm ci && npm run build`).

> Si prefieres crearlo a mano: **New → Web Service**, runtime Node, build
> `npm ci --include=dev && npm run build`, start `npm run start:prod`, health
> check `/api/health`, y agrega las mismas variables de entorno.

## 3. Verificar

- `https://<servicio>.onrender.com/api` → `BITA API is online`
- `https://<servicio>.onrender.com/api/health` → `{ "status": "ok", ... }`
- Prueba de base de datos: `POST /api/auth/register` y luego `POST /api/auth/login`.

## 4. Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `NODE_ENV` | sí | `production` en Render |
| `DATABASE_URL` | sí (Neon) | Cadena pooled con `sslmode=require` |
| `DB_SYNC` | no | `true` crea/actualiza el esquema con TypeORM |
| `DB_SSL` | no | Por defecto `true` en producción o si hay `DATABASE_URL` |
| `DB_SSL_REJECT_UNAUTHORIZED` | no | `false` para Neon |
| `JWT_SECRET` | sí | Mínimo 64 caracteres |
| `CORS_ORIGINS` | no | Lista separada por comas; vacío = cualquier origen |
| `PORT` | no | Render lo inyecta automáticamente |

Los valores reales de `bita-api` están en Render → Environment. Copia local de
`DATABASE_URL` y `JWT_SECRET` en `.secrets/` (ignorado por git).

El resto (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`) solo
se usa en local con `docker compose up -d`.

## 5. Notas y problemas comunes

- **`DB_SYNC=true`** está pensado para la primera entrega: no hay migraciones y
  TypeORM crea las tablas. Antes de tener datos reales, genera migraciones y
  cambia a `DB_SYNC=false`.
- **Plan gratuito de Render**: el servicio se suspende tras ~15 min sin tráfico.
  La primera petición después puede tardar 30–60 s (no es un error).
- **`sh: 1: nest: not found`**: con `NODE_ENV=production` npm omite las
  devDependencies. Usa `npm ci --include=dev && npm run build`.
- **Error `self-signed certificate in certificate chain`**: confirma
  `DB_SSL_REJECT_UNAUTHORIZED=false`.
- **Build falla en `argon2`**: en Windows, `argon2` 0.45.x trae un binario que
  hace *segfault* y npm intenta compilar sin Windows SDK. El proyecto usa
  `^0.44.0`, que instala con binarios precompilados en Windows y Linux.
- **`JWT_SECRET must contain at least 64 characters`**: la app no arranca hasta
  que el secreto tenga 64+ caracteres.
