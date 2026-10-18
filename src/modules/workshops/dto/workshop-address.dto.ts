import { Transform } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

/** The Google Places result the partner picked, plus what they typed below it. */
export class WorkshopAddressDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 255)
  name: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 1000)
  formatted_address: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 120)
  shop_no: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 160)
  landmark?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  city?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  state?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  postal_code?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  country?: string | null;
}
