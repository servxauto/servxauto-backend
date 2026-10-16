import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { FuelType } from '../types/vehicle.types';
// `import type` is required: emitDecoratorMetadata would otherwise try to emit
// a runtime reference for a type-only export.
import type { FuelTypeValue } from '../types/vehicle.types';
import { VEHICLE_NO_REGEX } from './vehicle-lookup.dto';

export class CreateVehicleDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.replace(/[\s-]/g, '').toUpperCase()
      : value,
  )
  @Matches(VEHICLE_NO_REGEX, { message: ErrorMessage.VEHICLE_NO_FORMAT })
  vehicle_no: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 100)
  brand: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 100)
  model: string;

  @IsIn(Object.values(FuelType))
  fuel_type: FuelTypeValue;

  /** Ids from `POST vehicles/image-upload`, in the order shown. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsUUID(undefined, { each: true })
  image_ids?: string[];
}
