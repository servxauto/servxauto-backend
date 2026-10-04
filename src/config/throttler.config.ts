import { ConfigService } from '@nestjs/config';
import { ThrottlerAsyncOptions } from '@nestjs/throttler';
import { ErrorMessage } from '@/common/constants/error-messages.constant';

/**
 * Global rate limit: each client IP may make THROTTLE_LIMIT requests per
 * THROTTLE_TTL_MS window. Override per route with `@Throttle()` (e.g. stricter
 * limits on login / OTP) or opt out with `@SkipThrottle()`.
 */
export const throttlerAsyncConfig: ThrottlerAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      {
        ttl: Number(config.get('THROTTLE_TTL_MS', 60000)),
        limit: Number(config.get('THROTTLE_LIMIT', 100)),
      },
    ],
    errorMessage: ErrorMessage.TOO_MANY_REQUESTS,
  }),
};
