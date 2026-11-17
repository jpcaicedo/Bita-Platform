# BITA — Frontend

Aplicación móvil de BITA by ICESI hecha con Next.js 16 (App Router) y React 19.
Consume la API NestJS de este mismo repositorio.

## Requisitos

- Node.js 22.x
- Backend de BITA corriendo en `http://localhost:3000/api`
  (ver [`README.md`](../README.md) de la raíz)
- PostgreSQL local con `docker compose up -d` en la raíz del repo

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # BITA_API_URL=http://localhost:3000/api
npm run dev                  # http://localhost:3001
```

El puerto es **3001** para no chocar con el backend. La variable
`BITA_API_URL` es la URL base de la API (incluye `/api`).

> La primera vez, `next dev` puede detenerse para avisar de una actualización
> de seguridad de Next.js. Vuelve a ejecutar `npm run dev` y continúa.
>
> El botón flotante de DevTools de Next en la esquina inferior izquierda es
> exclusivo de desarrollo. Para ocultarlo también ahí, agrega
> `NEXT_PRIVATE_DISABLE_DEV_OVERLAY_UX=1` a `.env.local`. En producción no
> existe.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3001 |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

## Rutas

### Acceso

| Ruta | Pantalla |
|---|---|
| `/` | Splash: decide a dónde ir según la cookie de sesión |
| `/bienvenida?paso=1..3` | Onboarding de tres pasos |
| `/login` | Inicio de sesión |
| `/registro` | Crear cuenta de dueño o taller |

### Aplicación

El layout de `(app)` exige sesión y pinta el encabezado y la barra inferior.

| Ruta | Rol | Pantalla |
|---|---|---|
| `/ajustes` | Ambos | Perfil de la cuenta y cerrar sesión |
| `/taller` | Taller | Recepción por placa |
| `/taller/vehiculos` | Taller | Vehículos autorizados e historial |
| `/taller/vehiculos/[vehicleId]` | Taller | Detalle, próximos mantenimientos e historial |
| `/taller/registrar/[vehicleId]` | Taller | Registrar un servicio |
| `/taller/comprobante/[recordId]?vehiculo=` | Taller | Comprobante del servicio guardado |
| `/taller/servicio/[recordId]?vehiculo=` | Taller | Detalle de un servicio del historial |
| `/taller/perfil` | Taller | Crear o editar el perfil comercial |

Las rutas del garaje del dueño pertenecen al frente B y no se tocan en este
módulo.

## Roles

El backend no devuelve el rol en el JWT. El frontend lo deduce así:

- `GET /workshops/me` responde `200` → la cuenta es **taller**.
- Responde `404` → la cuenta es **dueño**.

`lib/session.ts` cachea esas llamadas por request y expone
`requireSession`, `requireOwner` y `requireWorkshop`.

## Flujo del taller

1. **Recepción** (`/taller`): busca por placa en
   `GET /workshops/vehicles/plate/:plate` y muestra uno de cuatro estados:
   sin búsqueda, autorizado, sin autorización y placa inexistente.
2. **Registro**: solo con permiso de escritura. Envía
   `POST /workshops/vehicles/:vehicleId/maintenance` y redirige al comprobante.
3. **Comprobante**: muestra el resumen, el detalle del trabajo y el próximo
   vencimiento calculado por el backend.
4. **Historial**: lista los vehículos autorizados y, dentro de cada uno, los
   servicios y los próximos mantenimientos.

### Formato de observaciones

El backend guarda `observations` como texto libre. El formulario del taller
compone estas líneas (ver `lib/taller-observaciones.ts`):

```
Técnico: Ing. Mateo Restrepo
Descripción: Cambio de aceite y revisión general
Repuestos: Aceite 5W-30 | Filtro de aceite
Garantía: 6 meses o 10.000 km
Moneda: COP
```

Al mostrarlas se vuelven a separar. Si un registro viejo no sigue el formato, se
muestra el texto tal cual.

## Estructura

```
src/
  app/
    (auth)/            splash, onboarding, login y registro
    (app)/             layout protegido, ajustes y módulo de taller
    globals.css        paleta, tipografía y utilidades g-*
  components/
    layout/            encabezado y barra inferior
    taller/            tarjeta de vehículo y editor de repuestos
    ui/                íconos y botón de envío
  lib/
    bita-api.ts        cliente único de la API
    session.ts         lectura y guardas de sesión
    auth-actions.ts    server actions de acceso
    taller.ts          lecturas del módulo de taller
    taller-actions.ts  server actions del taller
    taller-observaciones.ts  formato de las observaciones
  types/               tipos de las respuestas de la API
```

## Decisiones técnicas

- **Todo se renderiza en el servidor.** Las páginas son componentes async y
  las mutaciones son server actions (`"use server"`). No hay `fetch` desde el
  navegador ni estado global de datos.
- **Solo tres componentes cliente**, cada uno con su justificación:
  `AppFrame` (`usePathname`), `SubmitButton` (`useFormStatus`) y
  `PartsEditor` (lista local de repuestos).
- **La cookie `bita_token` es httpOnly.** `bitaFetch` la lee con `cookies()` y
  agrega el `Authorization`. El JWT dura 15 minutos.
- **Streaming con Cache Components.** Las lecturas de `cookies()` y
  `searchParams` se envuelven en `<Suspense>`. El layout de `(app)` y el del
  taller declaran `instant = false` porque la sesión bloquea la navegación.
- **Sin dependencias nuevas.** Los íconos son SVG propios y el CSS es plano con
  prefijo `g-`.
- **Diseño móvil de 430 px.** Las ilustraciones de `public/images/` son los SVG
  originales de `design-ref/` (`Car-1.svg` a `Car-4.svg`), con sus decoraciones
  y escalables sin pérdida de calidad. Los logos también son SVG; al del splash
  se le recortó el `viewBox` a su contenido para que quede centrado.

## Elementos solo de interfaz

Google, “olvidé mi contraseña”, adjuntos, exportar PDF, editar/eliminar
registros del historial, notificaciones y el propietario del vehículo se
muestran deshabilitados o como texto informativo porque la API todavía no los
expone. No simulan acciones que no existen.
