import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, Matches } from 'class-validator';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { PHONE_NO_REGEX } from '@/common/constants/validation.constant';

export class AuthWorkerLoginDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '') : value,
  )
  @Matches(PHONE_NO_REGEX, { message: ErrorMessage.PHONE_NO_FORMAT })
  phone_no: string;

  @Type(() => Number)
  @IsInt({ message: ErrorMessage.OTP_FORMAT })
  otp: number;
}
