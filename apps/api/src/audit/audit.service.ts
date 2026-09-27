import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@hy10/database';

export interface AuditEventData {
  entityType: string;
  entityId?: string;
  action: string;
  actorId?: string;
  actorType: string;
  previousValue?: any;
  newValue?: any;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  
  constructor(private readonly prisma: PrismaClient) {}

  async record(data: AuditEventData): Promise<void> {
    try {
      const sanitizedPreviousValue = this.sanitizeSecrets(data.previousValue);
      const sanitizedNewValue = this.sanitizeSecrets(data.newValue);

      await this.prisma.auditEvent.create({
        data: {
          entity_type: data.entityType,
          entity_id: data.entityId,
          action: data.action,
          actor_id: data.actorId,
          actor_type: data.actorType,
          previous_value: sanitizedPreviousValue,
          new_value: sanitizedNewValue,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record audit event: ${error.message}`, error.stack);
    }
  }

  private sanitizeSecrets(value: any): any {
    if (!value) return value;
    
    const sanitized = { ...value };
    const secretFields = [
      'password',
      'password_hash',
      'token',
      'secret',
      'api_key',
      'private_key',
      'mfa_secret',
      'bot_token',
      'card_number',
      'cvv',
      'audio',
      'voice_data'
    ];

    for (const field of secretFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  async query(actorId: string, actorRole: string, filter?: any) {
    if (actorRole !== 'ADMIN') {
      throw new Error('Only administrators can query audit logs');
    }

    return this.prisma.auditEvent.findMany({
      where: filter,
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
