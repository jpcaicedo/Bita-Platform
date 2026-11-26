import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import { VehicleStrip } from '@/components/gestion/vehicle-strip';
import { ReminderCriteriaFields } from '@/components/recordatorios/reminder-criteria-fields';
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  GaugeIcon,
} from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { getMyVehicle } from '@/lib/garaje';
import { createReminderAction } from '@/lib/reminders-actions';
import { requireOwner } from '@/lib/session';
import { getMaintenanceTypes, hoyISO } from '@/lib/taller';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Nuevo recordatorio',
};

interface NewReminderParams {
  error?: string;
}

const ERRORES: Record<string, string> = {
  titulo: 'El título es obligatorio y debe tener máximo 150 caracteres.',
  descripcion: 'La descripción debe tener máximo 2000 caracteres.',
  criterio: 'Elige si el aviso se activa por fecha o por kilometraje.',
  tipo: 'El tipo de mantenimiento no es válido.',
  fecha: 'Escribe una fecha válida para el recordatorio.',
  fecha_pasada: 'La fecha del recordatorio no puede estar en el pasado.',
  km: 'El kilometraje debe ser un número entero mayor o igual a cero.',
  anticipacion:
    'Los avisos de anticipación deben ser números enteros mayores o iguales a cero.',
  recurrencia:
    'Si el recordatorio se repite, indica cada cuánto (mínimo 1).',
  acceso: 'Solo el dueño del vehículo puede crear recordatorios.',
  vehiculo: 'No encontramos el vehículo.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos:
    'El servidor rechazó el recordatorio. Revisa que el kilometraje supere el actual del vehículo y que la fecha no sea pasada.',
};

export default function NuevoRecordatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<NewReminderParams>;
}) {
  return (
    <Suspense fallback={<NewReminderSkeleton />}>
      <NewReminderContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function NewReminderContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<NewReminderParams>;
}) {
  const [{ vehicleId }, query] = await Promise.all([params, searchParams]);
  await requireOwner();

  const [vehicle, types] = await Promise.all([
    getMyVehicle(vehicleId),
    getMaintenanceTypes(),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return <VehicleMissing status={vehicle.status} />;
  }

  const kilometers = vehicle.data.currentKilometers;
  const today = hoyISO();
  const errorText = query.error
    ? (ERRORES[query.error] ?? ERRORES.datos)
    : null;

  return (
    <section className="g-gest">
      <header className="g-gest-head">
        <p>
          Te avisaremos antes de que venza para que nada se te escape.
        </p>
      </header>

      <VehicleStrip vehicle={vehicle.data} />

      {errorText && (
        <div className="g-alert g-alert--error" role="alert">
          {errorText}
        </div>
      )}

      <form action={createReminderAction} className="g-card g-gest-form">
        <input type="hidden" name="vehicleId" value={vehicleId} />

        <h3 className="g-gest-form-title">
          <BellIcon size={18} />
          Recordatorio
        </h3>

        <div className="g-field">
          <label htmlFor="reminder-title" className="g-label">
            Título *
          </label>
          <input
            id="reminder-title"
            className="g-input"
            type="text"
            name="title"
            maxLength={150}
            placeholder="Ej. Cambio de bujías"
            required
          />
        </div>

        {types.ok && types.data && types.data.length > 0 && (
          <div className="g-field">
            <label htmlFor="reminder-type" className="g-label">
              Tipo de mantenimiento
            </label>
            <select
              id="reminder-type"
              className="g-input"
              name="maintenanceTypeId"
              defaultValue=""
            >
              <option value="">Sin tipo específico</option>
              {types.data.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <p className="g-help">
              Si eliges un tipo, el recordatorio se cierra solo cuando se
              registre ese mantenimiento.
            </p>
          </div>
        )}

        <div className="g-field">
          <label htmlFor="reminder-description" className="g-label">
            Descripción
          </label>
          <textarea
            id="reminder-description"
            className="g-textarea"
            name="description"
            maxLength={2000}
            placeholder="Detalles que quieras recordar."
          />
        </div>

        <h3 className="g-gest-form-title">
          <CalendarIcon size={18} />
          ¿Cuándo avisar?
        </h3>

        <ReminderCriteriaFields currentKilometers={kilometers} today={today} />

        <h3 className="g-gest-form-title">
          <GaugeIcon size={18} />
          Aviso de anticipación
        </h3>

        <div className="g-gest-grid">
          <div className="g-field">
            <label htmlFor="reminder-lead-days" className="g-label">
              Días antes
            </label>
            <input
              id="reminder-lead-days"
              className="g-input"
              type="number"
              name="leadDays"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="7"
            />
          </div>

          <div className="g-field">
            <label htmlFor="reminder-lead-km" className="g-label">
              Km antes
            </label>
            <input
              id="reminder-lead-km"
              className="g-input"
              type="number"
              name="leadKilometers"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="500"
            />
          </div>
        </div>

        <p className="g-help">
          Si lo dejas vacío avisamos 7 días o 500 km antes del límite.
        </p>

        <SubmitButton pendingText="Guardando…">
          Crear recordatorio
          <ArrowRightIcon size={18} />
        </SubmitButton>
      </form>
    </section>
  );
}

function NewReminderSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-tall" />
      <div className="g-skeleton g-gest-skeleton-card" />
    </section>
  );
}
