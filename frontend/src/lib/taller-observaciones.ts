// El backend guarda las observaciones como texto libre. El taller necesita
// campos separados (técnico, descripción, repuestos, garantía), así que aquí
// definimos un formato de líneas "Etiqueta: valor" fácil de leer y de volver
// a separar al mostrar el detalle.
export interface TallerObservaciones {
  technician: string;
  description: string;
  parts: string[];
  warranty: string;
  currency: string;
}

export interface ObservacionLinea {
  label: string;
  value: string;
}

const LABELS = {
  technician: 'Técnico',
  description: 'Descripción',
  parts: 'Repuestos',
  warranty: 'Garantía',
  currency: 'Moneda',
} as const;

export const MONEDAS = ['COP', 'USD', 'EUR'] as const;
export type Moneda = (typeof MONEDAS)[number];

export const MONEDA_POR_DEFECTO: Moneda = 'COP';

// Limpia saltos de línea para que cada dato ocupe exactamente una línea.
function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

// Convierte los campos del formulario en el texto que espera la API.
export function buildObservaciones(data: TallerObservaciones): string {
  const lines: string[] = [];
  const technician = oneLine(data.technician);
  const description = oneLine(data.description);
  const warranty = oneLine(data.warranty);
  const parts = data.parts.map(oneLine).filter(Boolean);

  if (technician) lines.push(`${LABELS.technician}: ${technician}`);
  if (description) lines.push(`${LABELS.description}: ${description}`);
  if (parts.length > 0) lines.push(`${LABELS.parts}: ${parts.join(' | ')}`);
  if (warranty) lines.push(`${LABELS.warranty}: ${warranty}`);
  if (data.currency) lines.push(`${LABELS.currency}: ${data.currency}`);

  return lines.join('\n');
}

/**
 * Separa el texto guardado. Si un registro viejo no sigue el formato,
 * devuelve null y la página muestra el texto tal cual.
 */
export function parseObservaciones(text: string | null): ObservacionLinea[] | null {
  if (!text?.trim()) return null;

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ObservacionLinea[] = [];
  const known = new Set<string>(Object.values(LABELS));

  for (const line of lines) {
    const separator = line.indexOf(':');

    if (separator === -1) return null;

    const label = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (!known.has(label) || !value) return null;

    if (label === LABELS.parts) {
      parsed.push({ label, value: value.split('|').map((p) => p.trim()).join(' · ') });
    } else {
      parsed.push({ label, value });
    }
  }

  return parsed.length > 0 ? parsed : null;
}

// Texto corto para las tarjetas del historial.
export function resumenObservaciones(text: string | null): string | null {
  const parsed = parseObservaciones(text);

  if (parsed) {
    const description = parsed.find((item) => item.label === LABELS.description);
    if (description) return description.value;
    return parsed.map((item) => item.value).join(' · ');
  }

  return text?.trim() || null;
}
