import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
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

    const user = this.usersRepository.create(createUserDto);

    if (createUserDto.password) {
      user.password = await bcrypt.hash(createUserDto.password, 10);
    }

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

    // Find by email
    async findByEmail(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({ where: { email } });
      }

        // Find by phone number
    async findByPhone(phoneNumber: string): Promise<User | undefined> {
      return this.usersRepository.findOne({ where: { phoneNumber: phoneNumber } }); //Corrección
    }

    // Find by OAuth ID and provider
    async findByOAuthId(oauthId: string, provider: string): Promise<User | undefined> {
      return this.usersRepository.findOne({ where: { oauthId: oauthId, provider: provider as any} }); //Aserción temporal
    }


  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);

     if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);

        try {
        await this.elasticsearchService.delete({
            index: this.indexName,
            id: id,
        });
    } catch (error) {
      this.logger.error(`Error deleting user from Elasticsearch: ${(error as Error).message}`, (error as Error).stack);
    }
  }

    async search(query: string): Promise<User[]> {
        try {
            const results = await this.elasticsearchService.search<SearchResponse<User>>({ // Tipado Correcto
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

            const users = results.hits.hits.map((hit: SearchHit<User>) => hit._source!); //  Tipado Correcto
            if (users.length === 0) {
                return [];
            }
            return users;
        } catch (error) {
            this.logger.error('Error searching users:', (error as Error).message, (error as Error).stack);
            // Fallback a TypeORM si Elasticsearch falla
            return this.usersRepository.find({
                where: [
                    { firstName: ILike(`%${query}%`) },
                    { lastName: ILike(`%${query}%`) },
                    { email: ILike(`%${query}%`) },
                ],
            });
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
}