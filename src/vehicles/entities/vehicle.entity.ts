import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { WorkshopAuthorizationEntity } from '../../authorizations/entities/workshop-authorization.entity';
import { MaintenanceRecordEntity } from '../../maintenance-records/entities/maintenance-record.entity';
import { SmartReminderEntity } from '../../reminders/entities/smart-reminder.entity';

@Entity('vehicles')
@Index('IDX_vehicles_owner_id', ['ownerId'])
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @ManyToOne(() => UserEntity, (user) => user.vehicles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_id' })
  owner!: UserEntity;

  @Column({ type: 'varchar', length: 10, unique: true })
  plate!: string;

  @Column({ type: 'varchar', length: 60 })
  brand!: string;

  @Column({ type: 'varchar', length: 60 })
  model!: string;

  @Column({ type: 'smallint', nullable: true })
  year!: number | null;

  @Column({
    type: 'integer',
    name: 'current_kilometers',
    default: 0,
  })
  currentKilometers!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => MaintenanceRecordEntity, (record) => record.vehicle)
  maintenanceRecords!: MaintenanceRecordEntity[];

  @OneToMany(
    () => WorkshopAuthorizationEntity,
    (authorization) => authorization.vehicle,
  )
  authorizations!: WorkshopAuthorizationEntity[];

  @OneToMany(() => SmartReminderEntity, (reminder) => reminder.vehicle)
  reminders!: SmartReminderEntity[];
}
