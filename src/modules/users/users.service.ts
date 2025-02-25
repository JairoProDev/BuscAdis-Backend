import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchResponse, SearchHit } from '@elastic/elasticsearch/lib/api/types';

@Injectable()
export class UsersService {
  private readonly indexName = 'users';
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    this.createIndex();
  }


  async createIndex() {
    try {
      const checkIndex = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!checkIndex) {
        await this.elasticsearchService.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                firstName: { type: 'text' },
                lastName: { type: 'text' },
                email: { type: 'keyword' },
                role: { type: 'keyword' },
                isVerified: { type: 'boolean' },
                phoneNumber: { type: 'keyword' }, //  'text' si necesitas búsquedas parciales
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                provider: { type: 'keyword' },
                oauthId: { type: 'keyword' },
              },
            },
          },
        });
        this.logger.log('User index created');
      } else {
        this.logger.log('User index already exists');
      }
    } catch (error) {
      this.logger.error('Error creating user index:', (error as Error).message, (error as Error).stack);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
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
    await this.indexUser(savedUser);
    return savedUser;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map(user => this.mapToResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.mapToResponseDto(user);
  }

    // Find by email
    async findByEmail(email: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({ where: { email } });
        return user || undefined;
    }

        // Find by phone number
    async findByPhone(phoneNumber: string): Promise<User | undefined> {
      const user = await this.usersRepository.findOne({ where: { phoneNumber } });
      return user || undefined;
    }

    // Find by OAuth ID and provider
    async findByOAuthId(oauthId: string, provider: string): Promise<User | undefined> {
      const user = await this.usersRepository.findOne({ 
        where: { 
          oauthId, 
          provider: provider.toUpperCase() as AuthProvider 
        } 
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
    await this.indexUser(savedUser);
    return this.mapToResponseDto(savedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.usersRepository.remove(user);
    await this.removeFromIndex(id);
  }

    async search(query: string): Promise<UserResponseDto[]> {
        try {
            const response = await this.elasticsearchService.search<User>({
                index: this.indexName,
                body: {
                    query: {
                        multi_match: {
                            query,
                            fields: ['firstName', 'lastName', 'email'],
                            fuzziness: 'AUTO',
                        },
                    },
                },
            });

            const users = response.hits.hits.map((hit) => ({
                ...hit._source,
                id: hit._id,
            } as User));

            return users.map(user => this.mapToResponseDto(user));
        } catch (error) {
            this.logger.error('Error searching users:', (error as Error).message, (error as Error).stack);
            // Fallback to TypeORM if Elasticsearch fails
            const users = await this.usersRepository.find({
                where: [
                    { firstName: ILike(`%${query}%`) },
                    { lastName: ILike(`%${query}%`) },
                    { email: ILike(`%${query}%`) },
                ],
            });
            return users.map(user => this.mapToResponseDto(user));
        }
    }


    async indexUser(user: User): Promise<void> {
        try {
            await this.elasticsearchService.index({
                index: this.indexName,
                id: user.id,
                body: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    phoneNumber: user.phoneNumber, // Incluido
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    provider: user.provider,
                    oauthId: user.oauthId, // Incluido
                },
            });

        } catch (error) {
            this.logger.error(`Error indexing user in Elasticsearch: ${(error as Error).message}`, (error as Error).stack)
        }
    }

    private async removeFromIndex(id: string): Promise<void> {
        try {
            await this.elasticsearchService.delete({
                index: this.indexName,
                id,
            });
        } catch (error) {
            this.logger.error('Error removing user from index:', error);
        }
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
}