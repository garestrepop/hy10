import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Settings } from '@hy10/database';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultSettings();
  }

  async get(): Promise<Settings> {
    let settings = await this.prisma.settings.findFirst();
    
    if (!settings) {
      settings = await this.ensureDefaultSettings();
    }
    
    return settings;
  }

  async update(
    actorId: string,
    actorRole: string,
    updateDto: UpdateSettingsDto,
  ): Promise<Settings> {
    if (actorRole !== 'ADMIN') {
      throw new Error('Only administrators can update settings');
    }

    const currentSettings = await this.get();
    
    const updated = await this.prisma.settings.update({
      where: { id: currentSettings.id },
      data: {
        ...updateDto,
        updated_at: new Date(),
      },
    });

    await this.auditService.record({
      entityType: 'Settings',
      entityId: updated.id,
      action: 'UPDATE',
      actorId,
      actorType: 'Account',
      previousValue: this.sanitizeForAudit(currentSettings),
      newValue: this.sanitizeForAudit(updated),
    });

    return updated;
  }

  private async ensureDefaultSettings(): Promise<Settings> {
    const existing = await this.prisma.settings.findFirst();
    
    if (existing) {
      return existing;
    }

    return this.prisma.settings.create({
      data: {
        timezone: 'America/Bogota',
        conversation_session_ttl_minutes: 60,
        handoff_ambiguity_attempts: 3,
        staff_upcoming_notice_minutes: 30,
        voice_note_max_seconds: 60,
        allow_cancel: false,
        allow_reschedule: false,
        cancel_min_hours: null,
        reschedule_min_hours: null,
        max_reschedules: null,
      },
    });
  }

  private sanitizeForAudit(settings: Settings): Partial<Settings> {
    const { id, created_at, updated_at, ...rest } = settings;
    return rest;
  }
}
