// Respuestas de autenticación tal como las devuelve NestJS.
export interface AuthUser {
  id: string;
  email: string;
  waid: string | null;
  phone: string | null;
  username?: string | null;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string | null;
  isActive: boolean;
  createdAt: string;
}
