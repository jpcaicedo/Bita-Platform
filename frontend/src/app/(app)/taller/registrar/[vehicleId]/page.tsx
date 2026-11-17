import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRightIcon,
  CalendarIcon,
  DocumentIcon,
  GaugeIcon,
  ShieldIcon,
  WrenchIcon,
} from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { PartsEditor } from '@/components/taller/parts-editor';
import {
  formatKilometros,
  getAuthorizedVehicles,
  getMaintenanceTypes,
  hoyISO,
} from '@/lib/taller';
import { MONEDAS, MONEDA_POR_DEFECTO } from '@/lib/taller-observaciones';
import { registerMaintenanceAction } from '@/lib/taller-actions';

export const metadata: Metadata = {
  title: 'Nuevo registro',
};

interface RegisterParams {
  error?: string;
}

const ERRORES: Record<string, string> = {
  campos: 'Selecciona el tipo de servicio, la fecha y el kilometraje.',
  fecha: 'La fecha del servicio no es válida.',
  km: 'El kilometraje debe ser un número entero mayor o igual a cero.',
  costo: 'El costo debe ser un número mayor o igual a cero.',
  observaciones:
    'El detalle del servicio es demasiado largo. Reduce los textos o repuestos.',
  acceso:
    'El dueño no autorizó registrar servicios con este taller. Pídele que actualice el permiso.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos:
    'El servidor rechazó el registro. Revisa la fecha (no puede ser futura) y que el kilometraje no sea menor al último registrado.',
};

export default function RegistrarPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<RegisterParams>;
}) {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<RegisterParams>;
}) {
  const [{ vehicleId }, query, vehicles, types] = await Promise.all([
    params,
    searchParams,
    getAuthorizedVehicles(),
    getMaintenanceTypes(),
  ]);

  const item = vehicles.data?.find(
    (authorized) => authorized.vehicle.id === vehicleId,
  );
  const errorText = query.error
    ? ERRORES[query.error] ?? ERRORES.datos
    : null;

  if (!item) {
    return (
      <section className="g-card g-state-card g-state-card--alert">
        <span className="g-state-icon" aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <h3>No encontramos el vehículo</h3>
        <p>
          El vehículo no está entre tus autorizaciones activas. Vuelve a la
          recepción y búscalo por placa.
        </p>
        <div className="g-state-actions">
          <Link href="/taller" className="g-btn g-btn--primary">
            Volver a recepción
          </Link>
        </div>
      </section>
    );
  }

  if (!item.canWrite) {
    return (
      <section className="g-card g-state-card g-state-card--alert">
        <span className="g-state-icon" aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <h3>Solo lectura</h3>
        <p>
          El dueño de <strong>{item.vehicle.plate}</strong> no autorizó a tu
          taller para registrar servicios.
        </p>
        <div className="g-state-actions">
          <Link
            href={`/taller/vehiculos/${item.vehicle.id}`}
            className="g-btn g-btn--outline"
          >
            Ver historial
          </Link>
        </div>
      </section>
    );
  }

  const { vehicle } = item;
  const kmActual = vehicle.currentKilometers;
  const today = hoyISO();

  return (
    <>
      <header className="g-taller-head">
        <h2>Nuevo registro</h2>
        <p>
          Completa el servicio. Quedará en la bitácora del vehículo y
          actualizará su kilometraje.
        </p>
      </header>

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

      {errorText && (
        <div className="g-alert g-alert--error" role="alert">
          {errorText}
        </div>
      )}

      <form action={registerMaintenanceAction} className="g-form-card g-card">
        <input type="hidden" name="vehicleId" value={vehicle.id} />

        <section className="g-field">
          <h3 className="g-form-section-title">
            <WrenchIcon size={18} />
            Servicio
          </h3>

          <div className="g-field">
            <label htmlFor="service-type" className="g-label">
              Tipo de mantenimiento *
            </label>
            {types.ok && types.data && types.data.length > 0 ? (
              <select
                id="service-type"
                className="g-input"
                name="maintenanceTypeId"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona un tipo
                </option>
                {types.data.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="g-alert g-alert--error" role="alert">
                No pudimos cargar el catálogo de servicios.
              </p>
            )}
          </div>

          <div className="g-form-grid">
            <div className="g-field">
              <label htmlFor="service-date" className="g-label">
                Fecha *
              </label>
              <input
                id="service-date"
                className="g-input"
                type="date"
                name="serviceDate"
                defaultValue={today}
                max={today}
                required
              />
            </div>

            <div className="g-field">
              <label htmlFor="service-km" className="g-label">
                Kilometraje *
              </label>
              <input
                id="service-km"
                className="g-input"
                type="number"
                name="kilometers"
                defaultValue={kmActual ?? ''}
                min={kmActual ?? 0}
                step={1}
                inputMode="numeric"
                placeholder="45000"
                required
              />
            </div>
          </div>

          <div className="g-field">
            <label htmlFor="service-cost" className="g-label">
              Costo
            </label>
            <div className="g-field-row">
              <input
                id="service-cost"
                className="g-input"
                type="number"
                name="cost"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="Opcional"
              />
              <span className="g-field-unit">sin IVA</span>
            </div>
          </div>
        </section>

        <section className="g-field">
          <h3 className="g-form-section-title">
            <DocumentIcon size={18} />
            Detalle del trabajo
          </h3>

          <div className="g-field">
            <label htmlFor="service-tech" className="g-label">
              Técnico responsable
            </label>
            <input
              id="service-tech"
              className="g-input"
              type="text"
              name="technician"
              maxLength={80}
              placeholder="Ej. Ing. Mateo Restrepo"
            />
          </div>

          <div className="g-field">
            <label htmlFor="service-description" className="g-label">
              Descripción
            </label>
            <textarea
              id="service-description"
              className="g-textarea"
              name="description"
              maxLength={600}
              placeholder="Qué se revisó, qué se encontró y qué se hizo."
            />
          </div>

          <PartsEditor />

          <div className="g-form-grid">
            <div className="g-field">
              <label htmlFor="service-warranty" className="g-label">
                Garantía
              </label>
              <input
                id="service-warranty"
                className="g-input"
                type="text"
                name="warranty"
                maxLength={100}
                placeholder="Ej. 6 meses"
              />
            </div>

            <div className="g-field">
              <label htmlFor="service-currency" className="g-label">
                Moneda
              </label>
              <select
                id="service-currency"
                className="g-input"
                name="currency"
                defaultValue={MONEDA_POR_DEFECTO}
              >
                {MONEDAS.map((moneda) => (
                  <option key={moneda} value={moneda}>
                    {moneda}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <SubmitButton pendingText="Registrando…">
          Registrar servicio
          <ArrowRightIcon size={18} />
        </SubmitButton>
      </form>

      <p className="g-help g-register-note">
        <CalendarIcon size={14} />
        <GaugeIcon size={14} />
        La fecha no puede ser futura y el kilometraje no puede ser menor al
        último registrado. El costo es opcional.
      </p>
    </>
  );
}

function RegisterSkeleton() {
  return (
    <>
      <div className="g-skeleton g-taller-skeleton-head" />
      <div className="g-skeleton g-taller-skeleton-text" />
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-tall" />
      <div className="g-skeleton g-taller-skeleton-card" />
    </>
  );
}
