import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Media } from '@/internals/media/entity/media.entity';
import type { GenderType, IUser } from '../types/users.types';

/**
 * A customer account. Soft deleted: `deleted_at` is set instead of the row
 * being removed, and TypeORM filters those rows out of queries unless
 * `withDeleted` is passed.
 */
@Entity('users')
export class User implements IUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'uuid', nullable: true })
  avatar_id: string | null;

  /** Uploaded avatar. Cleared to NULL if the media row is deleted. */
  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'avatar_id' })
  avatar: Media | null;

  @Index('UQ_users_phone_no', { unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone_no: string;

  @Index('UQ_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: GenderType | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  referral_code: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
