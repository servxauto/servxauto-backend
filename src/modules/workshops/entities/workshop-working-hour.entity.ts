import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  IWorkshopWorkingHour,
  WeekDayValue,
} from '../types/workshops.types';
import { Workshop } from './workshop.entity';

/** One row per weekday; a closed day keeps its row with `is_open` false. */
@Entity('workshop_working_hours')
@Index('UQ_workshop_working_hours_workshop_id_day', ['workshop_id', 'day'], {
  unique: true,
})
export class WorkshopWorkingHour implements IWorkshopWorkingHour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workshop_id: string;

  @ManyToOne(() => Workshop, (workshop) => workshop.working_hours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ type: 'varchar', length: 3 })
  day: WeekDayValue;

  @Column({ type: 'boolean', default: false })
  is_open: boolean;

  @Column({ type: 'time', nullable: true })
  opens_at: string | null;

  @Column({ type: 'time', nullable: true })
  closes_at: string | null;
}
