import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { AppHttpError } from '@/common/types/error.types';

/**
 * Catches everything that is not an HttpException (those are handled by
 * HttpExceptionFilter) and returns a generic 500 without leaking internals.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const error: AppHttpError = {
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ErrorMessage.SOMETHING_WENT_WRONG,
      error_code: ErrorCode.INTERNAL_SERVER_ERROR,
    };

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(error.status_code).json(error);
  }
}
