import Link from 'next/link';
import { ChevronRightIcon, TrashIcon, WorkshopIcon } from '@/components/ui/icons';
import {
  permissionOf,
  statusOf,
  workshopLabel,
} from '@/lib/authorizations';
import type { WorkshopAuthorization } from '@/types/authorization';

export function AuthorizationCard({
  authorization,
}: {
  authorization: WorkshopAuthorization;
}) {
  const permission = permissionOf(authorization);
  const status = statusOf(authorization);
  const isActive = authorization.status === 'active';
  const base = `/garaje/${authorization.vehicleId}/autorizaciones`;

  return (
    <article
      className={
        isActive
          ? 'g-card g-aut-card'
          : 'g-card g-aut-card g-aut-card--revoked'
      }
    >
      <div className="g-aut-card-head">
        <span className="g-aut-badge" aria-hidden="true">
          <WorkshopIcon size={20} />
        </span>
        <span className="g-aut-card-info">
          <strong>{workshopLabel(authorization.workshopId)}</strong>
          <span>{permission.description}</span>
        </span>
        <span className={`g-pill ${status.className}`}>{status.label}</span>
      </div>

      <div className="g-aut-card-foot">
        <span className={`g-pill ${permission.className}`}>
          {permission.label}
        </span>

        {isActive && (
          <span className="g-aut-card-actions">
            <Link
              href={`${base}/${authorization.id}/revocar`}
              className="g-aut-revoke"
            >
              <TrashIcon size={14} />
              Revocar
            </Link>
            <Link
              href={`${base}/nueva?taller=${authorization.workshopId}`}
              className="g-gest-link"
            >
              Cambiar permiso
              <ChevronRightIcon size={14} />
            </Link>
          </span>
        )}
      </div>
    </article>
  );
}
