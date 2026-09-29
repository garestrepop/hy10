import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { BusinessHours } from './entities/business-hours.entity';
import { StaffScheduleBlock } from './entities/staff-schedule-block.entity';
import { StaffException, ExceptionType } from './entities/staff-exception.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { StaffService } from '../services/entities/staff-service.entity';

describe('AgendaService - US-27 Business Hours Validation', () => {
  let service: AgendaService;
  let businessHoursRepo: Repository<BusinessHours>;
  let scheduleBlockRepo: Repository<StaffScheduleBlock>;
  let exceptionRepo: Repository<StaffException>;
  let userRepo: Repository<User>;
  let serviceRepo: Repository<Service>;
  let staffServiceRepo: Repository<StaffService>;

  const mockAdmin: User = {
    id: 'admin-id',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    is_active: true,
    first_name: 'Admin',
    last_name: 'User',
  } as User;

  const mockStaff: User = {
    id: 'staff-id',
    email: 'staff@example.com',
    role: UserRole.STAFF,
    is_active: true,
    first_name: 'Staff',
    last_name: 'Member',
  } as User;

  const mockBusinessHours: BusinessHours[] = [
    {
      id: 'bh-1',
      day_of_week: 1, // Monday
      start_time: '09:00',
      end_time: '18:00',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
    {
      id: 'bh-2',
      day_of_week: 2, // Tuesday
      start_time: '09:00',
      end_time: '18:00',
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: getRepositoryToken(BusinessHours),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StaffScheduleBlock),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StaffException),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
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
          provide: getRepositoryToken(Service),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StaffService),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
    businessHoursRepo = module.get(getRepositoryToken(BusinessHours));
    scheduleBlockRepo = module.get(getRepositoryToken(StaffScheduleBlock));
    exceptionRepo = module.get(getRepositoryToken(StaffException));
    userRepo = module.get(getRepositoryToken(User));
    serviceRepo = module.get(getRepositoryToken(Service));
    staffServiceRepo = module.get(getRepositoryToken(StaffService));
  });

  describe('Scenario: Block outside business hours', () => {
    it('should reject a staff schedule block that falls outside business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);

      const dto = {
        staff_id: 'staff-id',
        blocks: [
          {
            day_of_week: 1, // Monday
            start_time: '08:00', // Before business hours (09:00)
            end_time: '12:00',
          },
        ],
      };

      await expect(
        service.replaceStaffSchedule(mockStaff, dto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.replaceStaffSchedule(mockStaff, dto),
      ).rejects.toThrow('outside business hours');
    });

    it('should reject a staff schedule block that ends after business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);

      const dto = {
        staff_id: 'staff-id',
        blocks: [
          {
            day_of_week: 1, // Monday
            start_time: '16:00',
            end_time: '19:00', // After business hours (18:00)
          },
        ],
      };

      await expect(
        service.replaceStaffSchedule(mockStaff, dto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.replaceStaffSchedule(mockStaff, dto),
      ).rejects.toThrow('outside business hours');
    });

    it('should accept a staff schedule block within business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);
      jest.spyOn(scheduleBlockRepo, 'delete').mockResolvedValue(undefined);
      jest.spyOn(scheduleBlockRepo, 'create').mockImplementation((block) => block as any);
      jest.spyOn(scheduleBlockRepo, 'save').mockImplementation((blocks) => Promise.resolve(blocks as any));

      const dto = {
        staff_id: 'staff-id',
        blocks: [
          {
            day_of_week: 1, // Monday
            start_time: '10:00', // Within business hours (09:00-18:00)
            end_time: '17:00',
          },
        ],
      };

      const result = await service.replaceStaffSchedule(mockStaff, dto);
      expect(result).toBeDefined();
      expect(scheduleBlockRepo.save).toHaveBeenCalled();
    });

    it('should reject a block on a day with no business hours defined', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);

      const dto = {
        staff_id: 'staff-id',
        blocks: [
          {
            day_of_week: 0, // Sunday - no business hours defined
            start_time: '10:00',
            end_time: '17:00',
          },
        ],
      };

      await expect(
        service.replaceStaffSchedule(mockStaff, dto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.replaceStaffSchedule(mockStaff, dto),
      ).rejects.toThrow('No business hours defined for day');
    });

    it('should allow admin to edit any staff schedule', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);
      jest.spyOn(scheduleBlockRepo, 'delete').mockResolvedValue(undefined);
      jest.spyOn(scheduleBlockRepo, 'create').mockImplementation((block) => block as any);
      jest.spyOn(scheduleBlockRepo, 'save').mockImplementation((blocks) => Promise.resolve(blocks as any));

      const dto = {
        staff_id: 'staff-id',
        blocks: [
          {
            day_of_week: 1,
            start_time: '10:00',
            end_time: '17:00',
          },
        ],
      };

      const result = await service.replaceStaffSchedule(mockAdmin, dto);
      expect(result).toBeDefined();
    });
  });

  describe('Scenario: Opening exception outside business hours', () => {
    it('should reject an opening exception that falls outside business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);

      const dto = {
        staff_id: 'staff-id',
        date: '2026-09-29', // Monday (day_of_week = 1)
        start_time: '08:00', // Before business hours (09:00)
        end_time: '10:00',
        type: ExceptionType.OPENING,
      };

      await expect(service.addException(mockStaff, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addException(mockStaff, dto)).rejects.toThrow(
        'outside business hours',
      );
    });

    it('should reject an opening exception that ends after business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);

      const dto = {
        staff_id: 'staff-id',
        date: '2026-09-29', // Monday
        start_time: '17:00',
        end_time: '19:00', // After business hours (18:00)
        type: ExceptionType.OPENING,
      };

      await expect(service.addException(mockStaff, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addException(mockStaff, dto)).rejects.toThrow(
        'outside business hours',
      );
    });

    it('should accept an opening exception within business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);
      jest.spyOn(exceptionRepo, 'create').mockImplementation((ex) => ex as any);
      jest.spyOn(exceptionRepo, 'save').mockImplementation((ex) => Promise.resolve(ex as any));

      const dto = {
        staff_id: 'staff-id',
        date: '2026-09-29', // Monday
        start_time: '10:00', // Within business hours
        end_time: '12:00',
        type: ExceptionType.OPENING,
      };

      const result = await service.addException(mockStaff, dto);
      expect(result).toBeDefined();
      expect(exceptionRepo.save).toHaveBeenCalled();
    });

    it('should allow blocking exceptions regardless of business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);
      jest.spyOn(exceptionRepo, 'create').mockImplementation((ex) => ex as any);
      jest.spyOn(exceptionRepo, 'save').mockImplementation((ex) => Promise.resolve(ex as any));

      const dto = {
        staff_id: 'staff-id',
        date: '2026-09-29',
        start_time: '08:00', // Outside business hours, but it's a BLOCK
        end_time: '10:00',
        type: ExceptionType.BLOCK,
      };

      const result = await service.addException(mockStaff, dto);
      expect(result).toBeDefined();
      expect(exceptionRepo.save).toHaveBeenCalled();
    });

    it('should reject opening exception on a day with no business hours', async () => {
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);

      const dto = {
        staff_id: 'staff-id',
        date: '2026-09-28', // Sunday (day_of_week = 0) - no business hours
        start_time: '10:00',
        end_time: '12:00',
        type: ExceptionType.OPENING,
      };

      await expect(service.addException(mockStaff, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addException(mockStaff, dto)).rejects.toThrow(
        'No business hours defined for day',
      );
    });
  });

  describe('Scenario: Slots must be within business hours', () => {
    it('should only return slots that fall within business hours', async () => {
      const mockService: Service = {
        id: 'service-id',
        name: 'Test Service',
        duration_minutes: 60,
        is_active: true,
      } as Service;

      const mockStaffScheduleBlocks: StaffScheduleBlock[] = [
        {
          id: 'block-1',
          staff_id: 'staff-id',
          day_of_week: 1, // Monday
          start_time: '08:00', // Starts before business hours
          end_time: '19:00', // Ends after business hours
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        } as StaffScheduleBlock,
      ];

      jest.spyOn(serviceRepo, 'findOne').mockResolvedValue(mockService);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);
      jest.spyOn(staffServiceRepo, 'findOne').mockResolvedValue({
        staff_id: 'staff-id',
        service_id: 'service-id',
      } as any);
      jest.spyOn(scheduleBlockRepo, 'find').mockResolvedValue(mockStaffScheduleBlocks);
      jest.spyOn(exceptionRepo, 'find').mockResolvedValue([]);
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);

      const slots = await service.getAvailability('service-id', '2026-09-29', 'staff-id');

      expect(slots.length).toBeGreaterThan(0);
      
      // All slots should be within business hours (09:00-18:00)
      slots.forEach((slot) => {
        const startTime = slot.start.split('T')[1].substring(0, 5);
        const endTime = slot.end.split('T')[1].substring(0, 5);
        
        expect(startTime >= '09:00').toBe(true);
        expect(endTime <= '18:00').toBe(true);
      });
    });

    it('should return empty array when no business hours are defined for the day', async () => {
      const mockService: Service = {
        id: 'service-id',
        name: 'Test Service',
        duration_minutes: 60,
        is_active: true,
      } as Service;

      const mockStaffScheduleBlocks: StaffScheduleBlock[] = [
        {
          id: 'block-1',
          staff_id: 'staff-id',
          day_of_week: 0, // Sunday - no business hours
          start_time: '09:00',
          end_time: '17:00',
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        } as StaffScheduleBlock,
      ];

      jest.spyOn(serviceRepo, 'findOne').mockResolvedValue(mockService);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockStaff);
      jest.spyOn(staffServiceRepo, 'findOne').mockResolvedValue({
        staff_id: 'staff-id',
        service_id: 'service-id',
      } as any);
      jest.spyOn(scheduleBlockRepo, 'find').mockResolvedValue(mockStaffScheduleBlocks);
      jest.spyOn(exceptionRepo, 'find').mockResolvedValue([]);
      jest.spyOn(businessHoursRepo, 'find').mockResolvedValue(mockBusinessHours);

      const slots = await service.getAvailability('service-id', '2026-09-28', 'staff-id');

      // Should be empty because Sunday has no business hours defined
      expect(slots).toEqual([]);
    });
  });

  describe('Admin-only business hours management', () => {
    it('should allow admin to set business hours', async () => {
      jest.spyOn(businessHoursRepo, 'delete').mockResolvedValue(undefined);
      jest.spyOn(businessHoursRepo, 'create').mockImplementation((bh) => bh as any);
      jest.spyOn(businessHoursRepo, 'save').mockImplementation((hours) => Promise.resolve(hours as any));

      const dto = {
        hours: [
          { day_of_week: 1, start_time: '09:00', end_time: '18:00' },
          { day_of_week: 2, start_time: '09:00', end_time: '18:00' },
        ],
      };

      const result = await service.setBusinessHours(mockAdmin, dto);
      expect(result).toBeDefined();
      expect(businessHoursRepo.save).toHaveBeenCalled();
    });

    it('should reject non-admin from setting business hours', async () => {
      const dto = {
        hours: [
          { day_of_week: 1, start_time: '09:00', end_time: '18:00' },
        ],
      };

      await expect(service.setBusinessHours(mockStaff, dto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.setBusinessHours(mockStaff, dto)).rejects.toThrow(
        'Only admins can set business hours',
      );
    });
  });
});
