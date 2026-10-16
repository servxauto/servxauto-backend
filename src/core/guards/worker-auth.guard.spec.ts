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
import { Worker } from '@/modules/workers/entities/worker.entity';
import { WorkerAuthGuard } from './worker-auth.guard';

describe('WorkerAuthGuard', () => {
  let guard: WorkerAuthGuard;
  let workerRepo: jest.Mocked<Pick<Repository<Worker>, 'findOne'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;

  const contextWith = (authorization?: string) => {
    const request: { headers: Record<string, string>; worker?: Worker } = {
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
    workerRepo = { findOne: jest.fn() };
    jwtService = { verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerAuthGuard,
        { provide: getRepositoryToken(Worker), useValue: workerRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: () => 'test-secret' } },
      ],
    }).compile();

    guard = module.get<WorkerAuthGuard>(WorkerAuthGuard);
  });

  it('admits a token whose id is a worker, and exposes the account', async () => {
    const worker = { id: 'w1' } as Worker;
    jwtService.verifyAsync.mockResolvedValue({ sub: 'w1' });
    workerRepo.findOne.mockResolvedValue(worker);

    const { context, request } = contextWith('Bearer good.token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(workerRepo.findOne).toHaveBeenCalledWith({ where: { id: 'w1' } });
    expect(request.worker).toBe(worker);
  });

  it('rejects a token whose id is not in workers', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    workerRepo.findOne.mockResolvedValue(null);

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
    expect(workerRepo.findOne).not.toHaveBeenCalled();
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
