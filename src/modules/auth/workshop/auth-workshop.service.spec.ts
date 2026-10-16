import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthWorkshopService } from './auth-workshop.service';
import {
  AppUnauthorizedException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { OtpService } from '@/internals/otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import { Workshop } from '@/modules/workshops/entities/workshop.entity';
import { WorkshopApplicationService } from '@/modules/workshops/services/workshop-application.service';

describe('AuthWorkshopService', () => {
  let service: AuthWorkshopService;
  let workshopRepo: jest.Mocked<
    Pick<Repository<Workshop>, 'findOne' | 'create' | 'save'>
  >;
  let otpService: jest.Mocked<
    Pick<OtpService, 'sendPhoneOtp' | 'verifyPhoneOtp'>
  >;

  const phone_no = '+919876543210';
  const expiresAt = new Date('2026-10-11T09:20:00.000Z');

  beforeEach(async () => {
    workshopRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    otpService = {
      sendPhoneOtp: jest.fn(),
      verifyPhoneOtp: jest.fn(),
    };
    otpService.sendPhoneOtp.mockResolvedValue({
      expires_at: expiresAt,
      resend_after_seconds: 30,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthWorkshopService,
        { provide: getRepositoryToken(Workshop), useValue: workshopRepo },
        { provide: OtpService, useValue: otpService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') },
        },
        {
          provide: WorkshopApplicationService,
          useValue: { create: jest.fn(), find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthWorkshopService>(AuthWorkshopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('rejects an unknown phone number by default', async () => {
      workshopRepo.findOne.mockResolvedValue(null);

      await expect(service.sendOtp({ phone_no })).rejects.toThrow(
        RecordNotFoundException,
      );
      expect(otpService.sendPhoneOtp).not.toHaveBeenCalled();
    });

    it('sends the code to a known phone number', async () => {
      workshopRepo.findOne.mockResolvedValue({ id: 's1' } as Workshop);

      await expect(service.sendOtp({ phone_no })).resolves.toEqual({
        phone_no,
        expires_at: expiresAt.toISOString(),
        resend_after_seconds: 30,
      });
      expect(otpService.sendPhoneOtp).toHaveBeenCalledWith(phone_no);
    });

    it('skips the existence check when check_existance is false', async () => {
      await expect(
        service.sendOtp({ phone_no, check_existance: false }),
      ).resolves.toEqual({
        phone_no,
        expires_at: expiresAt.toISOString(),
        resend_after_seconds: 30,
      });

      expect(workshopRepo.findOne).not.toHaveBeenCalled();
      expect(otpService.sendPhoneOtp).toHaveBeenCalledWith(phone_no);
    });
  });

  describe('login', () => {
    it('rejects a wrong or expired code', async () => {
      otpService.verifyPhoneOtp.mockResolvedValue(false);

      await expect(service.login({ phone_no, otp: 123456 })).rejects.toThrow(
        AppUnauthorizedException,
      );
    });

    it('returns a session for an existing account', async () => {
      otpService.verifyPhoneOtp.mockResolvedValue(true);
      workshopRepo.findOne.mockResolvedValue({
        id: 's1',
        phone_no,
        email: null,
      } as Workshop);

      const result = await service.login({ phone_no, otp: 123456 });

      expect(result.is_new_user).toBe(false);
      expect(result.workshop.id).toBe('s1');
      expect(result.token).toBe('signed.jwt.token');
      expect(workshopRepo.save).not.toHaveBeenCalled();
    });

    it('registers the account on first login', async () => {
      otpService.verifyPhoneOtp.mockResolvedValue(true);
      workshopRepo.findOne.mockResolvedValue(null);
      workshopRepo.create.mockReturnValue({ phone_no } as Workshop);
      workshopRepo.save.mockResolvedValue({
        id: 's2',
        phone_no,
        email: null,
      } as Workshop);

      const result = await service.login({ phone_no, otp: 123456 });

      expect(result.is_new_user).toBe(true);
      expect(result.workshop.id).toBe('s2');
      expect(workshopRepo.save).toHaveBeenCalled();
    });
  });
});
