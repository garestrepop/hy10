import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';

describe('US-08 Mantener los servicios', () => {
  let service: ServicesService;
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: 'service-1',
      created_at: new Date('2026-09-26T00:00:00Z'),
      updated_at: new Date('2026-09-26T00:00:00Z'),
      deleted_at: null,
      ...value,
    })),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const auditService = { record: jest.fn().mockResolvedValue(undefined) };
  const settingsService = {
    get: jest.fn().mockResolvedValue({
      allow_cancel: false,
      allow_reschedule: false,
      cancel_min_hours: null,
      reschedule_min_hours: null,
      max_reschedules: null,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getRepositoryToken(Service), useValue: repository },
        { provide: AuditService, useValue: auditService },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = moduleRef.get(ServicesService);
  });

  describe('Alta de servicio', () => {
    it('crea un servicio con nombre, descripción, duración y precio >= 0', async () => {
      const admin = principal('admin');
      const dto = {
        name: 'Corte de cabello',
        description: 'Corte y peinado',
        duration_minutes: 30,
        price_cents: 50000,
      };

      const result = await service.create(admin, dto);

      expect(result).toMatchObject({
        name: 'Corte de cabello',
        description: 'Corte y peinado',
        duration_minutes: 30,
        price_cents: 50000,
        is_active: true,
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Corte de cabello',
          is_active: true,
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'service_created',
          actor_id: 'admin-1',
          entity_type: 'service',
        }),
      );
    });

    it('acepta precio cero', async () => {
      const admin = principal('admin');
      const dto = {
        name: 'Consulta',
        description: 'Consulta gratuita',
        duration_minutes: 15,
        price_cents: 0,
      };

      const result = await service.create(admin, dto);

      expect(result.price_cents).toBe(0);
    });

    it('queda disponible para asociar staff (is_active = true)', async () => {
      const admin = principal('admin');
      const dto = {
        name: 'Servicio',
        description: 'Descripción',
        duration_minutes: 30,
        price_cents: 10000,
      };

      const result = await service.create(admin, dto);

      expect(result.is_active).toBe(true);
    });
  });

  describe('Override de política', () => {
    it('el parámetro definido gana al global', async () => {
      repository.findOne.mockResolvedValue({
        id: 'service-1',
        name: 'Servicio con política',
        allow_cancel: true,
        allow_reschedule: null,
        cancel_min_hours: 48,
        reschedule_min_hours: null,
        max_reschedules: 2,
      });

      settingsService.get.mockResolvedValue({
        allow_cancel: false,
        allow_reschedule: false,
        cancel_min_hours: 24,
        reschedule_min_hours: 12,
        max_reschedules: 1,
      });

      const resolved = await service.resolvePolicy('service-1');

      expect(resolved.allow_cancel).toBe(true);
      expect(resolved.cancel_min_hours).toBe(48);
      expect(resolved.max_reschedules).toBe(2);
    });

    it('cada nulo usa el valor global', async () => {
      repository.findOne.mockResolvedValue({
        id: 'service-1',
        name: 'Servicio con política',
        allow_cancel: null,
        allow_reschedule: null,
        cancel_min_hours: null,
        reschedule_min_hours: null,
        max_reschedules: null,
      });

      settingsService.get.mockResolvedValue({
        allow_cancel: true,
        allow_reschedule: true,
        cancel_min_hours: 24,
        reschedule_min_hours: 12,
        max_reschedules: 3,
      });

      const resolved = await service.resolvePolicy('service-1');

      expect(resolved.allow_cancel).toBe(true);
      expect(resolved.allow_reschedule).toBe(true);
      expect(resolved.cancel_min_hours).toBe(24);
      expect(resolved.reschedule_min_hours).toBe(12);
      expect(resolved.max_reschedules).toBe(3);
    });

    it('mezcla definidos y nulos correctamente', async () => {
      repository.findOne.mockResolvedValue({
        id: 'service-1',
        name: 'Servicio mixto',
        allow_cancel: true,
        allow_reschedule: null,
        cancel_min_hours: 36,
        reschedule_min_hours: null,
        max_reschedules: null,
      });

      settingsService.get.mockResolvedValue({
        allow_cancel: false,
        allow_reschedule: false,
        cancel_min_hours: 12,
        reschedule_min_hours: 6,
        max_reschedules: 1,
      });

      const resolved = await service.resolvePolicy('service-1');

      expect(resolved.allow_cancel).toBe(true);
      expect(resolved.allow_reschedule).toBe(false);
      expect(resolved.cancel_min_hours).toBe(36);
      expect(resolved.reschedule_min_hours).toBe(6);
      expect(resolved.max_reschedules).toBe(1);
    });
  });

  describe('Servicio inactivo', () => {
    it('no se ofrece cuando está desactivado', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'service-1',
            name: 'Servicio activo',
            is_active: true,
            deleted_at: null,
          },
        ]),
      };
      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      const services = await service.findAll(false);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'service.is_active = :isActive',
        { isActive: true },
      );
      expect(services.length).toBe(1);
      expect(services[0].name).toBe('Servicio activo');
    });

    it('conserva el historial al desactivar', async () => {
      repository.findOne.mockResolvedValue({
        id: 'service-1',
        name: 'Servicio',
        description: 'Descripción',
        duration_minutes: 30,
        price_cents: 10000,
        is_active: true,
        created_at: new Date('2026-09-26T00:00:00Z'),
        updated_at: new Date('2026-09-26T00:00:00Z'),
      });

      repository.save.mockResolvedValue({
        id: 'service-1',
        name: 'Servicio',
        description: 'Descripción',
        duration_minutes: 30,
        price_cents: 10000,
        is_active: false,
        created_at: new Date('2026-09-26T00:00:00Z'),
        updated_at: new Date('2026-09-26T00:00:01Z'),
      });

      const admin = principal('admin');
      const result = await service.deactivate('service-1', admin);

      expect(result.is_active).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'service_updated',
          previous_value: expect.objectContaining({ is_active: true }),
          new_value: expect.objectContaining({ is_active: false }),
        }),
      );
    });

    it('puede incluir inactivos con query param', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'service-1', name: 'Activo', is_active: true },
          { id: 'service-2', name: 'Inactivo', is_active: false },
        ]),
      };
      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      const services = await service.findAll(true);

      expect(queryBuilder.where).not.toHaveBeenCalled();
      expect(services.length).toBe(2);
    });
  });

  describe('Validaciones', () => {
    it('rechaza servicio inexistente al actualizar', async () => {
      repository.findOne.mockResolvedValue(null);
      const admin = principal('admin');

      await expect(
        service.update('nonexistent', admin, { name: 'Nuevo nombre' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza servicio inexistente al resolver política', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.resolvePolicy('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza servicio inexistente al consultar', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

function principal(role: 'admin' | 'staff') {
  return {
    id: role === 'admin' ? 'admin-1' : 'staff-1',
    role,
    email: `${role}@hy10.test`,
  };
}
