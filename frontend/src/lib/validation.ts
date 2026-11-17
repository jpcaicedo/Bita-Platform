// Validaciones compartidas por las server actions de registro.
// No usamos librerías: son las mismas reglas del RegisterDto del backend.

export const PASSWORD_PATTERN = /^[a-zA-Z0-9\s-_]+$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function isValidPassword(value: string): boolean {
  return (
    value.length >= 8 && value.length <= 15 && PASSWORD_PATTERN.test(value)
  );
}
