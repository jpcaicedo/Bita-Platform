import Link from 'next/link';
import { ChevronRightIcon, WrenchIcon } from '@/components/ui/icons';
import {
  describeRecurrence,
  describeReminder,
  reminderPill,
  type ReminderItem,
} from '@/lib/reminders';

interface ReminderCardProps {
  item: ReminderItem;
  currentKilometers: number;
  today: string;
  showAction?: boolean;
}

export function ReminderCard({
  item,
  currentKilometers,
  today,
  showAction = true,
}: ReminderCardProps) {
  const { reminder, health } = item;
  const pill = reminderPill(health);
  const lines = describeReminder(reminder, currentKilometers, today);
  const recurrence = describeRecurrence(reminder);
  const isOpen = health !== 'completed' && health !== 'cancelled';

  return (
    <article className={`g-card g-rem-item g-rem-item--${pill.tone}`}>
      <div className="g-rem-head">
        <strong className="g-rem-title">{reminder.title}</strong>
        <span className={`g-pill ${pill.pill}`}>{pill.label}</span>
      </div>

      {reminder.maintenanceType && (
        <span className="g-rem-type">
          <WrenchIcon size={14} />
          {reminder.maintenanceType.name}
        </span>
      )}

      <div className="g-rem-lines">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
        {recurrence && <span>{recurrence}</span>}
      </div>

      {reminder.description && (
        <p className="g-rem-note">{reminder.description}</p>
      )}

      {showAction && isOpen && (
        <Link
          href={`/garaje/${reminder.vehicleId}/recordatorios/${reminder.id}/completar`}
          className="g-gest-link"
        >
          Marcar como completado
          <ChevronRightIcon size={14} />
        </Link>
      )}
    </article>
  );
}
