import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole, AuthProvider } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let passwordResetTokenRepository: Repository<PasswordResetToken>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPasswordResetTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
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
    refreshTokenRepository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    passwordResetTokenRepository = module.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken),
    );
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        first_name: 'Test',
        last_name: 'User',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: '1', ...registerDto });
      mockUserRepository.save.mockResolvedValue({ id: '1', ...registerDto });
      mockJwtService.sign.mockReturnValue('access_token');
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe(registerDto.email.toLowerCase());
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'ValidPass123!',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: '1', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for weak password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '12345678',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Short1',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password_hash: hashedPassword,
        auth_provider: AuthProvider.EMAIL,
        is_active: true,
        role: UserRole.STAFF,
        failed_login_attempts: 0,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('access_token');
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'ValidPass123!',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password_hash: hashedPassword,
        auth_provider: AuthProvider.EMAIL,
        is_active: true,
        failed_login_attempts: 0,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          failed_login_attempts: 1,
        }),
      );
    });

    it('should lock account after max failed attempts', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password_hash: hashedPassword,
        auth_provider: AuthProvider.EMAIL,
        is_active: true,
        failed_login_attempts: 4,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          failed_login_attempts: 5,
          locked_until: expect.any(Date),
        }),
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        is_active: false,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh token', async () => {
      const refreshToken = 'valid_refresh_token';
      const user = {
        id: '1',
        email: 'test@example.com',
        role: UserRole.STAFF,
        is_active: true,
      };

      const tokenRecord = {
        id: '1',
        token: refreshToken,
        user,
        is_revoked: false,
        expires_at: new Date(Date.now() + 86400000),
        device_info: 'test-device',
        ip_address: '127.0.0.1',
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(tokenRecord);
      mockRefreshTokenRepository.save.mockResolvedValue(tokenRecord);
      mockJwtService.sign.mockReturnValue('new_access_token');
      mockRefreshTokenRepository.create.mockReturnValue({});

      const result = await service.refresh(refreshToken);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_revoked: true,
        }),
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid_token';

      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const userId = '1';
      const refreshToken = 'valid_token';

      mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });

      await service.logout(userId, refreshToken);

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { user_id: userId, token: refreshToken },
        { is_revoked: true },
      );
    });
  });

  describe('logoutAll', () => {
    it('should revoke all user tokens', async () => {
      const userId = '1';

      mockRefreshTokenRepository.update.mockResolvedValue({ affected: 3 });

      await service.logoutAll(userId);

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { user_id: userId, is_revoked: false },
        { is_revoked: true },
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should create password reset token for existing user', async () => {
      const email = 'test@example.com';
      const user = { id: '1', email };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockPasswordResetTokenRepository.delete.mockResolvedValue({});
      mockPasswordResetTokenRepository.create.mockReturnValue({});
      mockPasswordResetTokenRepository.save.mockResolvedValue({});

      await service.requestPasswordReset(email);

      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('should not throw error for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.requestPasswordReset(email)).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      const token = 'valid_token';
      const newPassword = 'NewValidPass123!';

      const resetToken = {
        id: '1',
        token,
        user_id: '1',
        user: { id: '1', email: 'test@example.com' },
        is_used: false,
        expires_at: new Date(Date.now() + 3600000),
      };

      mockPasswordResetTokenRepository.findOne.mockResolvedValue(resetToken);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockPasswordResetTokenRepository.save.mockResolvedValue(resetToken);
      mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });

      await service.resetPassword(token, newPassword);

      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_used: true,
        }),
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      const token = 'invalid_token';
      const newPassword = 'NewValidPass123!';

      mockPasswordResetTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(BadRequestException);
    });
  });
});
