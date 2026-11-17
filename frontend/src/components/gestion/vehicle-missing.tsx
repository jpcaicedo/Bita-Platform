import Link from 'next/link';
import { CarIcon } from '@/components/ui/icons';

export function VehicleMissing({ status }: { status: number }) {
  const offline = status === 0;

  return (
    <section className="g-gest">
      <article className="g-card g-gest-state g-gest-state--alert">
        <span className="g-gest-state-icon" aria-hidden="true">
          <CarIcon size={26} />
        </span>
        <h3>
          {offline ? 'Sin conexión con el servidor' : 'No encontramos el vehículo'}
        </h3>
        <p>
          {offline
            ? 'El servidor puede estar despertando. Inténtalo de nuevo en unos segundos.'
            : 'El vehículo no existe o no está en tu garaje.'}
        </p>
        <div className="g-gest-state-actions">
          <Link href="/garaje" className="g-btn g-btn--primary">
            Volver al garaje
          </Link>
        </div>
      </article>
    </section>
  );
}
