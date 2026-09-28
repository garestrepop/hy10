import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CreateStaffInvitationDto } from './dto/create-staff-invitation.dto';
import { AcceptStaffInvitationDto } from './dto/accept-staff-invitation.dto';
import { StaffInvitationResponseDto, InvitationInfoDto } from './dto/staff-invitation-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser, CurrentUserData } from './decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    
    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  async googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect to client with tokens' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as unknown as User;
    const authResponse = await this.authService.generateAuthResponse(user);
    
    const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
    const redirectUrl = `${webOrigin}/auth/callback?access_token=${authResponse.access_token}&refresh_token=${authResponse.refresh_token}`;
    
    res.redirect(redirectUrl);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser('userId') userId: string,
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(userId, refreshTokenDto.refresh_token);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 204, description: 'All sessions revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(@CurrentUser('userId') userId: string): Promise<void> {
    await this.authService.logoutAll(userId);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if account exists)',
  })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(requestPasswordResetDto.email);
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.new_password,
    );
    return { message: 'Password reset successful' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    return user;
  }

  @Post('invite-staff')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a staff member (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Invitation created successfully',
    type: StaffInvitationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or user already has Staff role' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin only' })
  async inviteStaff(
    @CurrentUser('userId') userId: string,
    @Body() createInvitationDto: CreateStaffInvitationDto,
  ): Promise<StaffInvitationResponseDto> {
    return this.authService.createStaffInvitation(userId, createInvitationDto.email);
  }

  @Get('invitation/:token')
  @ApiOperation({ summary: 'Get invitation information' })
  @ApiResponse({
    status: 200,
    description: 'Invitation information',
    type: InvitationInfoDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async getInvitationInfo(@Req() req: Request): Promise<InvitationInfoDto> {
    const token = req.params.token;
    return this.authService.getInvitationInfo(token);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept a staff invitation' })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid, expired, or used token' })
  @ApiResponse({ status: 401, description: 'Unauthorized - wrong account' })
  async acceptInvitation(
    @Body() acceptInvitationDto: AcceptStaffInvitationDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const authHeader = req.headers.authorization;
    let currentUserId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = await this.authService['jwtService'].verify(token);
        currentUserId = decoded.sub;
      } catch (error) {
      }
    }

    return this.authService.acceptStaffInvitation(
      acceptInvitationDto.token,
      acceptInvitationDto.password,
      acceptInvitationDto.first_name,
      acceptInvitationDto.last_name,
      currentUserId,
    );
  }
}
