import type { Metadata, Viewport } from 'next';
import { Outfit, Quicksand } from 'next/font/google';
import './globals.css';

// Tipografías aproximadas a los mockups: Outfit para títulos y Quicksand
// para texto e inputs. next/font las autohospeda en el build.
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'BITA',
    template: '%s · BITA',
  },
  description:
    'BITA by ICESI: la bitácora digital de mantenimiento de tu vehículo.',
  applicationName: 'BITA',
};

export const viewport: Viewport = {
  themeColor: '#FDF6E6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${quicksand.variable}`}
    >
      <body>
        <div className="g-viewport">{children}</div>
      </body>
    </html>
  );
}
