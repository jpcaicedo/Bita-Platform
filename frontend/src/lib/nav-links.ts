// Rutas de la barra inferior. Este es el ÚNICO archivo que el equipo debe
// tocar si cambian las pantallas del dueño o del taller.
export type NavRole = 'owner' | 'workshop';

export interface NavLink {
  href: string;
  label: string;
  icon: 'cars' | 'history' | 'plus' | 'workshops' | 'settings';
  // El botón central naranja con "+" se marca como primario.
  primary?: boolean;
}

export const NAV_LINKS: Record<NavRole, NavLink[]> = {
  owner: [
    { href: '/garaje', label: 'Autos', icon: 'cars' },
    { href: '/garaje', label: 'Historial', icon: 'history' },
    { href: '/garaje/nuevo', label: 'Nuevo', icon: 'plus', primary: true },
    { href: '/garaje', label: 'Talleres', icon: 'workshops' },
    { href: '/ajustes', label: 'Ajustes', icon: 'settings' },
  ],
  workshop: [
    { href: '/taller', label: 'Autos', icon: 'cars' },
    { href: '/taller/vehiculos', label: 'Historial', icon: 'history' },
    { href: '/taller', label: 'Nuevo', icon: 'plus', primary: true },
    { href: '/taller/perfil', label: 'Talleres', icon: 'workshops' },
    { href: '/ajustes', label: 'Ajustes', icon: 'settings' },
  ],
};
