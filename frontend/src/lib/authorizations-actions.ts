'use server';

import { redirect } from 'next/navigation';
import { grantAuthorization, revokeAuthorization } from './authorizations';
import { requireOwner } from './session';
import { isUuid } from './uuid';

function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function volverARevocar(
  vehicleId: string,
  authorizationId: string,
  error: string,
): never {
  redirect(
    `/garaje/${vehicleId}/autorizaciones/${authorizationId}/revocar?error=${error}`,
  );
}

// Autoriza un taller en uno o varios vehículos: el backend recibe una
// autorización por vehículo, así que se crean una tras otra.
export async function grantAuthorizationAction(formData: FormData) {
  await requireOwner();

  const vehicleIds = [
    ...new Set(formData.getAll('vehicleIds').map((id) => String(id).trim())),
  ].filter((id) => isUuid(id));
  const workshopId = texto(formData, 'workshopId');
  const permission = texto(formData, 'permission');

  const volver = (error: string): never => {
    const params = new URLSearchParams({ error });
    if (isUuid(workshopId)) params.set('taller', workshopId);
    if (vehicleIds.length > 0) params.set('vehiculo', vehicleIds.join(','));
    redirect(`/talleres/otorgar?${params.toString()}`);
  };

  if (vehicleIds.length === 0) volver('vehiculos');
  if (!isUuid(workshopId)) volver('taller_id');
  if (permission !== 'read' && permission !== 'write') volver('permisos');

  let primera: { vehicleId: string; authorizationId: string } | null = null;
  let otorgadas = 0;

  for (const vehicleId of vehicleIds) {
    const result = await grantAuthorization(vehicleId, {
      workshopId,
      canRead: true,
      canWrite: permission === 'write',
    });

    if (!result.ok || !result.data) {
      // Si alguna ya quedó guardada, no se repite el formulario completo.
      if (otorgadas > 0) redirect('/talleres?ok=parcial');

      const message = result.message?.toLowerCase() ?? '';

      if (result.status === 0) volver('conexion');
      if (result.status === 403) volver('acceso');
      if (result.status === 404) {
        volver(message.includes('workshop') ? 'taller_no_existe' : 'vehiculo');
      }
      if (result.status === 400 && message.includes('owner')) {
        volver('propio');
      }
      volver('datos');
    }

    primera ??= { vehicleId, authorizationId: result.data!.id };
    otorgadas += 1;
  }

  if (otorgadas > 1 || !primera) {
    redirect(`/talleres?ok=otorgadas&n=${otorgadas}`);
  }

  redirect(
    `/garaje/${primera.vehicleId}/autorizaciones/${primera.authorizationId}/confirmacion`,
  );
}

export async function revokeAuthorizationAction(formData: FormData) {
  await requireOwner();

  const vehicleId = texto(formData, 'vehicleId');
  const authorizationId = texto(formData, 'authorizationId');

  if (!isUuid(vehicleId)) redirect('/garaje');
  if (!isUuid(authorizationId)) {
    redirect(`/garaje/${vehicleId}/autorizaciones`);
  }

  const reason = texto(formData, 'reason');

  if (reason.length > 500) {
    volverARevocar(vehicleId, authorizationId, 'motivo');
  }

  const result = await revokeAuthorization(
    authorizationId,
    reason ? { reason } : {},
  );

  if (result.status === 0) {
    volverARevocar(vehicleId, authorizationId, 'conexion');
  }
  if (result.status === 403) volverARevocar(vehicleId, authorizationId, 'acceso');
  if (result.status === 404) {
    volverARevocar(vehicleId, authorizationId, 'no_encontrada');
  }
  if (result.status === 409) {
    volverARevocar(vehicleId, authorizationId, 'ya_revocada');
  }
  if (!result.ok) volverARevocar(vehicleId, authorizationId, 'datos');

  redirect(`/garaje/${vehicleId}/autorizaciones?ok=revocada`);
}
