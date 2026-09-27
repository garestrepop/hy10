import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController - Logout', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            logout: jest.fn(),
            logoutAll: jest.fn(),
            refresh: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('logout', () => {
    it('should successfully logout from current device', async () => {
      const mockRequest = {
        user: { accountId: 'test-account-id' },
        body: { refreshToken: 'test-refresh-token' },
      };

      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      const result = await controller.logout(
        mockRequest,
        {},
        '127.0.0.1',
      );

      expect(result).toEqual({
        success: true,
        message: 'Successfully logged out from this device',
      });

      expect(authService.logout).toHaveBeenCalledWith(
        'test-account-id',
        'test-refresh-token',
        '127.0.0.1',
      );
    });

    it('should handle refresh token from header', async () => {
      const mockRequest = {
        user: { accountId: 'test-account-id' },
        body: {},
        headers: { 'x-refresh-token': 'test-refresh-token' },
      };

      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      await controller.logout(mockRequest, {}, '127.0.0.1');

      expect(authService.logout).toHaveBeenCalledWith(
        'test-account-id',
        'test-refresh-token',
        '127.0.0.1',
      );
    });

    it('should return error if refresh token is missing', async () => {
      const mockRequest = {
        user: { accountId: 'test-account-id' },
        body: {},
        headers: {},
      };

      const result = await controller.logout(
        mockRequest,
        {},
        '127.0.0.1',
      );

      expect(result).toEqual({
        success: false,
        message: 'Refresh token is required',
      });

      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should successfully logout from all devices', async () => {
      const mockRequest = {
        user: { accountId: 'test-account-id' },
      };

      jest.spyOn(authService, 'logoutAll').mockResolvedValue(3);

      const result = await controller.logoutAll(mockRequest, '127.0.0.1');

      expect(result).toEqual({
        success: true,
        message: 'Successfully logged out from all devices (3 sessions revoked)',
      });

      expect(authService.logoutAll).toHaveBeenCalledWith(
        'test-account-id',
        '127.0.0.1',
      );
    });

    it('should handle logout all with no active sessions', async () => {
      const mockRequest = {
        user: { accountId: 'test-account-id' },
      };

      jest.spyOn(authService, 'logoutAll').mockResolvedValue(0);

      const result = await controller.logoutAll(mockRequest, '127.0.0.1');

      expect(result.message).toContain('0 sessions revoked');
    });
  });
});
