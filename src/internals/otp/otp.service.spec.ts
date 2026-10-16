import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpPolicyService } from './otp-policy.service';
import { OtpService } from './otp.service';
import { TooManyRequestsException } from '@/core/exceptions/app-http.exception';
import { MailService } from '@/internals/mail/mail.service';
import { SmsService } from '@/common/services/sms.service';

const TTL_S = 300;
const COOLDOWN_S = 30;

describe('OtpService', () => {
  let service: OtpService;
  // Plain jest.Mock rather than jest.Mocked<Repository<Otp>>: create() and
  // save() are overloaded, and the overloads do not fit a single mock type.
  let otpRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const phone = '+919876543210';

  /** A row whose code was sent `agoSeconds` ago, per `expires_at - TTL`. */
  const sentAgo = (agoSeconds: number) =>
    ({
      id: 'otp-1',
      phone,
      email: null,
      expires_at: new Date(Date.now() + (TTL_S - agoSeconds) * 1000),
    }) as Otp;

  beforeEach(async () => {
    otpRepo = {
      findOne: jest.fn(),
      create: jest.fn((v: Otp) => v),
      save: jest.fn((v: Otp) => Promise.resolve(v)),
    };

    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'OTP_TTL_S') return TTL_S;
        if (key === 'OTP_RESEND_COOLDOWN_S') return COOLDOWN_S;
        if (key === 'NODE_ENV') return 'test';
        return fallback;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        // The real policy, so the TTL and cooldown arithmetic stays covered.
        OtpPolicyService,
        { provide: getRepositoryToken(Otp), useValue: otpRepo },
        { provide: MailService, useValue: { sendOtpMail: jest.fn() } },
        { provide: SmsService, useValue: { sendOtp: jest.fn() } },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPhoneOtp', () => {
    it('issues a code when the phone has none pending', async () => {
      otpRepo.findOne.mockResolvedValue(null);

      const result = await service.sendPhoneOtp(phone);

      expect(result.resend_after_seconds).toBe(COOLDOWN_S);
      // Expiry is TTL seconds out, allowing a second of drift.
      const ttlMs = result.expires_at.getTime() - Date.now();
      expect(ttlMs).toBeGreaterThan((TTL_S - 2) * 1000);
      expect(ttlMs).toBeLessThanOrEqual(TTL_S * 1000);
      expect(otpRepo.save).toHaveBeenCalled();
    });

    it('rejects a resend inside the cooldown window', async () => {
      otpRepo.findOne.mockResolvedValue(sentAgo(10));

      await expect(service.sendPhoneOtp(phone)).rejects.toThrow(
        TooManyRequestsException,
      );
      expect(otpRepo.save).not.toHaveBeenCalled();
    });

    it('allows a resend once the cooldown has passed', async () => {
      otpRepo.findOne.mockResolvedValue(sentAgo(COOLDOWN_S + 30));

      await expect(service.sendPhoneOtp(phone)).resolves.toMatchObject({
        resend_after_seconds: COOLDOWN_S,
      });
      expect(otpRepo.save).toHaveBeenCalled();
    });

    it('replaces the pending code rather than inserting a second row', async () => {
      const existing = sentAgo(COOLDOWN_S + 30);
      const previousCode = 111111;
      existing.code = previousCode;
      otpRepo.findOne.mockResolvedValue(existing);

      await service.sendPhoneOtp(phone);

      const saved = otpRepo.save.mock.calls[0][0] as Otp;
      expect(saved.id).toBe('otp-1');
      expect(saved.code).not.toBe(previousCode);
      expect(saved.is_verified).toBe(false);
      expect(otpRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyPhoneOtp', () => {
    it('accepts the pending code and marks it verified', async () => {
      otpRepo.findOne.mockResolvedValue(sentAgo(10));

      await expect(service.verifyPhoneOtp(phone, 123456)).resolves.toBe(true);

      const saved = otpRepo.save.mock.calls[0][0] as Otp;
      expect(saved.is_verified).toBe(true);
    });

    it('rejects a code with no matching pending row', async () => {
      otpRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyPhoneOtp(phone, 999999)).resolves.toBe(false);
      expect(otpRepo.save).not.toHaveBeenCalled();
    });
  });
});
