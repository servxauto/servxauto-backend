import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Media } from '@/internals/media/entity/media.entity';
import type { IWorkshopDocument } from '../types/workshops.types';
import { Workshop } from './workshop.entity';

/** One photo of an owner's document, filed under a requirement `key`. */
@Entity('workshop_documents')
@Index(
  'UQ_workshop_documents_workshop_id_media_id',
  ['workshop_id', 'media_id'],
  { unique: true },
)
@Index('IDX_workshop_documents_workshop_id_document_key', [
  'workshop_id',
  'document_key',
])
export class WorkshopDocument implements IWorkshopDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workshop_id: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ type: 'uuid' })
  media_id: string;

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media: Media;

  @Column({ type: 'varchar', length: 50 })
  document_key: string;

  /** Order the photos were sent in, e.g. front before back. */
  @Column({ type: 'smallint', default: 0 })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
