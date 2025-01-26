import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, AuthProvider } from '../users/entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Twilio } from 'twilio';

@Injectable()
export class AuthService {
  private twilioClient: Twilio;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Twilio client
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await user.validatePassword(password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      provider: AuthProvider.LOCAL,
    });
    return this.generateToken(user);
  }

  async handleSocialAuth(profile: any, provider: AuthProvider) {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        provider,
        providerId: profile.id,
        emailVerified: true,
      });
    } else if (user.provider !== provider) {
      throw new BadRequestException(`User already exists with ${user.provider} authentication`);
    }

    return this.generateToken(user);
  }

  async sendPhoneVerification(phone: string) {
    if (!this.twilioClient) {
      throw new BadRequestException('SMS service not configured');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.twilioClient.messages.create({
      body: `Your BuscAdis verification code is: ${verificationCode}`,
      to: phone,
      from: this.configService.get('TWILIO_PHONE_NUMBER'),
    });

    // In production, store the code securely with expiration
    return { message: 'Verification code sent' };
  }

  async verifyPhone(phone: string, code: string) {
    // In production, verify the code against stored code
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.phoneVerified = true;
    await this.usersService.update(user.id, user);

    return this.generateToken(user);
  }

  private generateToken(user: Partial<User>) {
    const payload = { 
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
} 