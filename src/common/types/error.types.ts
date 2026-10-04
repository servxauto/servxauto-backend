import { HttpStatus } from '@nestjs/common';
import { ErrorCodeType } from '@/common/constants/error-codes.constant';

export interface AppHttpError {
  status_code: HttpStatus;
  message: string;
  error_code?: ErrorCodeType | null;
}
