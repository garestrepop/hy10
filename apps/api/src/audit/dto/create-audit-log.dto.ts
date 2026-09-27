import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, ActorType } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsEnum(ActorType)
  actor_type: ActorType;

  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsOptional()
  @IsString()
  actor_email?: string;

  @IsOptional()
  @IsString()
  actor_role?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsString()
  entity_id?: string;

  @IsOptional()
  @IsObject()
  previous_value?: Record<string, any> | null;

  @IsOptional()
  @IsObject()
  new_value?: Record<string, any> | null;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
