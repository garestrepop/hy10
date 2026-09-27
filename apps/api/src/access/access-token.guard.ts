import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyAccessToken } from './access-token';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();
    const header = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException();
    }

    try {
      request.user = verifyAccessToken(header.slice('Bearer '.length), secret);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
