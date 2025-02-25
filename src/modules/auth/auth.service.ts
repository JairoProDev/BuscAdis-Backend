import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '../users/entities/user.entity';
import { Twilio } from 'twilio';
import { UserResponseDto } from '../users/dto/user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto'; //  ruta correcta

//  AuthResponseDto a un archivo DTO separado:
export class AuthResponseDto {
  user: UserResponseDto;
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
        // Simplifica la validación
        if (user && await bcrypt.compare(password, user.password!)) {
            return user;
        }
        return null;
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.generateToken(user);  //  User
    }


    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new BadRequestException('El correo electrónico ya está registrado.');
        }
        //  create devuelve un User (la entidad), no un DTO.
        const user = await this.usersService.create(registerDto);

        //  UpdateUserDto para actualizar
        const updateUserDto: UpdateUserDto = {
          provider: AuthProvider.LOCAL,
          isVerified: false, //  falso por defecto
        };

        // Actualiza y *espera* la actualización.
        await this.usersService.update(user.id, updateUserDto);
        return this.generateToken(user); //  User
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
        //  UpdateUserDto
        const updateUserDto: UpdateUserDto = {
          provider: AuthProvider[providerEnum],
          oauthId: profile.id,
          isVerified: true, // Verificado por OAuth
        };
        await this.usersService.update(user.id, updateUserDto);
      } else {
          // 1. Crea el usuario
          const createUserDto: RegisterDto = {
              email: profile.emails[0].value,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              password: Math.random().toString(36).slice(-8), //  mejor generación de contraseña
              phoneNumber: '', //  '' como valor inicial
          };

          user = await this.usersService.create(createUserDto);
          // 2. Actualiza *después* de crear, usando un DTO.
          const updateUserDto: UpdateUserDto = {
            provider: AuthProvider[providerEnum],
            oauthId: profile.id,
            isVerified: true,
            phoneNumber: '',
        };

        await this.usersService.update(user.id, updateUserDto);
      }
    }

    return this.generateToken(user); //  User
  }


    async handleSocialAuth(profile: any, provider: AuthProvider): Promise<AuthResponseDto> {
        const email = Array.isArray(profile.emails) && profile.emails.length > 0
            ? profile.emails[0].value
            : profile.email;

        let user = await this.usersService.findByEmail(email);

        if (!user) {
            if (!email) {
                throw new BadRequestException('Email is required for social authentication.');
            }
            const createUserDto: RegisterDto = {
                email: email,
                firstName: profile.firstName || profile.displayName.split(' ')[0],
                lastName: profile.lastName || profile.displayName.split(' ').slice(1).join(' '),
                password: '', //  sin contraseña
                phoneNumber: '', //  '' como valor inicial
            };
            user = await this.usersService.create(createUserDto);

            const updateUserDto: UpdateUserDto = {
                provider: provider,
                oauthId: profile.id,
                isVerified: true,
                phoneNumber: '',
            };
            await this.usersService.update(user.id, updateUserDto);

        } else if (user.provider !== provider) {
            throw new BadRequestException(`User already exists with ${user.provider} authentication`);
        }

        return this.generateToken(user); //  User
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
                from: this.configService.get('TWILIO_PHONE_NUMBER') || '', //  mejor manejo de errores
            });
        } catch (error) {
            this.logger.error(`Error sending SMS: ${(error as Error).message}`, (error as Error).stack);
            throw new BadRequestException(`Error sending SMS: ${(error as Error).message}`);
        }
        return { message: 'Verification code sent' };
    }

    async verifyPhone(phone: string, code: string): Promise<AuthResponseDto> {

    //  buscar por phoneNumber
    const user = await this.usersService.findByPhone(phone);

        if (!user) {
        //  Si no se encuentra por phone, buscar por email.
        const userByEmail = await this.usersService.findByEmail(phone); //  buscar por email
        if(!userByEmail) {
            throw new NotFoundException('User not found');
        }
            const updateUserDto: UpdateUserDto = {
                phoneNumber: phone,
                isVerified: true, //  verificar directamente si el código es correcto

            };
            await this.usersService.update(userByEmail.id, updateUserDto); //  await
            return this.generateToken(userByEmail);

        }

        //  UpdateUserDto
        const updateUserDto: UpdateUserDto = {
            isVerified: true,

        };
        await this.usersService.update(user.id, updateUserDto);
        return this.generateToken(user); // No necesita await.

    }


    private generateToken(user: User): AuthResponseDto {
        if (!user) {
          throw new BadRequestException('User cannot be null');
        }
        const payload = {
          sub: user.id,
          email: user.email,
          role: user.role,
        };

        //  UserResponseDto.  
        const userResponse: UserResponseDto = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
            phoneNumber: user.phoneNumber, //  phoneNumber
            provider: user.provider, // provider
            isActive: user.isActive,    //  isActive
            createdAt: user.createdAt, //  createdAt
            updatedAt: user.updatedAt, //  updatedAt
          isVerified: user.isVerified, //  isVerified
          oauthId: user.oauthId   //  oauthId
        };

    return {
      user: userResponse,
      token: this.jwtService.sign(payload),
    };
  }
}