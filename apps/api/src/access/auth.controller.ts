import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LogoutDto, LogoutResponseDto } from './dto/logout.dto';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from current device',
    description:
      'Invalidates the current refresh token. An expired access token cannot be renewed with it.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out from current device',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async logout(
    @Request() req: any,
    @Body() _logoutDto: LogoutDto,
    @Ip() ipAddress: string,
  ): Promise<LogoutResponseDto> {
    const accountId = req.user.accountId;
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      return {
        success: false,
        message: 'Refresh token is required',
      };
    }

    await this.authService.logout(accountId, refreshToken, ipAddress);

    return {
      success: true,
      message: 'Successfully logged out from this device',
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Invalidates all refresh tokens for the current user. No previous refresh token can renew the session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out from all devices',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async logoutAll(
    @Request() req: any,
    @Ip() ipAddress: string,
  ): Promise<LogoutResponseDto> {
    const accountId = req.user.accountId;
    const revokedCount = await this.authService.logoutAll(accountId, ipAddress);

    return {
      success: true,
      message: `Successfully logged out from all devices (${revokedCount} sessions revoked)`,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchanges a valid refresh token for a new access token and refresh token. The old refresh token is revoked (rotation).',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully refreshed token',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Ip() ipAddress: string,
  ) {
    const session = await this.authService.refresh(refreshToken, ipAddress);
    return session;
  }
}
