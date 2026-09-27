import { ApiProperty } from '@nestjs/swagger';
import { AuditAction, ActorType } from '../entities/audit-log.entity';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ enum: ActorType })
  actor_type: ActorType;

  @ApiProperty({ nullable: true })
  actor_id: string | null;

  @ApiProperty({ nullable: true })
  actor_email: string | null;

  @ApiProperty({ nullable: true })
  actor_role: string | null;

  @ApiProperty({ nullable: true })
  entity_type: string | null;

  @ApiProperty({ nullable: true })
  entity_id: string | null;

  @ApiProperty({ type: 'object', nullable: true })
  previous_value: Record<string, any> | null;

  @ApiProperty({ type: 'object', nullable: true })
  new_value: Record<string, any> | null;

  @ApiProperty({ nullable: true })
  metadata: string | null;

  @ApiProperty()
  created_at: Date;
}

export class AuditLogPageResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items: AuditLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  page_size: number;

  @ApiProperty()
  total_pages: number;
}
