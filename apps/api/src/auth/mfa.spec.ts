import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole, AuthProvider } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { generateSecret, verify } from 'otplib';

describe('AuthService MFA', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockPasswordResetTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: mockPasswordResetTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupMfa', () => {
    it('should generate MFA secret and QR code for admin user', async () => {
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: false,
        mfa_secret: null,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);
      mockUserRepository.save.mockResolvedValue({ ...adminUser, mfa_secret: 'test-secret' });

      const result = await service.setupMfa('123');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('otpauth_url');
      expect(result).toHaveProperty('qr_code');
      expect(result.qr_code).toContain('data:image/png;base64');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user is not admin', async () => {
      const staffUser = {
        id: '123',
        email: 'staff@example.com',
        role: UserRole.STAFF,
        mfa_enabled: false,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(staffUser);

      await expect(service.setupMfa('123')).rejects.toThrow(BadRequestException);
      await expect(service.setupMfa('123')).rejects.toThrow('MFA is only available for administrators');
    });

    it('should throw error if MFA is already enabled', async () => {
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: true,
        mfa_secret: 'existing-secret',
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);

      await expect(service.setupMfa('123')).rejects.toThrow(BadRequestException);
      await expect(service.setupMfa('123')).rejects.toThrow('MFA is already enabled');
    });
  });

  describe('enableMfa', () => {
    it('should enable MFA with valid code', async () => {
      const secret = generateSecret();
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: false,
        mfa_secret: secret,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);
      mockUserRepository.save.mockResolvedValue({ ...adminUser, mfa_enabled: true });

      jest.spyOn(require('otplib'), 'verify').mockResolvedValue(true);

      const result = await service.enableMfa('123', '123456');

      expect(result).toEqual({ message: 'MFA enabled successfully' });
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if MFA setup not initiated', async () => {
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: false,
        mfa_secret: null,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);

      await expect(service.enableMfa('123', '123456')).rejects.toThrow(BadRequestException);
      await expect(service.enableMfa('123', '123456')).rejects.toThrow('MFA setup not initiated');
    });

    it('should throw error with invalid code', async () => {
      const secret = generateSecret();
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: false,
        mfa_secret: secret,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);
      jest.spyOn(require('otplib'), 'verify').mockResolvedValue(false);

      await expect(service.enableMfa('123', '999999')).rejects.toThrow(UnauthorizedException);
      await expect(service.enableMfa('123', '999999')).rejects.toThrow('Invalid MFA code');
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA with valid code', async () => {
      const secret = generateSecret();
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: true,
        mfa_secret: secret,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);
      mockUserRepository.save.mockResolvedValue({ ...adminUser, mfa_enabled: false, mfa_secret: null });

      jest.spyOn(require('otplib'), 'verify').mockResolvedValue(true);

      const result = await service.disableMfa('123', '123456');

      expect(result).toEqual({ message: 'MFA disabled successfully' });
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          mfa_enabled: false,
          mfa_secret: null,
        })
      );
    });

    it('should throw error if MFA is not enabled', async () => {
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: false,
        mfa_secret: null,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);

      await expect(service.disableMfa('123', '123456')).rejects.toThrow(BadRequestException);
      await expect(service.disableMfa('123', '123456')).rejects.toThrow('MFA is not enabled');
    });
  });

  describe('login with MFA', () => {
    it('should return MFA token for admin with MFA enabled', async () => {
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        password_hash: '$2b$10$test',
        role: UserRole.ADMIN,
        auth_provider: AuthProvider.EMAIL,
        is_active: true,
        mfa_enabled: true,
        mfa_secret: 'secret',
        failed_login_attempts: 0,
        locked_until: null,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(adminUser);
      mockJwtService.sign.mockReturnValue('mfa-token-123');

      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.login(
        { email: 'admin@example.com', password: 'password' },
        'user-agent',
        '127.0.0.1'
      );

      expect(result).toHaveProperty('mfa_required', true);
      expect(result).toHaveProperty('mfa_token');
      expect(result).toHaveProperty('email', 'admin@example.com');
    });

    it('should return full auth response for non-admin user', async () => {
      const staffUser = {
        id: '456',
        email: 'staff@example.com',
        password_hash: '$2b$10$test',
        role: UserRole.STAFF,
        auth_provider: AuthProvider.EMAIL,
        is_active: true,
        mfa_enabled: false,
        failed_login_attempts: 0,
        locked_until: null,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(staffUser);
      mockJwtService.sign.mockReturnValue('access-token-123');
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

      const result = await service.login(
        { email: 'staff@example.com', password: 'password' },
        'user-agent',
        '127.0.0.1'
      );

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).not.toHaveProperty('mfa_required');
    });
  });

  describe('verifyMfa', () => {
    it('should complete login with valid MFA code', async () => {
      const secret = generateSecret();
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: true,
        mfa_secret: secret,
        is_active: true,
      } as User;

      mockJwtService.verify.mockReturnValue({
        sub: '123',
        type: 'mfa',
        deviceInfo: 'user-agent',
        ipAddress: '127.0.0.1',
      });
      mockUserRepository.findOne.mockResolvedValue(adminUser);
      mockJwtService.sign.mockReturnValue('access-token-123');
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      jest.spyOn(require('otplib'), 'verify').mockResolvedValue(true);

      const result = await service.verifyMfa('mfa-token', '123456');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw error with invalid MFA token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyMfa('invalid-token', '123456')).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyMfa('invalid-token', '123456')).rejects.toThrow('Invalid or expired MFA token');
    });

    it('should throw error with invalid MFA code', async () => {
      const secret = generateSecret();
      const adminUser = {
        id: '123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        mfa_enabled: true,
        mfa_secret: secret,
      } as User;

      mockJwtService.verify.mockReturnValue({
        sub: '123',
        type: 'mfa',
      });
      mockUserRepository.findOne.mockResolvedValue(adminUser);
      jest.spyOn(require('otplib'), 'verify').mockResolvedValue(false);

      await expect(service.verifyMfa('mfa-token', '999999')).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyMfa('mfa-token', '999999')).rejects.toThrow('Invalid MFA code');
    });
  });
});
