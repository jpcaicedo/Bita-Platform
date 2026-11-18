import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SmartReminderEntity } from './smart-reminder.entity';

export type NotificationChannel = 'whatsapp' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

@Entity('reminder_notifications')
export class ReminderNotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'reminder_id' })
  reminderId!: string;

  @ManyToOne(() => SmartReminderEntity, (reminder) => reminder.notifications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reminder_id' })
  reminder!: SmartReminderEntity;

  @Column({ type: 'varchar', length: 20 })
  channel!: NotificationChannel;

  @Column({ type: 'varchar', length: 40, name: 'notification_type' })
  notificationType!: string;

  @Column({ type: 'timestamptz', name: 'scheduled_for' })
  scheduledFor!: Date;

  @Column({ type: 'timestamptz', name: 'sent_at', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: NotificationStatus;

  @Column({
    type: 'varchar',
    length: 120,
    name: 'idempotency_key',
    unique: true,
  })
  idempotencyKey!: string;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage!: string | null;
}
