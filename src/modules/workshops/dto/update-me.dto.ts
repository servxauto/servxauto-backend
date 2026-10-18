import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsObject,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { GST_NO_REGEX } from '@/common/constants/validation.constant';
import { WorkshopAddressDto } from './workshop-address.dto';
import { WorkshopAgreementsDto } from './workshop-agreements.dto';
import { WorkshopWorkingHourDto } from './workshop-working-hour.dto';

/**
 * Every section is optional so the app can save one onboarding screen at a
 * time. A section that is sent replaces what is stored; one left out is
 * untouched. `null` clears a plain field.
 *
 * `phone_no` is absent on purpose — it is the login key, so changing it has to
 * go through OTP verification rather than a profile edit.
 */
export class WorkshopUpdateMeDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 160)
  business_name?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 120)
  owner_name?: string | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s/g, '').toUpperCase() : value,
  )
  @Matches(GST_NO_REGEX, { message: ErrorMessage.GST_NO_FORMAT })
  gst_no?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkshopAddressDto)
  address?: WorkshopAddressDto;

  /** Ids from `POST workshops/me/image-upload`, in the order shown. At least 2 are needed to submit. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  image_ids?: string[];

  /**
   * Requirement key → ids from `POST workshops/me/image-upload`, in display
   * order, e.g. `{ "aadhaar_card": [front, back] }`. The keys come from the
   * application's `document_requirements`, so the service validates them.
   */
  @IsOptional()
  @IsObject()
  documents?: Record<string, string[]>;

  /** The whole week, one entry per day. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ArrayUnique((hour: WorkshopWorkingHourDto) => hour.day)
  @ValidateNested({ each: true })
  @Type(() => WorkshopWorkingHourDto)
  working_hours?: WorkshopWorkingHourDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkshopAgreementsDto)
  agreements?: WorkshopAgreementsDto;
}
