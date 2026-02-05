import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @HttpCode(200)
  async sendTestEmail(@Body() body: { email: string }) {
    const email = body.email || 'handeshamwari@gmail.com';
    await this.emailService.sendTestEmail(email);
    return { 
      success: true, 
      message: `Test email sent to ${email}` 
    };
  }
}
