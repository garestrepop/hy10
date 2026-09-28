import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole, AuthProvider } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { StaffInvitationResponseDto, InvitationInfoDto } from './dto/staff-invitation-response.dto';

import { GoogleProfile } from './interfaces/google-profile.interface';

const COMMON_LEAKED_PASSWORDS = new Set([
  '12345678',
  'password',
  'Password123',
  'qwerty123',
  'abc12345',
  'password1',
  '12345678910',
  'welcome123',
]);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 2;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(StaffInvitation)
    private staffInvitationRepository: Repository<StaffInvitation>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, first_name, last_name } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    this.validatePassword(password);

    const password_hash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password_hash,
      auth_provider: AuthProvider.EMAIL,
      role: UserRole.STAFF,
      first_name,
      last_name,
      is_active: true,
    });

    await this.userRepository.save(user);

    this.logger.log(`User registered: ${user.email}`);

    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto, deviceInfo?: string, ipAddress?: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.checkAccountLock(user);

    if (user.auth_provider !== AuthProvider.EMAIL || !user.password_hash) {
      throw new UnauthorizedException('Please use Google login for this account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.resetFailedAttempts(user);

    this.logger.log(`User logged in: ${user.email}`);

    return this.generateAuthResponse(user, deviceInfo, ipAddress);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        is_revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    tokenRecord.is_revoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    const user = tokenRecord.user;

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    this.logger.log(`Token refreshed for user: ${user.email}`);

    return this.generateAuthResponse(
      user, 
      tokenRecord.device_info || undefined, 
      tokenRecord.ip_address || undefined
    );
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId, token: refreshToken },
      { is_revoked: true },
    );

    this.logger.log(`User logged out: ${userId}`);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId, is_revoked: false },
      { is_revoked: true },
    );

    this.logger.log(`All sessions revoked for user: ${userId}`);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 1);

    await this.passwordResetTokenRepository.delete({ user_id: user.id });

    const resetToken = this.passwordResetTokenRepository.create({
      user_id: user.id,
      token,
      expires_at,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    this.logger.log(`Password reset requested for: ${user.email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    this.validatePassword(newPassword);

    const password_hash = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(resetToken.user_id, { password_hash });

    resetToken.is_used = true;
    await this.passwordResetTokenRepository.save(resetToken);

    await this.refreshTokenRepository.update(
      { user_id: resetToken.user_id },
      { is_revoked: true },
    );

    this.logger.log(`Password reset completed for user: ${resetToken.user.email}`);
  }

  async generateAuthResponse(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'hy10-api',
      audience: 'hy10-web',
    });

    const refresh_token = crypto.randomBytes(64).toString('hex');
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      user_id: user.id,
      token: refresh_token,
      expires_at,
      device_info: deviceInfo,
      ip_address: ipAddress,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    if (COMMON_LEAKED_PASSWORDS.has(password)) {
      throw new BadRequestException('Password is too common and may be compromised');
    }
  }

  private async checkAccountLock(user: User): Promise<void> {
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / (1000 * 60),
      );
      throw new UnauthorizedException(
        `Account is temporarily locked. Try again in ${minutesLeft} minutes.`,
      );
    }
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
    user.last_failed_login = new Date();

    if (user.failed_login_attempts >= this.MAX_FAILED_ATTEMPTS) {
      user.locked_until = new Date();
      user.locked_until.setMinutes(
        user.locked_until.getMinutes() + this.LOCKOUT_DURATION_MINUTES,
      );
      this.logger.warn(`Account locked due to failed attempts: ${user.email}`);
    }

    await this.userRepository.save(user);
  }

  private async resetFailedAttempts(user: User): Promise<void> {
    if (user.failed_login_attempts > 0 || user.locked_until) {
      user.failed_login_attempts = 0;
      user.last_failed_login = null;
      user.locked_until = null;
      await this.userRepository.save(user);
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<User> {
    const email = profile.emails[0].value.toLowerCase();
    
    let user = await this.userRepository.findOne({
      where: [
        { email },
        { google_id: profile.id },
      ],
    });

    if (user) {
      if (!user.google_id) {
        user.google_id = profile.id;
        user.auth_provider = AuthProvider.GOOGLE;
        await this.userRepository.save(user);
      }
      return user;
    }

    user = this.userRepository.create({
      email,
      google_id: profile.id,
      auth_provider: AuthProvider.GOOGLE,
      first_name: profile.name?.givenName,
      last_name: profile.name?.familyName,
      role: UserRole.STAFF,
      is_active: true,
      email_verified: true,
    });

    await this.userRepository.save(user);

    this.logger.log(`Google user created: ${user.email}`);

    return user;
  }

  async createStaffInvitation(
    inviterUserId: string,
    email: string,
  ): Promise<StaffInvitationResponseDto> {
    const inviter = await this.userRepository.findOne({
      where: { id: inviterUserId },
    });

    if (!inviter || inviter.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only administrators can invite staff');
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.role === UserRole.STAFF) {
      throw new BadRequestException('User already has Staff role');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    const invitation = this.staffInvitationRepository.create({
      email: normalizedEmail,
      token,
      invited_by: inviterUserId,
      expires_at,
    });

    await this.staffInvitationRepository.save(invitation);

    this.logger.log(`Staff invitation created for ${normalizedEmail} by ${inviter.email}`);

    return {
      token,
      email: normalizedEmail,
      expires_at,
      invited_by_email: inviter.email,
    };
  }

  async getInvitationInfo(token: string): Promise<InvitationInfoDto> {
    const invitation = await this.staffInvitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    const is_expired = invitation.expires_at < new Date();

    return {
      email: invitation.email,
      email_exists: !!existingUser,
      expires_at: invitation.expires_at,
      is_expired,
      is_used: invitation.is_used,
    };
  }

  async acceptStaffInvitation(
    token: string,
    password?: string,
    first_name?: string,
    last_name?: string,
    currentUserId?: string,
  ): Promise<AuthResponseDto> {
    const invitation = await this.staffInvitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }

    if (invitation.is_used) {
      throw new BadRequestException('Invitation token has already been used');
    }

    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('Invitation token has expired');
    }

    const normalizedEmail = invitation.email.toLowerCase();
    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (user) {
      if (currentUserId && currentUserId !== user.id) {
        throw new UnauthorizedException(
          'This invitation is for a different account. Please log out and log in with the invited email.',
        );
      }

      if (user.role === UserRole.STAFF) {
        throw new BadRequestException('User already has Staff role');
      }

      user.role = UserRole.STAFF;
      await this.userRepository.save(user);

      this.logger.log(`Staff role assigned to existing user: ${user.email}`);
    } else {
      if (!password) {
        throw new BadRequestException('Password is required for new accounts');
      }

      this.validatePassword(password);

      const password_hash = await bcrypt.hash(password, 10);

      user = this.userRepository.create({
        email: normalizedEmail,
        password_hash,
        auth_provider: AuthProvider.EMAIL,
        role: UserRole.STAFF,
        first_name,
        last_name,
        is_active: true,
        email_verified: true,
      });

      await this.userRepository.save(user);

      this.logger.log(`New Staff user created via invitation: ${user.email}`);
    }

    invitation.is_used = true;
    invitation.used_at = new Date();
    invitation.created_user_id = user.id;
    await this.staffInvitationRepository.save(invitation);

    return this.generateAuthResponse(user);
  }
}
