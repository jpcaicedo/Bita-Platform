import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthorizationLogEntity } from '../../authorizations/entities/authorization-log.entity';
import { WorkshopAuthorizationEntity } from '../../authorizations/entities/workshop-authorization.entity';
import { MaintenanceRecordEntity } from '../../maintenance-records/entities/maintenance-record.entity';
import { SmartReminderEntity } from '../../reminders/entities/smart-reminder.entity';
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';
import { WorkshopProfileEntity } from '../../workshops/entities/workshop-profile.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true, nullable: true })
  waid!: string | null;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ type: 'text', name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.owner)
  vehicles!: VehicleEntity[];

  @OneToOne(() => WorkshopProfileEntity, (profile) => profile.user)
  workshopProfile!: WorkshopProfileEntity;

  @OneToMany(() => MaintenanceRecordEntity, (record) => record.workshop)
  workshopMaintenanceRecords!: MaintenanceRecordEntity[];

  @OneToMany(() => MaintenanceRecordEntity, (record) => record.registeredBy)
  registeredMaintenanceRecords!: MaintenanceRecordEntity[];

  @OneToMany(
    () => WorkshopAuthorizationEntity,
    (authorization) => authorization.workshop,
  )
  workshopAuthorizations!: WorkshopAuthorizationEntity[];

  @OneToMany(
    () => WorkshopAuthorizationEntity,
    (authorization) => authorization.grantedBy,
  )
  grantedAuthorizations!: WorkshopAuthorizationEntity[];

  @OneToMany(() => AuthorizationLogEntity, (log) => log.performedBy)
  authorizationLogs!: AuthorizationLogEntity[];

  @OneToMany(() => SmartReminderEntity, (reminder) => reminder.createdBy)
  createdReminders!: SmartReminderEntity[];
}
