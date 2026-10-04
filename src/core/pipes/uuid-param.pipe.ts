import { Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { InvalidRequestException } from '@/core/exceptions/app-http.exception';

/**
 * Validates that a route param is a UUID, e.g. `@Param('id', UuidParamPipe) id: string`.
 */
@Injectable()
export class UuidParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new InvalidRequestException(ErrorMessage.INVALID_ID);
    }
    return value;
  }
}
