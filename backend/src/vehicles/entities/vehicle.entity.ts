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

// Tipos de motorización que se pueden elegir al registrar el vehículo.
export const FUEL_TYPES = [
  'gasolina',
  'diesel',
  'hibrido',
  'electrico',
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

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

  @Column({ type: 'varchar', length: 20, name: 'fuel_type', nullable: true })
  fuelType!: FuelType | null;

  // Foto del vehículo como data URL (data:image/jpeg;base64,...). Va en la
  // base de datos porque el disco de Render se borra en cada deploy.
  // select: false = no viaja en las consultas normales (la lista del garaje
  // no carga cientos de KB); solo se lee con getPhoto().
  @Column({ type: 'text', nullable: true, select: false })
  photo!: string | null;

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
