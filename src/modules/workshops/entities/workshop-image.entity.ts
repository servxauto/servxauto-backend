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
import type { IWorkshopImage } from '../types/workshops.types';
import { Workshop } from './workshop.entity';

@Entity('workshop_images')
@Index('UQ_workshop_images_workshop_id_media_id', ['workshop_id', 'media_id'], {
  unique: true,
})
export class WorkshopImage implements IWorkshopImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workshop_id: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ type: 'uuid' })
  media_id: string;

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media: Media;

  /** Slot the photo occupies on the screen, so the order survives a re-upload. */
  @Column({ type: 'smallint', default: 0 })
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
