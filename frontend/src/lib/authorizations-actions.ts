'use server';

import { redirect } from 'next/navigation';
import { grantAuthorization, revokeAuthorization } from './authorizations';
import { requireOwner } from './session';
import { isUuid } from './uuid';

function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function volverAOtorgar(vehicleId: string, error: string): never {
  redirect(`/garaje/${vehicleId}/autorizaciones/nueva?error=${error}`);
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

export async function grantAuthorizationAction(formData: FormData) {
  await requireOwner();

  const vehicleId = texto(formData, 'vehicleId');

  if (!isUuid(vehicleId)) redirect('/garaje');

  const workshopId = texto(formData, 'workshopId');
  const permission = texto(formData, 'permission');

  if (!isUuid(workshopId)) volverAOtorgar(vehicleId, 'taller_id');
  if (permission !== 'read' && permission !== 'write') {
    volverAOtorgar(vehicleId, 'permisos');
  }

  const result = await grantAuthorization(vehicleId, {
    workshopId,
    canRead: true,
    canWrite: permission === 'write',
  });

  const message = result.message?.toLowerCase() ?? '';

  if (result.status === 0) volverAOtorgar(vehicleId, 'conexion');
  if (result.status === 403) volverAOtorgar(vehicleId, 'acceso');
  if (result.status === 404) {
    volverAOtorgar(
      vehicleId,
      message.includes('workshop') ? 'taller_no_existe' : 'vehiculo',
    );
  }
  if (result.status === 400 && message.includes('owner')) {
    volverAOtorgar(vehicleId, 'propio');
  }
  if (!result.ok || !result.data) volverAOtorgar(vehicleId, 'datos');

  redirect(`/garaje/${vehicleId}/autorizaciones/${result.data.id}/confirmacion`);
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
