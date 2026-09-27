import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Account } from './entities/account.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ActorType } from '../audit/entities/audit-log.entity';

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async logout(
    accountId: string,
    refreshToken: string,
    ipAddress?: string,
  ): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const token = await this.refreshTokenRepository.findOne({
      where: {
        account_id: accountId,
        token: refreshToken,
        is_revoked: false,
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    token.is_revoked = true;
    token.revoked_at = new Date();
    await this.refreshTokenRepository.save(token);

    await this.auditService.record({
      action: AuditAction.LOGOUT,
      actor_type: ActorType.USER,
      actor_id: accountId,
      actor_email: account.email,
      actor_role: account.role,
      entity_type: 'refresh_token',
      entity_id: token.id,
      ip_address: ipAddress,
      metadata: JSON.stringify({ logout_type: 'single_device' }),
    });
  }

  async logoutAll(accountId: string, ipAddress?: string): Promise<number> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const activeTokens = await this.refreshTokenRepository.find({
      where: {
        account_id: accountId,
        is_revoked: false,
      },
    });

    const now = new Date();
    const revokedCount = activeTokens.length;

    for (const token of activeTokens) {
      token.is_revoked = true;
      token.revoked_at = now;
    }

    await this.refreshTokenRepository.save(activeTokens);

    await this.auditService.record({
      action: AuditAction.LOGOUT,
      actor_type: ActorType.USER,
      actor_id: accountId,
      actor_email: account.email,
      actor_role: account.role,
      entity_type: 'account',
      entity_id: accountId,
      ip_address: ipAddress,
      metadata: JSON.stringify({
        logout_type: 'all_devices',
        revoked_count: revokedCount,
      }),
    });

    return revokedCount;
  }

  async refresh(oldRefreshToken: string, ipAddress?: string): Promise<Session> {
    const token = await this.refreshTokenRepository.findOne({
      where: {
        token: oldRefreshToken,
        is_revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['account'],
    });

    if (!token) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const account = token.account;

    if (!account.is_active) {
      throw new UnauthorizedException('Account is not active');
    }

    token.is_revoked = true;
    token.revoked_at = new Date();
    await this.refreshTokenRepository.save(token);

    return this.generateSession(account, ipAddress);
  }

  private async generateSession(
    account: Account,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const accessTokenExpiresIn = 15 * 60;
    const refreshTokenExpiresIn = 2 * 24 * 60 * 60;

    const payload = {
      sub: account.id,
      email: account.email,
      role: account.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setSeconds(
      refreshTokenExpiry.getSeconds() + refreshTokenExpiresIn,
    );

    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      account_id: account.id,
      expires_at: refreshTokenExpiry,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: accessTokenExpiresIn,
    };
  }

  async validateRefreshToken(refreshToken: string): Promise<Account | null> {
    const token = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        is_revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['account'],
    });

    if (!token || !token.account.is_active) {
      return null;
    }

    return token.account;
  }
}
