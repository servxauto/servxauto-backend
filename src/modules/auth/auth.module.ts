import { Module } from '@nestjs/common';
import { AuthUserModule } from './user/auth-user.module';
import { AuthWorkerModule } from './worker/auth-worker.module';
import { AuthWorkshopModule } from './workshop/auth-workshop.module';

/**
 * Groups the three auth modules so `AppModule` imports one module
 * instead of three.
 */
@Module({
  imports: [AuthUserModule, AuthWorkshopModule, AuthWorkerModule],
})
export class AuthModule {}
