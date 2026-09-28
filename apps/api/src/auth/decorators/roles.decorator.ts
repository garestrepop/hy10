import { SetMetadata } from '@nestjs/common';
import { AccessRole } from '../../access/access-token';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AccessRole[]) => SetMetadata(ROLES_KEY, roles);
