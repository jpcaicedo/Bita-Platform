import { requireWorkshop } from '@/lib/session';
import './taller.css';

// Las pantallas del taller leen la sesión y datos del servidor en cada
// request: se permite que la navegación bloquee mientras llega la respuesta.
export const instant = false;

// Todo el módulo exige rol de taller. getSession está cacheado por request, así
// que el chequeo del layout y el de cada página no repiten llamadas a la API.
export default async function TallerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWorkshop();

  return <section className="g-taller">{children}</section>;
}
