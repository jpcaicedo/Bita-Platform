import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRightIcon,
  CarIcon,
  CheckIcon,
  SearchIcon,
  ShieldIcon,
} from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { VehicleCard } from '@/components/taller/vehicle-card';
import type { BitaResponse } from '@/lib/bita-api';
import {
  formatKilometros,
  getAuthorizedVehicles,
  searchVehicleByPlate,
} from '@/lib/taller';
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
  const [vehicles, result] = await Promise.all([
    getAuthorizedVehicles(),
    plate ? searchVehicleByPlate(plate) : Promise.resolve(null),
  ]);

  return (
    <>
      <header className="g-taller-head">
        <h2>Recepción de vehículos</h2>
        <p>
          Busca por placa para confirmar la autorización del dueño antes de
          registrar un servicio.
        </p>
      </header>

      <section className="g-card g-plate-card">
        <div className="g-plate-card-head">
          <span className="g-plate-icon" aria-hidden="true">
            <SearchIcon size={22} />
          </span>
          <div>
            <h3>Buscar vehículo</h3>
            <p>Ingresa la placa tal como aparece en el vehículo.</p>
          </div>
        </div>

        <form action="/taller" method="get" className="g-plate-form">
          <label htmlFor="plate" className="g-sr-only">
            Placa del vehículo
          </label>
          <div className="g-plate-row">
            <input
              id="plate"
              className="g-input"
              type="text"
              name="placa"
              defaultValue={plate}
              placeholder="ABC-123"
              maxLength={10}
              autoComplete="off"
              required
            />
            <SubmitButton pendingText="…">
              <SearchIcon size={20} />
              <span className="g-sr-only">Buscar</span>
            </SubmitButton>
          </div>
        </form>

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

function PlateResult({
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

  return (
    <section className="g-card g-state-card">
      <span className="g-state-icon" aria-hidden="true">
        <CheckIcon size={26} />
      </span>
      <h3>Vehículo autorizado</h3>

      <div className="g-vehicle-strip">
        <span className="g-vehicle-plate">{vehicle.plate}</span>
        <span className="g-vehicle-strip-info">
          <strong>
            {vehicle.brand} {vehicle.model}
          </strong>
          <span>
            {vehicle.year ?? 'Año no registrado'} ·{' '}
            {formatKilometros(vehicle.currentKilometers)}
          </span>
        </span>
      </div>

      <div className="g-pills-row">
        <span className="g-pill g-pill--green">
          <CheckIcon size={13} /> Lectura
        </span>
        <span
          className={`g-pill ${
            authorization.canWrite ? 'g-pill--green' : 'g-pill--lilac'
          }`}
        >
          <ShieldIcon size={13} />
          {authorization.canWrite ? 'Escritura' : 'Solo lectura'}
        </span>
      </div>

      <div className="g-state-actions">
        {authorization.canWrite ? (
          <Link
            href={`/taller/registrar/${vehicle.id}`}
            className="g-btn g-btn--primary"
          >
            Registrar servicio
            <ArrowRightIcon size={18} />
          </Link>
        ) : (
          <p className="g-help">
            El dueño no autorizó registrar servicios con este taller.
          </p>
        )}
        <Link
          href={`/taller/vehiculos/${vehicle.id}`}
          className="g-btn g-btn--outline"
        >
          Ver historial
        </Link>
      </div>
    </section>
  );
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
