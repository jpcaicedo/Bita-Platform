import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { TrashIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { getMyVehicle } from '@/lib/garaje';
import { deleteVehicleAction } from '@/lib/garaje-actions';
import { getVehicleReminders } from '@/lib/reminders';
import { getVehicleHistory } from '@/lib/taller';

export const metadata: Metadata = {
  title: 'Eliminar vehículo',
};

interface DeleteVehicleParams {
  error?: string;
}

// Confirmación antes de borrar: muestra lo que se va a perder, como la
// pantalla de revocar una autorización.
export default function DeleteVehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<DeleteVehicleParams>;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="g-skeleton g-garage-skeleton"
          style={{ height: 360, marginTop: 62 }}
        />
      }
    >
      <DeleteVehicleContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function DeleteVehicleContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<DeleteVehicleParams>;
}) {
  const { vehicleId } = await params;
  const { error } = await searchParams;

  const [vehicle, history, reminders] = await Promise.all([
    getMyVehicle(vehicleId),
    getVehicleHistory(vehicleId),
    getVehicleReminders(vehicleId),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return (
      <section className="g-garage-state" style={{ marginTop: 62 }}>
        <h3>Vehículo no encontrado</h3>
        <p>Este vehículo no existe o no está en tu garaje.</p>
        <Link href="/garaje" className="g-btn g-btn--outline">
          Volver al garaje
        </Link>
      </section>
    );
  }

  const auto = vehicle.data;
  const servicios = history.ok ? (history.data?.length ?? 0) : 0;
  const recordatorios = reminders.ok ? (reminders.data?.length ?? 0) : 0;

  return (
    <section className="g-garage-confirm">
      <span className="g-garage-confirm-icon" aria-hidden="true">
        <TrashIcon size={28} />
      </span>

      <h2>¿Eliminar este vehículo?</h2>
      <p>
        Vas a eliminar el{' '}
        <strong>
          {auto.brand} {auto.model}
        </strong>{' '}
        con placa <strong>{auto.plate}</strong>. Esta acción no se puede
        deshacer.
      </p>

      <ul className="g-garage-confirm-list">
        <li>
          {servicios} {servicios === 1 ? 'servicio' : 'servicios'} del historial
        </li>
        <li>
          {recordatorios}{' '}
          {recordatorios === 1 ? 'recordatorio' : 'recordatorios'}
        </li>
        <li>Los permisos que les diste a talleres</li>
      </ul>

      {error && (
        <p className="g-alert g-alert--error" role="alert">
          {error === 'conexion'
            ? 'No pudimos conectar con el servidor. Inténtalo otra vez.'
            : 'No pudimos eliminar el vehículo. Inténtalo otra vez.'}
        </p>
      )}

      <form action={deleteVehicleAction} className="g-garage-confirm-actions">
        <input type="hidden" name="vehicleId" value={auto.id} />
        <SubmitButton pendingText="Eliminando…" className="g-btn g-btn--danger">
          Sí, eliminar vehículo
        </SubmitButton>
        <Link href={`/garaje/${auto.id}`} className="g-btn g-btn--outline">
          Cancelar
        </Link>
      </form>
    </section>
  );
}
