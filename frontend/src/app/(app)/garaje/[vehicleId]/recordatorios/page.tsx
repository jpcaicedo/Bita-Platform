import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Stats } from '@/components/gestion/stats';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import { VehicleStrip } from '@/components/gestion/vehicle-strip';
import { ReminderCard } from '@/components/recordatorios/reminder-card';
import { BellIcon, PlusIcon } from '@/components/ui/icons';
import { getMyVehicle } from '@/lib/garaje';
import { getVehicleReminders, groupReminders } from '@/lib/reminders';
import { requireOwner } from '@/lib/session';
import { hoyISO } from '@/lib/taller';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Recordatorios',
};

interface ReminderListParams {
  ok?: string;
}

const AVISOS: Record<string, string> = {
  creado: 'Recordatorio creado. Te avisaremos antes de que venza.',
  completado: 'Recordatorio completado.',
};

export default function RecordatoriosPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<ReminderListParams>;
}) {
  return (
    <Suspense fallback={<RemindersSkeleton />}>
      <RemindersContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RemindersContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<ReminderListParams>;
}) {
  const [{ vehicleId }, query] = await Promise.all([params, searchParams]);
  await requireOwner();

  const [vehicle, reminders] = await Promise.all([
    getMyVehicle(vehicleId),
    getVehicleReminders(vehicleId),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return <VehicleMissing status={vehicle.status} />;
  }

  const kilometers = vehicle.data.currentKilometers;
  const today = hoyISO();
  const groups = groupReminders(
    reminders.ok ? (reminders.data ?? []) : [],
    kilometers,
    today,
  );
  const notice = query.ok ? AVISOS[query.ok] : undefined;

  return (
    <section className="g-gest">
      <header className="g-gest-head">
        <p>
          Avisos por fecha o kilometraje para que ningún mantenimiento se te
          pase.
        </p>
      </header>

      <VehicleStrip vehicle={vehicle.data} />

      {notice && (
        <div className="g-alert g-alert--ok" role="status">
          {notice}
        </div>
      )}

      {!reminders.ok && (
        <div className="g-alert g-alert--error" role="alert">
          No pudimos cargar los recordatorios de este vehículo.
        </div>
      )}

      <Stats
        items={[
          { value: groups.overdue, label: 'Vencidos', tone: 'alert' },
          { value: groups.upcoming, label: 'Próximos', tone: 'lilac' },
          { value: groups.onTrack, label: 'Al día', tone: 'green' },
        ]}
      />

      <Link
        href={`/garaje/${vehicleId}/recordatorios/nuevo`}
        className="g-btn g-btn--primary"
      >
        <PlusIcon size={18} />
        Nuevo recordatorio
      </Link>

      <section className="g-gest-section">
        <div className="g-gest-section-head">
          <h3>Pendientes</h3>
          <span>
            {groups.active.length}{' '}
            {groups.active.length === 1 ? 'recordatorio' : 'recordatorios'}
          </span>
        </div>

        {groups.active.length > 0 ? (
          <div className="g-rem-list">
            {groups.active.map((item) => (
              <ReminderCard
                key={item.reminder.id}
                item={item}
                currentKilometers={kilometers}
                today={today}
              />
            ))}
          </div>
        ) : (
          <div className="g-card g-gest-empty">
            <span className="g-gest-state-icon" aria-hidden="true">
              <BellIcon size={24} />
            </span>
            <p>
              No tienes recordatorios pendientes. Crea uno para el cambio de
              aceite, el SOAT o la revisión técnico-mecánica.
            </p>
          </div>
        )}
      </section>

      {groups.closed.length > 0 && (
        <section className="g-gest-section">
          <div className="g-gest-section-head">
            <h3>Completados</h3>
            <span>{groups.closed.length}</span>
          </div>

          <div className="g-rem-list">
            {groups.closed.map((item) => (
              <ReminderCard
                key={item.reminder.id}
                item={item}
                currentKilometers={kilometers}
                today={today}
                showAction={false}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function RemindersSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-tall" />
    </section>
  );
}
