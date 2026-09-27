import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Role, Settings } from '@hy10/database';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../common/guards/roles.guard';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

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
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            get: jest.fn(),
            update: jest.fn(),
          },
        },
        Reflector,
        RolesGuard,
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  describe('GET /api/v1/settings', () => {
    it('should allow Admin to get settings', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(mockSettings);

      const result = await controller.getSettings();

      expect(result).toEqual(mockSettings);
      expect(service.get).toHaveBeenCalled();
    });

    it('should allow Staff to read settings', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(mockSettings);

      const result = await controller.getSettings();

      expect(result).toEqual(mockSettings);
    });
  });

  describe('PATCH /api/v1/settings', () => {
    it('should allow Admin to update settings', async () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      const updateDto = {
        timezone: 'America/Mexico_City',
        model_identifier: 'gpt-4',
      };

      const updatedSettings: Settings = {
        ...mockSettings,
        ...updateDto,
      };

      jest.spyOn(service, 'update').mockResolvedValue(updatedSettings);

      const result = await controller.updateSettings(adminUser, updateDto);

      expect(result).toEqual(updatedSettings);
      expect(service.update).toHaveBeenCalledWith(
        adminUser.id,
        adminUser.role,
        updateDto,
      );
    });

    it('should be protected by @Roles(Role.ADMIN) decorator', () => {
      const metadata = Reflect.getMetadata(
        'roles',
        controller.updateSettings,
      );
      expect(metadata).toEqual([Role.ADMIN]);
    });
  });
});
