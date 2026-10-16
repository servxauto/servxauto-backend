import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OtpPolicyService } from './otp-policy.service';

const TTL_S = 300;
const COOLDOWN_S = 30;

describe('OtpPolicyService', () => {
  let policy: OtpPolicyService;
  let env: Record<string, unknown>;

  /** Expiry of a code sent `agoSeconds` ago, as `issue()` would have set it. */
  const expiryOfCodeSent = (agoSeconds: number) =>
    new Date(Date.now() + (TTL_S - agoSeconds) * 1000);

  beforeEach(async () => {
    env = {
      OTP_TTL_S: TTL_S,
      OTP_RESEND_COOLDOWN_S: COOLDOWN_S,
      NODE_ENV: 'development',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpPolicyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) =>
              key in env ? env[key] : fallback,
            ),
          },
        },
      ],
    }).compile();

    policy = module.get<OtpPolicyService>(OtpPolicyService);
  });

  describe('generateCode', () => {
    it('returns a 6 digit code', () => {
      for (let i = 0; i < 50; i++) {
        const code = policy.generateCode();
        expect(code).toBeGreaterThanOrEqual(100000);
        expect(code).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('nextExpiresAt', () => {
    it('is OTP_TTL_S seconds out', () => {
      const ms = policy.nextExpiresAt().getTime() - Date.now();
      expect(ms).toBeGreaterThan((TTL_S - 2) * 1000);
      expect(ms).toBeLessThanOrEqual(TTL_S * 1000);
    });

    it('follows a changed TTL', () => {
      env.OTP_TTL_S = 60;
      const ms = policy.nextExpiresAt().getTime() - Date.now();
      expect(ms).toBeLessThanOrEqual(60 * 1000);
    });
  });

  describe('cooldownRemaining', () => {
    it('counts down while inside the window', () => {
      expect(policy.cooldownRemaining(expiryOfCodeSent(10))).toBe(20);
    });

    it('is 0 once the window has passed', () => {
      expect(policy.cooldownRemaining(expiryOfCodeSent(COOLDOWN_S + 5))).toBe(
        0,
      );
    });

    it('is 0 exactly on the boundary', () => {
      expect(policy.cooldownRemaining(expiryOfCodeSent(COOLDOWN_S))).toBe(0);
    });

    it('is the full cooldown for a code just sent', () => {
      expect(policy.cooldownRemaining(expiryOfCodeSent(0))).toBe(COOLDOWN_S);
    });
  });

  describe('isDevBypass', () => {
    it('accepts the bypass code in development', () => {
      expect(policy.isDevBypass(112233)).toBe(true);
    });

    it('rejects any other code', () => {
      expect(policy.isDevBypass(123456)).toBe(false);
    });

    it('rejects the bypass code in production', () => {
      env.NODE_ENV = 'production';
      expect(policy.isDevBypass(112233)).toBe(false);
    });
  });
});
