import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Service } from './entities/service.entity';
import { StaffService } from './entities/staff-service.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { Repository } from 'typeorm';

describe('US-09 Mantener el staff y sus servicios', () => {
  let service: CatalogService;
  let serviceRepository: jest.Mocked<Repository<Service>>;
  let staffServiceRepository: jest.Mocked<Repository<StaffService>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let auditService: jest.Mocked<AuditService>;

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@hy10.test',
    role: UserRole.ADMIN,
    is_active: true,
  } as User;

  const mockStaff: User = {
    id: 'staff-1',
    email: 'staff@hy10.test',
    role: UserRole.STAFF,
    is_active: true,
  } as User;

  const mockService: Service = {
    id: 'service-1',
    name: 'Corte de cabello',
    description: 'Corte básico',
    duration_minutes: 30,
    price_cents: 20000,
    is_active: true,
    cancel_window_hours: null,
    reschedule_window_hours: null,
    max_reschedules: null,
    staff_services: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StaffService),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
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

    service = module.get<CatalogService>(CatalogService);
    serviceRepository = module.get(getRepositoryToken(Service));
    staffServiceRepository = module.get(getRepositoryToken(StaffService));
    userRepository = module.get(getRepositoryToken(User));
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Escenario: Alta de servicio', () => {
    it('crea un servicio con nombre, descripción, duración y precio', async () => {
      const createDto = {
        name: 'Corte de cabello',
        description: 'Corte básico',
        duration_minutes: 30,
        price_cents: 20000,
      };

      serviceRepository.create.mockReturnValue(mockService);
      serviceRepository.save.mockResolvedValue(mockService);

      const result = await service.createService(createDto, mockAdmin);

      expect(result).toEqual(mockService);
      expect(serviceRepository.create).toHaveBeenCalledWith(createDto);
      expect(serviceRepository.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'service_created',
          actor_id: mockAdmin.id,
          entity_type: 'service',
          entity_id: mockService.id,
        }),
      );
    });

    it('rechaza cuando un Staff intenta crear un servicio', async () => {
      const createDto = {
        name: 'Corte de cabello',
        description: 'Corte básico',
        duration_minutes: 30,
        price_cents: 20000,
      };

      await expect(service.createService(createDto, mockStaff)).rejects.toThrow(
        ForbiddenException,
      );
      expect(serviceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Escenario: Asociar servicios', () => {
    it('asocia uno o más staff a un servicio activo', async () => {
      const staffIds = ['staff-1', 'staff-2'];
      const mockStaffUsers = [
        { id: 'staff-1', role: UserRole.STAFF, is_active: true } as User,
        { id: 'staff-2', role: UserRole.STAFF, is_active: true } as User,
      ];

      serviceRepository.findOne.mockResolvedValue(mockService);
      userRepository.find.mockResolvedValue(mockStaffUsers);
      staffServiceRepository.delete.mockResolvedValue(undefined as any);
      staffServiceRepository.create.mockImplementation((data: any) => data as StaffService);
      staffServiceRepository.save.mockResolvedValue([] as any);

      await service.associateStaff('service-1', { staff_ids: staffIds }, mockAdmin);

      expect(userRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.anything(),
          role: UserRole.STAFF,
          is_active: true,
        },
      });
      expect(staffServiceRepository.delete).toHaveBeenCalledWith({
        service_id: 'service-1',
      });
      expect(staffServiceRepository.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });

    it('rechaza si un Staff intenta asociar servicios', async () => {
      await expect(
        service.associateStaff('service-1', { staff_ids: ['staff-1'] }, mockStaff),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si algún staff_id no existe o no está activo', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      userRepository.find.mockResolvedValue([mockStaff]);

      await expect(
        service.associateStaff('service-1', { staff_ids: ['staff-1', 'staff-2'] }, mockAdmin),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Escenario: Staff inactivo', () => {
    it('no devuelve staff inactivo al buscar staff para un servicio', async () => {
      const inactiveStaff = { ...mockStaff, is_active: false };
      const staffServices = [
        {
          id: 'ss-1',
          staff_id: 'staff-1',
          service_id: 'service-1',
          staff: inactiveStaff,
          service: mockService,
          created_at: new Date(),
        } as StaffService,
      ];

      serviceRepository.findOne.mockResolvedValue(mockService);
      staffServiceRepository.find.mockResolvedValue(staffServices);

      const result = await service.getStaffForService('service-1');

      expect(result).toEqual([]);
    });

    it('devuelve false cuando verifica si un staff inactivo puede prestar un servicio', async () => {
      const inactiveStaff = { ...mockStaff, is_active: false };
      const staffServiceData = {
        id: 'ss-1',
        staff_id: 'staff-1',
        service_id: 'service-1',
        staff: inactiveStaff,
        service: mockService,
        created_at: new Date(),
      } as StaffService;

      staffServiceRepository.findOne.mockResolvedValue(staffServiceData);

      const result = await service.canStaffProvideService('staff-1', 'service-1');

      expect(result).toBe(false);
    });
  });

  describe('Escenario: Servicio inactivo', () => {
    it('devuelve solo servicios activos con findActive', async () => {
      const activeService = { ...mockService, is_active: true };
      const inactiveService = { ...mockService, id: 'service-2', is_active: false };

      serviceRepository.find.mockResolvedValue([activeService]);

      const result = await service.findActive();

      expect(serviceRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        relations: ['staff_services', 'staff_services.staff'],
        order: { name: 'ASC' },
      });
      expect(result).toEqual([activeService]);
    });

    it('devuelve false cuando verifica si un staff puede prestar un servicio inactivo', async () => {
      const inactiveService = { ...mockService, is_active: false };
      const staffServiceData = {
        id: 'ss-1',
        staff_id: 'staff-1',
        service_id: 'service-1',
        staff: mockStaff,
        service: inactiveService,
        created_at: new Date(),
      } as StaffService;

      staffServiceRepository.findOne.mockResolvedValue(staffServiceData);

      const result = await service.canStaffProvideService('staff-1', 'service-1');

      expect(result).toBe(false);
    });
  });

  describe('Override de política', () => {
    it('permite guardar políticas específicas del servicio', async () => {
      const createDto = {
        name: 'Masaje terapéutico',
        description: 'Masaje de 60 minutos',
        duration_minutes: 60,
        price_cents: 80000,
        cancel_window_hours: 48,
        reschedule_window_hours: 24,
        max_reschedules: 1,
      };

      const savedService = {
        ...mockService,
        ...createDto,
        id: 'service-2',
      };

      serviceRepository.create.mockReturnValue(savedService);
      serviceRepository.save.mockResolvedValue(savedService);

      const result = await service.createService(createDto, mockAdmin);

      expect(result.cancel_window_hours).toBe(48);
      expect(result.reschedule_window_hours).toBe(24);
      expect(result.max_reschedules).toBe(1);
    });
  });
});
