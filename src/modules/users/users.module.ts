//Asegurate de importar el UserSubscriber
// users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSubscriber } from './subscribers/user.subscriber';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const username = configService.get<string>('ELASTICSEARCH_USERNAME');
        const password = configService.get<string>('ELASTICSEARCH_PASSWORD');
        const node = configService.get<string>('ELASTICSEARCH_NODE');

        const config: any = {
          node,
        };

        if (username && password) {
          config.auth = {
            username,
            password,
          };
        }

        return config;
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserSubscriber], //  UserSubscriber
  exports: [UsersService],
})
export class UsersModule {}