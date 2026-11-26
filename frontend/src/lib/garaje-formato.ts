// Ayudas de presentación del frente B. No piden datos: solo dan formato.
import type { FuelType } from '@/types/garaje';

// Días completos desde una fecha "YYYY-MM-DD" hasta hoy.
export function diasDesde(isoDate: string): number {
  const fecha = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((Date.now() - fecha) / 86_400_000));
}

// Días que faltan para una fecha "YYYY-MM-DD" (negativo si ya pasó).
export function diasHasta(isoDate: string): number {
  const fecha = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.ceil((fecha - Date.now()) / 86_400_000);
}

// 48250 -> "48.250" (formato colombiano, igual que los precios).
export function formatMiles(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

/**
 * El backend no tiene un campo para el nombre del taller cuando registra el
 * dueño. Lo guardamos como primera línea de las observaciones:
 *   "Taller: AutoTaller Central\nSe usó aceite sintético..."
 * y aquí lo separamos para mostrarlo como en el Figma.
 */
const PREFIJO_TALLER = 'Taller: ';

export function unirTaller(taller: string, notas: string): string {
  const limpio = taller.replace(/\s+/g, ' ').trim();
  if (!limpio) return notas;
  return notas
    ? `${PREFIJO_TALLER}${limpio}\n${notas}`
    : `${PREFIJO_TALLER}${limpio}`;
}

export function separarTaller(observations: string | null): {
  taller: string | null;
  notas: string | null;
} {
  if (!observations?.startsWith(PREFIJO_TALLER)) {
    return { taller: null, notas: observations };
  }

  const [primera, ...resto] = observations.split('\n');
  const notas = resto.join('\n').trim();

  return {
    taller: primera.slice(PREFIJO_TALLER.length).trim() || null,
    notas: notas || null,
  };
}

// Ícono y colores de cada tipo de mantenimiento, según el nombre del tipo.
export interface EstiloTipo {
  icono: string; // archivo en /public/garaje
  chip: string; // ícono pequeño para los chips del formulario
  fondo: string;
  color: string;
}

export function estiloTipo(nombre: string): EstiloTipo {
  const n = nombre.toLowerCase();

  if (n.includes('aceite') || n.includes('preventivo')) {
    return {
      icono: 'aceite',
      chip: 'chip-aceite',
      fondo: '#ffdcc2',
      color: '#8f4e00',
    };
  }
  if (n.includes('freno')) {
    return {
      icono: 'aceite',
      chip: 'chip-frenos',
      fondo: '#ffdcc2',
      color: '#8f4e00',
    };
  }
  if (n.includes('neum') || n.includes('suspens') || n.includes('llanta')) {
    return {
      icono: 'neumaticos',
      chip: 'chip-neumaticos',
      fondo: '#d1e7e5',
      color: '#4f6261',
    };
  }
  if (n.includes('técnico') || n.includes('tecnico') || n.includes('diagn')) {
    return {
      icono: 'tecnomecanica',
      chip: 'chip-tecnomecanica',
      fondo: '#ffddb4',
      color: '#765930',
    };
  }
  if (n.includes('bater') || n.includes('eléctr') || n.includes('electr')) {
    return {
      icono: 'tecnomecanica',
      chip: 'chip-bateria',
      fondo: '#ffddb4',
      color: '#765930',
    };
  }

  return {
    icono: 'tecnomecanica',
    chip: 'chip-otro',
    fondo: '#ffddb4',
    color: '#765930',
  };
}

// Nombre para mostrar de la motorización guardada en el vehículo.
const MOTORIZACION: Record<FuelType, string> = {
  gasolina: 'Gasolina',
  diesel: 'Diésel',
  hibrido: 'Híbrido',
  electrico: 'Eléctrico',
};

export function etiquetaMotorizacion(fuelType: FuelType | null): string | null {
  return fuelType ? MOTORIZACION[fuelType] : null;
}
