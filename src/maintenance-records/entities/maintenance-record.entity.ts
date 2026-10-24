import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { MaintenanceTypeEntity } from '../../maintenance-types/entities/maintenance-type.entity';
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';

@Entity('maintenance_records')
@Index('IDX_maintenance_records_vehicle_service_date', [
  'vehicleId',
  'serviceDate',
])
export class MaintenanceRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.maintenanceRecords, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: VehicleEntity;

  @Column({ type: 'uuid', name: 'maintenance_type_id' })
  maintenanceTypeId!: string;

  @ManyToOne(
    () => MaintenanceTypeEntity,
    (maintenanceType) => maintenanceType.maintenanceRecords,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'maintenance_type_id' })
  maintenanceType!: MaintenanceTypeEntity;

  @Column({ type: 'uuid', name: 'workshop_id', nullable: true })
  workshopId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.workshopMaintenanceRecords, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'workshop_id' })
  workshop!: UserEntity | null;

  @Column({ type: 'uuid', name: 'registered_by_user_id' })
  registeredById!: string;

  @ManyToOne(() => UserEntity, (user) => user.registeredMaintenanceRecords, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'registered_by_user_id' })
  registeredBy!: UserEntity;

  @Column({ type: 'date', name: 'service_date' })
  serviceDate!: string;

  @Column({ type: 'integer' })
  kilometers!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  cost!: number | null;

  @Column({ type: 'text', nullable: true })
  observations!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
