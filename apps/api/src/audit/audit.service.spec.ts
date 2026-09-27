import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog, AuditAction, ActorType } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditLog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('record', () => {
    it('should record an audit log with sanitized data', async () => {
      const dto: CreateAuditLogDto = {
        action: AuditAction.RESERVATION_CREATED,
        actor_type: ActorType.USER,
        actor_id: 'user-123',
        actor_email: 'admin@example.com',
        actor_role: 'admin',
        entity_type: 'reservation',
        entity_id: 'res-456',
        previous_value: undefined,
        new_value: {
          service: 'Haircut',
          start_time: '2026-09-27T10:00:00Z',
        },
      };

      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue(dto);

      await service.record(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.RESERVATION_CREATED,
          actor_type: ActorType.USER,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should redact sensitive fields from audit data', async () => {
      const dto: CreateAuditLogDto = {
        action: AuditAction.SETTINGS_UPDATED,
        actor_type: ActorType.USER,
        actor_id: 'user-123',
        previous_value: {
          api_key: 'secret-key-123',
          bot_token: 'bot-token-456',
          normal_field: 'visible',
        },
        new_value: {
          api_key: 'new-secret-key',
          bot_token: 'new-bot-token',
          normal_field: 'updated',
        },
      };

      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockResolvedValue({} as AuditLog);

      await service.record(dto);

      const savedData = mockRepository.create.mock.calls[0][0];
      expect(savedData.previous_value.api_key).toBe('[REDACTED]');
      expect(savedData.previous_value.bot_token).toBe('[REDACTED]');
      expect(savedData.previous_value.normal_field).toBe('visible');
      expect(savedData.new_value.api_key).toBe('[REDACTED]');
      expect(savedData.new_value.bot_token).toBe('[REDACTED]');
      expect(savedData.new_value.normal_field).toBe('updated');
    });

    it('should not throw if save fails (per FR-56)', async () => {
      const dto: CreateAuditLogDto = {
        action: AuditAction.RESERVATION_CREATED,
        actor_type: ActorType.USER,
        actor_id: 'user-123',
      };

      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.record(dto)).resolves.not.toThrow();
    });
  });

  describe('query', () => {
    it('should return audit logs for admin', async () => {
      const mockLogs = [
        {
          id: '1',
          action: AuditAction.RESERVATION_CREATED,
          actor_type: ActorType.USER,
          actor_id: 'user-123',
          created_at: new Date(),
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockLogs, 1]);

      const result = await service.query('admin', {
        page: 1,
        page_size: 50,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should reject query from staff user', async () => {
      await expect(
        service.query('staff', { page: 1, page_size: 50 }),
      ).rejects.toThrow('Unauthorized: Only administrators can access audit logs');
    });

    it('should filter by action', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.query('admin', {
        action: AuditAction.INVOICE_PAID,
        page: 1,
        page_size: 50,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: AuditAction.INVOICE_PAID,
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.query('admin', {
        from_date: '2026-01-01T00:00:00Z',
        to_date: '2026-12-31T23:59:59Z',
        page: 1,
        page_size: 50,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.any(Object),
          }),
        }),
      );
    });
  });
});
