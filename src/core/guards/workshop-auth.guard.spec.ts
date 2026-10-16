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
import { Workshop } from '@/modules/workshops/entities/workshop.entity';
import { WorkshopAuthGuard } from './workshop-auth.guard';

describe('WorkshopAuthGuard', () => {
  let guard: WorkshopAuthGuard;
  let workshopRepo: jest.Mocked<Pick<Repository<Workshop>, 'findOne'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;

  const contextWith = (authorization?: string) => {
    const request: { headers: Record<string, string>; workshop?: Workshop } = {
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
    workshopRepo = { findOne: jest.fn() };
    jwtService = { verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopAuthGuard,
        { provide: getRepositoryToken(Workshop), useValue: workshopRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: () => 'test-secret' } },
      ],
    }).compile();

    guard = module.get<WorkshopAuthGuard>(WorkshopAuthGuard);
  });

  it('admits a token whose id is a workshop, and exposes the account', async () => {
    const workshop = { id: 'ws1' } as Workshop;
    jwtService.verifyAsync.mockResolvedValue({ sub: 'ws1' });
    workshopRepo.findOne.mockResolvedValue(workshop);

    const { context, request } = contextWith('Bearer good.token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(workshopRepo.findOne).toHaveBeenCalledWith({ where: { id: 'ws1' } });
    expect(request.workshop).toBe(workshop);
  });

  it('rejects a token whose id is not in workshops', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    workshopRepo.findOne.mockResolvedValue(null);

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
    expect(workshopRepo.findOne).not.toHaveBeenCalled();
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
