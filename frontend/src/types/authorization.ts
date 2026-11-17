export type AuthorizationStatus = 'active' | 'revoked';

export interface WorkshopAuthorization {
  id: string;
  vehicleId: string;
  workshopId: string;
  grantedById: string;
  canRead: boolean;
  canWrite: boolean;
  status: AuthorizationStatus;
  // Nombre del taller según su perfil. Puede faltar si el taller aún no lo
  // completó; en ese caso el frontend muestra un label derivado del ID.
  workshopName: string | null;
}
