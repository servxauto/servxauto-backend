import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { ErrorMessage } from '@/common/constants/error-messages.constant';

/**
 * Indian registration number: the usual `MH12AB1234` layout, or the newer
 * BH-series `22BH1234AA`.
 */
export const VEHICLE_NO_REGEX =
  /^([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}|\d{2}BH\d{4}[A-Z]{1,2})$/;

export class VehicleLookupDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.replace(/[\s-]/g, '').toUpperCase()
      : value,
  )
  @Matches(VEHICLE_NO_REGEX, { message: ErrorMessage.VEHICLE_NO_FORMAT })
  vehicle_no: string;
}
