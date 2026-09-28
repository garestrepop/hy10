import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly webOrigin: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.webOrigin = this.configService.get('WEB_ORIGIN', 'http://localhost:3000');
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.webOrigin}/auth/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get('MAIL_FROM', 'noreply@hy10.app'),
        subject: 'Recuperar contraseña - hy10',
        template: 'password-reset',
        context: {
          resetUrl,
          expirationHours: 1,
        },
      });

      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get('MAIL_FROM', 'noreply@hy10.app'),
        subject: 'Bienvenido a hy10',
        template: 'welcome',
        context: {
          firstName,
          loginUrl: `${this.webOrigin}/auth/login`,
        },
      });

      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
    }
  }
}
