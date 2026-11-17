export type AuthorizationStatus = 'active' | 'revoked';

export interface WorkshopAuthorization {
  id: string;
  vehicleId: string;
  workshopId: string;
  grantedById: string;
  canRead: boolean;
  canWrite: boolean;
  status: AuthorizationStatus;
}
