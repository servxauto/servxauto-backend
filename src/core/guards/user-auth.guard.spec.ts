import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AppUnauthorizedException,
  InvalidOrExpiredTokenException,
} from '@/core/exceptions/app-http.exception';
import { User } from '@/modules/users/entities/user.entity';
import { UserAuthGuard } from './user-auth.guard';

describe('UserAuthGuard', () => {
  let guard: UserAuthGuard;
  let userRepo: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;

  const contextWith = (authorization?: string) => {
    const request: { headers: Record<string, string>; user?: User } = {
      headers: authorization ? { authorization } : {},
    };
    return {
      request,
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext,
    };
  };

  beforeEach(async () => {
    userRepo = { findOne: jest.fn() };
    jwtService = { verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthGuard,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: () => 'test-secret' } },
      ],
    }).compile();

    guard = module.get<UserAuthGuard>(UserAuthGuard);
  });

  it('admits a token whose id is a customer, and exposes the account', async () => {
    const user = { id: 'u1' } as User;
    jwtService.verifyAsync.mockResolvedValue({ sub: 'u1' });
    userRepo.findOne.mockResolvedValue(user);

    const { context, request } = contextWith('Bearer good.token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(request.user).toBe(user);
  });

  it('rejects a token whose id is not in users', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'workshop-1' });
    userRepo.findOne.mockResolvedValue(null);

    const { context } = contextWith('Bearer other.account.token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      InvalidOrExpiredTokenException,
    );
  });

  it('rejects a token that does not verify', async () => {
    jwtService.verifyAsync.mockRejectedValue(
      new JsonWebTokenError('bad signature'),
    );

    const { context } = contextWith('Bearer broken.token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      InvalidOrExpiredTokenException,
    );
    expect(userRepo.findOne).not.toHaveBeenCalled();
  });

  it.each([
    ['no header', undefined],
    ['a non-bearer scheme', 'Basic abc123'],
    ['bearer with no token', 'Bearer'],
  ])('rejects %s', async (_name, authorization) => {
    const { context } = contextWith(authorization);

    await expect(guard.canActivate(context)).rejects.toThrow(
      AppUnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });
});
