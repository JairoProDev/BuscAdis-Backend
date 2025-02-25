import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';  // Importa solo LoginDto y RegisterDto
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '../users/entities/user.entity';
import { Twilio } from 'twilio';

// Definición de AuthResponseDto (dentro de auth.service.ts)
export class AuthResponseDto { // Define el DTO aquí, o en un archivo separado (recomendado)
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string; //  string, o mejor, usa el enum UserRole
    };
    token: string;
}

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

        //Primero crea el usuario
        const user = await this.usersService.create(registerDto);
        //Luego asigna las propiedades de la entidad
        user.provider = AuthProvider.LOCAL;

        //Guarda el usuario.
        await this.usersService.update(user.id, user);

        return this.generateToken(user);
    }


    async validateOAuthLogin(profile: any, provider: string): Promise<AuthResponseDto> {
        const providerEnum = provider.toUpperCase() as keyof typeof AuthProvider;

        if (!AuthProvider[providerEnum]) {
            throw new BadRequestException(`Invalid provider: ${provider}`);
        }

        let user = await this.usersService.findByOAuthId(profile.id, provider);

        if (!user) {
            const existingUser = await this.usersService.findByEmail(profile.emails[0].value);

            if (existingUser) {
                user = existingUser;
                user.provider = AuthProvider[providerEnum];
                user.oauthId = profile.id;
                await this.usersService.update(user.id, user); //  update en lugar de save
            } else {
                const createUserDto: RegisterDto = { // Usa RegisterDto, no CreateUserDto
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    password: Math.random().toString(36).slice(-8),
                };
                user = await this.usersService.create(createUserDto);
                user.provider = AuthProvider[providerEnum];
                user.oauthId = profile.id;
                user.isVerified = true;
                await this.usersService.update(user.id, user); //  update en lugar de save
            }
        }

        return this.generateToken(user);
    }


  async handleSocialAuth(profile: any, provider: AuthProvider): Promise<AuthResponseDto> {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
        const createUserDto: RegisterDto = { //  RegisterDto
            email: profile.emails[0].value,
            firstName: profile.firstName,
            lastName: profile.lastName,
            password: '', // No password for social auth
        };
        user = await this.usersService.create(createUserDto);
        user.provider = provider;
        user.oauthId = profile.id;
        user.isVerified = true;
        await this.usersService.update(user.id, user); //  update en lugar de save
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
        from: this.configService.get('TWILIO_PHONE_NUMBER') || '', // Considera un mejor manejo de errores aquí
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
     await this.usersService.update(user.id, user); //  update en lugar de save

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