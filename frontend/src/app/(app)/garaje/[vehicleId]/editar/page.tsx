import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { GarageIcon } from '@/components/garaje/garage-icon';
import {
  ERRORES_VEHICULO,
  VehicleFormFields,
} from '@/components/garaje/vehicle-form-fields';
import { TrashIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { getMyVehicle } from '@/lib/garaje';
import { updateVehicleAction } from '@/lib/garaje-actions';

export const metadata: Metadata = {
  title: 'Editar vehículo',
};

interface EditVehicleParams {
  error?: string;
}

export default function EditVehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<EditVehicleParams>;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="g-skeleton g-garage-skeleton"
          style={{ height: 520, marginTop: 53 }}
        />
      }
    >
      <EditVehicleContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditVehicleContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<EditVehicleParams>;
}) {
  const { vehicleId } = await params;
  const { error } = await searchParams;
  const vehicle = await getMyVehicle(vehicleId);

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

  return (
    <>
      <header className="g-garage-title">
        <h2>Editar vehículo</h2>
        <p>
          Corrige los datos de tu vehículo. Los cambios se guardan al confirmar.
        </p>
      </header>

      <div className="g-garage-ficha">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/garaje/ficha-carro.svg" alt="" />
        <div>
          <small>Ficha técnica</small>
          <strong>
            {auto.brand} {auto.model} · {auto.plate}
          </strong>
        </div>
      </div>

      {error && (
        <p
          className="g-alert g-alert--error"
          role="alert"
          style={{ marginBottom: 16 }}
        >
          {ERRORES_VEHICULO[error] ?? ERRORES_VEHICULO.datos}
        </p>
      )}

      <form action={updateVehicleAction} className="g-garage-form">
        <input type="hidden" name="vehicleId" value={auto.id} />
        <VehicleFormFields vehicle={auto} />

        <SubmitButton pendingText="Guardando…" className="g-garage-submit">
          Guardar cambios
          <span className="g-garage-submit-arrow">
            <GarageIcon name="flecha" width={12} height={12} />
          </span>
        </SubmitButton>
      </form>

      {/* Zona de peligro: lleva a la pantalla de confirmación. */}
      <Link
        href={`/garaje/${auto.id}/eliminar`}
        className="g-garage-danger-link"
      >
        <TrashIcon size={16} />
        Eliminar vehículo
      </Link>
    </>
  );
}
