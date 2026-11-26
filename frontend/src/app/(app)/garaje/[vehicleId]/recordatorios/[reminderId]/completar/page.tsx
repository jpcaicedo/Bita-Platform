import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import { VehicleStrip } from '@/components/gestion/vehicle-strip';
import { ReminderCard } from '@/components/recordatorios/reminder-card';
import { BellIcon, CheckIcon, GaugeIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { getMyVehicle } from '@/lib/garaje';
import { completeReminderAction } from '@/lib/reminders-actions';
import { evaluateReminder, findReminder } from '@/lib/reminders';
import { requireOwner } from '@/lib/session';
import { hoyISO } from '@/lib/taller';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Completar recordatorio',
};

interface CompleteParams {
  error?: string;
}

const ERRORES: Record<string, string> = {
  km: 'El kilometraje debe ser un número entero y no puede ser menor al actual del vehículo.',
  estado: 'Este recordatorio ya no está pendiente.',
  no_encontrado: 'No encontramos el recordatorio.',
  acceso: 'Solo el dueño del vehículo puede completar recordatorios.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos: 'El servidor rechazó la solicitud. Inténtalo de nuevo.',
};

export default function CompletarRecordatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string; reminderId: string }>;
  searchParams: Promise<CompleteParams>;
}) {
  return (
    <Suspense fallback={<CompleteSkeleton />}>
      <CompleteContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CompleteContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string; reminderId: string }>;
  searchParams: Promise<CompleteParams>;
}) {
  const [{ vehicleId, reminderId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  await requireOwner();

  const [vehicle, reminder] = await Promise.all([
    getMyVehicle(vehicleId),
    findReminder(vehicleId, reminderId),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return <VehicleMissing status={vehicle.status} />;
  }

  if (
    !reminder ||
    (reminder.status !== 'pending' && reminder.status !== 'notified')
  ) {
    return (
      <section className="g-gest">
        <article className="g-card g-gest-state">
          <span className="g-gest-state-icon" aria-hidden="true">
            <BellIcon size={26} />
          </span>
          <h3>No hay nada por completar</h3>
          <p>
            El recordatorio no existe o ya fue completado. Revisa tu lista para
            confirmarlo.
          </p>
          <div className="g-gest-state-actions">
            <Link
              href={`/garaje/${vehicleId}/recordatorios`}
              className="g-btn g-btn--primary"
            >
              Ver recordatorios
            </Link>
          </div>
        </article>
      </section>
    );
  }

  const kilometers = vehicle.data.currentKilometers;
  const today = hoyISO();
  const errorText = query.error
    ? (ERRORES[query.error] ?? ERRORES.datos)
    : null;

  return (
    <section className="g-gest">
      <header className="g-gest-head">
        <p>Confirma que ya hiciste este mantenimiento.</p>
      </header>

      <VehicleStrip vehicle={vehicle.data} />

      <ReminderCard
        item={{
          reminder,
          health: evaluateReminder(reminder, kilometers, today),
        }}
        currentKilometers={kilometers}
        today={today}
        showAction={false}
      />

      {errorText && (
        <div className="g-alert g-alert--error" role="alert">
          {errorText}
        </div>
      )}

      <form action={completeReminderAction} className="g-card g-gest-form">
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input type="hidden" name="reminderId" value={reminderId} />

        <h3 className="g-gest-form-title">
          <GaugeIcon size={18} />
          Kilometraje actual
        </h3>

        <div className="g-field">
          <label htmlFor="complete-km" className="g-label">
            Kilometraje
          </label>
          <div className="g-gest-field-row">
            <input
              id="complete-km"
              className="g-input"
              type="number"
              name="kilometers"
              min={kilometers}
              step={1}
              inputMode="numeric"
              placeholder={String(kilometers)}
            />
            <span className="g-gest-field-unit">km</span>
          </div>
          <p className="g-help">
            Opcional. Si lo escribes, actualizamos el kilometraje del vehículo.
          </p>
        </div>

        {reminder.recurring && (
          <p className="g-help">
            Este recordatorio se repite: al completarlo programamos el
            siguiente ciclo automáticamente.
          </p>
        )}

        <SubmitButton pendingText="Guardando…">
          <CheckIcon size={18} />
          Marcar como completado
        </SubmitButton>

        <Link
          href={`/garaje/${vehicleId}/recordatorios`}
          className="g-btn g-btn--outline"
        >
          Cancelar
        </Link>
      </form>
    </section>
  );
}

function CompleteSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-tall" />
    </section>
  );
}
