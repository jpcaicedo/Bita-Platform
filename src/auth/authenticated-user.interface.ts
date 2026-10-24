export interface AuthenticatedUser {
  id: string;
  email: string;
  waid: string | null;
  phone: string | null;
}
