import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  WorkshopApplicationStatus,
  WorkshopApplicationStep,
} from '../types/workshops.types';
import type {
  IWorkshopApplication,
  WorkshopDocumentRequirementSnapshot,
  WorkshopApplicationStatusType,
  WorkshopApplicationStepType,
} from '../types/workshops.types';
import { Workshop } from './workshop.entity';

/**
 * A workshop's onboarding application — one per workshop, enforced by the
 * unique index on `workshop_id`.
 *
 * Each `*_completed_at` column records when its step was finished, so progress
 * survives the partner leaving and coming back, and `current_step` alone never
 * has to be trusted to reconstruct it.
 */
@Entity('workshop_applications')
export class WorkshopApplication implements IWorkshopApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('UQ_workshop_applications_workshop_id', { unique: true })
  @Column({ type: 'uuid' })
  workshop_id: string;

  @OneToOne(() => Workshop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({
    type: 'varchar',
    length: 30,
    default: WorkshopApplicationStep.BUSINESS_DETAILS,
  })
  current_step: WorkshopApplicationStepType;

  @Index('IDX_workshop_applications_status')
  @Column({
    type: 'varchar',
    length: 20,
    default: WorkshopApplicationStatus.IN_PROGRESS,
  })
  status: WorkshopApplicationStatusType;

  /**
   * Defaults to the insert time: the application is only ever created after
   * the partner has signed in with an OTP, so its phone number is already
   * verified by then.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  phone_no_verified_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  business_details_completed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  shop_location_completed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  documents_completed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  working_hours_completed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  agreements_accepted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  document_requirements: WorkshopDocumentRequirementSnapshot[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
