import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** The worker that WorkerAuthGuard put on the request. */
export const CurrentWorker = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ worker?: unknown }>();
    return request.worker;
  },
);
