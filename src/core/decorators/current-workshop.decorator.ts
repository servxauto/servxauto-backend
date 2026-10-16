import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** The workshop that WorkshopAuthGuard put on the request. */
export const CurrentWorkshop = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ workshop?: unknown }>();
    return request.workshop;
  },
);
