import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthUserController } from './auth-user.controller';
import { AuthUserService } from './auth-user.service';
import { AuthCommonModule } from '@/modules/auth/auth-common.module';
import { User } from '@/modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthCommonModule],
  controllers: [AuthUserController],
  providers: [AuthUserService],
  exports: [AuthUserService],
})
export class AuthUserModule {}
