import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Account, AccountRole, AuthProvider } from './entities/account.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService - Logout', () => {
  let service: AuthService;
  let accountRepository: Repository<Account>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let auditService: AuditService;

  const mockAccount = {
    id: 'test-account-id',
    email: 'test@example.com',
    password_hash: 'hashed-password',
    role: AccountRole.STAFF,
    provider: AuthProvider.LOCAL,
    provider_id: null,
    mfa_enabled: false,
    mfa_secret: null,
    is_active: true,
    last_login_at: new Date(),
    telegram_user_id: null,
    refresh_tokens: [],
    created_at: new Date(),
    updated_at: new Date(),
  } as Account;

  const mockRefreshToken = {
    id: 'test-token-id',
    token_hash: '$2b$10$hashedtoken',
    account_id: 'test-account-id',
    account: mockAccount,
    expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    is_revoked: false,
    revoked_at: null,
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
    created_at: new Date(),
  } as RefreshToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
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

    service = module.get<AuthService>(AuthService);
    accountRepository = module.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    auditService = module.get<AuditService>(AuditService);
  });

  describe('logout', () => {
    it('should successfully logout from current device', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest
        .spyOn(refreshTokenRepository, 'find')
        .mockResolvedValue([mockRefreshToken]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest
        .spyOn(refreshTokenRepository, 'save')
        .mockResolvedValue({ ...mockRefreshToken, is_revoked: true });

      await service.logout(
        mockAccount.id,
        'test-refresh-token',
        '127.0.0.1',
      );

      expect(refreshTokenRepository.find).toHaveBeenCalledWith({
        where: {
          account_id: mockAccount.id,
          is_revoked: false,
        },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'test-refresh-token',
        mockRefreshToken.token_hash,
      );

      expect(refreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_revoked: true,
          revoked_at: expect.any(Date),
        }),
      );

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGOUT,
          actor_id: mockAccount.id,
          metadata: expect.stringContaining('single_device'),
        }),
      );
    });

    it('should throw NotFoundException if account does not exist', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.logout('invalid-id', 'some-token', '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(refreshTokenRepository, 'find').mockResolvedValue([mockRefreshToken]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.logout(mockAccount.id, 'invalid-token', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if no tokens exist', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(refreshTokenRepository, 'find').mockResolvedValue([]);

      await expect(
        service.logout(mockAccount.id, 'some-token', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logoutAll', () => {
    it('should successfully logout from all devices', async () => {
      const mockTokens = [
        { ...mockRefreshToken, id: 'token-1', token_hash: 'hash-1' },
        { ...mockRefreshToken, id: 'token-2', token_hash: 'hash-2' },
        { ...mockRefreshToken, id: 'token-3', token_hash: 'hash-3' },
      ];

      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(refreshTokenRepository, 'find').mockResolvedValue(mockTokens);
      jest.spyOn(refreshTokenRepository, 'save').mockResolvedValue([] as any);

      const revokedCount = await service.logoutAll(mockAccount.id, '127.0.0.1');

      expect(revokedCount).toBe(3);

      expect(refreshTokenRepository.find).toHaveBeenCalledWith({
        where: {
          account_id: mockAccount.id,
          is_revoked: false,
        },
      });

      expect(refreshTokenRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ is_revoked: true }),
          expect.objectContaining({ is_revoked: true }),
          expect.objectContaining({ is_revoked: true }),
        ]),
      );

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGOUT,
          actor_id: mockAccount.id,
          metadata: expect.stringContaining('all_devices'),
        }),
      );
    });

    it('should throw NotFoundException if account does not exist', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.logoutAll('invalid-id', '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 0 if no active tokens exist', async () => {
      jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockAccount);
      jest.spyOn(refreshTokenRepository, 'find').mockResolvedValue([]);
      jest.spyOn(refreshTokenRepository, 'save').mockResolvedValue([] as any);

      const revokedCount = await service.logoutAll(mockAccount.id, '127.0.0.1');

      expect(revokedCount).toBe(0);
    });
  });
});
