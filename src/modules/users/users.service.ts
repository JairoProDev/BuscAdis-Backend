import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, SearchUsersDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly indexName = 'users';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    this.createIndex();
  }

  private async createIndex() {
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
              isActive: { type: 'boolean' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { phone: createUserDto.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);

    // Index user in Elasticsearch
    await this.elasticsearchService.index({
      index: this.indexName,
      id: savedUser.id,
      body: this.mapUserToElastic(savedUser),
    });

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Update Elasticsearch
    await this.elasticsearchService.update({
      index: this.indexName,
      id: updatedUser.id,
      body: {
        doc: this.mapUserToElastic(updatedUser),
      },
    });

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);

    // Remove from Elasticsearch
    await this.elasticsearchService.delete({
      index: this.indexName,
      id: id,
    });
  }

  async search(searchDto: SearchUsersDto) {
    const { query, role, isActive, page = 1, limit = 10 } = searchDto;

    const must: any[] = [];
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['firstName', 'lastName', 'email'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (role) {
      must.push({ term: { role } });
    }

    if (typeof isActive === 'boolean') {
      must.push({ term: { isActive } });
    }

    const { body } = await this.elasticsearchService.search({
      index: this.indexName,
      body: {
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: { must },
        },
        sort: [{ createdAt: { order: 'desc' } }],
      },
    });

    const hits = body.hits.hits;
    const total = body.hits.total.value;

    return {
      items: hits.map((item: any) => ({
        ...item._source,
        score: item._score,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  private mapUserToElastic(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
} 