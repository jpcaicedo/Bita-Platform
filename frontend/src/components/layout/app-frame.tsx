'use client';

// Este componente es cliente únicamente por usePathname: nos permite marcar
// el ítem activo de la barra y elegir el título/flecha de cada pantalla sin
// pasar props desde cada página.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS, type NavRole } from '@/lib/nav-links';
import { BackIcon, BellIcon, CarIcon, UserIcon } from '@/components/ui/icons';
import { jakarta } from '@/lib/fonts';
import { NavIcon } from './nav-icon';
import './app-frame.css';

interface AppFrameProps {
  role: NavRole;
  children: React.ReactNode;
}

interface ScreenMeta {
  title: string;
  back?: string;
}

function screenMeta(pathname: string): ScreenMeta {
  if (pathname.startsWith('/taller/registrar')) {
    return { title: 'Nuevo Registro', back: '/taller' };
  }
  if (pathname.startsWith('/taller/comprobante')) {
    return { title: 'Servicio Registrado', back: '/taller' };
  }
  if (pathname.startsWith('/taller/servicio')) {
    return { title: 'Detalle Servicio', back: '/taller/vehiculos' };
  }
  if (/^\/taller\/vehiculos\/[^/]+/.test(pathname)) {
    return { title: 'Historial', back: '/taller/vehiculos' };
  }
  if (pathname.startsWith('/taller/vehiculos')) {
    return { title: 'Vehículos', back: '/taller' };
  }
  if (pathname.startsWith('/taller/perfil')) {
    return { title: 'Perfil del Taller', back: '/taller' };
  }
  // "/talleres" (dueño) también empieza por "/taller": va primero.
  if (pathname.startsWith('/talleres')) return { title: 'Talleres' };
  if (pathname.startsWith('/taller')) return { title: 'Vehículos' };

  const reminders = pathname.match(/^\/garaje\/([^/]+)\/recordatorios(\/.*)?$/);
  if (reminders) {
    const [, vehicleId, rest] = reminders;

    if (rest?.startsWith('/nuevo')) {
      return {
        title: 'Nuevo Recordatorio',
        back: `/garaje/${vehicleId}/recordatorios`,
      };
    }
    if (rest) {
      return {
        title: 'Completar Recordatorio',
        back: `/garaje/${vehicleId}/recordatorios`,
      };
    }
    return { title: 'Recordatorios', back: `/garaje/${vehicleId}` };
  }

  const authorizations = pathname.match(
    /^\/garaje\/([^/]+)\/autorizaciones(\/.*)?$/,
  );
  if (authorizations) {
    const [, vehicleId, rest] = authorizations;
    const list = `/garaje/${vehicleId}/autorizaciones`;

    if (rest?.startsWith('/nueva')) {
      return { title: 'Otorgar Acceso', back: list };
    }
    if (rest?.endsWith('/revocar')) {
      return { title: 'Revocar Acceso', back: list };
    }
    if (rest?.endsWith('/confirmacion')) {
      return { title: 'Autorización Concedida', back: list };
    }
    return { title: 'Talleres Autorizados', back: `/garaje/${vehicleId}` };
  }

  if (pathname.startsWith('/garaje/nuevo')) {
    return { title: 'Nuevo Vehículo', back: '/garaje' };
  }
  if (pathname.startsWith('/garaje')) return { title: 'Mis Autos' };
  if (pathname.startsWith('/ajustes')) return { title: 'Ajustes' };

  return { title: 'BITA' };
}

function isActive(pathname: string, href: string): boolean {
  // "/taller" solo coincide exacto para que /taller/vehiculos marque Historial.
  if (href === '/taller' || href === '/garaje') {
    if (
      href === '/garaje' &&
      /^\/garaje\/[^/]+\/recordatorios/.test(pathname)
    ) {
      return true;
    }
    return pathname === href;
  }
  // El detalle de un servicio también pertenece al historial.
  if (href === '/taller/vehiculos' && pathname.startsWith('/taller/servicio')) {
    return true;
  }
  // Las autorizaciones de un vehículo pertenecen a Talleres.
  if (
    href === '/talleres' &&
    /^\/garaje\/[^/]+\/autorizaciones/.test(pathname)
  ) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppFrame({ role, children }: AppFrameProps) {
  const pathname = usePathname();
  const meta = screenMeta(pathname);
  const links = NAV_LINKS[role];
  const activeIndex = links.findIndex((link) => isActive(pathname, link.href));

  return (
    <div className={`g-app-shell ${jakarta.variable}`}>
      <header className="g-app-header">
        {meta.back ? (
          <Link
            href={meta.back}
            className="g-app-back"
            aria-label="Volver atrás"
          >
            <BackIcon size={22} />
          </Link>
        ) : (
          <span className="g-app-car" aria-hidden="true">
            <CarIcon size={22} />
          </span>
        )}

        <h1 className="g-app-heading">{meta.title}</h1>

        <div className="g-app-actions">
          <button
            type="button"
            className="g-app-bell"
            title="Notificaciones próximamente"
            aria-label="Notificaciones próximamente"
            disabled
          >
            <BellIcon size={20} />
          </button>
          <Link href="/ajustes" className="g-app-user" aria-label="Ajustes">
            <UserIcon size={18} />
          </Link>
        </div>
      </header>

      <div className="g-app-main">{children}</div>

      <nav className="g-bottom-nav" aria-label="Navegación principal">
        {links.map((link, index) => {
          const active = index === activeIndex;

          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={[
                'g-nav-item',
                link.primary ? 'g-nav-item--primary' : '',
                active ? 'g-nav-item--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <span className={link.primary ? 'g-nav-plus' : 'g-nav-icon'}>
                <NavIcon name={link.icon} />
              </span>
              <span className="g-nav-label">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
