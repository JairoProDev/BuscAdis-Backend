import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, DataSource, Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private usersRepository: Repository<User>; // Add this line

    constructor(private dataSource: DataSource) {
        this.usersRepository = this.dataSource.getRepository(User); // Initialize usersRepository
    }

    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
            provider: AuthProvider.LOCAL,
        });

        const savedUser = await this.usersRepository.save(user);
        return this.mapToResponseDto(savedUser);
    }

    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.usersRepository.find();
        return users.map((user: User) => this.mapToResponseDto(user));
    }

    async findOne(id: string): Promise<UserResponseDto> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return this.mapToResponseDto(user);
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({ where: { email } });
        return user || undefined;
    }

    async findByPhone(phoneNumber: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({ where: { phoneNumber } });
        return user || undefined;
    }

    async findByOAuthId(oauthId: string, provider: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({
            where: {
                oauthId,
                provider: provider.toUpperCase() as AuthProvider,
            },
        });
        return user || undefined;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        Object.assign(user, updateUserDto);
        const savedUser = await this.usersRepository.save(user);
        return this.mapToResponseDto(savedUser);
    }

    async remove(id: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        await this.usersRepository.remove(user);
    }

    async search(query: string): Promise<UserResponseDto[]> {
        const users = await this.usersRepository.find({
            where: [
                { firstName: ILike(`%${query}%`) },
                { lastName: ILike(`%${query}%`) },
                { email: ILike(`%${query}%`) },
            ],
        });
        return users.map((user: User) => this.mapToResponseDto(user));
    }

    private mapToResponseDto(user: User): UserResponseDto {
        const response = new UserResponseDto();
        response.id = user.id;
        response.email = user.email;
        response.firstName = user.firstName;
        response.lastName = user.lastName;
        response.phoneNumber = user.phoneNumber;
        response.role = user.role;
        response.provider = user.provider;
        response.isActive = user.isActive;
        response.createdAt = user.createdAt;
        response.updatedAt = user.updatedAt;
        response.lastLoginAt = user.lastLoginAt;
        response.isVerified = user.isVerified;
        response.oauthId = user.oauthId;
        return response;
    }

    async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        await this.usersRepository.update(userId, { password: hashedPassword });
    }

    async initialize(): Promise<void> {
        this.logger.log('UsersService initialized');
    }

    async indexUser(user: User): Promise<void> {
    }
}