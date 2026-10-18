import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsUUID, Length } from 'class-validator';
import { Gender } from '../types/users.types';
// `import type` is required: emitDecoratorMetadata would otherwise try to emit
// a runtime reference for a type-only export.
import type { GenderType } from '../types/users.types';

/**
 * Every field is optional so the app can send one at a time; `null` clears it.
 * `phone_no` is absent on purpose — it is the login key, so changing it has to
 * go through OTP verification rather than a profile edit.
 */
export class UserUpdateMeDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 255)
  name?: string | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsIn(Object.values(Gender))
  gender?: GenderType | null;

  /** Id from `POST users/me/avatar`; must be a file this user uploaded. */
  @IsOptional()
  @IsUUID()
  avatar_id?: string | null;
}
