import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ErrorCode,
  ErrorCodeType,
} from '@/common/constants/error-codes.constant';
import { AppHttpError } from '@/common/types/error.types';
import { AppHttpException } from '@/core/exceptions/app-http.exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const error =
      exception instanceof AppHttpException
        ? (exception.getResponse() as AppHttpError)
        : this.fromNestException(exception, request);

    // client errors are expected traffic: log briefly; server errors get the stack
    if (error.status_code >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${error.status_code}`,
        exception.stack,
      );
    } else {
      const cause = exception.cause
        ? `\nCaused by: ${this.getErrorCause(exception.cause)}`
        : '';
      this.logger.warn(
        `${request.method} ${request.url} -> ${error.status_code} ${error.message}${cause}`,
      );
    }

    response.status(error.status_code).json(error);
  }

  private fromNestException(
    exception: HttpException,
    request: Request,
  ): AppHttpError {
    const status = exception.getStatus();
    const body = exception.getResponse();
    const message =
      typeof body === 'string'
        ? body
        : (body as { message?: string | string[] }).message;

    return {
      status_code: status,
      message: Array.isArray(message)
        ? message.join(', ')
        : (message ?? exception.message),
      error_code: this.getErrorCode(status, request),
    };
  }

  private getErrorCode(status: number, request: Request): ErrorCodeType | null {
    // Handle route not found case
    if (status === Number(HttpStatus.NOT_FOUND) && !request.route) {
      return ErrorCode.ROUTE_NOT_FOUND;
    }
    return ErrorCode[HttpStatus[status] as ErrorCodeType] ?? null;
  }

  private getErrorCause(cause: unknown): string {
    // Handle error cause for unknown errors
    if (cause instanceof Error) {
      return cause.stack ?? cause.message;
    }
    return typeof cause === 'string' ? cause : JSON.stringify(cause);
  }
}
