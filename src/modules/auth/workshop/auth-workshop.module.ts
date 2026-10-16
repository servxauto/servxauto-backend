import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthWorkshopController } from './auth-workshop.controller';
import { AuthWorkshopService } from './auth-workshop.service';
import { AuthCommonModule } from '@/modules/auth/auth-common.module';
import { Workshop } from '@/modules/workshops/entities/workshop.entity';
// AuthWorkshopService injects WorkshopApplicationService, which this exports.
import { WorkshopsModule } from '@/modules/workshops/workshops.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workshop]),
    AuthCommonModule,
    WorkshopsModule,
  ],
  controllers: [AuthWorkshopController],
  providers: [AuthWorkshopService],
  exports: [AuthWorkshopService],
})
export class AuthWorkshopModule {}
