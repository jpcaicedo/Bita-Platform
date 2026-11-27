import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/ui/icons';
import './not-found.css';

export const metadata: Metadata = {
  title: 'Página no encontrada',
};

// 404 propia: la de Next.js sale en inglés y sin la identidad de BITA.
export default function NotFound() {
  return (
    <main className="g-404">
      <div className="g-404-logo">
        <Image
          src="/images/logo-b.svg"
          alt="BITA"
          fill
          priority
          sizes="80px"
        />
      </div>

      <p className="g-404-code" aria-hidden="true">
        404
      </p>

      <h1 className="g-404-title">Esta página no existe</h1>
      <p className="g-404-text">
        Puede que el enlace esté mal escrito o que la página se haya movido.
        Vuelve al inicio y sigue cuidando tu vehículo.
      </p>

      <Link className="g-btn g-btn--primary g-404-cta" href="/">
        Volver al inicio
        <ArrowRightIcon size={18} />
      </Link>
    </main>
  );
}
