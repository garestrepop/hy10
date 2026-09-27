import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService, NotificationKind } from './notifications.service';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { User } from '../staff/entities/staff.entity';
import { Settings } from './entities/settings.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<User>;
  let settingsRepository: Repository<Settings>;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockSettingsRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Settings),
          useValue: mockSettingsRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    userRepository = module.get(getRepositoryToken(User));
    settingsRepository = module.get(getRepositoryToken(Settings));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reservationChanged', () => {
    const mockReservation: Partial<Reservation> = {
      id: 'reservation-123',
      staff_id: 'staff-123',
      client_id: 'client-123',
      service_id: 'service-123',
      start_time: new Date('2026-09-30T10:00:00Z'),
      previous_start_time: new Date('2026-09-29T10:00:00Z'),
      status: ReservationStatus.CANCELLED,
      duration_minutes: 60,
      reschedule_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockStaff: Partial<User> = {
      id: 'staff-123',
      email: 'staff@example.com',
      telegram_user_id: '123456789',
      display_name: 'John Doe',
    };

    const mockSettings: Partial<Settings> = {
      timezone: 'America/Bogota',
      staff_upcoming_notice_minutes: 30,
    };

    it('should create a cancellation notification when staff has Telegram linked', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockStaff);
      mockSettingsRepository.findOne.mockResolvedValue(mockSettings);
      const createdNotification = { id: 'notification-123', type: NotificationType.RESERVATION_CANCELLED };
      mockNotificationRepository.create.mockReturnValue(createdNotification);
      mockNotificationRepository.save.mockResolvedValue(createdNotification);

      await service.reservationChanged(
        mockReservation as Reservation,
        NotificationKind.CANCELLED,
        'Haircut',
        'Jane Client',
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'staff-123' },
      });

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.RESERVATION_CANCELLED,
          recipient_id: 'staff-123',
          recipient_telegram_id: '123456789',
          reservation_id: 'reservation-123',
          status: NotificationStatus.PENDING,
        }),
      );

      expect(mockNotificationRepository.save).toHaveBeenCalled();
    });

    it('should create a reschedule notification with old and new times', async () => {
      const rescheduledReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
        start_time: new Date('2026-09-30T14:00:00Z'),
        previous_start_time: new Date('2026-09-30T10:00:00Z'),
      };

      mockUserRepository.findOne.mockResolvedValue(mockStaff);
      mockSettingsRepository.findOne.mockResolvedValue(mockSettings);
      mockNotificationRepository.create.mockImplementation((dto) => dto);
      mockNotificationRepository.save.mockResolvedValue({
        id: 'notification-124',
      });

      await service.reservationChanged(
        rescheduledReservation as Reservation,
        NotificationKind.RESCHEDULED,
        'Haircut',
        'Jane Client',
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.RESERVATION_RESCHEDULED,
          recipient_id: 'staff-123',
          reservation_id: 'reservation-123',
        }),
      );

      const createdNotification = mockNotificationRepository.create.mock.calls[0][0];
      expect(createdNotification.message).toContain('Reprogramación');
      expect(createdNotification.message).toContain('Horario anterior');
      expect(createdNotification.message).toContain('Nuevo horario');
    });

    it('should not create notification if staff has no Telegram linked', async () => {
      const staffWithoutTelegram = {
        ...mockStaff,
        telegram_user_id: null,
      };

      mockUserRepository.findOne.mockResolvedValue(staffWithoutTelegram);

      await service.reservationChanged(
        mockReservation as Reservation,
        NotificationKind.CANCELLED,
        'Haircut',
        'Jane Client',
      );

      expect(mockNotificationRepository.create).not.toHaveBeenCalled();
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    it('should not create notification if staff not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await service.reservationChanged(
        mockReservation as Reservation,
        NotificationKind.CANCELLED,
        'Haircut',
        'Jane Client',
      );

      expect(mockNotificationRepository.create).not.toHaveBeenCalled();
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.findOne.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.reservationChanged(
          mockReservation as Reservation,
          NotificationKind.CANCELLED,
          'Haircut',
          'Jane Client',
        ),
      ).resolves.not.toThrow();

      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('staffUpcoming', () => {
    const mockReservation: Partial<Reservation> = {
      id: 'reservation-456',
      staff_id: 'staff-456',
      start_time: new Date('2026-09-30T15:00:00Z'),
      status: ReservationStatus.CONFIRMED,
    };

    const mockStaff: Partial<User> = {
      id: 'staff-456',
      telegram_user_id: '987654321',
    };

    it('should create upcoming notification', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockStaff);
      mockSettingsRepository.findOne.mockResolvedValue({
        timezone: 'America/Bogota',
      });
      mockNotificationRepository.create.mockImplementation((dto) => dto);
      mockNotificationRepository.save.mockResolvedValue({ id: 'notif-789' });

      await service.staffUpcoming(
        mockReservation as Reservation,
        'Manicure',
        'John Client',
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.STAFF_UPCOMING,
          recipient_id: 'staff-456',
          reservation_id: 'reservation-456',
        }),
      );
    });
  });

  describe('getPendingNotifications', () => {
    it('should return pending notifications ordered by creation time', async () => {
      const mockNotifications = [
        { id: '1', status: NotificationStatus.PENDING },
        { id: '2', status: NotificationStatus.PENDING },
      ];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.getPendingNotifications(10);

      expect(mockNotificationRepository.find).toHaveBeenCalledWith({
        where: { status: NotificationStatus.PENDING },
        order: { created_at: 'ASC' },
        take: 10,
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsSent', () => {
    it('should update notification status to sent', async () => {
      await service.markAsSent('notification-123');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        'notification-123',
        expect.objectContaining({
          status: NotificationStatus.SENT,
          sent_at: expect.any(Date),
        }),
      );
    });
  });

  describe('markAsFailed', () => {
    it('should update notification status to failed with error message', async () => {
      await service.markAsFailed('notification-456', 'Connection timeout');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        'notification-456',
        {
          status: NotificationStatus.FAILED,
          error_message: 'Connection timeout',
        },
      );
    });
  });
});
