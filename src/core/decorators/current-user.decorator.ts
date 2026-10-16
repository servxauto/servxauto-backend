import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** The customer that UserAuthGuard put on the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return request.user;
  },
);
