import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRightIcon,
  BellIcon,
  CarIcon,
  DocumentIcon,
  SearchIcon,
  ShieldIcon,
  WorkshopIcon,
} from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { VehicleCard } from '@/components/taller/vehicle-card';
import type { BitaResponse } from '@/lib/bita-api';
import { etiquetaEstado, masUrgente } from '@/lib/garaje';
import { diasDesde, diasHasta } from '@/lib/garaje-formato';
import {
  getAuthorizedVehicles,
  getVehicleHealth,
  getVehicleHistory,
  leerPlacasRecientes,
  PLACAS_RECIENTES_COOKIE,
  searchVehicleByPlate,
} from '@/lib/taller';
import { searchPlateAction } from '@/lib/taller-actions';
import type { MaintenanceStatusItem } from '@/types/maintenance';
import type { WorkshopPlateResult } from '@/types/workshop';

export const metadata: Metadata = {
  title: 'Recepción',
};

interface ReceptionParams {
  placa?: string;
  error?: string;
}

export default function TallerPage({
  searchParams,
}: {
  searchParams: Promise<ReceptionParams>;
}) {
  return (
    <Suspense fallback={<ReceptionSkeleton />}>
      <ReceptionContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReceptionContent({
  searchParams,
}: {
  searchParams: Promise<ReceptionParams>;
}) {
  const params = await searchParams;
  const plate = params.placa?.trim() ?? '';
  const [vehicles, result, cookieStore] = await Promise.all([
    getAuthorizedVehicles(),
    plate ? searchVehicleByPlate(plate) : Promise.resolve(null),
    cookies(),
  ]);
  const recientes = leerPlacasRecientes(
    cookieStore.get(PLACAS_RECIENTES_COOKIE)?.value,
  );

  return (
    <>
      <header className="g-taller-head g-recep-head">
        <span className="g-recep-role">
          <WorkshopIcon size={13} />
          Rol taller • Recepción técnica
        </span>
        <h2>Buscar vehículo</h2>
        <p>
          Ingresa la placa para verificar la autorización del cliente e iniciar
          el registro del servicio en su bitácora.
        </p>
      </header>

      <section className="g-card g-recep-search">
        <form action={searchPlateAction}>
          <div className="g-recep-label">
            <label htmlFor="plate">Matrícula o Placa del Vehículo</label>
            <span>Obligatorio</span>
          </div>

          <div className="g-recep-row">
            <span className="g-recep-field">
              <span className="g-recep-field-icon" aria-hidden="true">
                <CarIcon size={16} />
              </span>
              <input
                id="plate"
                type="text"
                name="placa"
                defaultValue={plate}
                placeholder="ABC-123"
                maxLength={10}
                autoComplete="off"
                spellCheck={false}
                required
              />
            </span>
            <SubmitButton pendingText="Buscando…">
              <SearchIcon size={16} />
              Buscar
            </SubmitButton>
          </div>
        </form>

        {recientes.length > 0 && (
          <div className="g-recep-recent">
            <span>Búsquedas recientes:</span>
            {recientes.map((item) => (
              <Link
                key={item}
                href={`/taller?placa=${encodeURIComponent(item)}`}
                className="g-recep-chip"
              >
                {item}
              </Link>
            ))}
          </div>
        )}

        {params.error === 'datos' && (
          <p className="g-alert g-alert--error g-plate-error" role="alert">
            No pudimos leer la placa. Inténtalo de nuevo.
          </p>
        )}
      </section>

      {result && <PlateResult result={result} plate={plate} />}

      {!plate && (
        <section className="g-taller-section">
          <div className="g-taller-section-head">
            <h3>Vehículos autorizados</h3>
            <span>
              {vehicles.data?.length ?? 0}{' '}
              {vehicles.data?.length === 1 ? 'activo' : 'activos'}
            </span>
          </div>

          {!vehicles.ok ? (
            <p className="g-alert g-alert--error" role="alert">
              No pudimos cargar tus vehículos autorizados.
            </p>
          ) : vehicles.data && vehicles.data.length > 0 ? (
            <div className="g-vehicle-list">
              {vehicles.data.map((item) => (
                <VehicleCard key={item.authorizationId} item={item} />
              ))}
            </div>
          ) : (
            <div className="g-card g-empty">
              <span className="g-state-icon" aria-hidden="true">
                <CarIcon size={24} />
              </span>
              <p>
                Aún no tienes vehículos autorizados. Pide al dueño que te
                otorgue acceso desde su garaje.
              </p>
            </div>
          )}

          <Link href="/taller/vehiculos" className="g-taller-link">
            Ver todos los vehículos
            <ArrowRightIcon size={15} />
          </Link>
        </section>
      )}
    </>
  );
}

async function PlateResult({
  result,
  plate,
}: {
  result: BitaResponse<WorkshopPlateResult>;
  plate: string;
}) {
  if (result.status === 400) {
    return (
      <section className="g-card g-state-card g-state-card--alert">
        <span className="g-state-icon" aria-hidden="true">
          <SearchIcon size={26} />
        </span>
        <h3>Placa no válida</h3>
        <p>
          La placa debe tener máximo 10 caracteres y solo puede contener letras,
          números y guiones.
        </p>
        <div className="g-state-actions">
          <Link href="/taller" className="g-btn g-btn--outline">
            Buscar otra placa
          </Link>
        </div>
      </section>
    );
  }

  if (result.status === 404) {
    return (
      <section className="g-card g-state-card">
        <span className="g-state-icon" aria-hidden="true">
          <CarIcon size={26} />
        </span>
        <h3>No encontramos esa placa</h3>
        <p>
          No existe un vehículo con la placa <strong>{plate}</strong>. Revisa
          que esté bien escrita o pide al dueño que lo registre en BITA.
        </p>
        <div className="g-state-actions">
          <Link href="/taller" className="g-btn g-btn--outline">
            Buscar otra placa
          </Link>
        </div>
      </section>
    );
  }

  if (!result.ok || !result.data) {
    return (
      <p className="g-alert g-alert--error" role="alert">
        No pudimos consultar la placa. Inténtalo de nuevo en unos segundos.
      </p>
    );
  }

  const { vehicle, authorization } = result.data;

  if (!authorization) {
    return (
      <section className="g-card g-state-card g-state-card--alert">
        <span className="g-state-icon" aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <h3>Sin autorización</h3>
        <p>
          El vehículo <strong>{vehicle.plate}</strong> existe, pero tu taller no
          tiene una autorización activa del dueño.
        </p>
        <div className="g-state-actions">
          <Link href="/taller" className="g-btn g-btn--outline">
            Buscar otra placa
          </Link>
        </div>
      </section>
    );
  }

  if (!authorization.canRead) {
    return (
      <section className="g-card g-state-card">
        <span className="g-state-icon" aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <h3>Acceso restringido</h3>
        <p>
          Tu taller puede registrar servicios de <strong>{vehicle.plate}</strong>
          , pero el dueño no autorizó la lectura del historial ni del
          kilometraje.
        </p>
        <div className="g-state-actions">
          {authorization.canWrite && (
            <Link
              href={`/taller/registrar/${vehicle.id}`}
              className="g-btn g-btn--primary"
            >
              Registrar servicio
              <ArrowRightIcon size={18} />
            </Link>
          )}
          <Link href="/taller" className="g-btn g-btn--outline">
            Buscar otra placa
          </Link>
        </div>
      </section>
    );
  }

  // Con permiso de lectura se muestran el historial y el estado del
  // vehículo, como en la tarjeta de resultado del Figma ("Taller - Main").
  const [history, health] = await Promise.all([
    getVehicleHistory(vehicle.id),
    getVehicleHealth(vehicle.id),
  ]);
  const records = history.ok ? (history.data ?? []) : [];
  const ultimo = records.reduce<string | null>(
    (max, record) =>
      max === null || record.serviceDate > max ? record.serviceDate : max,
    null,
  );
  const inversion = records.reduce(
    (total, record) => total + (record.cost ?? 0),
    0,
  );
  const urgente = health.ok ? masUrgente(health.data ?? []) : null;
  const km = vehicle.currentKilometers ?? 0;

  return (
    <>
      <section className="g-card g-recep-result">
        <div className="g-recep-result-head">
          <span className="g-recep-car" aria-hidden="true">
            <CarIcon size={24} />
          </span>
          <span className="g-recep-result-info">
            <strong>
              {vehicle.brand} {vehicle.model}
            </strong>
            <small>
              Placa {vehicle.plate}
              {vehicle.year ? ` · ${vehicle.year}` : ''}
            </small>
          </span>
          <span className="g-pill g-pill--green">Autorizado</span>
        </div>

        <div className="g-recep-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/garaje/foto-vehiculo.jpg" alt="" />
          <span>
            <ShieldIcon size={12} />
            Bitácora activa
          </span>
        </div>

        <div className="g-recep-permission">
          <span className="g-recep-permission-icon" aria-hidden="true">
            <ShieldIcon size={15} />
          </span>
          <span>
            <small>Permiso del dueño</small>
            <strong>Vigente</strong>
          </span>
          <span
            className={`g-pill ${
              authorization.canWrite ? 'g-pill--green' : 'g-pill--lilac'
            }`}
          >
            {authorization.canWrite ? 'Lectura + Escritura' : 'Solo lectura'}
          </span>
        </div>

        <dl className="g-recep-stats">
          <div>
            <dt>Odómetro</dt>
            <dd>{new Intl.NumberFormat('en-US').format(km)}</dd>
            <dd>km totales</dd>
          </div>
          <div>
            <dt>Último serv.</dt>
            <dd>{ultimo ? `${diasDesde(ultimo)} días` : '—'}</dd>
            <dd>{ultimo ? 'desde el último' : 'sin registros'}</dd>
          </div>
          <div>
            <dt>Inversión</dt>
            <dd>
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0,
              }).format(inversion)}
            </dd>
            <dd>acumulado</dd>
          </div>
        </dl>

        <div className="g-recep-alert">
          <span className="g-recep-alert-icon" aria-hidden="true">
            <BellIcon size={15} />
          </span>
          <span>
            <span className="g-recep-alert-title">
              Alerta preventiva
              <span>{etiquetaEstado(urgente?.status ?? null)}</span>
            </span>
            <p>
              {urgente
                ? textoAlerta(urgente, km)
                : 'Este vehículo aún no tiene mantenimientos con próxima fecha.'}
            </p>
          </span>
        </div>

        {authorization.canWrite ? (
          <Link
            href={`/taller/registrar/${vehicle.id}`}
            className="g-recep-cta"
          >
            Continuar a registrar servicio
            <span aria-hidden="true">
              <ArrowRightIcon size={18} />
            </span>
          </Link>
        ) : (
          <p className="g-help g-recep-readonly">
            El dueño no autorizó registrar servicios con este taller.
          </p>
        )}

        <Link
          href={`/taller/vehiculos/${vehicle.id}`}
          className="g-taller-link g-recep-history"
        >
          Ver historial completo
          <ArrowRightIcon size={15} />
        </Link>
      </section>

      <aside className="g-recep-note">
        <span aria-hidden="true">
          <DocumentIcon size={16} />
        </span>
        <p>
          Al registrar el servicio, quedará guardado en la bitácora del dueño
          con el nombre de tu taller.
        </p>
      </aside>
    </>
  );
}

// "Próximo cambio de aceite en 1,750 km o 45 días."
function textoAlerta(item: MaintenanceStatusItem, km: number): string {
  const { dueKilometers, dueDate } = item.nextMaintenance;
  const nombre = item.maintenanceType.name;
  const kmRestantes = dueKilometers !== null ? dueKilometers - km : null;
  const dias = dueDate !== null ? diasHasta(dueDate) : null;
  const miles = (valor: number) =>
    new Intl.NumberFormat('en-US').format(valor);

  if (item.status === 'overdue') {
    const partes: string[] = [];
    if (kmRestantes !== null && kmRestantes <= 0) {
      partes.push(`${miles(-kmRestantes)} km`);
    }
    if (dias !== null && dias < 0) partes.push(`${-dias} días`);
    return partes.length > 0
      ? `${nombre} vencido hace ${partes.join(' o ')}.`
      : `${nombre} vencido.`;
  }

  const partes: string[] = [];
  if (kmRestantes !== null && kmRestantes > 0) {
    partes.push(`${miles(kmRestantes)} km`);
  }
  if (dias !== null && dias > 0) partes.push(`${dias} días`);

  return partes.length > 0
    ? `Próximo ${nombre.toLowerCase()} en ${partes.join(' o ')}.`
    : `Próximo ${nombre.toLowerCase()} pronto.`;
}

function ReceptionSkeleton() {
  return (
    <>
      <header className="g-taller-head">
        <div className="g-skeleton g-taller-skeleton-head" />
        <div className="g-skeleton g-taller-skeleton-text" />
      </header>
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-tall" />
    </>
  );
}
