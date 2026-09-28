import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let emailService: EmailService;
  let mailerService: MailerService;
  let configService: ConfigService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'WEB_ORIGIN') return 'http://localhost:3000';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'WEB_ORIGIN') return 'http://localhost:3000';
      if (key === 'MAIL_FROM') return 'noreply@hy10.app';
      return defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'user@example.com';
      const token = 'reset-token-123';
      const resetUrl = `http://localhost:3000/auth/reset-password?token=${token}`;

      mockMailerService.sendMail.mockResolvedValue(true);

      await emailService.sendPasswordResetEmail(email, token);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        from: 'noreply@hy10.app',
        subject: 'Recuperar contraseña - hy10',
        template: 'password-reset',
        context: {
          resetUrl,
          expirationHours: 1,
        },
      });
    });

    it('should log success when email is sent', async () => {
      const email = 'user@example.com';
      const token = 'reset-token-123';
      
      mockMailerService.sendMail.mockResolvedValue(true);
      const loggerSpy = jest.spyOn(emailService['logger'], 'log');

      await emailService.sendPasswordResetEmail(email, token);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Password reset email sent to: ${email}`)
      );
    });

    it('should throw error and log when email sending fails', async () => {
      const email = 'user@example.com';
      const token = 'reset-token-123';
      const error = new Error('SMTP connection failed');

      mockMailerService.sendMail.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(emailService['logger'], 'error');

      await expect(
        emailService.sendPasswordResetEmail(email, token)
      ).rejects.toThrow('SMTP connection failed');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to send password reset email to ${email}`),
        error
      );
    });

    it('should use configured WEB_ORIGIN for reset URL', async () => {
      const email = 'user@example.com';
      const token = 'reset-token-123';
      const customOrigin = 'https://app.hy10.com';

      const customConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'WEB_ORIGIN') return customOrigin;
          if (key === 'MAIL_FROM') return 'noreply@hy10.app';
          return defaultValue;
        }),
      };

      mockMailerService.sendMail.mockResolvedValue(true);

      const newEmailService = new EmailService(mailerService, customConfigService as any);
      await newEmailService.sendPasswordResetEmail(email, token);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@hy10.app',
          context: expect.objectContaining({
            resetUrl: `${customOrigin}/auth/reset-password?token=${token}`,
          }),
        })
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const email = 'newuser@example.com';
      const firstName = 'John';

      mockMailerService.sendMail.mockResolvedValue(true);

      await emailService.sendWelcomeEmail(email, firstName);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        from: 'noreply@hy10.app',
        subject: 'Bienvenido a hy10',
        template: 'welcome',
        context: {
          firstName,
          loginUrl: 'http://localhost:3000/auth/login',
        },
      });
    });

    it('should log success when welcome email is sent', async () => {
      const email = 'newuser@example.com';
      const firstName = 'John';

      mockMailerService.sendMail.mockResolvedValue(true);
      const loggerSpy = jest.spyOn(emailService['logger'], 'log');

      await emailService.sendWelcomeEmail(email, firstName);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Welcome email sent to: ${email}`)
      );
    });

    it('should not throw error when welcome email fails (non-critical)', async () => {
      const email = 'newuser@example.com';
      const firstName = 'John';
      const error = new Error('SMTP connection failed');

      mockMailerService.sendMail.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(emailService['logger'], 'error');

      await expect(
        emailService.sendWelcomeEmail(email, firstName)
      ).resolves.not.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to send welcome email to ${email}`),
        error
      );
    });
  });
});
