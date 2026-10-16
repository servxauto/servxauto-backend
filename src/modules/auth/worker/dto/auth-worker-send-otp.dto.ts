import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { PHONE_NO_REGEX } from '@/common/constants/validation.constant';

export class AuthWorkerSendOtpDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '') : value,
  )
  @Matches(PHONE_NO_REGEX, { message: ErrorMessage.PHONE_NO_FORMAT })
  phone_no: string;

  /** Defaults to `true`: an unknown number is rejected with 404. `false` registers. */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  check_existance?: boolean;
}
