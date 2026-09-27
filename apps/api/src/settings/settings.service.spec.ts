import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { AuditService } from '../audit/audit.service';
import { PrismaClient, Settings } from '@hy10/database';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaClient;
  let auditService: AuditService;

  const mockSettings: Settings = {
    id: '1',
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
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaClient,
          useValue: {
            settings: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            record: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaClient>(PrismaClient);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('US-07 Escenario: Valores iniciales', () => {
    it('should return default values for a newly created business', async () => {
      jest.spyOn(prisma.settings, 'findFirst').mockResolvedValue(mockSettings);

      const result = await service.get();

      expect(result.timezone).toBe('America/Bogota');
      expect(result.conversation_session_ttl_minutes).toBe(60);
      expect(result.handoff_ambiguity_attempts).toBe(3);
      expect(result.staff_upcoming_notice_minutes).toBe(30);
      expect(result.allow_cancel).toBe(false);
      expect(result.allow_reschedule).toBe(false);
    });

    it('should create default settings if none exist', async () => {
      jest.spyOn(prisma.settings, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.settings, 'create').mockResolvedValue(mockSettings);

      const result = await service.get();

      expect(prisma.settings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timezone: 'America/Bogota',
          conversation_session_ttl_minutes: 60,
          handoff_ambiguity_attempts: 3,
          staff_upcoming_notice_minutes: 30,
          allow_cancel: false,
          allow_reschedule: false,
        }),
      });
      expect(result.timezone).toBe('America/Bogota');
    });
  });

  describe('US-07 Escenario: Guardar políticas y modelo', () => {
    it('should allow Admin to update settings', async () => {
      const actorId = 'admin-123';
      const actorRole = 'ADMIN';
      const updateDto = {
        timezone: 'America/Mexico_City',
        model_identifier: 'gpt-4',
        allow_cancel: true,
        cancel_min_hours: 24,
      };

      const updatedSettings: Settings = {
        ...mockSettings,
        ...updateDto,
      };

      jest.spyOn(prisma.settings, 'findFirst').mockResolvedValue(mockSettings);
      jest.spyOn(prisma.settings, 'update').mockResolvedValue(updatedSettings);
      jest.spyOn(auditService, 'record').mockResolvedValue(undefined);

      const result = await service.update(actorId, actorRole, updateDto);

      expect(result.timezone).toBe('America/Mexico_City');
      expect(result.model_identifier).toBe('gpt-4');
      expect(result.allow_cancel).toBe(true);
      expect(result.cancel_min_hours).toBe(24);
    });

    it('should audit settings changes with actor and previous value', async () => {
      const actorId = 'admin-123';
      const actorRole = 'ADMIN';
      const updateDto = {
        timezone: 'America/Lima',
        model_identifier: 'claude-3',
      };

      const updatedSettings: Settings = {
        ...mockSettings,
        ...updateDto,
      };

      jest.spyOn(prisma.settings, 'findFirst').mockResolvedValue(mockSettings);
      jest.spyOn(prisma.settings, 'update').mockResolvedValue(updatedSettings);
      jest.spyOn(auditService, 'record').mockResolvedValue(undefined);

      await service.update(actorId, actorRole, updateDto);

      expect(auditService.record).toHaveBeenCalledWith({
        entityType: 'Settings',
        entityId: mockSettings.id,
        action: 'UPDATE',
        actorId,
        actorType: 'Account',
        previousValue: expect.objectContaining({
          timezone: 'America/Bogota',
          model_identifier: null,
        }),
        newValue: expect.objectContaining({
          timezone: 'America/Lima',
          model_identifier: 'claude-3',
        }),
      });
    });

    it('should not expose provider catalog or model keys in response', async () => {
      jest.spyOn(prisma.settings, 'findFirst').mockResolvedValue(mockSettings);

      const result = await service.get();

      expect(result).not.toHaveProperty('provider_key');
      expect(result).not.toHaveProperty('api_key');
      expect(result).not.toHaveProperty('provider_catalog');
      expect(result).toHaveProperty('model_identifier');
    });
  });

  describe('US-07 Escenario: Staff intenta configurar', () => {
    it('should reject Staff user when attempting to update settings', async () => {
      const staffId = 'staff-456';
      const staffRole = 'STAFF';
      const updateDto = {
        timezone: 'America/Lima',
      };

      jest.spyOn(prisma.settings, 'findFirst').mockResolvedValue(mockSettings);

      await expect(
        service.update(staffId, staffRole, updateDto),
      ).rejects.toThrow('Only administrators can update settings');

      expect(prisma.settings.update).not.toHaveBeenCalled();
    });
  });
});
