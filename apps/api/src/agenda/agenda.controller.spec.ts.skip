import { Test, TestingModule } from '@nestjs/testing';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { DayOfWeek } from './entities/schedule-block.entity';
import { ExceptionType } from './entities/schedule-exception.entity';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('../access/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

describe('AgendaController', () => {
  let controller: AgendaController;
  let service: AgendaService;

  const mockAgendaService = {
    replaceStaffSchedule: jest.fn(),
    getStaffSchedule: jest.fn(),
    addException: jest.fn(),
    getStaffExceptions: jest.fn(),
    deleteException: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [
        {
          provide: AgendaService,
          useValue: mockAgendaService,
        },
      ],
    }).compile();

    controller = module.get<AgendaController>(AgendaController);
    service = module.get<AgendaService>(AgendaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('replaceSchedule', () => {
    it('should replace staff schedule', async () => {
      const actor = { id: 'staff-id-1', role: 'staff', email: 'staff@example.com' } as any;
      const staffId = 'staff-id-1';
      const replaceDto = {
        blocks: [
          {
            day_of_week: DayOfWeek.MONDAY,
            start_time: '09:00',
            end_time: '17:00',
          },
        ],
      };

      const expectedResult = [
        {
          id: 'block-id-1',
          staff_id: staffId,
          day_of_week: DayOfWeek.MONDAY,
          start_time: '09:00:00',
          end_time: '17:00:00',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAgendaService.replaceStaffSchedule.mockResolvedValue(expectedResult);

      const result = await controller.replaceSchedule(actor, staffId, replaceDto);

      expect(result).toEqual(expectedResult);
      expect(service.replaceStaffSchedule).toHaveBeenCalledWith(
        'staff-id-1',
        staffId,
        replaceDto,
      );
    });
  });

  describe('getSchedule', () => {
    it('should get staff schedule', async () => {
      const actor = { id: 'staff-id-1', role: 'staff', email: 'staff@example.com' } as any;
      const staffId = 'staff-id-1';

      const expectedResult = [
        {
          id: 'block-id-1',
          staff_id: staffId,
          day_of_week: DayOfWeek.MONDAY,
          start_time: '09:00:00',
          end_time: '17:00:00',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAgendaService.getStaffSchedule.mockResolvedValue(expectedResult);

      const result = await controller.getSchedule(actor, staffId);

      expect(result).toEqual(expectedResult);
      expect(service.getStaffSchedule).toHaveBeenCalledWith('staff-id-1', staffId);
    });

    it('should throw ForbiddenException when staff tries to view another schedule', async () => {
      const actor = { id: 'staff-id-1', role: 'staff', email: 'staff@example.com' } as any;
      const staffId = 'staff-id-2';

      mockAgendaService.getStaffSchedule.mockRejectedValue(
        new ForbiddenException('Staff can only view their own schedule'),
      );

      await expect(controller.getSchedule(actor, staffId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addException', () => {
    it('should add exception for staff', async () => {
      const actor = { id: 'staff-id-1', role: 'staff', email: 'staff@example.com' } as any;
      const staffId = 'staff-id-1';
      const exceptionDto = {
        exception_type: ExceptionType.BLOCK,
        exception_date: '2026-10-01',
        start_time: '09:00',
        end_time: '12:00',
      };

      const expectedResult = {
        id: 'exception-id-1',
        staff_id: staffId,
        exception_type: ExceptionType.BLOCK,
        exception_date: '2026-10-01',
        start_time: '09:00:00',
        end_time: '12:00:00',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAgendaService.addException.mockResolvedValue(expectedResult);

      const result = await controller.addException(actor, staffId, exceptionDto);

      expect(result).toEqual(expectedResult);
      expect(service.addException).toHaveBeenCalledWith(
        'staff-id-1',
        staffId,
        exceptionDto,
      );
    });
  });

  describe('getExceptions', () => {
    it('should get staff exceptions', async () => {
      const actor = { id: 'staff-id-1', role: 'staff', email: 'staff@example.com' } as any;
      const staffId = 'staff-id-1';

      const expectedResult = [
        {
          id: 'exception-id-1',
          staff_id: staffId,
          exception_type: ExceptionType.BLOCK,
          exception_date: '2026-10-01',
          start_time: '09:00:00',
          end_time: '12:00:00',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockAgendaService.getStaffExceptions.mockResolvedValue(expectedResult);

      const result = await controller.getExceptions(actor, staffId);

      expect(result).toEqual(expectedResult);
      expect(service.getStaffExceptions).toHaveBeenCalledWith('staff-id-1', staffId);
    });
  });

  describe('deleteException', () => {
    it('should delete exception', async () => {
      const actor = { id: 'staff-id-1', role: 'staff', email: 'staff@example.com' } as any;
      const staffId = 'staff-id-1';
      const exceptionId = 'exception-id-1';

      mockAgendaService.deleteException.mockResolvedValue(undefined);

      await controller.deleteException(actor, staffId, exceptionId);

      expect(service.deleteException).toHaveBeenCalledWith(
        'staff-id-1',
        staffId,
        exceptionId,
      );
    });

    it('should throw NotFoundException when exception not found', async () => {
      const actor = { id: 'staff-id-1', role: 'staff', email: 'staff@example.com' } as any;
      const staffId = 'staff-id-1';
      const exceptionId = 'nonexistent';

      mockAgendaService.deleteException.mockRejectedValue(
        new NotFoundException('Exception not found'),
      );

      await expect(
        controller.deleteException(actor, staffId, exceptionId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
