import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One pending OTP per identity. `email` and `phone` are each unique, and a row
 * carries exactly one of them — Postgres allows repeated NULLs in a unique
 * index, so email rows and phone rows coexist in this table.
 *
 * Re-sending a code updates the existing row rather than inserting another.
 */
@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  code: number;

  @Index('UQ_otps_email', { unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Index('UQ_otps_phone', { unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
