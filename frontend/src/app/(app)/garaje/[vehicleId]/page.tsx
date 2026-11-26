import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { GarageIcon } from '@/components/garaje/garage-icon';
import { VehiclePhoto } from '@/components/garaje/vehicle-photo';
import {
  elegirAlerta,
  etiquetaEstado,
  getMyVehicle,
  getVehiclePhoto,
  masUrgente,
  progresoServicio,
} from '@/lib/garaje';
import {
  diasDesde,
  diasHasta,
  estiloTipo,
  etiquetaMotorizacion,
  formatMiles,
  separarTaller,
} from '@/lib/garaje-formato';
import {
  formatCosto,
  formatFecha,
  getMaintenanceTypes,
  getVehicleHealth,
  getVehicleHistory,
  hoyISO,
} from '@/lib/taller';
import {
  describeReminder,
  getVehicleReminders,
  groupReminders,
  type ReminderItem,
} from '@/lib/reminders';
import type { MaintenanceStatusItem } from '@/types/maintenance';

export const metadata: Metadata = {
  title: 'Ficha del vehículo',
};

interface DetailParams {
  tipo?: string;
  registrado?: string;
  foto?: string;
  editado?: string;
}

// Mensajes de ?foto= después de subir la foto del vehículo.
const MENSAJES_FOTO: Record<string, { ok: boolean; texto: string }> = {
  ok: { ok: true, texto: 'Foto del vehículo actualizada.' },
  grande: {
    ok: false,
    texto: 'La foto es demasiado pesada. Prueba con otra imagen.',
  },
  formato: { ok: false, texto: 'Elige una imagen JPG, PNG o WebP.' },
  conexion: {
    ok: false,
    texto: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  },
  error: {
    ok: false,
    texto: 'No pudimos guardar la foto. Inténtalo otra vez.',
  },
};

export default function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<DetailParams>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <VehicleDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function VehicleDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<DetailParams>;
}) {
  const { vehicleId } = await params;
  const { tipo, registrado, foto, editado } = await searchParams;

  // Todo en paralelo para que cargue más rápido.
  const [vehicle, health, history, types, reminders, photo] = await Promise.all(
    [
      getMyVehicle(vehicleId),
      getVehicleHealth(vehicleId),
      getVehicleHistory(vehicleId),
      getMaintenanceTypes(),
      getVehicleReminders(vehicleId),
      getVehiclePhoto(vehicleId),
    ],
  );

  // 404 = no existe, 403 = es de otro dueño. Ninguno se puede ver.
  if (!vehicle.ok || !vehicle.data) {
    const noExiste = vehicle.status === 404 || vehicle.status === 403;

    return (
      <section className="g-garage-state" style={{ marginTop: 62 }}>
        <h3>{noExiste ? 'Vehículo no encontrado' : 'No pudimos cargarlo'}</h3>
        <p>
          {noExiste
            ? 'Este vehículo no existe o no está en tu garaje.'
            : 'El servidor no respondió. Inténtalo de nuevo en unos segundos.'}
        </p>
        <Link href="/garaje" className="g-btn g-btn--outline">
          Volver al garaje
        </Link>
      </section>
    );
  }

  const auto = vehicle.data;
  const items = health.ok ? (health.data ?? []) : [];
  const registros = history.ok ? (history.data ?? []) : [];
  const hoy = hoyISO();

  // El recordatorio más urgente (la lista ya viene ordenada: vencidos,
  // próximos y al día). Los completados no cuentan.
  const recordatorio =
    groupReminders(
      reminders.ok ? (reminders.data ?? []) : [],
      auto.currentKilometers,
      hoy,
    ).active[0] ?? null;

  const alerta = elegirAlerta(masUrgente(items), recordatorio);

  // Con servicios registrados pero sin alertas, el carro está al día.
  const status = alerta?.status ?? (registros.length > 0 ? 'up_to_date' : null);

  // Filtro del historial por tipo (?tipo=<id del tipo>).
  const filtrados = tipo
    ? registros.filter((record) => record.maintenanceTypeId === tipo)
    : registros;

  // Solo mostramos chips de tipos que tengan registros en este vehículo.
  const tiposUsados = (types.data ?? []).filter((type) =>
    registros.some((record) => record.maintenanceTypeId === type.id),
  );

  const inversion = registros.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const ultimo = registros[0]; // el backend los devuelve del más reciente al más antiguo

  return (
    <>
      <header className="g-garage-detail-head">
        <div>
          <h2>
            {auto.brand} {auto.model} {auto.year ?? ''}
          </h2>
          <p>
            {etiquetaMotorizacion(auto.fuelType) ?? 'Mi fiel compañero de ruta'}
          </p>
        </div>
        <div className="g-garage-detail-actions">
          <span className="g-garage-plate-tag">{auto.plate}</span>
          <Link
            href={`/garaje/${auto.id}/editar`}
            className="g-garage-edit"
            aria-label="Editar vehículo"
          >
            <GarageIcon name="editar" width={16} height={17} />
          </Link>
        </div>
      </header>

      {editado === '1' && (
        <p
          className="g-alert g-alert--ok"
          role="status"
          style={{ marginBottom: 16 }}
        >
          Datos del vehículo actualizados.
        </p>
      )}

      {registrado === '1' && (
        <p
          className="g-alert g-alert--ok"
          role="status"
          style={{ marginBottom: 16 }}
        >
          Mantenimiento registrado. El kilometraje y los recordatorios se
          actualizaron.
        </p>
      )}

      {foto && MENSAJES_FOTO[foto] && (
        <p
          className={`g-alert ${
            MENSAJES_FOTO[foto].ok ? 'g-alert--ok' : 'g-alert--error'
          }`}
          role={MENSAJES_FOTO[foto].ok ? 'status' : 'alert'}
          style={{ marginBottom: 16 }}
        >
          {MENSAJES_FOTO[foto].texto}
        </p>
      )}

      <section className="g-garage-hero">
        <div className="g-garage-photo">
          <VehiclePhoto
            vehicleId={auto.id}
            alt={`${auto.brand} ${auto.model}`}
            photo={photo.ok ? (photo.data?.photo ?? null) : null}
          />
          <span
            className={`g-garage-badge g-garage-photo-status g-garage-badge--${
              status ?? 'none'
            }`}
          >
            {etiquetaEstado(status)}
          </span>
          <span className="g-garage-photo-pill">
            <GarageIcon name="garantia" width={13.75} height={13.1} />
            {registros.length}{' '}
            {registros.length === 1
              ? 'servicio registrado'
              : 'servicios registrados'}
          </span>
        </div>

        <div className="g-garage-stats">
          <div>
            <span>Odómetro</span>
            <strong>{formatMiles(auto.currentKilometers)}</strong>
            <small>km totales</small>
          </div>
          <div>
            <span>Último serv.</span>
            <strong>
              {ultimo ? `${diasDesde(ultimo.serviceDate)} días` : '—'}
            </strong>
          </div>
          <div>
            <span>Inversión</span>
            <strong className="g-garage-money">
              {formatCosto(inversion, null)}
            </strong>
          </div>
        </div>

        {/* La alerta lleva a los recordatorios del vehículo (frente C). */}
        <Link
          href={`/garaje/${auto.id}/recordatorios`}
          className={`g-garage-alert g-garage-alert--${alerta?.status ?? 'up_to_date'}`}
        >
          <span className="g-garage-alert-icon">
            <GarageIcon name="campana" width={16.7} height={16.7} />
          </span>
          <div className="g-garage-alert-body">
            <div className="g-garage-alert-title">
              Alerta Preventiva
              <span>
                {alerta ? etiquetaEstado(alerta.status) : 'Recordatorios'}
              </span>
            </div>
            <p className="g-garage-alert-text">
              {alerta?.origen === 'mantenimiento' ? (
                <TextoAlerta item={alerta.item} km={auto.currentKilometers} />
              ) : alerta?.origen === 'recordatorio' ? (
                <TextoRecordatorio
                  item={alerta.item}
                  km={auto.currentKilometers}
                  hoy={hoy}
                />
              ) : (
                <>
                  Sin alertas por ahora. <b>Crea un recordatorio</b>.
                </>
              )}
            </p>
            {alerta && (
              <div className={`g-garage-bar g-garage-bar--${alerta.status}`}>
                <span
                  style={{
                    width: `${
                      alerta.origen === 'mantenimiento'
                        ? progresoServicio(alerta.item, auto.currentKilometers)
                        : progresoRecordatorio(alerta.item)
                    }%`,
                  }}
                />
              </div>
            )}
          </div>
        </Link>
      </section>

      <Link
        href={`/garaje/${auto.id}/mantenimiento/nuevo`}
        className="g-garage-cta"
      >
        Registrar nuevo mantenimiento
        <span>
          <GarageIcon name="flecha" width={10.7} height={10.7} />
        </span>
      </Link>

      <h3 className="g-garage-history-title">
        <GarageIcon name="historial" width={15} height={15} />
        Historial de Servicios
      </h3>

      <nav className="g-garage-filters" aria-label="Filtrar historial">
        <Link
          href={`/garaje/${auto.id}`}
          className="g-garage-filter"
          aria-current={!tipo ? 'page' : undefined}
        >
          Todos ({registros.length})
        </Link>
        {tiposUsados.map((type) => (
          <Link
            key={type.id}
            href={`/garaje/${auto.id}?tipo=${type.id}`}
            className="g-garage-filter"
            aria-current={tipo === type.id ? 'page' : undefined}
          >
            {type.name}
          </Link>
        ))}
      </nav>

      {!history.ok ? (
        <p className="g-alert g-alert--error" role="alert">
          No pudimos cargar el historial de este vehículo.
        </p>
      ) : filtrados.length === 0 ? (
        <section className="g-garage-state">
          <p>
            {tipo
              ? 'No hay registros de este tipo.'
              : 'Este vehículo todavía no tiene mantenimientos registrados.'}
          </p>
        </section>
      ) : (
        <div className="g-garage-records">
          {filtrados.map((record) => {
            const estilo = estiloTipo(record.maintenanceType.name);
            const costo = formatCosto(record.cost, record.observations);
            const { taller } = separarTaller(record.observations);

            return (
              <article key={record.id} className="g-garage-record">
                <div className="g-garage-record-head">
                  <div className="g-garage-record-main">
                    <span
                      className="g-garage-record-icon"
                      style={{ background: estilo.fondo, color: estilo.color }}
                    >
                      <GarageIcon name={estilo.icono} width={18} height={17} />
                    </span>
                    <div>
                      <h3>{record.maintenanceType.name}</h3>
                      <p className="g-garage-record-meta">
                        <GarageIcon
                          name="fecha-mini"
                          width={10.5}
                          height={11.7}
                        />
                        {formatFecha(record.serviceDate)} ·{' '}
                        {formatMiles(record.kilometers)} km
                      </p>
                    </div>
                  </div>
                  {costo && (
                    <span className="g-garage-record-cost">{costo}</span>
                  )}
                </div>

                <div className="g-garage-record-foot">
                  <span className="g-garage-record-shop">
                    <GarageIcon name="taller-mini" width={12} height={10.7} />
                    {taller ??
                      (record.workshopId
                        ? 'Registrado por un taller'
                        : 'Registrado por ti')}
                  </span>
                  <span className="g-garage-record-status">Completado</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

// "Próximo cambio de aceite en 1,750 km o 45 días."
function TextoAlerta({
  item,
  km,
}: {
  item: MaintenanceStatusItem;
  km: number;
}) {
  const { dueKilometers, dueDate } = item.nextMaintenance;
  const nombre = item.maintenanceType.name.toLowerCase();
  const kmRestantes = dueKilometers !== null ? dueKilometers - km : null;
  const dias = dueDate !== null ? diasHasta(dueDate) : null;

  if (item.status === 'overdue') {
    return (
      <>
        {item.maintenanceType.name} vencido
        {kmRestantes !== null && kmRestantes <= 0 && (
          <>
            {' '}
            hace <b>{formatMiles(-kmRestantes)} km</b>
          </>
        )}
        {dias !== null && dias < 0 && (
          <>
            {' '}
            (<b>{-dias} días</b>)
          </>
        )}
        .
      </>
    );
  }

  return (
    <>
      Próximo {nombre}
      {kmRestantes !== null && (
        <>
          {' '}
          en <b>{formatMiles(Math.max(0, kmRestantes))} km</b>
        </>
      )}
      {dias !== null && (
        <>
          {kmRestantes !== null ? ' o ' : ' en '}
          <b>{Math.max(0, dias)} días</b>
        </>
      )}
      .
    </>
  );
}

// "Recordatorio Frenos: 4,000 km · faltan 700 km."
function TextoRecordatorio({
  item,
  km,
  hoy,
}: {
  item: ReminderItem;
  km: number;
  hoy: string;
}) {
  const detalle = describeReminder(item.reminder, km, hoy).join(' / ');

  return (
    <>
      Recordatorio <b>{item.reminder.title}</b>
      {detalle && <>: {detalle}</>}.
    </>
  );
}

// Los recordatorios no guardan desde dónde se cuenta, así que la barra
// va por estado: vencido llena, próximo casi llena, al día a la mitad.
function progresoRecordatorio(item: ReminderItem): number {
  if (item.health === 'overdue') return 100;
  if (item.health === 'upcoming') return 85;
  return 40;
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" style={{ paddingTop: 62 }}>
      <div
        className="g-skeleton"
        style={{ height: 30, width: '60%', marginBottom: 24 }}
      />
      <div
        className="g-skeleton g-garage-skeleton"
        style={{ height: 424, marginBottom: 16 }}
      />
      <div className="g-skeleton g-garage-skeleton" style={{ height: 125 }} />
    </div>
  );
}
