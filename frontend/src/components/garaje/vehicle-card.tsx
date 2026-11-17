import Link from 'next/link';
import {
  etiquetaEstado,
  masUrgente,
  progresoServicio,
  textoVencimiento,
} from '@/lib/garaje';
import { formatMiles } from '@/lib/garaje-formato';
import type { OwnerVehicle } from '@/types/garaje';
import type { MaintenanceStatusItem } from '@/types/maintenance';
import { GarageIcon } from './garage-icon';

interface GarageVehicleCardProps {
  vehicle: OwnerVehicle;
  statusItems: MaintenanceStatusItem[];
}

// Ícono pequeño de la fila "próximo servicio", según el estado (Figma).
const ICONO_ESTADO = {
  up_to_date: { name: 'aceite-mini', width: 10.5, height: 10.5 },
  upcoming: { name: 'frenos-mini', width: 11.7, height: 11.7 },
  overdue: { name: 'alerta-mini', width: 12.8, height: 11.1 },
} as const;

// Tarjeta del garaje con el semáforo (Al día / Próximo / Vencido).
export function GarageVehicleCard({
  vehicle,
  statusItems,
}: GarageVehicleCardProps) {
  const urgente = masUrgente(statusItems);
  const status = urgente?.status ?? null;

  return (
    <article className="g-garage-card">
      <div className="g-garage-card-head">
        <div>
          <div className="g-garage-card-title">
            <h3>
              {vehicle.brand} {vehicle.model}
            </h3>
            {vehicle.year && <span>{vehicle.year}</span>}
          </div>
          <p className="g-garage-plate">Placa: {vehicle.plate}</p>
        </div>
        <span className={`g-garage-badge g-garage-badge--${status ?? 'none'}`}>
          {etiquetaEstado(status)}
        </span>
      </div>

      <div
        className={`g-garage-specs ${
          status === 'overdue' ? 'g-garage-specs--overdue' : ''
        }`}
      >
        <div className="g-garage-km">
          <span className="g-garage-km-label">Kilometraje actual</span>
          <span className="g-garage-km-value">
            {formatMiles(vehicle.currentKilometers)}
            <small>km</small>
          </span>
        </div>

        {urgente ? (
          <>
            <div className={`g-garage-bar g-garage-bar--${urgente.status}`}>
              <span
                style={{
                  width: `${progresoServicio(urgente, vehicle.currentKilometers)}%`,
                }}
              />
            </div>
            <div className={`g-garage-next g-garage-next--${urgente.status}`}>
              <span className="g-garage-next-type">
                <GarageIcon {...ICONO_ESTADO[urgente.status]} />
                {urgente.maintenanceType.name}
              </span>
              <span className="g-garage-next-due">
                {textoVencimiento(urgente, vehicle.currentKilometers)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="g-garage-bar">
              <span style={{ width: '0%' }} />
            </div>
            <div className="g-garage-next">
              <span>Aún no hay mantenimientos registrados</span>
            </div>
          </>
        )}
      </div>

      <div className="g-garage-card-foot">
        <Link href={`/garaje/${vehicle.id}`} className="g-garage-link">
          {status === 'overdue' ? 'Gestionar revisión' : 'Ver historial'}
          <span className="g-garage-link-arrow">
            <GarageIcon name="flecha" width={9.3} height={9.3} />
          </span>
        </Link>
      </div>
    </article>
  );
}
