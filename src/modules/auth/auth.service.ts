import { Injectable, UnauthorizedException, BadRequestException, Logger, NotFoundException } from '@nestjs/common'; // Add NotFoundException
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, AuthProvider } from '../users/entities/user.entity'; // Import User
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Twilio } from 'twilio';
import { UserResponseDto } from '../users/dto/user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

export class AuthResponseDto {  //  DTO independiente
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
        if (user && user.password && await bcrypt.compare(password, user.password)) {
            return user;
        }
        return null;
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.generateToken(user); // Pasamos la entidad User
    }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new BadRequestException('El correo electrónico ya está registrado.');
        }

        // usersService.create devuelve la entidad User
        const user = await this.usersService.create(registerDto);

        const updateUserDto: UpdateUserDto = {
            provider: AuthProvider.LOCAL,
            isVerified: false,
        };
        // Actualizamos el usuario.  usersService.update espera el ID y un DTO, no la entidad
        await this.usersService.update(user.id, updateUserDto);

        return this.generateToken(user); // Pasamos la entidad User
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
                const updateUserDto: UpdateUserDto = {
                    provider: AuthProvider[providerEnum],
                    oauthId: profile.id,
                    isVerified: true, // Ya verificado
                };
                await this.usersService.update(user.id, updateUserDto);
            } else {
                const createUserDto: RegisterDto = {
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    password: Math.random().toString(36).slice(-8),
                    phoneNumber: '',  // Añadido para evitar errores
                };
                // usersService.create devuelve la entidad User
                user = await this.usersService.create(createUserDto);
                const updateUserDto: UpdateUserDto = {
                  provider: AuthProvider[providerEnum],
                  oauthId: profile.id,
                  isVerified: true,
                  phoneNumber: '',
                }
                await this.usersService.update(user.id, updateUserDto);
            }
        }

        if (!user) {
            throw new NotFoundException('User creation failed.'); // Mejor manejo de errores
        }
        return this.generateToken(user); // Pasamos la entidad user
    }

    async handleSocialAuth(profile: any, provider: AuthProvider): Promise<AuthResponseDto> {
        // profile.emails puede ser undefined o un array vacío.  Maneja ambos casos.
        const email = Array.isArray(profile.emails) && profile.emails.length > 0
            ? profile.emails[0].value
            : profile.email; // Usa profile.email como respaldo si no hay emails

        let user = await this.usersService.findByEmail(email);

        if (!user) {
            if (!email) { // Verifica que tenemos un email
                throw new BadRequestException('Email is required for social authentication.');
            }
            const createUserDto: RegisterDto = {
                email: email,
                firstName: profile.firstName || profile.displayName.split(' ')[0],
                lastName: profile.lastName || profile.displayName.split(' ').slice(1).join(' '),
                password: '', // Sin password
                phoneNumber: '',
            };
            user = await this.usersService.create(createUserDto);
            const updateUserDto: UpdateUserDto = {
              provider: provider,
              oauthId: profile.id,
              isVerified: true,
              phoneNumber: '',
            }
            await this.usersService.update(user.id, updateUserDto);

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


    async verifyPhone(phone: string, code: string): Promise<AuthResponseDto> {
        // Primero intenta encontrar por número de teléfono
        let user = await this.usersService.findByPhone(phone);

        if (!user) {
            // Si no se encuentra por teléfono, intenta por email
            user = await this.usersService.findByEmail(phone);
             if (!user) {
                throw new NotFoundException('User not found');
             }
        }

        const updateUserDto: UpdateUserDto = {
            isVerified: true,
            //Si el usuario se encontró por email, asignamos phone al phoneNumber
            ...(phone !== user.email && {phoneNumber: phone})
        };

        await this.usersService.update(user.id, updateUserDto);
        return this.generateToken(user);
    }



    private generateToken(user: User): AuthResponseDto {
        if (!user) {  //  importante para la seguridad
            throw new BadRequestException('User cannot be null');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const userResponse: UserResponseDto = { //  UserResponseDto
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,  //  phoneNumber
            provider: user.provider,      //  provider
            isActive: user.isActive,       //  isActive
            createdAt: user.createdAt,   //  createdAt
            updatedAt: user.updatedAt,     //  updatedAt
            isVerified: user.isVerified,    //  isVerified
            oauthId: user.oauthId,         //  oauthId
        };

        return {
            user: userResponse,
            token: this.jwtService.sign(payload),
        };
    }
}