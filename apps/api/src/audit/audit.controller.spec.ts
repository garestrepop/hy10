import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('query', () => {
    it('should allow admin to query audit logs', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        page_size: 50,
        total_pages: 0,
      };

      mockAuditService.query.mockResolvedValue(mockResponse);

      const req = { user: { role: 'admin' } };
      const result = await controller.query(req, {});

      expect(result).toEqual(mockResponse);
      expect(mockAuditService.query).toHaveBeenCalledWith('admin', {});
    });

    it('should reject staff user from querying audit logs', async () => {
      const req = { user: { role: 'staff' } };

      await expect(controller.query(req, {})).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockAuditService.query).not.toHaveBeenCalled();
    });

    it('should pass filters to service', async () => {
      mockAuditService.query.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 50,
        total_pages: 0,
      });

      const req = { user: { role: 'admin' } };
      const filters = {
        action: AuditAction.RESERVATION_CREATED,
        from_date: '2026-01-01T00:00:00Z',
        to_date: '2026-12-31T23:59:59Z',
      };

      await controller.query(req, filters);

      expect(mockAuditService.query).toHaveBeenCalledWith('admin', filters);
    });
  });
});
