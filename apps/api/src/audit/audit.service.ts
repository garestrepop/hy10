import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog, AuditAction, ActorType } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditDto } from './dto/query-audit.dto';
import {
  AuditLogResponseDto,
  AuditLogPageResponseDto,
} from './dto/audit-log-response.dto';

/**
 * Sensitive fields that must be excluded from audit logs
 * per FR-56: no passwords, tokens, or card data
 */
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'webhook_secret',
  'bot_token',
  'card_number',
  'cvv',
  'card_data',
  'credit_card',
  'payment_method',
  'audio',
  'voice_note',
  'recording',
];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Record an audit event
   * Per FR-56: If write fails, business operation should not rollback
   */
  async record(dto: CreateAuditLogDto): Promise<void> {
    try {
      // Sanitize sensitive data
      const sanitizedPrevious = this.sanitizeData(dto.previous_value);
      const sanitizedNew = this.sanitizeData(dto.new_value);

<<<<<<< HEAD
      const auditLog: Partial<AuditLog> = {
        action: dto.action,
        actor_type: dto.actor_type,
        actor_id: dto.actor_id ?? undefined,
        actor_email: dto.actor_email ?? undefined,
        actor_role: dto.actor_role ?? undefined,
        entity_type: dto.entity_type ?? undefined,
        entity_id: dto.entity_id ?? undefined,
        previous_value: sanitizedPrevious ?? undefined,
        new_value: sanitizedNew ?? undefined,
        metadata: dto.metadata ?? undefined,
        ip_address: dto.ip_address ?? undefined,
        user_agent: dto.user_agent ?? undefined,
      };
=======
      const auditLog = this.auditLogRepository.create({
        action: dto.action,
        actor_type: dto.actor_type,
        actor_id: dto.actor_id,
        actor_email: dto.actor_email,
        actor_role: dto.actor_role,
        entity_type: dto.entity_type,
        entity_id: dto.entity_id,
        previous_value: sanitizedPrevious,
        new_value: sanitizedNew,
        metadata: dto.metadata,
        ip_address: dto.ip_address,
        user_agent: dto.user_agent,
      });
>>>>>>> origin/develop

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Per FR-56: log the failure but don't throw
      this.logger.error(
        `Failed to write audit log for action ${dto.action}`,
        error,
      );
      // Error goes to application log, not audit log
    }
  }

  /**
   * Query audit logs - Admin only per US-31
   */
  async query(
    actorRole: string,
    dto: QueryAuditDto,
  ): Promise<AuditLogPageResponseDto> {
    // Per US-31 Scenario: Staff - server rejects
    if (actorRole !== 'admin' && actorRole !== 'administrator') {
      throw new Error('Unauthorized: Only administrators can access audit logs');
    }

    const where: FindOptionsWhere<AuditLog> = {
      is_deleted: false,
    };

    // Filter by action
    if (dto.action) {
      where.action = dto.action;
    }

    // Filter by actor
    if (dto.actor_id) {
      where.actor_id = dto.actor_id;
    }

    // Filter by entity
    if (dto.entity_type) {
      where.entity_type = dto.entity_type;
    }

    if (dto.entity_id) {
      where.entity_id = dto.entity_id;
    }

    // Filter by date range
    if (dto.from_date || dto.to_date) {
      const fromDate = dto.from_date
        ? new Date(dto.from_date)
        : new Date('1970-01-01');
      const toDate = dto.to_date ? new Date(dto.to_date) : new Date();

      where.created_at = Between(fromDate, toDate);
    }

    // Pagination
    const page = dto.page || 1;
    const pageSize = dto.page_size || 50;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.auditLogRepository.findAndCount({
      where,
      order: {
        created_at: 'DESC',
      },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: items.map((item) => this.toResponseDto(item)),
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  }

  /**
   * Sanitize data to remove sensitive fields
   */
  private sanitizeData(
    data: Record<string, any> | null | undefined,
  ): Record<string, any> | null {
    if (!data) {
      return null;
    }

    const sanitized = { ...data };

    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Convert entity to response DTO, excluding internal fields
   */
  private toResponseDto(entity: AuditLog): AuditLogResponseDto {
    return {
      id: entity.id,
      action: entity.action,
      actor_type: entity.actor_type,
      actor_id: entity.actor_id,
      actor_email: entity.actor_email,
      actor_role: entity.actor_role,
      entity_type: entity.entity_type,
      entity_id: entity.entity_id,
      previous_value: entity.previous_value,
      new_value: entity.new_value,
      metadata: entity.metadata,
      created_at: entity.created_at,
    };
  }
}
