import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { MaintenanceTypeEntity } from '../../maintenance-types/entities/maintenance-type.entity';
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';
import { ReminderNotificationEntity } from './reminder-notification.entity';

export type ReminderCriteria = 'due_date' | 'due_kilometers';
export type ReminderStatus = 'pending' | 'notified' | 'completed' | 'cancelled';

@Entity('smart_reminders')
@Index('IDX_smart_reminders_due', ['dueDate', 'dueKilometers'])
export class SmartReminderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.reminders, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: VehicleEntity;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdById!: string;

  @ManyToOne(() => UserEntity, (user) => user.createdReminders, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: UserEntity;

  @Column({ type: 'uuid', name: 'maintenance_type_id', nullable: true })
  maintenanceTypeId!: string | null;

  @ManyToOne(
    () => MaintenanceTypeEntity,
    (maintenanceType) => maintenanceType.reminders,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'maintenance_type_id' })
  maintenanceType!: MaintenanceTypeEntity | null;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'due_date' })
  criteria!: ReminderCriteria;

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate!: string | null;

  @Column({ type: 'integer', name: 'due_kilometers', nullable: true })
  dueKilometers!: number | null;

  @Column({ type: 'integer', name: 'lead_days', default: 7 })
  leadDays!: number;

  @Column({ type: 'integer', name: 'lead_kilometers', default: 500 })
  leadKilometers!: number;

  @Column({ type: 'boolean', default: false })
  recurring!: boolean;

  @Column({ type: 'integer', name: 'recurrence_days', nullable: true })
  recurrenceDays!: number | null;

  @Column({ type: 'integer', name: 'recurrence_km', nullable: true })
  recurrenceKm!: number | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: ReminderStatus;

  @Column({ type: 'timestamptz', name: 'last_notified_at', nullable: true })
  lastNotifiedAt!: Date | null;

  @OneToMany(
    () => ReminderNotificationEntity,
    (notification) => notification.reminder,
  )
  notifications!: ReminderNotificationEntity[];
}
