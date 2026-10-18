import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { IWorkshop } from '../types/workshops.types';
import { WorkshopAddress } from './workshop-address.entity';
import { WorkshopAgreement } from './workshop-agreement.entity';
import { WorkshopDocument } from './workshop-document.entity';
import { WorkshopImage } from './workshop-image.entity';
import { WorkshopWorkingHour } from './workshop-working-hour.entity';

/**
 * A workshop (partner) account. Identified by phone number — see
 * `auth/workshop/send-otp` and `auth/workshop/login`.
 */
@Entity('workshops')
export class Workshop implements IWorkshop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('UQ_workshops_phone_no', { unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone_no: string;

  @Index('UQ_workshops_email', { unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  business_name: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  owner_name: string | null;

  /** GSTIN, uppercase, e.g. `08ABCDE1234F1Z5`. */
  @Column({ type: 'varchar', length: 15, nullable: true })
  gst_no: string | null;

  @OneToOne(() => WorkshopAddress, (address) => address.workshop)
  address?: WorkshopAddress | null;

  @OneToMany(() => WorkshopImage, (image) => image.workshop)
  images?: WorkshopImage[];

  @OneToMany(() => WorkshopDocument, (document) => document.workshop)
  documents?: WorkshopDocument[];

  @OneToMany(() => WorkshopWorkingHour, (hour) => hour.workshop)
  working_hours?: WorkshopWorkingHour[];

  @OneToMany(() => WorkshopAgreement, (agreement) => agreement.workshop)
  agreements?: WorkshopAgreement[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
