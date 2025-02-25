// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto'; // Import AuthResponseDto
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '../users/entities/user.entity';
import { Twilio } from 'twilio';

@Injectable()
export class AuthService {
  private twilioClient: Twilio | undefined;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials are not configured. SMS functionality will be disabled.');
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    const user = await this.usersService.create(registerDto);
    user.provider = AuthProvider.LOCAL;
    await this.usersService.save(user); // UsersService *does* have .save()

    return this.generateToken(user);
  }

  async validateOAuthLogin(profile: any, provider: string): Promise<AuthResponseDto> {
    const providerEnum = provider.toUpperCase() as keyof typeof AuthProvider;
    if (!AuthProvider[providerEnum]) {
      throw new BadRequestException(`Invalid provider: ${provider}`);
    }

    // Use findByOAuthId (we'll add this to UsersService)
    let user = await this.usersService.findByOAuthId(profile.id, provider);

    if (!user) {
      const existingUser = await this.usersService.findByEmail(profile.emails[0].value);

      if (existingUser) {
        user = existingUser;
        user.provider = AuthProvider[providerEnum];
        user.oauthId = profile.id;  // oauthId is on the User entity
        await this.usersService.save(user);
      } else {
        // CreateUserDto does *not* have provider, providerId, or isVerified
        const createUserDto: RegisterDto = {  // Use RegisterDto, it has the core fields
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          password: Math.random().toString(36).slice(-8), // Random password
           // No username here.  It's part of the User entity, not the DTO
        };
        user = await this.usersService.create(createUserDto);
        user.provider = AuthProvider[providerEnum];
        user.oauthId = profile.id;
        user.isVerified = true;
        await this.usersService.save(user);
      }
    }

    return this.generateToken(user);
  }



  async handleSocialAuth(profile: any, provider: AuthProvider): Promise<AuthResponseDto> {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Same issue as above: create the user with the DTO, *then* set entity-specific properties.
      const createUserDto: RegisterDto = {  // Use RegisterDto
        email: profile.emails[0].value,
        firstName: profile.firstName,
        lastName: profile.lastName,
        password: '', // No password for social auth
         // No username
      };

      user = await this.usersService.create(createUserDto);
      user.provider = provider;
      user.oauthId = profile.id;
      user.isVerified = true;
      await this.usersService.save(user);
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

    try {
      await this.twilioClient.messages.create({
        body: `Your BuscAdis verification code is: ${verificationCode}`,
        to: phone,
        from: this.configService.get('TWILIO_PHONE_NUMBER') || '',
      });
    } catch (error) {
      this.logger.error(`Error sending SMS: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException(`Error sending SMS: ${(error as Error).message}`);
    }
    return { message: 'Verification code sent' };
  }

  async verifyPhone(phone: string, code: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.isVerified = true;
    await this.usersService.save(user); //  save

    return this.generateToken(user);
  }

  private generateToken(user: User): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token: this.jwtService.sign(payload),
    };
  }
}