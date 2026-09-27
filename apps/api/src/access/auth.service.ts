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
import * as bcrypt from 'bcrypt';
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

    // Find all non-revoked tokens for this account
    const tokens = await this.refreshTokenRepository.find({
      where: {
        account_id: accountId,
        is_revoked: false,
      },
    });

    // Compare the provided token with hashed tokens using timing-safe comparison
    let matchedToken: RefreshToken | null = null;
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.token_hash);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    matchedToken.is_revoked = true;
    matchedToken.revoked_at = new Date();
    await this.refreshTokenRepository.save(matchedToken);

    await this.auditService.record({
      action: AuditAction.LOGOUT,
      actor_type: ActorType.USER,
      actor_id: accountId,
      actor_email: account.email,
      actor_role: account.role,
      entity_type: 'refresh_token',
      entity_id: matchedToken.id,
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
    // Get all non-revoked, non-expired tokens
    const tokens = await this.refreshTokenRepository.find({
      where: {
        is_revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['account'],
    });

    // Find matching token using timing-safe comparison
    let matchedToken: RefreshToken | null = null;
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(oldRefreshToken, token.token_hash);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const account = matchedToken.account;

    if (!account.is_active) {
      throw new UnauthorizedException('Account is not active');
    }

    matchedToken.is_revoked = true;
    matchedToken.revoked_at = new Date();
    await this.refreshTokenRepository.save(matchedToken);

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

    // Generate random refresh token
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    
    // Hash the token before storing (bcrypt with 10 rounds)
    const tokenHash = await bcrypt.hash(refreshTokenValue, 10);
    
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setSeconds(
      refreshTokenExpiry.getSeconds() + refreshTokenExpiresIn,
    );

    const refreshToken = this.refreshTokenRepository.create({
      token_hash: tokenHash,
      account_id: account.id,
      expires_at: refreshTokenExpiry,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await this.refreshTokenRepository.save(refreshToken);

    // Return the plaintext token to the client (only time it's visible)
    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: accessTokenExpiresIn,
    };
  }

  async validateRefreshToken(refreshToken: string): Promise<Account | null> {
    const tokens = await this.refreshTokenRepository.find({
      where: {
        is_revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['account'],
    });

    // Find matching token using timing-safe comparison
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.token_hash);
      if (isMatch && token.account.is_active) {
        return token.account;
      }
    }

    return null;
  }
}
