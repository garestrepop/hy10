import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole, AuthProvider } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';

describe('AuthService - Staff Invitation (US-05)', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let staffInvitationRepository: Repository<StaffInvitation>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let passwordResetTokenRepository: Repository<PasswordResetToken>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockStaffInvitationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPasswordResetTokenRepository = {};

  const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(() => 'mock-secret'),
  };

  const JwtServiceToken = 'JwtService';
  const ConfigServiceToken = 'ConfigService';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepository },
        { provide: getRepositoryToken(PasswordResetToken), useValue: mockPasswordResetTokenRepository },
        { provide: getRepositoryToken(StaffInvitation), useValue: mockStaffInvitationRepository },
        { provide: JwtServiceToken, useValue: mockJwtService },
        { provide: ConfigServiceToken, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    staffInvitationRepository = module.get<Repository<StaffInvitation>>(getRepositoryToken(StaffInvitation));
    refreshTokenRepository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    passwordResetTokenRepository = module.get<Repository<PasswordResetToken>>(getRepositoryToken(PasswordResetToken));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Escenario: Email nuevo', () => {
    it('should create invitation token with 7 days validity when admin invites new email', async () => {
      const adminUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      } as User;

      const newEmail = 'newstaff@example.com';
      const now = new Date();

      mockUserRepository.findOne
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(null);

      const mockInvitation = {
        id: 'invitation-id',
        email: newEmail,
        token: 'mock-token',
        invited_by: adminUser.id,
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        is_used: false,
      };

      mockStaffInvitationRepository.create.mockReturnValue(mockInvitation);
      mockStaffInvitationRepository.save.mockResolvedValue(mockInvitation);

      const result = await service.createStaffInvitation(adminUser.id, newEmail);

      expect(result.token).toBeDefined();
      expect(result.email).toBe(newEmail);
      expect(result.expires_at).toBeDefined();

      const daysDiff = Math.floor(
        (result.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(7);
    });

    it('should create new Staff account when accepting invitation for new email', async () => {
      const invitation = {
        id: 'invitation-id',
        email: 'newstaff@example.com',
        token: 'valid-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_used: false,
        invited_by: 'admin-id',
      } as StaffInvitation;

      const newUser = {
        id: 'new-user-id',
        email: invitation.email,
        role: UserRole.STAFF,
        is_active: true,
        email_verified: true,
      } as User;

      mockStaffInvitationRepository.findOne.mockResolvedValue(invitation);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);
      mockStaffInvitationRepository.save.mockResolvedValue({
        ...invitation,
        is_used: true,
        used_at: new Date(),
        created_user_id: newUser.id,
      });
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.acceptStaffInvitation(
        'valid-token',
        'SecurePass123',
        'John',
        'Doe'
      );

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: invitation.email,
          role: UserRole.STAFF,
          first_name: 'John',
          last_name: 'Doe',
          is_active: true,
          email_verified: true,
        })
      );
      expect(result.access_token).toBeDefined();
    });
  });

  describe('Escenario: Email que ya tiene cuenta', () => {
    it('should require login and assign Staff role to existing user', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'existing@example.com',
        role: UserRole.ADMIN,
      } as User;

      const invitation = {
        id: 'invitation-id',
        email: existingUser.email,
        token: 'valid-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_used: false,
        invited_by: 'admin-id',
      } as StaffInvitation;

      mockStaffInvitationRepository.findOne.mockResolvedValue(invitation);
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({ ...existingUser, role: UserRole.STAFF });
      mockStaffInvitationRepository.save.mockResolvedValue({
        ...invitation,
        is_used: true,
        used_at: new Date(),
      });
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.acceptStaffInvitation(
        'valid-token',
        undefined,
        undefined,
        undefined,
        existingUser.id
      );

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.STAFF,
        })
      );
      expect(result.access_token).toBeDefined();
    });

    it('should not duplicate account when email already exists', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'existing@example.com',
        role: UserRole.ADMIN,
      } as User;

      const invitation = {
        id: 'invitation-id',
        email: existingUser.email,
        token: 'valid-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_used: false,
        invited_by: 'admin-id',
      } as StaffInvitation;

      mockStaffInvitationRepository.findOne.mockResolvedValue(invitation);
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({ ...existingUser, role: UserRole.STAFF });
      mockStaffInvitationRepository.save.mockResolvedValue(invitation);
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      await service.acceptStaffInvitation(
        'valid-token',
        undefined,
        undefined,
        undefined,
        existingUser.id
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should reject if wrong user tries to accept invitation', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'existing@example.com',
        role: UserRole.ADMIN,
      } as User;

      const invitation = {
        id: 'invitation-id',
        email: existingUser.email,
        token: 'valid-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_used: false,
        invited_by: 'admin-id',
      } as StaffInvitation;

      mockStaffInvitationRepository.findOne.mockResolvedValue(invitation);
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(
        service.acceptStaffInvitation(
          'valid-token',
          undefined,
          undefined,
          undefined,
          'different-user-id'
        )
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Escenario: Token vencido, usado o ajeno', () => {
    it('should reject expired token', async () => {
      const expiredInvitation = {
        id: 'invitation-id',
        email: 'staff@example.com',
        token: 'expired-token',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        is_used: false,
        invited_by: 'admin-id',
      } as StaffInvitation;

      mockStaffInvitationRepository.findOne.mockResolvedValue(expiredInvitation);

      await expect(
        service.acceptStaffInvitation('expired-token', 'password123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject already used token', async () => {
      const usedInvitation = {
        id: 'invitation-id',
        email: 'staff@example.com',
        token: 'used-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_used: true,
        used_at: new Date(),
        invited_by: 'admin-id',
      } as StaffInvitation;

      mockStaffInvitationRepository.findOne.mockResolvedValue(usedInvitation);

      await expect(
        service.acceptStaffInvitation('used-token', 'password123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid token', async () => {
      mockStaffInvitationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.acceptStaffInvitation('invalid-token', 'password123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invitation creation by non-admin user', async () => {
      const staffUser = {
        id: 'staff-id',
        email: 'staff@example.com',
        role: UserRole.STAFF,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(staffUser);

      await expect(
        service.createStaffInvitation(staffUser.id, 'newstaff@example.com')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Additional validations', () => {
    it('should require password for new account creation', async () => {
      const invitation = {
        id: 'invitation-id',
        email: 'newstaff@example.com',
        token: 'valid-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_used: false,
        invited_by: 'admin-id',
      } as StaffInvitation;

      mockStaffInvitationRepository.findOne.mockResolvedValue(invitation);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.acceptStaffInvitation('valid-token')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invitation if user already has Staff role', async () => {
      const adminUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      } as User;

      const existingStaffUser = {
        id: 'staff-id',
        email: 'staff@example.com',
        role: UserRole.STAFF,
      } as User;

      mockUserRepository.findOne
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(existingStaffUser);

      await expect(
        service.createStaffInvitation(adminUser.id, 'staff@example.com')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
