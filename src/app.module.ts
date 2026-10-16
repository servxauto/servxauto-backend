import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { throttlerAsyncConfig } from '@/config/throttler.config';
import { typeOrmAsyncConfig } from '@/config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkersModule } from './modules/workers/workers.module';
import { WorkshopsModule } from './modules/workshops/workshops.module';
import { CommonModule } from './common/common.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    ThrottlerModule.forRootAsync(throttlerAsyncConfig),
    CommonModule,
    AuthModule,
    UsersModule,
    WorkersModule,
    WorkshopsModule,
    VehiclesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
