import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationsService } from './operations.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { StaffService as StaffServiceEntity } from '../services/entities/staff-service.entity';

describe('OperationsService', () => {
  let service: OperationsService;
  let userRepository: Repository<User>;
  let serviceRepository: Repository<Service>;
  let staffServiceRepository: Repository<StaffServiceEntity>;

  const mockUserRepository = {
    find: jest.fn(),
  };

  const mockServiceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockStaffServiceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
        {
          provide: getRepositoryToken(StaffServiceEntity),
          useValue: mockStaffServiceRepository,
        },
      ],
    }).compile();

    service = module.get<OperationsService>(OperationsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    serviceRepository = module.get<Repository<Service>>(getRepositoryToken(Service));
    staffServiceRepository = module.get<Repository<StaffServiceEntity>>(
      getRepositoryToken(StaffServiceEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOccupation', () => {
    it('should return occupation data for all staff', async () => {
      const mockStaff = [
        { 
          id: 'staff-1', 
          first_name: 'John', 
          last_name: 'Doe', 
          email: 'john@example.com', 
          role: UserRole.STAFF, 
          is_active: true 
        },
        { 
          id: 'staff-2', 
          first_name: 'Jane', 
          last_name: 'Smith', 
          email: 'jane@example.com', 
          role: UserRole.STAFF, 
          is_active: true 
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockStaff);

      const result = await service.getOccupation();

      expect(result).toHaveProperty('timestamp');
      expect(result.total_staff).toBe(2);
      expect(result.total_active_reservations).toBe(0); // Placeholder until Reservations module exists
      expect(result.staff_occupation).toHaveLength(2);
      expect(result.staff_occupation[0]).toMatchObject({
        staff_id: 'staff-1',
        staff_name: 'John Doe',
        staff_email: 'john@example.com',
        active_reservations_count: 0,
        upcoming_reservations: [],
      });
    });

    it('should return empty occupation when no staff exists', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.getOccupation();

      expect(result.total_staff).toBe(0);
      expect(result.staff_occupation).toHaveLength(0);
    });
  });

  describe('getAvailability', () => {
    const serviceId = 'service-123';
    const date = '2026-09-30';

    it('should return availability for a valid service', async () => {
      const mockService = {
        id: serviceId,
        name: 'Haircut',
        is_active: true,
      };

      mockServiceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.getAvailability({
        service_id: serviceId,
        date,
      });

      expect(result.service_id).toBe(serviceId);
      expect(result.service_name).toBe('Haircut');
      expect(result.date).toBe(date);
      expect(result.slots).toEqual([]); // Placeholder until Agenda module exists
      expect(result.total_slots).toBe(0);
    });

    it('should throw NotFoundException for invalid service', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAvailability({ service_id: serviceId, date }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate staff_id when provided', async () => {
      const staffId = 'staff-123';
      const mockService = {
        id: serviceId,
        name: 'Haircut',
        is_active: true,
      };

      const mockStaffService = {
        service_id: serviceId,
        staff_id: staffId,
        staff: { is_active: true },
      };

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockStaffServiceRepository.findOne.mockResolvedValue(mockStaffService);

      const result = await service.getAvailability({
        service_id: serviceId,
        date,
        staff_id: staffId,
      });

      expect(result.staff_id).toBe(staffId);
    });

    it('should throw NotFoundException for invalid staff_id', async () => {
      const staffId = 'invalid-staff';
      const mockService = {
        id: serviceId,
        name: 'Haircut',
        is_active: true,
      };

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockStaffServiceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAvailability({
          service_id: serviceId,
          date,
          staff_id: staffId,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStaffPerService', () => {
    it('should return all services with their staff', async () => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'Haircut',
          description: 'Basic haircut',
          duration_minutes: 30,
          price_cents: 5000,
          is_active: true,
        },
        {
          id: 'service-2',
          name: 'Massage',
          description: 'Relaxing massage',
          duration_minutes: 60,
          price_cents: 15000,
          is_active: true,
        },
      ];

      const mockStaffServices = [
        {
          service_id: 'service-1',
          staff: {
            id: 'staff-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            is_active: true,
          },
        },
        {
          service_id: 'service-1',
          staff: {
            id: 'staff-2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            is_active: true,
          },
        },
      ];

      mockServiceRepository.find.mockResolvedValue(mockServices);
      mockStaffServiceRepository.find
        .mockResolvedValueOnce([mockStaffServices[0], mockStaffServices[1]])
        .mockResolvedValueOnce([]);

      const result = await service.getStaffPerService();

      expect(result).toHaveProperty('timestamp');
      expect(result.total_services).toBe(2);
      expect(result.services).toHaveLength(2);
      expect(result.services[0].service.name).toBe('Haircut');
      expect(result.services[0].staff).toHaveLength(2);
      expect(result.services[0].staff[0].name).toBe('John Doe');
      expect(result.services[1].service.name).toBe('Massage');
      expect(result.services[1].staff).toHaveLength(0);
    });

    it('should filter out inactive staff', async () => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'Haircut',
          description: 'Basic haircut',
          duration_minutes: 30,
          price_cents: 5000,
          is_active: true,
        },
      ];

      const mockStaffServices = [
        {
          service_id: 'service-1',
          staff: {
            id: 'staff-1',
            first_name: 'Active',
            last_name: 'Staff',
            email: 'active@example.com',
            is_active: true,
          },
        },
        {
          service_id: 'service-1',
          staff: {
            id: 'staff-2',
            first_name: 'Inactive',
            last_name: 'Staff',
            email: 'inactive@example.com',
            is_active: false,
          },
        },
      ];

      mockServiceRepository.find.mockResolvedValue(mockServices);
      mockStaffServiceRepository.find.mockResolvedValue(mockStaffServices);

      const result = await service.getStaffPerService();

      expect(result.services[0].staff).toHaveLength(1);
      expect(result.services[0].staff[0].name).toBe('Active Staff');
    });

    it('should return empty list when no services exist', async () => {
      mockServiceRepository.find.mockResolvedValue([]);

      const result = await service.getStaffPerService();

      expect(result.total_services).toBe(0);
      expect(result.services).toHaveLength(0);
    });
  });
});
