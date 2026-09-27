import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccessTokenGuard } from '../access/access-token.guard';
import { signAccessToken } from '../access/access-token';
import { AuditService } from '../audit/audit.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { BusinessSettings } from './entities/business-settings.entity';

const SECRET = 'test-access-secret';

describe('US-07 Configurar el negocio', () => {
  let controller: SettingsController;
  let guard: AccessTokenGuard;
  const repository = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: 'settings-1',
      created_at: new Date('2026-09-26T00:00:00Z'),
      updated_at: new Date('2026-09-26T00:00:00Z'),
      ...value,
    })),
  };
  const auditService = { record: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = SECRET;
    repository.findOne.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        SettingsService,
        AccessTokenGuard,
        { provide: getRepositoryToken(BusinessSettings), useValue: repository },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    controller = moduleRef.get(SettingsController);
    guard = moduleRef.get(AccessTokenGuard);
  });

  it('devuelve los valores iniciales de un negocio nuevo', async () => {
    const admin = principal('admin');

    const result = await controller.get(admin);

    expect(result).toEqual({
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
    });
    expect(result).not.toHaveProperty('api_key');
    expect(result).not.toHaveProperty('provider');
    expect(result).not.toHaveProperty('provider_catalog');
  });

  it('audita el cambio con actor y valor anterior, sin clave ni catálogo', async () => {
    repository.findOne.mockResolvedValue({
      id: 'settings-1',
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
    });
    const admin = principal('admin');

    const result = await controller.update(admin, {
      timezone: 'America/Lima',
      model_identifier: 'gpt-4.1',
      allow_cancel: true,
      cancel_min_hours: 24,
    });

    expect(result.timezone).toBe('America/Lima');
    expect(result.model_identifier).toBe('gpt-4.1');
    expect(result).not.toHaveProperty('api_key');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'admin-1',
        actor_role: 'admin',
        entity_type: 'business_settings',
        previous_value: expect.objectContaining({ timezone: 'America/Bogota' }),
        new_value: expect.objectContaining({
          timezone: 'America/Lima',
          model_identifier: 'gpt-4.1',
        }),
      }),
    );
  });

  it('rechaza a Staff cuando abre la configuración', () => {
    expect(() => controller.get(principal('staff'))).toThrow(ForbiddenException);
    expect(() =>
      controller.update(principal('staff'), { timezone: 'America/Lima' }),
    ).toThrow(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rechaza una petición sin token', () => {
    const context = httpContext({ headers: {} });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('acepta el token de un Administrador', () => {
    const token = signAccessToken(principal('admin'), SECRET);
    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };

    expect(guard.canActivate(httpContext(request))).toBe(true);
    expect(request.user).toEqual(
      expect.objectContaining({ id: 'admin-1', role: 'admin' }),
    );
  });
});

function principal(role: 'admin' | 'staff') {
  return {
    id: role === 'admin' ? 'admin-1' : 'staff-1',
    role,
    email: `${role}@hy10.test`,
  };
}

function httpContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
