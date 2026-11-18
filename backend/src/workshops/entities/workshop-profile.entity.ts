import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('workshop_profiles')
export class WorkshopProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => UserEntity, (user) => user.workshopProfile, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({
    type: 'varchar',
    length: 150,
    name: 'business_name',
    nullable: true,
  })
  businessName!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  identification!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
