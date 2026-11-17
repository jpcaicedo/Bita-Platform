import { Plus_Jakarta_Sans } from 'next/font/google';
import { requireOwner } from '@/lib/session';
import './garaje.css';

// Segunda fuente del Figma. Solo se carga en las pantallas del garaje.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Igual que el layout del taller: las pantallas leen la sesión y datos del
// servidor en cada request.
export const instant = false;

// Todo el módulo exige rol de dueño. Si entra un taller, va a /taller.
export default async function GarajeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();

  return (
    <section className={`g-garage ${jakarta.variable}`}>{children}</section>
  );
}