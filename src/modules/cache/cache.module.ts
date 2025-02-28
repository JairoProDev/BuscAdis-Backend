import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { redisConfig } from '../../config/redis.config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: () => redisConfig,
    }),
  ],
  exports: [NestCacheModule],
})
export class RedisCacheModule {} 