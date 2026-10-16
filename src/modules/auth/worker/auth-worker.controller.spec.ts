import { Test, TestingModule } from '@nestjs/testing';
import { AuthWorkerController } from './auth-worker.controller';
import { AuthWorkerService } from './auth-worker.service';

describe('AuthWorkerController', () => {
  let controller: AuthWorkerController;
  let service: jest.Mocked<Pick<AuthWorkerService, 'sendOtp' | 'login'>>;

  const phone_no = '+919876543210';

  beforeEach(async () => {
    service = { sendOtp: jest.fn(), login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthWorkerController],
      providers: [{ provide: AuthWorkerService, useValue: service }],
    }).compile();

    controller = module.get<AuthWorkerController>(AuthWorkerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates send-otp to the service', async () => {
    service.sendOtp.mockResolvedValue({
      phone_no,
      expires_at: '2026-10-11T09:20:00.000Z',
      resend_after_seconds: 30,
    });

    await expect(controller.sendOtp({ phone_no })).resolves.toEqual({
      phone_no,
      expires_at: '2026-10-11T09:20:00.000Z',
      resend_after_seconds: 30,
    });
    expect(service.sendOtp).toHaveBeenCalledWith({ phone_no });
  });

  it('delegates login to the service', async () => {
    const dto = { phone_no, otp: 123456 };
    await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto);
  });
});
