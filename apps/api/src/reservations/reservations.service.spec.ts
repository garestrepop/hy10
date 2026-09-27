import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { NotificationsService, NotificationKind } from '../platform/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationRepository: Repository<Reservation>;
  let notificationsService: NotificationsService;
  let auditService: AuditService;

  const mockReservationRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockNotificationsService = {
    reservationChanged: jest.fn(),
  };

  const mockAuditService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    reservationRepository = module.get(getRepositoryToken(Reservation));
    notificationsService = module.get(NotificationsService);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cancel', () => {
    const mockReservation: Partial<Reservation> = {
      id: 'reservation-123',
      staff_id: 'staff-123',
      client_id: 'client-123',
      service_id: 'service-123',
      start_time: new Date('2026-09-30T10:00:00Z'),
      status: ReservationStatus.CONFIRMED,
      duration_minutes: 60,
      reschedule_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should cancel a confirmed reservation and trigger notifications', async () => {
      mockReservationRepository.findOne.mockResolvedValue(mockReservation);
      mockReservationRepository.save.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      });
      mockAuditService.record.mockResolvedValue(undefined);
      mockNotificationsService.reservationChanged.mockResolvedValue(undefined);

      const result = await service.cancel({
        reservationId: 'reservation-123',
        actorId: 'client-123',
        actorRole: 'client',
        reason: 'Client request',
      });

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(result.cancellation_reason).toBe('Client request');
      expect(result.cancelled_by_user_id).toBe('client-123');

      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.RESERVATION_CANCELLED,
          actor_id: 'client-123',
          entity_type: 'reservation',
          entity_id: 'reservation-123',
        }),
      );

      expect(mockNotificationsService.reservationChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'reservation-123',
          status: ReservationStatus.CANCELLED,
        }),
        NotificationKind.CANCELLED,
        'Service Name',
        'Client Name',
      );
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      mockReservationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancel({
          reservationId: 'nonexistent',
          actorId: 'client-123',
          actorRole: 'client',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockReservationRepository.save).not.toHaveBeenCalled();
      expect(mockNotificationsService.reservationChanged).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reservation is not confirmed', async () => {
      mockReservationRepository.findOne.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      });

      await expect(
        service.cancel({
          reservationId: 'reservation-123',
          actorId: 'client-123',
          actorRole: 'client',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockReservationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('reschedule', () => {
    const mockReservation: Partial<Reservation> = {
      id: 'reservation-456',
      staff_id: 'staff-456',
      client_id: 'client-456',
      service_id: 'service-456',
      start_time: new Date('2026-09-30T10:00:00Z'),
      status: ReservationStatus.CONFIRMED,
      reschedule_count: 0,
      duration_minutes: 60,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should reschedule a reservation and trigger notifications', async () => {
      const newStartTime = new Date('2026-09-30T14:00:00Z');

      mockReservationRepository.findOne.mockResolvedValue(mockReservation);
      mockReservationRepository.save.mockImplementation((reservation) => {
        return Promise.resolve(reservation);
      });
      mockAuditService.record.mockResolvedValue(undefined);
      mockNotificationsService.reservationChanged.mockResolvedValue(undefined);

      const result = await service.reschedule({
        reservationId: 'reservation-456',
        newStartTime,
        actorId: 'client-456',
        actorRole: 'client',
      });

      expect(result.start_time).toEqual(newStartTime);
      expect(result.previous_start_time).toEqual(new Date('2026-09-30T10:00:00Z'));
      expect(result.reschedule_count).toBe(1);

      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.RESERVATION_RESCHEDULED,
          actor_id: 'client-456',
        }),
      );

      expect(mockNotificationsService.reservationChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: newStartTime,
        }),
        NotificationKind.RESCHEDULED,
        'Service Name',
        'Client Name',
      );
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      mockReservationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reschedule({
          reservationId: 'nonexistent',
          newStartTime: new Date(),
          actorId: 'client-456',
          actorRole: 'client',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStaffId', () => {
    it('should return reservations for a staff member', async () => {
      const mockReservations = [
        { id: '1', staff_id: 'staff-123' },
        { id: '2', staff_id: 'staff-123' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findByStaffId('staff-123', new Date());

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'r.staff_id = :staffId',
        { staffId: 'staff-123' },
      );
      expect(result).toEqual(mockReservations);
    });
  });
});
