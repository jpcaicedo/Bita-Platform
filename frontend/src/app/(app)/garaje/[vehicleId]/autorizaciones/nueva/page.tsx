import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { isUuid } from '@/lib/uuid';

// Otorgar acceso ahora vive en /talleres/otorgar, donde se pueden elegir uno o
// varios vehículos. Esta ruta se conserva para los enlaces viejos y llega con
// el vehículo ya marcado.
export default function NuevaAutorizacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ taller?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <RedirectToGrant params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RedirectToGrant({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ taller?: string }>;
}): Promise<never> {
  const [{ vehicleId }, query] = await Promise.all([params, searchParams]);
  const taller =
    query.taller && isUuid(query.taller) ? `&taller=${query.taller}` : '';

  redirect(`/talleres/otorgar?vehiculo=${vehicleId}${taller}`);
}
