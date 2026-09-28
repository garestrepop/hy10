import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { ScheduleBlock, DayOfWeek } from './entities/schedule-block.entity';
import {
  ScheduleException,
  ExceptionType,
} from './entities/schedule-exception.entity';
import { Account, AccountRole } from '../access/entities/account.entity';

describe('AgendaService', () => {
  let service: AgendaService;
  let scheduleBlockRepository: Repository<ScheduleBlock>;
  let scheduleExceptionRepository: Repository<ScheduleException>;
  let accountRepository: Repository<Account>;

  const mockStaffAccount: Account = {
    id: 'staff-id-1',
    email: 'staff@example.com',
    role: AccountRole.STAFF,
    is_active: true,
  } as Account;

  const mockAdminAccount: Account = {
    id: 'admin-id-1',
    email: 'admin@example.com',
    role: AccountRole.ADMIN,
    is_active: true,
  } as Account;

  const mockScheduleBlock: ScheduleBlock = {
    id: 'block-id-1',
    staff_id: 'staff-id-1',
    day_of_week: DayOfWeek.MONDAY,
    start_time: '09:00:00',
    end_time: '17:00:00',
    created_at: new Date(),
    updated_at: new Date(),
  } as ScheduleBlock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: getRepositoryToken(ScheduleBlock),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ScheduleException),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
    scheduleBlockRepository = module.get<Repository<ScheduleBlock>>(
      getRepositoryToken(ScheduleBlock),
    );
    scheduleExceptionRepository = module.get<Repository<ScheduleException>>(
      getRepositoryToken(ScheduleException),
    );
    accountRepository = module.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('replaceStaffSchedule', () => {
    it('should allow staff to replace their own schedule', async () => {
      const replaceDto = {
        blocks: [
          {
            day_of_week: DayOfWeek.MONDAY,
            start_time: '09:00',
            end_time: '17:00',
          },
        ],
      };

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValueOnce(mockStaffAccount)
        .mockResolvedValueOnce(mockStaffAccount);
      jest.spyOn(scheduleBlockRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] } as any);
      jest
        .spyOn(scheduleBlockRepository, 'save')
        .mockResolvedValue([mockScheduleBlock] as any);

      const result = await service.replaceStaffSchedule(
        'staff-id-1',
        'staff-id-1',
        replaceDto,
      );

      expect(result).toHaveLength(1);
      expect(result[0].staff_id).toBe('staff-id-1');
      expect(scheduleBlockRepository.delete).toHaveBeenCalledWith({
        staff_id: 'staff-id-1',
      });
    });

    it('should allow admin to replace any staff schedule', async () => {
      const replaceDto = {
        blocks: [
          {
            day_of_week: DayOfWeek.MONDAY,
            start_time: '09:00',
            end_time: '17:00',
          },
        ],
      };

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValueOnce(mockAdminAccount)
        .mockResolvedValueOnce(mockStaffAccount);
      jest.spyOn(scheduleBlockRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] } as any);
      jest
        .spyOn(scheduleBlockRepository, 'save')
        .mockResolvedValue([mockScheduleBlock] as any);

      const result = await service.replaceStaffSchedule(
        'admin-id-1',
        'staff-id-1',
        replaceDto,
      );

      expect(result).toHaveLength(1);
    });

    it('should reject staff editing another staff schedule', async () => {
      const replaceDto = {
        blocks: [
          {
            day_of_week: DayOfWeek.MONDAY,
            start_time: '09:00',
            end_time: '17:00',
          },
        ],
      };

      const otherStaff: Account = {
        ...mockStaffAccount,
        id: 'staff-id-2',
      };

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValueOnce(mockStaffAccount)
        .mockResolvedValueOnce(otherStaff);

      await expect(
        service.replaceStaffSchedule('staff-id-1', 'staff-id-2', replaceDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate time ranges', async () => {
      const replaceDto = {
        blocks: [
          {
            day_of_week: DayOfWeek.MONDAY,
            start_time: '17:00',
            end_time: '09:00',
          },
        ],
      };

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValueOnce(mockStaffAccount)
        .mockResolvedValueOnce(mockStaffAccount);

      await expect(
        service.replaceStaffSchedule('staff-id-1', 'staff-id-1', replaceDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addException', () => {
    it('should allow staff to add their own exception', async () => {
      const exceptionDto = {
        exception_type: ExceptionType.BLOCK,
        exception_date: '2026-10-01',
        start_time: '09:00',
        end_time: '17:00',
      };

      const mockException: ScheduleException = {
        id: 'exception-id-1',
        staff_id: 'staff-id-1',
        exception_type: ExceptionType.BLOCK,
        exception_date: '2026-10-01',
        start_time: '09:00:00',
        end_time: '17:00:00',
        created_at: new Date(),
        updated_at: new Date(),
      } as ScheduleException;

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValueOnce(mockStaffAccount)
        .mockResolvedValueOnce(mockStaffAccount);
      jest
        .spyOn(scheduleExceptionRepository, 'save')
        .mockResolvedValue(mockException);

      const result = await service.addException(
        'staff-id-1',
        'staff-id-1',
        exceptionDto,
      );

      expect(result.exception_type).toBe(ExceptionType.BLOCK);
      expect(result.staff_id).toBe('staff-id-1');
    });

    it('should reject staff adding exception for another staff', async () => {
      const exceptionDto = {
        exception_type: ExceptionType.BLOCK,
        exception_date: '2026-10-01',
        start_time: '09:00',
        end_time: '17:00',
      };

      const otherStaff: Account = {
        ...mockStaffAccount,
        id: 'staff-id-2',
      };

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValueOnce(mockStaffAccount)
        .mockResolvedValueOnce(otherStaff);

      await expect(
        service.addException('staff-id-1', 'staff-id-2', exceptionDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate exception times', async () => {
      const exceptionDto = {
        exception_type: ExceptionType.BLOCK,
        exception_date: '2026-10-01',
        start_time: '17:00',
        end_time: '09:00',
      };

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValueOnce(mockStaffAccount)
        .mockResolvedValueOnce(mockStaffAccount);

      await expect(
        service.addException('staff-id-1', 'staff-id-1', exceptionDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStaffSchedule', () => {
    it('should allow staff to view their own schedule', async () => {
      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValue(mockStaffAccount);
      jest
        .spyOn(scheduleBlockRepository, 'find')
        .mockResolvedValue([mockScheduleBlock]);

      const result = await service.getStaffSchedule('staff-id-1', 'staff-id-1');

      expect(result).toHaveLength(1);
      expect(result[0].staff_id).toBe('staff-id-1');
    });

    it('should reject staff viewing another staff schedule', async () => {
      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValue(mockStaffAccount);

      await expect(
        service.getStaffSchedule('staff-id-1', 'staff-id-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any staff schedule', async () => {
      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValue(mockAdminAccount);
      jest
        .spyOn(scheduleBlockRepository, 'find')
        .mockResolvedValue([mockScheduleBlock]);

      const result = await service.getStaffSchedule('admin-id-1', 'staff-id-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('deleteException', () => {
    it('should allow staff to delete their own exception', async () => {
      const mockException: ScheduleException = {
        id: 'exception-id-1',
        staff_id: 'staff-id-1',
        exception_type: ExceptionType.BLOCK,
        exception_date: '2026-10-01',
        start_time: '09:00:00',
        end_time: '17:00:00',
        created_at: new Date(),
        updated_at: new Date(),
      } as ScheduleException;

      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValue(mockStaffAccount);
      jest
        .spyOn(scheduleExceptionRepository, 'findOne')
        .mockResolvedValue(mockException);
      jest
        .spyOn(scheduleExceptionRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: [] } as any);

      await service.deleteException(
        'staff-id-1',
        'staff-id-1',
        'exception-id-1',
      );

      expect(scheduleExceptionRepository.delete).toHaveBeenCalledWith(
        'exception-id-1',
      );
    });

    it('should reject staff deleting another staff exception', async () => {
      jest
        .spyOn(accountRepository, 'findOne')
        .mockResolvedValue(mockStaffAccount);

      await expect(
        service.deleteException('staff-id-1', 'staff-id-2', 'exception-id-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
