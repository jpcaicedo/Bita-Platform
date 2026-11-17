import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { GarageIcon } from '@/components/garaje/garage-icon';
import { SubmitButton } from '@/components/ui/submit-button';
import { getMyVehicle } from '@/lib/garaje';
import { registerOwnerMaintenanceAction } from '@/lib/garaje-actions';
import { estiloTipo, formatMiles } from '@/lib/garaje-formato';
import { getMaintenanceTypes, hoyISO } from '@/lib/taller';

export const metadata: Metadata = {
  title: 'Registrar mantenimiento',
};

interface RegisterParams {
  error?: string;
}

const ERRORES: Record<string, string> = {
  campos: 'Selecciona el tipo de servicio, la fecha y el kilometraje.',
  fecha: 'La fecha del servicio no es válida.',
  km: 'El kilometraje debe ser un número entero mayor o igual a cero.',
  costo: 'El costo debe ser un número positivo con máximo 2 decimales.',
  observaciones: 'Las observaciones no pueden pasar de 2000 caracteres.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos:
    'El servidor rechazó el registro. Revisa que la fecha no sea futura y que el kilometraje no sea menor al último registrado.',
};

export default function NewMaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<RegisterParams>;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="g-skeleton g-garage-skeleton"
          style={{ height: 600, marginTop: 53 }}
        />
      }
    >
      <NewMaintenanceContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function NewMaintenanceContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<RegisterParams>;
}) {
  const { vehicleId } = await params;
  const { error } = await searchParams;
  const [vehicle, types] = await Promise.all([
    getMyVehicle(vehicleId),
    getMaintenanceTypes(),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return (
      <section className="g-garage-state" style={{ marginTop: 53 }}>
        <h3>Vehículo no disponible</h3>
        <p>No encontramos este vehículo en tu garaje.</p>
        <Link href="/garaje" className="g-btn g-btn--outline">
          Volver al garaje
        </Link>
      </section>
    );
  }

  const auto = vehicle.data;
  const tipos = (types.data ?? []).filter((type) => type.isActive);

  return (
    <div className="g-garage-reg">
      <header className="g-garage-intro">
        <div className="g-garage-kicker">
          <span>
            <GarageIcon name="cuaderno" width={12.5} height={12.5} />
          </span>
          Nuevo cuaderno de taller
        </div>
        <h2>Registrar mantenimiento</h2>
        <p>
          Añade los detalles del servicio realizado o programado para conservar
          la bitácora al día.
        </p>

        <div className="g-garage-vehicle">
          <div>
            <div className="g-garage-vehicle-name">
              {auto.brand} {auto.model}
              <span>Activo</span>
            </div>
            <p>
              Placa: {auto.plate}
              {auto.year ? ` • ${auto.year}` : ''}
            </p>
          </div>
          <Link href={`/garaje/${auto.id}`} aria-label="Volver a la ficha">
            <GarageIcon name="cambiar" width={6.75} height={13.4} />
          </Link>
        </div>
      </header>

      {error && (
        <p
          className="g-alert g-alert--error"
          role="alert"
          style={{ marginBottom: 16 }}
        >
          {ERRORES[error] ?? ERRORES.datos}
        </p>
      )}

      {tipos.length === 0 ? (
        <p className="g-alert g-alert--error" role="alert">
          No hay tipos de mantenimiento creados en el backend.
        </p>
      ) : (
        <form action={registerOwnerMaintenanceAction} className="g-garage-form">
          <input type="hidden" name="vehicleId" value={auto.id} />

          <fieldset className="g-garage-types">
            <legend className="g-garage-reg-label">
              <span>
                Tipo de servicio<b>*</b>
              </span>
              <small>Selecciona uno</small>
            </legend>
            {tipos.map((type, index) => (
              <label key={type.id} className="g-garage-type">
                <input
                  type="radio"
                  name="maintenanceTypeId"
                  value={type.id}
                  defaultChecked={index === 0}
                  required
                />
                <span>
                  <span className="g-garage-type-icon">
                    <GarageIcon
                      name={estiloTipo(type.name).chip}
                      width={13.3}
                      height={13.3}
                    />
                  </span>
                  <span className="g-garage-type-text">{type.name}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="g-garage-field">
            <label
              htmlFor="serviceDate"
              className="g-garage-reg-label g-garage-reg-label--jakarta"
            >
              <span>
                Fecha del servicio<b>*</b>
              </span>
            </label>
            <div className="g-garage-input">
              <span className="g-garage-input-icon">
                <GarageIcon name="calendario" width={13.5} height={15} />
              </span>
              <input
                id="serviceDate"
                name="serviceDate"
                type="date"
                defaultValue={hoyISO()}
                max={hoyISO()}
                required
              />
              <GarageIcon name="calendario-editar" width={16.7} height={16.7} />
            </div>
          </div>

          <div className="g-garage-field">
            <label htmlFor="kilometers" className="g-garage-reg-label">
              <span>
                Kilometraje actual<b>*</b>
              </span>
              <small className="g-garage-hint">
                Anterior: {formatMiles(auto.currentKilometers)} km
              </small>
            </label>
            <div className="g-garage-input g-garage-input--big g-garage-input--km">
              <span className="g-garage-input-icon">
                <GarageIcon name="velocimetro" width={15} height={12} />
              </span>
              <input
                id="kilometers"
                name="kilometers"
                type="number"
                defaultValue={auto.currentKilometers}
                min={0}
                step={1}
                required
              />
              <span className="g-garage-tag">KM</span>
            </div>
          </div>

          <div className="g-garage-field">
            <label
              htmlFor="cost"
              className="g-garage-reg-label g-garage-reg-label--jakarta"
            >
              <span>
                Costo total del servicio<b>*</b>
              </span>
            </label>
            <div className="g-garage-input g-garage-input--big g-garage-input--cost">
              <span className="g-garage-input-icon">
                <GarageIcon name="dinero" width={16.5} height={12} />
              </span>
              <input
                id="cost"
                name="cost"
                type="number"
                placeholder="85000"
                min={0}
                step={0.01}
                required
              />
              <span className="g-garage-tag g-garage-tag--money">COP</span>
            </div>
          </div>

          <div className="g-garage-field">
            <label htmlFor="workshopName" className="g-garage-reg-label">
              Taller o mecánico
              <small>Opcional</small>
            </label>
            <div className="g-garage-input">
              <span className="g-garage-input-icon">
                <GarageIcon name="taller" width={13.5} height={12} />
              </span>
              <input
                id="workshopName"
                name="workshopName"
                maxLength={120}
                placeholder="Ej. AutoTaller Central o Lubricentro San José"
              />
            </div>
          </div>

          <div className="g-garage-field">
            <label htmlFor="observations" className="g-garage-reg-label">
              Observaciones y piezas
              <small>Notas</small>
            </label>
            <div className="g-garage-input g-garage-input--notes">
              <span className="g-garage-input-icon">
                <GarageIcon name="notas" width={16.5} height={11.3} />
              </span>
              <textarea
                id="observations"
                name="observations"
                maxLength={1800}
                placeholder="Ej. Se usó aceite sintético 5W-30 Mobil 1 y filtro original OEM."
              />
            </div>
          </div>

          <SubmitButton pendingText="Guardando…" className="g-garage-save">
            <span className="g-garage-save-text">
              Guardar registro de mantenimiento
            </span>
            <span className="g-garage-save-arrow">
              <GarageIcon name="flecha" width={12} height={12} />
            </span>
            <span className="g-garage-save-cars" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/garaje/carros-1.svg" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/garaje/carros-2.svg" alt="" />
            </span>
          </SubmitButton>
        </form>
      )}
    </div>
  );
}