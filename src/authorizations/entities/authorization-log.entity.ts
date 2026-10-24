import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { WorkshopAuthorizationEntity } from './workshop-authorization.entity';

export type AuthorizationAction = 'GRANT' | 'REVOKE';

@Entity('authorization_logs')
export class AuthorizationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'authorization_id' })
  authorizationId!: string;

  @ManyToOne(
    () => WorkshopAuthorizationEntity,
    (authorization) => authorization.logs,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'authorization_id' })
  authorization!: WorkshopAuthorizationEntity;

  @Column({ type: 'uuid', name: 'performed_by' })
  performedById!: string;

  @ManyToOne(() => UserEntity, (user) => user.authorizationLogs, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'performed_by' })
  performedBy!: UserEntity;

  @Column({ type: 'varchar', length: 20 })
  action!: AuthorizationAction;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
