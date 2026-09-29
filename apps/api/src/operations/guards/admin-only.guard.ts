import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../auth/entities/user.entity';

/**
 * AdminOnlyGuard
 * 
 * Authorization guard that restricts access to Administrator role only.
 * 
 * US-22 Scenario: Cliente o Staff pide lo mismo
 * "Cuando un Cliente, o un Staff pide la ocupación global o el staff de todos los servicios,
 * entonces no recibe el resultado de Administrador"
 * 
 * This guard ensures that Staff and Client roles are rejected from
 * accessing administrator-level operational queries.
 */
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied. Administrator role required.');
    }

    return true;
  }
}
