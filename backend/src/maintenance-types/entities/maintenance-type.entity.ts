import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MaintenanceRecordEntity } from '../../maintenance-records/entities/maintenance-record.entity';
import { SmartReminderEntity } from '../../reminders/entities/smart-reminder.entity';

@Entity('maintenance_types')
export class MaintenanceTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'integer',
    name: 'default_interval_km',
    nullable: true,
  })
  defaultIntervalKm!: number | null;

  @Column({
    type: 'integer',
    name: 'default_interval_months',
    nullable: true,
  })
  defaultIntervalMonths!: number | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => MaintenanceRecordEntity, (record) => record.maintenanceType)
  maintenanceRecords!: MaintenanceRecordEntity[];

  @OneToMany(() => SmartReminderEntity, (reminder) => reminder.maintenanceType)
  reminders!: SmartReminderEntity[];
}
