import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessPrincipal } from '../access/access-token';
import { AuditService } from '../audit/audit.service';
import { ActorType, AuditAction } from '../audit/entities/audit-log.entity';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { BusinessSettings } from './entities/business-settings.entity';

const DEFAULTS = {
  singleton: true,
  timezone: 'America/Bogota',
  model_identifier: null,
  conversation_session_ttl_minutes: 60,
  handoff_ambiguity_attempts: 3,
  staff_upcoming_notice_minutes: 30,
  voice_note_max_seconds: 60,
  allow_cancel: false,
  allow_reschedule: false,
  cancel_min_hours: null,
  reschedule_min_hours: null,
  max_reschedules: null,
} as const;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(BusinessSettings)
    private readonly settingsRepository: Repository<BusinessSettings>,
    private readonly auditService: AuditService,
  ) {}

  async get(): Promise<SettingsResponseDto> {
    const settings = await this.findOrCreate();
    return this.toResponse(settings);
  }

  async update(
    actor: AccessPrincipal,
    dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    const current = await this.findOrCreate();
    const previous = this.toResponse(current);

    Object.assign(current, dto);
    const saved = await this.settingsRepository.save(current);
    const next = this.toResponse(saved);

    await this.auditService.record({
      action: AuditAction.SETTINGS_UPDATED,
      actor_type: ActorType.USER,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: 'business_settings',
      entity_id: saved.id,
      previous_value: previous,
      new_value: next,
    });

    return next;
  }

  private async findOrCreate(): Promise<BusinessSettings> {
    const existing = await this.settingsRepository.findOne({
      where: { singleton: true },
    });
    if (existing) {
      return existing;
    }

    return this.settingsRepository.save(
      this.settingsRepository.create({ ...DEFAULTS }),
    );
  }

  private toResponse(settings: BusinessSettings): SettingsResponseDto {
    return {
      timezone: settings.timezone,
      model_identifier: settings.model_identifier,
      conversation_session_ttl_minutes: settings.conversation_session_ttl_minutes,
      handoff_ambiguity_attempts: settings.handoff_ambiguity_attempts,
      staff_upcoming_notice_minutes: settings.staff_upcoming_notice_minutes,
      voice_note_max_seconds: settings.voice_note_max_seconds,
      allow_cancel: settings.allow_cancel,
      allow_reschedule: settings.allow_reschedule,
      cancel_min_hours: settings.cancel_min_hours,
      reschedule_min_hours: settings.reschedule_min_hours,
      max_reschedules: settings.max_reschedules,
    };
  }
}
