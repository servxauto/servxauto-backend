import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserService } from './auth-user.service';
import {
  AppUnauthorizedException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { OtpService } from '@/internals/otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/modules/users/entities/user.entity';

describe('AuthUserService', () => {
  let service: AuthUserService;
  let userRepo: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'create' | 'save'>
  >;
  let otpService: jest.Mocked<
    Pick<OtpService, 'sendPhoneOtp' | 'verifyPhoneOtp'>
  >;

  const phone_no = '+919876543210';
  const expiresAt = new Date('2026-10-11T09:20:00.000Z');

  beforeEach(async () => {
    userRepo = {
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
        AuthUserService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: OtpService, useValue: otpService },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthUserService>(AuthUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('rejects an unknown phone number by default', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.sendOtp({ phone_no })).rejects.toThrow(
        RecordNotFoundException,
      );
      expect(otpService.sendPhoneOtp).not.toHaveBeenCalled();
    });

    it('sends the code to a known phone number', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1' } as User);

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

      expect(userRepo.findOne).not.toHaveBeenCalled();
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
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        phone_no,
        email: null,
      } as User);

      const result = await service.login({ phone_no, otp: 123456 });

      expect(result.is_new_user).toBe(false);
      expect(result.user.id).toBe('u1');
      expect(result.token).toBe('signed.jwt.token');
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('registers the account on first login', async () => {
      otpService.verifyPhoneOtp.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ phone_no } as User);
      userRepo.save.mockResolvedValue({
        id: 'u2',
        phone_no,
        email: null,
      } as User);

      const result = await service.login({ phone_no, otp: 123456 });

      expect(result.is_new_user).toBe(true);
      expect(result.user.id).toBe('u2');
      expect(userRepo.save).toHaveBeenCalled();
    });
  });
});
