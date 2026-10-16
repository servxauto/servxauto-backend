import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Media } from '@/internals/media/entity/media.entity';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_images')
export class VehicleImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vehicle_id: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'uuid' })
  media_id: string;

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media: Media;

  @Column({ type: 'smallint', default: 0 })
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
