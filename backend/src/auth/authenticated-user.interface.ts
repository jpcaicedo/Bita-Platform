export interface AuthenticatedUser {
  id: string;
  email: string;
  waid: string | null;
  phone: string | null;
  // Opcional para no romper los objetos de usuario que ya existían.
  username?: string | null;
}
