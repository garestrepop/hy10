import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessPrincipal } from './access-token';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessPrincipal => {
    const request = context.switchToHttp().getRequest<{ user: AccessPrincipal }>();
    return request.user;
  },
);
