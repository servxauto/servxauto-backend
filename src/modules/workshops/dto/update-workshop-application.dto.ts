import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional } from 'class-validator';
import {
  WorkshopApplicationStatus,
  WorkshopApplicationStep,
} from '../types/workshops.types';
// `import type` is required: emitDecoratorMetadata would otherwise try to emit
// a runtime reference for a type-only export.
import type {
  WorkshopApplicationStatusType,
  WorkshopApplicationStepType,
} from '../types/workshops.types';

/**
 * Body of the application update: the step the partner is on, and when each
 * step was completed. Every field is optional, so the app can PATCH one step
 * at a time; passing `null` clears a step and makes it pending again.
 *
 * `submitted_at`, `approved_at` and `rejection_reason` stay absent — they are
 * outcomes of submitting and of the admin review, not fields a client sets.
 */
export class UpdateWorkshopApplicationDto {
  @IsOptional()
  @IsIn(Object.values(WorkshopApplicationStep))
  current_step?: WorkshopApplicationStepType;

  /**
   * Only `in_progress` is accepted — the partner may reopen a rejected
   * application for editing, but `submitted` and `approved` are reached
   * through `submit` and the admin review, which enforce their own rules.
   */
  @IsOptional()
  @IsIn([WorkshopApplicationStatus.IN_PROGRESS])
  status?: WorkshopApplicationStatusType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  phone_no_verified_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  business_details_completed_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  shop_location_completed_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  documents_completed_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  working_hours_completed_at?: Date | null;

  /** Completion of the `review` step, where the partner checks its own entry. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reviewed_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  agreements_accepted_at?: Date | null;
}
