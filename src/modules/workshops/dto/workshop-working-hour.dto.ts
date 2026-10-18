import { IsBoolean, IsIn, Matches, ValidateIf } from 'class-validator';
import { TIME_HH_MM_REGEX } from '@/common/constants/validation.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { WeekDay } from '../types/workshops.types';
// `import type` is required: emitDecoratorMetadata would otherwise try to emit
// a runtime reference for a type-only export.
import type { WeekDayValue } from '../types/workshops.types';

/**
 * One weekday. The times are required while open and ignored while closed;
 * that `closes_at` is after `opens_at` is checked by the service.
 */
export class WorkshopWorkingHourDto {
  @IsIn(Object.values(WeekDay))
  day: WeekDayValue;

  @IsBoolean()
  is_open: boolean;

  @ValidateIf((hour: WorkshopWorkingHourDto) => hour.is_open)
  @Matches(TIME_HH_MM_REGEX, {
    message: ErrorMessage.WORKING_HOURS_TIME_FORMAT,
  })
  opens_at?: string | null;

  @ValidateIf((hour: WorkshopWorkingHourDto) => hour.is_open)
  @Matches(TIME_HH_MM_REGEX, {
    message: ErrorMessage.WORKING_HOURS_TIME_FORMAT,
  })
  closes_at?: string | null;
}
