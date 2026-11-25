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
    { href: '/garaje/historial', label: 'Historial', icon: 'history' },
    { href: '/garaje/nuevo', label: 'Nuevo', icon: 'plus', primary: true },
    { href: '/talleres', label: 'Talleres', icon: 'workshops' },
    { href: '/ajustes', label: 'Ajustes', icon: 'settings' },
  ],
  workshop: [
    { href: '/taller', label: 'Recepción', icon: 'cars' },
    { href: '/taller/historial', label: 'Historial', icon: 'history' },
    // Para registrar un servicio primero se elige un vehículo autorizado.
    {
      href: '/taller/vehiculos',
      label: 'Registrar',
      icon: 'plus',
      primary: true,
    },
    { href: '/taller/perfil', label: 'Perfil', icon: 'workshops' },
    { href: '/ajustes', label: 'Ajustes', icon: 'settings' },
  ],
};
