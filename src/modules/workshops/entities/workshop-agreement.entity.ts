import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
// `import type` is required: emitDecoratorMetadata would otherwise try to emit
// a runtime reference for a type-only export.
import type {
  IWorkshopAgreement,
  WorkshopAgreementTypeValue,
} from '../types/workshops.types';
import { Workshop } from './workshop.entity';

/**
 * One row per agreement version the workshop accepted. Rows for older
 * versions stay, as a record of what was agreed to and when.
 */
@Entity('workshop_agreements')
@Index(
  'UQ_workshop_agreements_workshop_id_type_version',
  ['workshop_id', 'type', 'version'],
  { unique: true },
)
export class WorkshopAgreement implements IWorkshopAgreement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workshop_id: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.agreements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ type: 'varchar', length: 40 })
  type: WorkshopAgreementTypeValue;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @CreateDateColumn({ type: 'timestamptz' })
  accepted_at: Date;
}
