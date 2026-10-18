import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { EntityTypeValue, IMedia } from '../types/media.types';

/**
 * An uploaded file. `path` is the object key in the S3-compatible bucket;
 * `AwsS3Service.getObjectUrl()` turns it into a public URL.
 *
 * `entity_id` + `entity_type` form a loose polymorphic link to whatever the
 * file belongs to, so there is no foreign key on that pair.
 */
@Entity('media')
@Index(['entity_type', 'entity_id'])
export class Media implements IMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The uploading customer. Null for workshop uploads, which a link table claims instead. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  entity_id: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  entity_type: EntityTypeValue | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 512 })
  path: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'varchar', length: 127 })
  mime: string;

  @CreateDateColumn({ type: 'timestamptz' })
  uploaded_at: Date;
}
