import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopApplicationController } from './controllers/workshop-application.controller';
import { WorkshopsController } from './controllers/workshops.controller';
import { WorkshopApplication } from './entities/workshop-application.entity';
import { Workshop } from './entities/workshop.entity';
import { WorkshopApplicationService } from './services/workshop-application.service';
import { WorkshopsService } from './services/workshops.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop, WorkshopApplication])],
  controllers: [WorkshopsController, WorkshopApplicationController],
  providers: [WorkshopsService, WorkshopApplicationService],
  exports: [WorkshopApplicationService],
})
export class WorkshopsModule {}
