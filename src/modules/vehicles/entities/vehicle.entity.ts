import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
// `import type` is required: emitDecoratorMetadata would otherwise try to emit
// a runtime reference for a type-only export.
import type { FuelTypeValue, IVehicle } from '../types/vehicles.types';
import { VehicleImage } from './vehicle-image.entity';

/**
 * A car a customer has added to their garage. Soft deleted, so a plate can be
 * removed and added again — hence the partial unique index, which only applies
 * to rows that are still live.
 *
 * Photos hang off the `vehicle_images` link table.
 */
@Entity('vehicles')
@Index('UQ_vehicles_user_id_vehicle_no', ['user_id', 'vehicle_no'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Vehicle implements IVehicle {
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

  @OneToMany(() => VehicleImage, (vehicleImg) => vehicleImg.vehicle)
  images?: VehicleImage[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
