'use client';

// Transición entre pantallas con <ViewTransition> de React 19.3.
// Next convierte cada navegación en una transición, así que basta con
// envolver el contenido y cambiar la "key" cuando cambia la ruta: React
// anima la pantalla que sale y la que entra (el CSS está en globals.css).
//
// La dirección se decide sola, sin marcar cada link:
//   - link a una pantalla más adentro (/garaje → /garaje/:id) → "adelante"
//   - link a una más afuera, flecha de volver o botón atrás  → "atras"
//   - menú de abajo (cambiar de pestaña)                       → "cambio"
//   - enviar un formulario (vuelve a la pantalla anterior)     → "atras"
import { usePathname } from 'next/navigation';
import { useEffect, ViewTransition } from 'react';

type Direccion = 'adelante' | 'atras' | 'cambio';

function profundidad(ruta: string): number {
  return ruta.split('/').filter(Boolean).length;
}

function marcar(direccion: Direccion) {
  document.documentElement.dataset.nav = direccion;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    function alHacerClic(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="/"]',
      );
      if (!link) return;

      if (link.closest('.g-bottom-nav')) {
        marcar('cambio');
        return;
      }

      if (link.classList.contains('g-app-back')) {
        marcar('atras');
        return;
      }

      const diferencia =
        profundidad(new URL(link.href).pathname) -
        profundidad(window.location.pathname);

      if (diferencia > 0) marcar('adelante');
      else if (diferencia < 0) marcar('atras');
      else marcar('cambio');
    }

    const alVolver = () => marcar('atras');

    marcar('cambio');
    document.addEventListener('click', alHacerClic, true);
    document.addEventListener('submit', alVolver, true);
    window.addEventListener('popstate', alVolver);

    return () => {
      document.removeEventListener('click', alHacerClic, true);
      document.removeEventListener('submit', alVolver, true);
      window.removeEventListener('popstate', alVolver);
    };
  }, []);

  return (
    <ViewTransition key={pathname} enter="pagina" exit="pagina" default="none">
      {children}
    </ViewTransition>
  );
}
