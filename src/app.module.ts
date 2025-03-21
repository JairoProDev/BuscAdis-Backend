import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { typeOrmConfig } from './config/typeorm.config';
import { TasksModule } from './modules/tasks/tasks.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './modules/storage/storage.module';
import { CustomLogger } from './common/logger/logger.service'; // Importa CustomLogger
import { AllExceptionsFilter } from './common/filters/http-exception.filter'; // Importa AllExceptionsFilter

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot(typeOrmConfig),
        ScheduleModule.forRoot(),
        CacheModule.register(),
        TasksModule,
        PublicationsModule,
        UsersModule,
        StorageModule,
    ],
    providers: [
        CustomLogger, // Registra CustomLogger como proveedor
        AllExceptionsFilter, // Registra AllExceptionsFilter como proveedor
    ],
})
export class AppModule {}