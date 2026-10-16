import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import {
  AppUnauthorizedException,
  InvalidOrExpiredTokenException,
} from '@/core/exceptions/app-http.exception';
import { AuthJwtPayload } from '@/core/types/auth.types';
import { Workshop } from '@/modules/workshops/entities/workshop.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Admits workshop tokens only. `@UseGuards(WorkshopAuthGuard)`.
 *
 * The token carries nothing but the id, so the account is proved by finding
 * the row: a token issued to another kind of account has an id that is not in
 * `workshops`, and a deleted account stops being found at all.
 */
@Injectable()
export class WorkshopAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new AppUnauthorizedException(
        ErrorMessage.NO_TOKEN_PROVIDED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const workshop = await this.workshopRepo.findOne({
        where: { id: payload.sub },
      });

      if (!workshop) {
        throw new InvalidOrExpiredTokenException(
          ErrorMessage.INVALID_OR_EXPIRED_TOKEN,
          ErrorCode.INVALID_OR_EXPIRED_TOKEN,
        );
      }

      request.workshop = workshop;
    } catch (error: unknown) {
      // Covers a bad signature, a malformed token and an expired one alike.
      if (
        error instanceof JsonWebTokenError ||
        error instanceof TokenExpiredError
      ) {
        throw new InvalidOrExpiredTokenException(
          ErrorMessage.INVALID_OR_EXPIRED_TOKEN,
          ErrorCode.INVALID_OR_EXPIRED_TOKEN,
          error,
        );
      }
      // Anything else — the "account not found" rejection above, a database
      // failure — must not be swallowed, or the request falls through to
      // `return true` with no account on it.
      throw error;
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
