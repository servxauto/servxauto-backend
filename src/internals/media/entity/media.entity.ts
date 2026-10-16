import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** What an uploaded file is attached to. */
export const EntityType = {
  USER: 'USER',
  VEHICLE: 'VEHICLE',
} as const;

export type EntityTypeValue = (typeof EntityType)[keyof typeof EntityType];

/**
 * An uploaded file. `path` is the object key in the S3-compatible bucket;
 * `AwsS3Service.getObjectUrl()` turns it into a public URL.
 *
 * `entity_id` + `entity_type` form a loose polymorphic link to whatever the
 * file belongs to, so there is no foreign key on that pair.
 */
@Entity('media')
@Index(['entity_type', 'entity_id'])
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

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
