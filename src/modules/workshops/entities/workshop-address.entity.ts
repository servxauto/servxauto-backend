import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { IWorkshopAddress } from '../types/workshops.types';
import { Workshop } from './workshop.entity';

/** One per workshop. The place fields come from the Google Places result the app picked. */
@Entity('workshop_addresses')
export class WorkshopAddress implements IWorkshopAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unique through the one-to-one join column, so there is no separate index.
  @Column({ type: 'uuid' })
  workshop_id: string;

  @OneToOne(() => Workshop, (workshop) => workshop.address, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  formatted_address: string;

  // `double precision`, not `numeric`: pg hands `numeric` back as a string.
  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ type: 'varchar', length: 120 })
  shop_no: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  landmark: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postal_code: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  country: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
