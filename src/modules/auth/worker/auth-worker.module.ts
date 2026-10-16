import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthWorkerController } from './auth-worker.controller';
import { AuthWorkerService } from './auth-worker.service';
import { AuthCommonModule } from '@/modules/auth/auth-common.module';
import { Worker } from '@/modules/workers/entities/worker.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Worker]), AuthCommonModule],
  controllers: [AuthWorkerController],
  providers: [AuthWorkerService],
  exports: [AuthWorkerService],
})
export class AuthWorkerModule {}
