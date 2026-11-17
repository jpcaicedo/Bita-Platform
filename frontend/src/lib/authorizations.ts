import type { WorkshopAuthorization } from '@/types/authorization';
import { bitaFetch, type BitaResponse } from './bita-api';

export function getVehicleAuthorizations(
  vehicleId: string,
): Promise<BitaResponse<WorkshopAuthorization[]>> {
  return bitaFetch<WorkshopAuthorization[]>(
    `/vehicles/${vehicleId}/authorizations`,
  );
}

export function grantAuthorization(
  vehicleId: string,
  body: { workshopId: string; canRead: boolean; canWrite: boolean },
): Promise<BitaResponse<WorkshopAuthorization>> {
  return bitaFetch<WorkshopAuthorization>(
    `/vehicles/${vehicleId}/authorizations`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function revokeAuthorization(
  authorizationId: string,
  body: { reason?: string },
): Promise<BitaResponse<WorkshopAuthorization>> {
  return bitaFetch<WorkshopAuthorization>(
    `/authorizations/${authorizationId}/revoke`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export async function findAuthorization(
  vehicleId: string,
  authorizationId: string,
): Promise<WorkshopAuthorization | null> {
  const result = await getVehicleAuthorizations(vehicleId);

  if (!result.ok || !result.data) return null;

  return (
    result.data.find((authorization) => authorization.id === authorizationId) ??
    null
  );
}

export function splitAuthorizations(authorizations: WorkshopAuthorization[]): {
  active: WorkshopAuthorization[];
  revoked: WorkshopAuthorization[];
} {
  return {
    active: authorizations.filter(
      (authorization) => authorization.status === 'active',
    ),
    revoked: authorizations.filter(
      (authorization) => authorization.status === 'revoked',
    ),
  };
}

export function workshopLabel(
  authorization: Pick<WorkshopAuthorization, 'workshopId' | 'workshopName'>,
): string {
  return (
    authorization.workshopName ??
    `Taller ${authorization.workshopId.slice(0, 8).toUpperCase()}`
  );
}

export function permissionOf(authorization: WorkshopAuthorization): {
  label: string;
  description: string;
  className: string;
} {
  if (authorization.canWrite) {
    return {
      label: 'Lectura + escritura',
      description: 'Puede consultar la bitácora y registrar servicios',
      className: 'g-pill--green',
    };
  }

  if (authorization.canRead) {
    return {
      label: 'Solo lectura',
      description: 'Puede consultar la bitácora del vehículo',
      className: 'g-pill--lilac',
    };
  }

  return {
    label: 'Sin permisos',
    description: 'No puede leer ni registrar servicios',
    className: 'g-pill--alert',
  };
}

export function statusOf(authorization: WorkshopAuthorization): {
  label: string;
  className: string;
} {
  if (authorization.status === 'revoked') {
    return { label: 'Revocada', className: 'g-pill--alert' };
  }

  return { label: 'Activa', className: 'g-pill--green' };
}
