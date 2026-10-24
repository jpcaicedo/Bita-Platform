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
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';
import { AuthorizationLogEntity } from './authorization-log.entity';

export type AuthorizationStatus = 'active' | 'revoked';

@Entity('workshop_authorizations')
@Index('IDX_workshop_authorizations_vehicle_workshop', [
  'vehicleId',
  'workshopId',
])
export class WorkshopAuthorizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.authorizations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: VehicleEntity;

  @Column({ type: 'uuid', name: 'workshop_id' })
  workshopId!: string;

  @ManyToOne(() => UserEntity, (user) => user.workshopAuthorizations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workshop_id' })
  workshop!: UserEntity;

  @Column({ type: 'uuid', name: 'granted_by_user_id' })
  grantedById!: string;

  @ManyToOne(() => UserEntity, (user) => user.grantedAuthorizations, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'granted_by_user_id' })
  grantedBy!: UserEntity;

  @Column({ type: 'boolean', name: 'can_read', default: true })
  canRead!: boolean;

  @Column({ type: 'boolean', name: 'can_write', default: false })
  canWrite!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: AuthorizationStatus;

  @OneToMany(() => AuthorizationLogEntity, (log) => log.authorization)
  logs!: AuthorizationLogEntity[];
}
