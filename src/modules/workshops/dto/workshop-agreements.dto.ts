import { IsBoolean, IsOptional } from 'class-validator';

/**
 * `true` accepts the agreement's current version, `false` withdraws it. An
 * agreement left out is untouched.
 */
export class WorkshopAgreementsDto {
  @IsOptional()
  @IsBoolean()
  terms_of_service?: boolean;

  @IsOptional()
  @IsBoolean()
  commission_agreement?: boolean;

  @IsOptional()
  @IsBoolean()
  data_privacy_consent?: boolean;
}
