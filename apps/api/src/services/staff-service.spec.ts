import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { StaffService } from './entities/staff-service.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { Repository } from 'typeorm';

describe('US-09 Mantener el staff y sus servicios', () => {
  let service: ServicesService;
  let serviceRepository: jest.Mocked<Repository<Service>>;
  let staffServiceRepository: jest.Mocked<Repository<StaffService>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockAdmin = {
    id: 'admin-1',
    email: 'admin@hy10.test',
    role: 'admin',
  };

  const mockService: Service = {
    id: 'service-1',
    name: 'Corte de cabello',
    description: 'Corte básico',
    duration_minutes: 30,
    price_cents: 20000,
    is_active: true,
    allow_cancel: null,
    allow_reschedule: null,
    cancel_min_hours: null,
    reschedule_min_hours: null,
    max_reschedules: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockStaff: User = {
    id: 'staff-1',
    email: 'staff@hy10.test',
    role: UserRole.STAFF,
    is_active: true,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
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
        {
          provide: SettingsService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    serviceRepository = module.get(getRepositoryToken(Service));
    staffServiceRepository = module.get(getRepositoryToken(StaffService));
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      await service.associateStaff('service-1', { staff_ids: staffIds }, mockAdmin as any);

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
    });

    it('rechaza si algún staff_id no existe o no está activo', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      userRepository.find.mockResolvedValue([mockStaff]);

      await expect(
        service.associateStaff('service-1', { staff_ids: ['staff-1', 'staff-2'] }, mockAdmin as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el servicio no existe', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.associateStaff('service-1', { staff_ids: ['staff-1'] }, mockAdmin as any),
      ).rejects.toThrow(NotFoundException);
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

    it('devuelve solo staff activos para un servicio', async () => {
      const activeStaff = { ...mockStaff, is_active: true };
      const staffServices = [
        {
          id: 'ss-1',
          staff_id: 'staff-1',
          service_id: 'service-1',
          staff: activeStaff,
          service: mockService,
          created_at: new Date(),
        } as StaffService,
      ];

      serviceRepository.findOne.mockResolvedValue(mockService);
      staffServiceRepository.find.mockResolvedValue(staffServices);

      const result = await service.getStaffForService('service-1');

      expect(result).toHaveLength(1);
      expect(result[0].is_active).toBe(true);
    });
  });

  describe('Escenario: Servicio inactivo', () => {
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

    it('devuelve true solo si ambos (staff y servicio) están activos', async () => {
      const staffServiceData = {
        id: 'ss-1',
        staff_id: 'staff-1',
        service_id: 'service-1',
        staff: mockStaff,
        service: mockService,
        created_at: new Date(),
      } as StaffService;

      staffServiceRepository.findOne.mockResolvedValue(staffServiceData);

      const result = await service.canStaffProvideService('staff-1', 'service-1');

      expect(result).toBe(true);
    });
  });

  describe('getServicesForStaff', () => {
    it('devuelve los servicios asociados a un staff member', async () => {
      const staffServices = [
        {
          id: 'ss-1',
          staff_id: 'staff-1',
          service_id: 'service-1',
          staff: mockStaff,
          service: mockService,
          created_at: new Date(),
        } as StaffService,
      ];

      userRepository.findOne.mockResolvedValue(mockStaff);
      staffServiceRepository.find.mockResolvedValue(staffServices);

      const result = await service.getServicesForStaff('staff-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('service-1');
    });

    it('rechaza si el staff member no existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getServicesForStaff('staff-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
