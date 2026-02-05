import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  async sendTestEmail(to: string): Promise<void> {
    this.logger.log(`Sending test email to: ${to}`);
    await this.mailerService.sendMail({
      to,
      subject: 'Hande - Email Test ✓',
      template: 'test',
      context: {
        name: 'User',
        year: new Date().getFullYear(),
      },
    });
    this.logger.log(`Test email sent successfully to: ${to}`);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    this.logger.log(`Sending welcome email to: ${to}`);
    await this.mailerService.sendMail({
      to,
      subject: 'Welcome to Hande! 🚗',
      template: 'welcome',
      context: {
        name,
        year: new Date().getFullYear(),
      },
    });
    this.logger.log(`Welcome email sent to: ${to}`);
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<void> {
    this.logger.log(`Sending password reset email to: ${to}`);
    await this.mailerService.sendMail({
      to,
      subject: 'Reset Your Hande Password',
      template: 'password-reset',
      context: {
        name,
        resetLink,
        year: new Date().getFullYear(),
      },
    });
    this.logger.log(`Password reset email sent to: ${to}`);
  }

  async sendSubscriptionConfirmation(to: string, name: string, days: number): Promise<void> {
    this.logger.log(`Sending subscription confirmation to: ${to}`);
    await this.mailerService.sendMail({
      to,
      subject: 'Hande Subscription Active! 🎉',
      template: 'subscription',
      context: {
        name,
        days,
        amount: days,
        year: new Date().getFullYear(),
      },
    });
    this.logger.log(`Subscription email sent to: ${to}`);
  }
}
