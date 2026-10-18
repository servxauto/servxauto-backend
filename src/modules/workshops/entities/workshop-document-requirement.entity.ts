import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { IWorkshopDocumentRequirement } from '../types/workshops.types';

/**
 * A document workshops have to upload. A new application copies the active
 * rows into its `document_requirements`, so editing a row here only affects
 * applications created afterwards.
 */
@Entity('workshop_document_requirements')
export class WorkshopDocumentRequirement implements IWorkshopDocumentRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable identifier the uploaded photos are filed under, e.g. `aadhaar_card`. */
  @Index('UQ_workshop_document_requirements_key', { unique: true })
  @Column({ type: 'varchar', length: 50 })
  key: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'smallint' })
  min_images: number;

  @Column({ type: 'smallint' })
  max_images: number;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'smallint', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
