import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
// `import type` is required: emitDecoratorMetadata would otherwise try to emit
// a runtime reference for a type-only export.
import type { FuelTypeValue, VehicleImage } from '../types/vehicle.types';

/**
 * A car a customer has added to their garage. Soft deleted, so a plate can be
 * removed and added again — hence the partial unique index, which only applies
 * to rows that are still live.
 *
 * Photos are not a relation: they are `media` rows pointing back at this
 * vehicle through `entity_id` + `entity_type`, which carry no foreign key.
 */
@Entity('vehicles')
@Index('UQ_vehicles_user_id_vehicle_no', ['user_id', 'vehicle_no'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_vehicles_user_id')
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Registration number, normalised to uppercase with no spaces. */
  @Column({ type: 'varchar', length: 20 })
  vehicle_no: string;

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'varchar', length: 20 })
  fuel_type: FuelTypeValue;

  /** Filled in by the service from `media`; not a column, so not a relation. */
  images?: VehicleImage[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
