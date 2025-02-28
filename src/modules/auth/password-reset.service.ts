import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return; // No revelar si el email existe
    }

    const token = this.jwtService.sign(
      { email },
      { expiresIn: '1h' },
    );

    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.emailService.sendEmail({
      to: email,
      subject: 'Reset your password',
      template: 'password-reset',
      context: {
        name: user.firstName,
        resetUrl,
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const { email } = this.jwtService.verify(token);
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        throw new Error('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.updatePassword(user.id, hashedPassword);
    } catch (error) {
      this.logger.error('Error resetting password:', error);
      throw new Error('Invalid or expired token');
    }
  }
} 