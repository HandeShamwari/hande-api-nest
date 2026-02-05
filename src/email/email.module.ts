import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST', 'smtp.gmail.com'),
          port: parseInt(config.get('MAIL_PORT', '587')),
          secure: false, // Use STARTTLS
          auth: {
            user: config.get('MAIL_FROM_ADDRESS', 'handeshamwari@gmail.com'),
            pass: config.get('MAIL_PASSWORD', ''),
          },
        },
        defaults: {
          from: `"Hande" <${config.get('MAIL_FROM_ADDRESS', 'handeshamwari@gmail.com')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
