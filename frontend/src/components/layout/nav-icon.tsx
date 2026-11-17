import type { CSSProperties } from 'react';
import type { NavLink } from '@/lib/nav-links';

// Íconos de la barra inferior exportados del Figma (public/nav).
// Tamaños exactos de cada ícono en el diseño.
const ICONOS: Record<NavLink['icon'], { file: string; w: number; h: number }> =
  {
    cars: { file: 'autos', w: 14.67, h: 16.5 },
    history: { file: 'historial', w: 16.5, h: 18.33 },
    plus: { file: 'mas', w: 15.17, h: 15.17 },
    workshops: { file: 'talleres', w: 18.33, h: 14.67 },
    settings: { file: 'ajustes', w: 18.43, h: 18.33 },
  };

export function NavIcon({ name }: { name: NavLink['icon'] }) {
  const icono = ICONOS[name];
  const style = {
    '--g-nav-svg': `url(/nav/${icono.file}.svg)`,
    width: icono.w,
    height: icono.h,
  } as CSSProperties;

  return <span className="g-nav-svg" style={style} aria-hidden="true" />;
}
