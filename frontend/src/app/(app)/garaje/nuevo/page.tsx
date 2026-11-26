import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GarageIcon } from '@/components/garaje/garage-icon';
import {
  ERRORES_VEHICULO,
  VehicleFormFields,
} from '@/components/garaje/vehicle-form-fields';
import { SubmitButton } from '@/components/ui/submit-button';
import { createVehicleAction } from '@/lib/garaje-actions';

export const metadata: Metadata = {
  title: 'Nuevo vehículo',
};

interface NewVehicleParams {
  error?: string;
}

export default function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<NewVehicleParams>;
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
      <NewVehicleContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewVehicleContent({
  searchParams,
}: {
  searchParams: Promise<NewVehicleParams>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <header className="g-garage-title">
        <h2>Agregar vehículo</h2>
        <p>
          Ingresa los datos para monitorear sus mantenimientos y recibir alertas
          preventivas a tiempo.
        </p>
      </header>

      <div className="g-garage-ficha">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/garaje/ficha-carro.svg" alt="" />
        <div>
          <small>Ficha técnica</small>
          <strong>Nuevo vehículo</strong>
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

      <form action={createVehicleAction} className="g-garage-form">
        <VehicleFormFields />

        <SubmitButton pendingText="Guardando…" className="g-garage-submit">
          Confirmar y guardar vehículo
          <span className="g-garage-submit-arrow">
            <GarageIcon name="flecha" width={12} height={12} />
          </span>
        </SubmitButton>
      </form>
    </>
  );
}
